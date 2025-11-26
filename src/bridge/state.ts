/*
 * Copyright (c) 2025 Oink Bridge Contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Bridge State Manager - Maintains 1:1 peg integrity
import { BridgeState, BridgeOperation, LockEvent, MintEvent, BurnEvent, UnlockEvent } from '../types/index.js';

export class BridgeStateManager {
  private state: BridgeState;
  private operations: Map<string, BridgeOperation> = new Map();

  constructor() {
    this.state = {
      totalOinkLocked: 0n,
      totalMidoinkMinted: 0n,
      pendingOperations: [],
      completedOperations: 0,
      lastCardanoBlock: 0,
      lastMidnightBlock: 0,
      isHealthy: true,
    };
  }

  // ============================================
  // State Accessors
  // ============================================

  getState(): BridgeState {
    return { ...this.state };
  }

  verifyPegIntegrity(): { isValid: boolean; diff: bigint } {
    const diff = this.state.totalOinkLocked - this.state.totalMidoinkMinted;
    return {
      isValid: diff === 0n,
      diff,
    };
  }

  // ============================================
  // Lock Operations (Cardano → Midnight)
  // ============================================

  recordLock(event: LockEvent): BridgeOperation {
    const operation: BridgeOperation = {
      id: `wrap-${event.txHash}`,
      type: 'wrap',
      status: 'locked',
      amount: event.amount,
      cardanoAddress: event.sender,
      lockTxHash: event.txHash,
      midnightAddress: '', // Set when mint is requested
      createdAt: event.timestamp,
      updatedAt: Date.now(),
      signatures: [],
    };

    this.operations.set(operation.id, operation);
    this.state.totalOinkLocked += event.amount;
    this.state.pendingOperations.push(operation);
    
    // Note: Peg will be temporarily unbalanced until mint completes
    // This is expected during the wrap process
    
    return operation;
  }

  recordMint(event: MintEvent): void {
    const operationId = `wrap-${event.lockTxHash}`;
    const operation = this.operations.get(operationId);
    
    if (!operation) {
      throw new Error(`No lock operation found for mint: ${event.lockTxHash}`);
    }

    operation.status = 'minted';
    operation.mintTxHash = event.txHash;
    operation.midnightAddress = event.recipient;
    operation.completedAt = event.timestamp;
    operation.updatedAt = Date.now();

    this.state.totalMidoinkMinted += event.amount;
    this.state.pendingOperations = this.state.pendingOperations.filter(
      op => op.id !== operationId
    );
    this.state.completedOperations++;

    // CRITICAL: Verify 1:1 peg after mint
    this.assertPegIntegrity();
  }

  // ============================================
  // Burn Operations (Midnight → Cardano)
  // ============================================

  recordBurn(event: BurnEvent): BridgeOperation {
    const operation: BridgeOperation = {
      id: `unwrap-${event.txHash}`,
      type: 'unwrap',
      status: 'burned',
      amount: event.amount,
      midnightAddress: event.sender,
      burnTxHash: event.txHash,
      cardanoAddress: event.cardanoRecipient,
      createdAt: event.timestamp,
      updatedAt: Date.now(),
      signatures: [],
    };

    this.operations.set(operation.id, operation);
    this.state.totalMidoinkMinted -= event.amount;
    this.state.pendingOperations.push(operation);

    // Note: Peg will be temporarily unbalanced until unlock completes
    // This is expected during the unwrap process

    return operation;
  }

  recordUnlock(event: UnlockEvent): void {
    const operationId = `unwrap-${event.burnTxHash}`;
    const operation = this.operations.get(operationId);

    if (!operation) {
      throw new Error(`No burn operation found for unlock: ${event.burnTxHash}`);
    }

    operation.status = 'unlocked';
    operation.unlockTxHash = event.txHash;
    operation.completedAt = event.timestamp;
    operation.updatedAt = Date.now();

    this.state.totalOinkLocked -= event.amount;
    this.state.pendingOperations = this.state.pendingOperations.filter(
      op => op.id !== operationId
    );
    this.state.completedOperations++;

    // CRITICAL: Verify 1:1 peg after unlock
    this.assertPegIntegrity();
  }

  // ============================================
  // Peg Integrity
  // ============================================

  private assertPegIntegrity(): void {
    const { isValid, diff } = this.verifyPegIntegrity();
    
    if (!isValid) {
      this.state.isHealthy = false;
      console.error(`🚨 PEG INTEGRITY VIOLATION! Diff: ${diff}`);
      throw new Error(`Peg integrity violated: locked=${this.state.totalOinkLocked}, minted=${this.state.totalMidoinkMinted}`);
    }
  }

  // ============================================
  // Operation Queries
  // ============================================

  getOperation(id: string): BridgeOperation | undefined {
    return this.operations.get(id);
  }

  getPendingOperations(): BridgeOperation[] {
    return [...this.state.pendingOperations];
  }

  getOperationsByAddress(address: string): BridgeOperation[] {
    return Array.from(this.operations.values()).filter(
      op => op.cardanoAddress === address || op.midnightAddress === address
    );
  }
}

// Singleton instance
export const bridgeState = new BridgeStateManager();

