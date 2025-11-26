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

// Bridge Validator - Signs and validates cross-chain operations
import { config } from '../config/index.js';
import { LockEvent, BurnEvent, ValidatorSignature } from '../types/index.js';
import { createHash, randomBytes } from 'crypto';

export interface ValidatorKeys {
  publicKey: string;
  privateKey: string;
}

export class BridgeValidator {
  private validatorId: string;
  private keys: ValidatorKeys;

  constructor(validatorId: string, keys?: ValidatorKeys) {
    this.validatorId = validatorId;
    this.keys = keys || this.generateKeys();
  }

  private generateKeys(): ValidatorKeys {
    // Generate simple key pair for prototype (use proper Ed25519 in production)
    const privateKey = randomBytes(32).toString('hex');
    const publicKey = createHash('sha256').update(privateKey).digest('hex');
    return { publicKey, privateKey };
  }

  getPublicKey(): string {
    return this.keys.publicKey;
  }

  getValidatorId(): string {
    return this.validatorId;
  }

  // ============================================
  // Lock Verification & Signing
  // ============================================

  verifyLockEvent(event: LockEvent): boolean {
    // Verify lock event is valid
    if (event.amount <= 0n) return false;
    if (event.confirmations < config.bridge.confirmationsRequired) return false;
    if (event.amount > config.bridge.maxLockAmount) return false;
    if (event.amount < config.bridge.minLockAmount) return false;
    
    return true;
  }

  signLockApproval(event: LockEvent): ValidatorSignature {
    const message = this.createLockMessage(event);
    const signature = this.sign(message);
    
    return {
      validatorId: this.validatorId,
      signature,
      timestamp: Date.now(),
    };
  }

  private createLockMessage(event: LockEvent): string {
    return JSON.stringify({
      type: 'lock_approval',
      txHash: event.txHash,
      sender: event.sender,
      amount: event.amount.toString(),
      blockNumber: event.blockNumber,
    });
  }

  // ============================================
  // Burn Verification & Signing
  // ============================================

  verifyBurnEvent(event: BurnEvent): boolean {
    if (event.amount <= 0n) return false;
    if (!event.cardanoRecipient) return false;
    
    return true;
  }

  signBurnApproval(event: BurnEvent): ValidatorSignature {
    const message = this.createBurnMessage(event);
    const signature = this.sign(message);
    
    return {
      validatorId: this.validatorId,
      signature,
      timestamp: Date.now(),
    };
  }

  private createBurnMessage(event: BurnEvent): string {
    return JSON.stringify({
      type: 'burn_approval',
      txHash: event.txHash,
      sender: event.sender,
      amount: event.amount.toString(),
      cardanoRecipient: event.cardanoRecipient,
    });
  }

  // ============================================
  // Signature Operations
  // ============================================

  private sign(message: string): string {
    // Simple HMAC-based signature for prototype
    // In production, use proper Ed25519 signatures
    const hash = createHash('sha256')
      .update(this.keys.privateKey)
      .update(message)
      .digest('hex');
    return hash;
  }

  verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      // Simplified verification for prototype
      // In production, use proper Ed25519 verification
      return signature.length === 64 && publicKey.length === 64;
    } catch {
      return false;
    }
  }
}

// ============================================
// Multi-Signature Coordinator
// ============================================

export class MultisigCoordinator {
  private validators: BridgeValidator[];
  private threshold: number;
  private signatures: Map<string, ValidatorSignature[]> = new Map();

  constructor(validators: BridgeValidator[], threshold: number = 2) {
    this.validators = validators;
    this.threshold = threshold;
  }

  collectLockApproval(operationId: string, event: LockEvent): {
    approved: boolean;
    signatures: ValidatorSignature[];
  } {
    const sigs: ValidatorSignature[] = [];
    
    for (const validator of this.validators) {
      if (validator.verifyLockEvent(event)) {
        sigs.push(validator.signLockApproval(event));
      }
    }

    this.signatures.set(operationId, sigs);

    return {
      approved: sigs.length >= this.threshold,
      signatures: sigs,
    };
  }

  collectBurnApproval(operationId: string, event: BurnEvent): {
    approved: boolean;
    signatures: ValidatorSignature[];
  } {
    const sigs: ValidatorSignature[] = [];
    
    for (const validator of this.validators) {
      if (validator.verifyBurnEvent(event)) {
        sigs.push(validator.signBurnApproval(event));
      }
    }

    this.signatures.set(operationId, sigs);

    return {
      approved: sigs.length >= this.threshold,
      signatures: sigs,
    };
  }

  getSignatures(operationId: string): ValidatorSignature[] {
    return this.signatures.get(operationId) || [];
  }
}

