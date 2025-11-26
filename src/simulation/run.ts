#!/usr/bin/env tsx
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

// Full Bridge Simulation - Tests wrap/unwrap flow with 1:1 peg verification

import { startServer } from '../bridge/server.js';
import { config } from '../config/index.js';

const BRIDGE_URL = `http://localhost:${config.bridge.port}`;

interface HealthResponse {
  status: string;
  pegIntegrity: boolean;
  totalLocked: string;
  totalMinted: string;
  pendingOperations: number;
  completedOperations: number;
}

interface WrapResponse {
  success: boolean;
  operation?: { id: string; status: string; amount: string };
  pegStatus?: { totalLocked: string; totalMinted: string; pegValid: boolean };
  error?: string;
  details?: string;
}

interface UnwrapResponse {
  success: boolean;
  operation?: { id: string; status: string; amount: string };
  pegStatus?: { totalLocked: string; totalMinted: string; pegValid: boolean };
  error?: string;
}

interface SimulationResult {
  scenario: string;
  success: boolean;
  pegValid: boolean;
  details: Record<string, unknown>;
}

const results: SimulationResult[] = [];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          🐷 $oink ↔ 🌙 $midoink Bridge Simulation              ║');
  console.log('║                     1:1 Peg Verification                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Start server
  console.log('\n🚀 Starting bridge server...');
  const server = startServer();
  await sleep(1000);

  try {
    // Scenario 1: Initial state
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('📋 Scenario 1: Initial State Check');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const initialStatus = await fetch(`${BRIDGE_URL}/health`).then(r => r.json()) as HealthResponse;
    console.log(`   Locked: ${initialStatus.totalLocked} | Minted: ${initialStatus.totalMinted}`);
    console.log(`   Peg: ${initialStatus.pegIntegrity ? '✅ Valid' : '❌ Invalid'}`);
    
    results.push({
      scenario: 'Initial State',
      success: initialStatus.status === 'healthy',
      pegValid: initialStatus.pegIntegrity,
      details: initialStatus as unknown as Record<string, unknown>,
    });

    // Scenario 2: Wrap 1,000,000 $oink
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('📋 Scenario 2: Wrap 1,000,000 $oink → $midoink');
    console.log('─────────────────────────────────────────────────────────────────');

    const wrap1 = await fetch(`${BRIDGE_URL}/wrap/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lockTxHash: 'sim-lock-tx-001',
        sender: 'addr_test1_user_alice',
        midnightAddress: 'midnight_test1_alice',
        amount: '1000000',
      }),
    }).then(r => r.json()) as WrapResponse;

    console.log(`   Operation: ${wrap1.operation?.id || 'failed'}`);
    console.log(`   Locked: ${wrap1.pegStatus?.totalLocked} | Minted: ${wrap1.pegStatus?.totalMinted}`);
    console.log(`   Peg: ${wrap1.pegStatus?.pegValid ? '✅ Valid' : '❌ Invalid'}`);

    results.push({
      scenario: 'Wrap 1M tokens',
      success: wrap1.success,
      pegValid: wrap1.pegStatus?.pegValid ?? false,
      details: wrap1 as unknown as Record<string, unknown>,
    });

    // Scenario 3: Wrap another 500,000 $oink
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('📋 Scenario 3: Wrap 500,000 more $oink → $midoink');
    console.log('─────────────────────────────────────────────────────────────────');

    const wrap2Res = await fetch(`${BRIDGE_URL}/wrap/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lockTxHash: 'sim-lock-tx-002',
        sender: 'addr_test1_user_bob',
        midnightAddress: 'midnight_test1_bob',
        amount: '500000',
      }),
    });
    const wrap2 = await wrap2Res.json() as WrapResponse;

    if (!wrap2.success) {
      console.log(`   ❌ Error: ${wrap2.error || 'Unknown error'}`);
      if (wrap2.details) console.log(`   Details: ${wrap2.details}`);
    }
    console.log(`   Operation: ${wrap2.operation?.id || 'failed'}`);
    console.log(`   Locked: ${wrap2.pegStatus?.totalLocked} | Minted: ${wrap2.pegStatus?.totalMinted}`);
    console.log(`   Peg: ${wrap2.pegStatus?.pegValid ? '✅ Valid' : '❌ Invalid'}`);

    results.push({
      scenario: 'Wrap 500K more tokens',
      success: wrap2.success,
      pegValid: wrap2.pegStatus?.pegValid ?? false,
      details: wrap2 as unknown as Record<string, unknown>,
    });

    // Scenario 4: Unwrap 300,000 $midoink
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('📋 Scenario 4: Unwrap 300,000 $midoink → $oink');
    console.log('─────────────────────────────────────────────────────────────────');

    const unwrap1 = await fetch(`${BRIDGE_URL}/unwrap/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        burnTxHash: 'sim-burn-tx-001',
        sender: 'midnight_test1_alice',
        cardanoAddress: 'addr_test1_user_alice',
        amount: '300000',
      }),
    }).then(r => r.json()) as UnwrapResponse;

    console.log(`   Operation: ${unwrap1.operation?.id || 'failed'}`);
    console.log(`   Locked: ${unwrap1.pegStatus?.totalLocked} | Minted: ${unwrap1.pegStatus?.totalMinted}`);
    console.log(`   Peg: ${unwrap1.pegStatus?.pegValid ? '✅ Valid' : '❌ Invalid'}`);

    results.push({
      scenario: 'Unwrap 300K tokens',
      success: unwrap1.success,
      pegValid: unwrap1.pegStatus?.pegValid ?? false,
      details: unwrap1 as unknown as Record<string, unknown>,
    });

    // Scenario 5: Final state verification
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('📋 Scenario 5: Final State Verification');
    console.log('─────────────────────────────────────────────────────────────────');

    const finalStatus = await fetch(`${BRIDGE_URL}/health`).then(r => r.json()) as HealthResponse;
    
    // Expected: 1,000,000 + 500,000 - 300,000 = 1,200,000
    const expectedBalance = '1200000';
    const actualLocked = finalStatus.totalLocked;
    const actualMinted = finalStatus.totalMinted;
    
    console.log(`   Expected: ${expectedBalance}`);
    console.log(`   Locked:   ${actualLocked}`);
    console.log(`   Minted:   ${actualMinted}`);
    console.log(`   Peg:      ${finalStatus.pegIntegrity ? '✅ Valid' : '❌ Invalid'}`);

    results.push({
      scenario: 'Final State',
      success: actualLocked === expectedBalance && actualMinted === expectedBalance,
      pegValid: finalStatus.pegIntegrity,
      details: { expected: expectedBalance, actualLocked, actualMinted },
    });

    // Summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     SIMULATION SUMMARY                          ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    
    let allPassed = true;
    results.forEach((r, i) => {
      const status = r.success && r.pegValid ? '✅' : '❌';
      allPassed = allPassed && r.success && r.pegValid;
      console.log(`║  ${i + 1}. ${r.scenario.padEnd(20)} ${status} Success: ${r.success}, Peg: ${r.pegValid}`.padEnd(65) + '║');
    });
    
    console.log('╠════════════════════════════════════════════════════════════════╣');
    
    if (allPassed) {
      console.log('║  ✅ ALL SCENARIOS PASSED - 1:1 PEG MAINTAINED                  ║');
    } else {
      console.log('║  ❌ SOME SCENARIOS FAILED - CHECK DETAILS ABOVE                ║');
    }
    
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    return allPassed;

  } finally {
    server.close();
    console.log('🛑 Bridge server stopped\n');
  }
}

// Run
runSimulation()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('Simulation error:', err);
    process.exit(1);
  });
