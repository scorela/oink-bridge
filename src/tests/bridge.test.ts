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

// Bridge Unit Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { BridgeStateManager } from '../bridge/state.js';
import { BridgeValidator, MultisigCoordinator } from '../bridge/validator.js';
import { LockEvent, BurnEvent } from '../types/index.js';

describe('BridgeStateManager', () => {
  let state: BridgeStateManager;

  beforeEach(() => {
    state = new BridgeStateManager();
  });

  describe('Initial State', () => {
    it('should start with 0:0 peg', () => {
      const s = state.getState();
      expect(s.totalOinkLocked).toBe(0n);
      expect(s.totalMidoinkMinted).toBe(0n);
    });

    it('should have valid peg integrity initially', () => {
      const peg = state.verifyPegIntegrity();
      expect(peg.isValid).toBe(true);
      expect(peg.diff).toBe(0n);
    });
  });

  describe('Wrap Operations (Lock + Mint)', () => {
    it('should increase locked amount on lock', () => {
      state.recordLock(createLockEvent('tx1', 1000000n));
      const s = state.getState();
      expect(s.totalOinkLocked).toBe(1000000n);
    });

    it('should maintain 1:1 peg after lock+mint', () => {
      state.recordLock(createLockEvent('tx1', 1000000n));
      state.recordMint(createMintEvent('mint1', 1000000n, 'tx1'));
      
      const peg = state.verifyPegIntegrity();
      expect(peg.isValid).toBe(true);
    });

    it('should handle multiple wrap operations', () => {
      // First wrap
      state.recordLock(createLockEvent('tx1', 1000000n));
      state.recordMint(createMintEvent('mint1', 1000000n, 'tx1'));
      
      // Second wrap
      state.recordLock(createLockEvent('tx2', 500000n));
      state.recordMint(createMintEvent('mint2', 500000n, 'tx2'));

      const s = state.getState();
      expect(s.totalOinkLocked).toBe(1500000n);
      expect(s.totalMidoinkMinted).toBe(1500000n);
      expect(state.verifyPegIntegrity().isValid).toBe(true);
    });
  });

  describe('Unwrap Operations (Burn + Unlock)', () => {
    beforeEach(() => {
      // Setup: wrap 1M tokens first
      state.recordLock(createLockEvent('tx1', 1000000n));
      state.recordMint(createMintEvent('mint1', 1000000n, 'tx1'));
    });

    it('should decrease minted amount on burn', () => {
      state.recordBurn(createBurnEvent('burn1', 300000n));
      const s = state.getState();
      expect(s.totalMidoinkMinted).toBe(700000n);
    });

    it('should maintain 1:1 peg after burn+unlock', () => {
      state.recordBurn(createBurnEvent('burn1', 300000n));
      state.recordUnlock(createUnlockEvent('unlock1', 300000n, 'burn1'));

      const peg = state.verifyPegIntegrity();
      expect(peg.isValid).toBe(true);
      
      const s = state.getState();
      expect(s.totalOinkLocked).toBe(700000n);
      expect(s.totalMidoinkMinted).toBe(700000n);
    });

    it('should return to 0:0 after full unwrap', () => {
      state.recordBurn(createBurnEvent('burn1', 1000000n));
      state.recordUnlock(createUnlockEvent('unlock1', 1000000n, 'burn1'));

      const s = state.getState();
      expect(s.totalOinkLocked).toBe(0n);
      expect(s.totalMidoinkMinted).toBe(0n);
    });
  });

  describe('Peg Integrity', () => {
    it('should track operations correctly', () => {
      // Complex scenario
      state.recordLock(createLockEvent('tx1', 1000000n));
      state.recordMint(createMintEvent('mint1', 1000000n, 'tx1'));
      
      state.recordLock(createLockEvent('tx2', 2000000n));
      state.recordMint(createMintEvent('mint2', 2000000n, 'tx2'));
      
      state.recordBurn(createBurnEvent('burn1', 500000n));
      state.recordUnlock(createUnlockEvent('unlock1', 500000n, 'burn1'));
      
      state.recordLock(createLockEvent('tx3', 100000n));
      state.recordMint(createMintEvent('mint3', 100000n, 'tx3'));

      // Expected: 1M + 2M - 500K + 100K = 2.6M
      const s = state.getState();
      expect(s.totalOinkLocked).toBe(2600000n);
      expect(s.totalMidoinkMinted).toBe(2600000n);
      expect(state.verifyPegIntegrity().isValid).toBe(true);
    });
  });
});

describe('BridgeValidator', () => {
  let validator: BridgeValidator;

  beforeEach(() => {
    validator = new BridgeValidator('test-validator-1');
  });

  describe('Lock Event Verification', () => {
    it('should accept valid lock events', () => {
      const event = createLockEvent('tx1', 1000000n);
      expect(validator.verifyLockEvent(event)).toBe(true);
    });

    it('should reject zero amount', () => {
      const event = createLockEvent('tx1', 0n);
      expect(validator.verifyLockEvent(event)).toBe(false);
    });

    it('should reject insufficient confirmations', () => {
      const event = { ...createLockEvent('tx1', 1000000n), confirmations: 5 };
      expect(validator.verifyLockEvent(event)).toBe(false);
    });
  });

  describe('Burn Event Verification', () => {
    it('should accept valid burn events', () => {
      const event = createBurnEvent('burn1', 1000000n);
      expect(validator.verifyBurnEvent(event)).toBe(true);
    });

    it('should reject zero amount', () => {
      const event = { ...createBurnEvent('burn1', 0n) };
      expect(validator.verifyBurnEvent(event)).toBe(false);
    });
  });

  describe('Signature Operations', () => {
    it('should generate valid lock approval signatures', () => {
      const event = createLockEvent('tx1', 1000000n);
      const signature = validator.signLockApproval(event);
      
      expect(signature.validatorId).toBe('test-validator-1');
      expect(signature.signature).toBeTruthy();
      expect(signature.timestamp).toBeGreaterThan(0);
    });
  });
});

describe('MultisigCoordinator', () => {
  let coordinator: MultisigCoordinator;

  beforeEach(() => {
    const validators = [
      new BridgeValidator('v1'),
      new BridgeValidator('v2'),
      new BridgeValidator('v3'),
    ];
    coordinator = new MultisigCoordinator(validators, 2);
  });

  it('should collect approvals from validators', () => {
    const event = createLockEvent('tx1', 1000000n);
    const result = coordinator.collectLockApproval('op1', event);
    
    expect(result.approved).toBe(true);
    expect(result.signatures.length).toBeGreaterThanOrEqual(2);
  });

  it('should store signatures by operation id', () => {
    const event = createLockEvent('tx1', 1000000n);
    coordinator.collectLockApproval('op1', event);
    
    const sigs = coordinator.getSignatures('op1');
    expect(sigs.length).toBeGreaterThanOrEqual(2);
  });

  it('should collect burn approvals', () => {
    const event = createBurnEvent('burn1', 1000000n);
    const result = coordinator.collectBurnApproval('op2', event);
    
    expect(result.approved).toBe(true);
    expect(result.signatures.length).toBeGreaterThanOrEqual(2);
  });

  it('should return empty array for unknown operation', () => {
    const sigs = coordinator.getSignatures('unknown-op');
    expect(sigs).toEqual([]);
  });
});

describe('BridgeStateManager - Edge Cases', () => {
  let state: BridgeStateManager;

  beforeEach(() => {
    state = new BridgeStateManager();
  });

  it('should return undefined for non-existent operation', () => {
    const op = state.getOperation('non-existent');
    expect(op).toBeUndefined();
  });

  it('should return empty array when no pending operations', () => {
    const pending = state.getPendingOperations();
    expect(pending).toEqual([]);
  });

  it('should return empty array for address with no operations', () => {
    const ops = state.getOperationsByAddress('addr_unknown');
    expect(ops).toEqual([]);
  });

  it('should find operations by cardano address', () => {
    state.recordLock(createLockEvent('tx1', 1000000n));
    state.recordMint(createMintEvent('mint1', 1000000n, 'tx1'));
    
    const ops = state.getOperationsByAddress('addr_test1_sender');
    expect(ops.length).toBe(1);
  });

  it('should find operations by midnight address', () => {
    state.recordLock(createLockEvent('tx1', 1000000n));
    state.recordMint(createMintEvent('mint1', 1000000n, 'tx1'));
    
    const ops = state.getOperationsByAddress('midnight_test1_recipient');
    expect(ops.length).toBe(1);
  });

  it('should throw error when minting without lock', () => {
    expect(() => {
      state.recordMint(createMintEvent('mint1', 1000000n, 'unknown-lock'));
    }).toThrow('No lock operation found');
  });

  it('should throw error when unlocking without burn', () => {
    state.recordLock(createLockEvent('tx1', 1000000n));
    state.recordMint(createMintEvent('mint1', 1000000n, 'tx1'));
    
    expect(() => {
      state.recordUnlock(createUnlockEvent('unlock1', 1000000n, 'unknown-burn'));
    }).toThrow('No burn operation found');
  });
});

describe('BridgeValidator - Edge Cases', () => {
  let validator: BridgeValidator;

  beforeEach(() => {
    validator = new BridgeValidator('test-validator');
  });

  it('should reject lock with amount over max', () => {
    const event = { ...createLockEvent('tx1', BigInt('2000000000000')), amount: BigInt('2000000000000') };
    expect(validator.verifyLockEvent(event)).toBe(false);
  });

  it('should reject lock with amount under min', () => {
    const event = { ...createLockEvent('tx1', 100n), amount: 100n };
    expect(validator.verifyLockEvent(event)).toBe(false);
  });

  it('should reject burn without cardano recipient', () => {
    const event = { ...createBurnEvent('burn1', 1000000n), cardanoRecipient: '' };
    expect(validator.verifyBurnEvent(event)).toBe(false);
  });

  it('should generate burn approval signatures', () => {
    const event = createBurnEvent('burn1', 1000000n);
    const signature = validator.signBurnApproval(event);
    
    expect(signature.validatorId).toBe('test-validator');
    expect(signature.signature).toBeTruthy();
  });

  it('should verify valid signature format', () => {
    const validSig = 'a'.repeat(64);
    const validPubKey = 'b'.repeat(64);
    const result = validator.verifySignature('message', validSig, validPubKey);
    expect(result).toBe(true);
  });

  it('should reject invalid signature format', () => {
    const result = validator.verifySignature('message', 'short', 'short');
    expect(result).toBe(false);
  });

  it('should return public key', () => {
    const pubKey = validator.getPublicKey();
    expect(pubKey).toBeTruthy();
    expect(pubKey.length).toBe(64);
  });
});

// Helper functions
function createLockEvent(txHash: string, amount: bigint): LockEvent {
  return {
    txHash,
    blockNumber: 1000000,
    sender: 'addr_test1_sender',
    amount,
    timestamp: Date.now(),
    confirmations: 15,
  };
}

function createMintEvent(txHash: string, amount: bigint, lockTxHash: string) {
  return {
    txHash,
    blockNumber: 500000,
    recipient: 'midnight_test1_recipient',
    amount,
    timestamp: Date.now(),
    lockTxHash,
  };
}

function createBurnEvent(txHash: string, amount: bigint): BurnEvent {
  return {
    txHash,
    blockNumber: 500001,
    sender: 'midnight_test1_sender',
    amount,
    timestamp: Date.now(),
    cardanoRecipient: 'addr_test1_recipient',
  };
}

function createUnlockEvent(txHash: string, amount: bigint, burnTxHash: string) {
  return {
    txHash,
    blockNumber: 1000001,
    recipient: 'addr_test1_recipient',
    amount,
    timestamp: Date.now(),
    burnTxHash,
  };
}

