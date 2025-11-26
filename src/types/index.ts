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

import { z } from 'zod';

// ============================================
// Core Types
// ============================================

export type Network = 'cardano' | 'midnight';
export type OperationType = 'wrap' | 'unwrap';

// ============================================
// Token Types
// ============================================

export interface TokenAmount {
  policyId: string;
  assetName: string;
  amount: bigint;
}

export interface OinkToken extends TokenAmount {
  network: 'cardano';
}

export interface MidoinkToken extends TokenAmount {
  network: 'midnight';
}

// ============================================
// Transaction Types
// ============================================

export interface LockEvent {
  txHash: string;
  blockNumber: number;
  sender: string;
  amount: bigint;
  timestamp: number;
  confirmations: number;
}

export interface MintEvent {
  txHash: string;
  blockNumber: number;
  recipient: string;
  amount: bigint;
  timestamp: number;
  lockTxHash: string; // Reference to Cardano lock tx
}

export interface BurnEvent {
  txHash: string;
  blockNumber: number;
  sender: string;
  amount: bigint;
  timestamp: number;
  cardanoRecipient: string;
}

export interface UnlockEvent {
  txHash: string;
  blockNumber: number;
  recipient: string;
  amount: bigint;
  timestamp: number;
  burnTxHash: string; // Reference to Midnight burn tx
}

// ============================================
// Bridge State Types
// ============================================

export type BridgeOperationStatus = 
  | 'pending_lock'
  | 'locked'
  | 'pending_mint'
  | 'minted'
  | 'pending_burn'
  | 'burned'
  | 'pending_unlock'
  | 'unlocked'
  | 'failed';

export interface BridgeOperation {
  id: string;
  type: OperationType;
  status: BridgeOperationStatus;
  amount: bigint;
  
  // Cardano side
  cardanoAddress: string;
  lockTxHash?: string;
  unlockTxHash?: string;
  
  // Midnight side
  midnightAddress: string;
  mintTxHash?: string;
  burnTxHash?: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  
  // Validator signatures
  signatures: ValidatorSignature[];
}

export interface ValidatorSignature {
  validatorId: string;
  signature: string;
  timestamp: number;
}

// ============================================
// Bridge State (for 1:1 peg verification)
// ============================================

export interface BridgeState {
  // Must always be equal for 1:1 peg
  totalOinkLocked: bigint;
  totalMidoinkMinted: bigint;
  
  // Audit trail
  pendingOperations: BridgeOperation[];
  completedOperations: number;
  
  // Health
  lastCardanoBlock: number;
  lastMidnightBlock: number;
  isHealthy: boolean;
}

// ============================================
// Validation Schemas
// ============================================

export const WrapRequestSchema = z.object({
  cardanoAddress: z.string().min(1),
  midnightAddress: z.string().min(1),
  amount: z.string().transform(BigInt),
});

export const UnwrapRequestSchema = z.object({
  midnightAddress: z.string().min(1),
  cardanoAddress: z.string().min(1),
  amount: z.string().transform(BigInt),
});

export type WrapRequest = z.infer<typeof WrapRequestSchema>;
export type UnwrapRequest = z.infer<typeof UnwrapRequestSchema>;

