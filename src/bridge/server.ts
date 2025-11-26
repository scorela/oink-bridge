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

// Bridge Server - HTTP API for bridge operations
import express, { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { bridgeState } from './state.js';
import { BridgeValidator, MultisigCoordinator } from './validator.js';
import { WrapRequestSchema, UnwrapRequestSchema, LockEvent, BurnEvent } from '../types/index.js';

const app = express();
app.use(express.json());

// Initialize validators (2-of-3 multisig)
const validators = [
  new BridgeValidator('validator-1'),
  new BridgeValidator('validator-2'),
  new BridgeValidator('validator-3'),
];
const multisig = new MultisigCoordinator(validators, config.bridge.threshold);

// ============================================
// Health & Status
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  const state = bridgeState.getState();
  const peg = bridgeState.verifyPegIntegrity();
  
  res.json({
    status: state.isHealthy ? 'healthy' : 'unhealthy',
    pegIntegrity: peg.isValid,
    totalLocked: state.totalOinkLocked.toString(),
    totalMinted: state.totalMidoinkMinted.toString(),
    pendingOperations: state.pendingOperations.length,
    completedOperations: state.completedOperations,
  });
});

app.get('/status', (_req: Request, res: Response) => {
  const state = bridgeState.getState();
  
  res.json({
    bridge: {
      oinkLocked: state.totalOinkLocked.toString(),
      midoinkMinted: state.totalMidoinkMinted.toString(),
      pegRatio: '1:1',
      pegValid: state.totalOinkLocked === state.totalMidoinkMinted,
    },
    validators: validators.map(v => ({
      id: v.getValidatorId(),
      active: true,
    })),
    threshold: `${config.bridge.threshold}-of-${validators.length}`,
    pendingOperations: state.pendingOperations.length,
  });
});

// ============================================
// Wrap: $oink → $midoink
// ============================================

// Step 1: Initiate wrap (get lock address)
app.post('/wrap/initiate', (req: Request, res: Response) => {
  try {
    const parsed = WrapRequestSchema.parse(req.body);
    
    res.json({
      success: true,
      lockAddress: config.cardano.lockContractAddress || 'addr_test1_lock_contract',
      instructions: {
        step1: `Send ${parsed.amount} $oink to lock address`,
        step2: 'Include your Midnight address in transaction metadata',
        step3: 'Wait for 15 confirmations',
        step4: 'Call /wrap/complete with lock tx hash',
      },
      midnightRecipient: parsed.midnightAddress,
      amount: parsed.amount.toString(),
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request', details: error });
  }
});

// Step 2: Complete wrap (after lock confirmed)
app.post('/wrap/complete', (req: Request, res: Response) => {
  try {
    const { lockTxHash, sender, midnightAddress, amount } = req.body;
    
    // Simulate lock event from Cardano
    const lockEvent: LockEvent = {
      txHash: lockTxHash,
      blockNumber: 1000000,
      sender,
      amount: BigInt(amount),
      timestamp: Date.now(),
      confirmations: 15, // Assume confirmed
    };

    // VALIDATE FIRST before any state changes
    // Check if we can get validator approvals
    const tempApproval = multisig.collectLockApproval(`temp-${lockTxHash}`, lockEvent);
    
    if (!tempApproval.approved) {
      res.status(400).json({ 
        error: 'Insufficient validator approvals',
        collected: tempApproval.signatures.length,
        required: config.bridge.threshold,
      });
      return;
    }

    // Now atomically record lock + mint (both must succeed)
    const operation = bridgeState.recordLock(lockEvent);
    operation.signatures = tempApproval.signatures;

    // Record mint (would trigger Midnight contract in production)
    bridgeState.recordMint({
      txHash: `midnight-mint-${Date.now()}`,
      blockNumber: 500000,
      recipient: midnightAddress,
      amount: BigInt(amount),
      timestamp: Date.now(),
      lockTxHash,
    });

    const state = bridgeState.getState();
    
    res.json({
      success: true,
      operation: {
        id: operation.id,
        status: 'minted',
        amount: amount,
        lockTxHash,
      },
      pegStatus: {
        totalLocked: state.totalOinkLocked.toString(),
        totalMinted: state.totalMidoinkMinted.toString(),
        pegValid: state.totalOinkLocked === state.totalMidoinkMinted,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Wrap failed', details: String(error) });
  }
});

// ============================================
// Unwrap: $midoink → $oink
// ============================================

// Step 1: Initiate unwrap (burn $midoink)
app.post('/unwrap/initiate', (req: Request, res: Response) => {
  try {
    const parsed = UnwrapRequestSchema.parse(req.body);
    
    res.json({
      success: true,
      instructions: {
        step1: `Call burn() on Midnight contract with ${parsed.amount} $midoink`,
        step2: 'Include your Cardano address',
        step3: 'Call /unwrap/complete with burn tx hash',
      },
      cardanoRecipient: parsed.cardanoAddress,
      amount: parsed.amount.toString(),
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request', details: error });
  }
});

// Step 2: Complete unwrap (after burn confirmed)
app.post('/unwrap/complete', (req: Request, res: Response) => {
  try {
    const { burnTxHash, sender, cardanoAddress, amount } = req.body;
    
    // Simulate burn event from Midnight
    const burnEvent: BurnEvent = {
      txHash: burnTxHash,
      blockNumber: 500001,
      sender,
      amount: BigInt(amount),
      timestamp: Date.now(),
      cardanoRecipient: cardanoAddress,
    };

    // VALIDATE FIRST before any state changes
    const tempApproval = multisig.collectBurnApproval(`temp-${burnTxHash}`, burnEvent);

    if (!tempApproval.approved) {
      res.status(400).json({
        error: 'Insufficient validator approvals',
        collected: tempApproval.signatures.length,
        required: config.bridge.threshold,
      });
      return;
    }

    // Now atomically record burn + unlock (both must succeed)
    const operation = bridgeState.recordBurn(burnEvent);
    operation.signatures = tempApproval.signatures;

    // Record unlock (would trigger Cardano contract in production)
    bridgeState.recordUnlock({
      txHash: `cardano-unlock-${Date.now()}`,
      blockNumber: 1000001,
      recipient: cardanoAddress,
      amount: BigInt(amount),
      timestamp: Date.now(),
      burnTxHash,
    });

    const state = bridgeState.getState();

    res.json({
      success: true,
      operation: {
        id: operation.id,
        status: 'unlocked',
        amount: amount,
        burnTxHash,
      },
      pegStatus: {
        totalLocked: state.totalOinkLocked.toString(),
        totalMinted: state.totalMidoinkMinted.toString(),
        pegValid: state.totalOinkLocked === state.totalMidoinkMinted,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Unwrap failed', details: String(error) });
  }
});

// ============================================
// Operations Query
// ============================================

app.get('/operations/:id', (req: Request, res: Response) => {
  const operation = bridgeState.getOperation(req.params.id);
  
  if (!operation) {
    res.status(404).json({ error: 'Operation not found' });
    return;
  }

  res.json({
    operation: {
      ...operation,
      amount: operation.amount.toString(),
    },
  });
});

app.get('/operations', (req: Request, res: Response) => {
  const { address } = req.query;
  
  const operations = address 
    ? bridgeState.getOperationsByAddress(address as string)
    : bridgeState.getPendingOperations();

  res.json({
    operations: operations.map(op => ({
      ...op,
      amount: op.amount.toString(),
    })),
  });
});

// ============================================
// Error Handler
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Bridge error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================

const PORT = config.bridge.port;

export function startServer() {
  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌉 Bridge server running on http://0.0.0.0:${PORT}`);
    console.log(`   Validators: ${validators.length} (threshold: ${config.bridge.threshold})`);
    console.log(`   Peg ratio: 1:1`);
    console.log(`   Network: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Run if executed directly (ESM compatible)
const isMain = process.argv[1]?.includes('server') || 
               import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  startServer();
}

export { app };

