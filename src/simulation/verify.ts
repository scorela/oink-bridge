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

// Peg Integrity Verification - Comprehensive checks for 1:1 peg

import { BridgeStateManager } from '../bridge/state.js';

interface VerificationResult {
  check: string;
  passed: boolean;
  expected: string;
  actual: string;
}

function runVerification() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           🔍 1:1 PEG INTEGRITY VERIFICATION                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const results: VerificationResult[] = [];
  const state = new BridgeStateManager();

  // Test 1: Initial state should be 0:0
  console.log('\n📋 Test 1: Initial State');
  const initialState = state.getState();
  const test1 = initialState.totalOinkLocked === 0n && initialState.totalMidoinkMinted === 0n;
  results.push({
    check: 'Initial state 0:0',
    passed: test1,
    expected: '0:0',
    actual: `${initialState.totalOinkLocked}:${initialState.totalMidoinkMinted}`,
  });
  console.log(`   ${test1 ? '✅' : '❌'} Expected 0:0, got ${initialState.totalOinkLocked}:${initialState.totalMidoinkMinted}`);

  // Test 2: Lock should increase oink
  console.log('\n📋 Test 2: Lock increases $oink locked');
  state.recordLock({
    txHash: 'test-lock-1',
    blockNumber: 100,
    sender: 'addr_test1',
    amount: 1000000n,
    timestamp: Date.now(),
    confirmations: 15,
  });
  const afterLock = state.getState();
  const test2 = afterLock.totalOinkLocked === 1000000n;
  results.push({
    check: 'Lock increases $oink',
    passed: test2,
    expected: '1000000',
    actual: afterLock.totalOinkLocked.toString(),
  });
  console.log(`   ${test2 ? '✅' : '❌'} Expected 1000000, got ${afterLock.totalOinkLocked}`);

  // Test 3: Mint should match lock (1:1)
  console.log('\n📋 Test 3: Mint matches lock 1:1');
  state.recordMint({
    txHash: 'test-mint-1',
    blockNumber: 50,
    recipient: 'midnight_test1',
    amount: 1000000n,
    timestamp: Date.now(),
    lockTxHash: 'test-lock-1',
  });
  const afterMint = state.getState();
  const test3 = afterMint.totalOinkLocked === afterMint.totalMidoinkMinted;
  results.push({
    check: 'Mint matches lock 1:1',
    passed: test3,
    expected: `${afterMint.totalOinkLocked}:${afterMint.totalOinkLocked}`,
    actual: `${afterMint.totalOinkLocked}:${afterMint.totalMidoinkMinted}`,
  });
  console.log(`   ${test3 ? '✅' : '❌'} Locked: ${afterMint.totalOinkLocked}, Minted: ${afterMint.totalMidoinkMinted}`);

  // Test 4: Peg integrity check
  console.log('\n📋 Test 4: Peg integrity verification');
  const pegCheck = state.verifyPegIntegrity();
  results.push({
    check: 'Peg integrity valid',
    passed: pegCheck.isValid,
    expected: 'diff=0',
    actual: `diff=${pegCheck.diff}`,
  });
  console.log(`   ${pegCheck.isValid ? '✅' : '❌'} Peg valid: ${pegCheck.isValid}, diff: ${pegCheck.diff}`);

  // Test 5: Multiple operations maintain peg
  console.log('\n📋 Test 5: Multiple operations maintain peg');
  
  // Lock more
  state.recordLock({
    txHash: 'test-lock-2',
    blockNumber: 101,
    sender: 'addr_test2',
    amount: 500000n,
    timestamp: Date.now(),
    confirmations: 15,
  });
  state.recordMint({
    txHash: 'test-mint-2',
    blockNumber: 51,
    recipient: 'midnight_test2',
    amount: 500000n,
    timestamp: Date.now(),
    lockTxHash: 'test-lock-2',
  });

  // Burn and unlock
  state.recordBurn({
    txHash: 'test-burn-1',
    blockNumber: 52,
    sender: 'midnight_test1',
    amount: 200000n,
    timestamp: Date.now(),
    cardanoRecipient: 'addr_test1',
  });
  state.recordUnlock({
    txHash: 'test-unlock-1',
    blockNumber: 102,
    recipient: 'addr_test1',
    amount: 200000n,
    timestamp: Date.now(),
    burnTxHash: 'test-burn-1',
  });

  const multiOpState = state.getState();
  // Expected: 1,000,000 + 500,000 - 200,000 = 1,300,000
  const expectedFinal = 1300000n;
  const test5 = multiOpState.totalOinkLocked === expectedFinal && 
                multiOpState.totalMidoinkMinted === expectedFinal;
  results.push({
    check: 'Multi-op maintains peg',
    passed: test5,
    expected: `${expectedFinal}:${expectedFinal}`,
    actual: `${multiOpState.totalOinkLocked}:${multiOpState.totalMidoinkMinted}`,
  });
  console.log(`   ${test5 ? '✅' : '❌'} Expected ${expectedFinal}:${expectedFinal}, got ${multiOpState.totalOinkLocked}:${multiOpState.totalMidoinkMinted}`);

  // Test 6: Full unwrap returns to 0:0
  console.log('\n📋 Test 6: Full unwrap returns to 0:0');
  
  state.recordBurn({
    txHash: 'test-burn-2',
    blockNumber: 53,
    sender: 'midnight_test_all',
    amount: 1300000n,
    timestamp: Date.now(),
    cardanoRecipient: 'addr_test_all',
  });
  state.recordUnlock({
    txHash: 'test-unlock-2',
    blockNumber: 103,
    recipient: 'addr_test_all',
    amount: 1300000n,
    timestamp: Date.now(),
    burnTxHash: 'test-burn-2',
  });

  const finalState = state.getState();
  const test6 = finalState.totalOinkLocked === 0n && finalState.totalMidoinkMinted === 0n;
  results.push({
    check: 'Full unwrap returns to 0:0',
    passed: test6,
    expected: '0:0',
    actual: `${finalState.totalOinkLocked}:${finalState.totalMidoinkMinted}`,
  });
  console.log(`   ${test6 ? '✅' : '❌'} Expected 0:0, got ${finalState.totalOinkLocked}:${finalState.totalMidoinkMinted}`);

  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    VERIFICATION SUMMARY                         ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');

  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  
  results.forEach((r, i) => {
    const status = r.passed ? '✅' : '❌';
    console.log(`║  ${i + 1}. ${status} ${r.check.padEnd(40)}`.padEnd(65) + '║');
  });

  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Results: ${passedCount}/${results.length} tests passed`.padEnd(64) + '║');
  
  if (allPassed) {
    console.log('║  ✅ ALL VERIFICATIONS PASSED - 1:1 PEG GUARANTEED              ║');
  } else {
    console.log('║  ❌ VERIFICATION FAILED - PEG INTEGRITY AT RISK                ║');
  }
  
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  return allPassed;
}

// Run
const passed = runVerification();
process.exit(passed ? 0 : 1);

