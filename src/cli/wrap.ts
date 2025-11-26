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

// CLI: Wrap $oink → $midoink

import { config } from '../config/index.js';

interface WrapArgs {
  amount: string;
  cardanoAddress: string;
  midnightAddress: string;
}

interface InitiateResponse {
  success: boolean;
  lockAddress: string;
  instructions: Record<string, string>;
  error?: string;
}

interface CompleteResponse {
  success: boolean;
  operation: { id: string; status: string; amount: string; lockTxHash: string };
  pegStatus: { totalLocked: string; totalMinted: string; pegValid: boolean };
  error?: string;
}

function parseArgs(): WrapArgs {
  const args = process.argv.slice(2);
  const parsed: Partial<WrapArgs> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      parsed[key as keyof WrapArgs] = value;
    }
  }

  if (!parsed.amount || !parsed.cardanoAddress || !parsed.midnightAddress) {
    console.error(`
Usage: npm run cli:wrap -- --amount <amount> --cardanoAddress <addr> --midnightAddress <addr>

Example:
  npm run cli:wrap -- \\
    --amount 1000000 \\
    --cardanoAddress addr_test1qz... \\
    --midnightAddress midnight_test1...
`);
    process.exit(1);
  }

  return parsed as WrapArgs;
}

async function wrap(args: WrapArgs) {
  const bridgeUrl = `http://localhost:${config.bridge.port}`;

  console.log('\n🐷 $oink → $midoink Wrap');
  console.log('═'.repeat(50));
  console.log(`Amount:           ${args.amount} $oink`);
  console.log(`From (Cardano):   ${args.cardanoAddress}`);
  console.log(`To (Midnight):    ${args.midnightAddress}`);
  console.log('═'.repeat(50));

  // Step 1: Initiate wrap
  console.log('\n📝 Step 1: Initiating wrap...');
  
  const initiateRes = await fetch(`${bridgeUrl}/wrap/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardanoAddress: args.cardanoAddress,
      midnightAddress: args.midnightAddress,
      amount: args.amount,
    }),
  });

  const initiate = await initiateRes.json() as InitiateResponse;
  
  if (!initiate.success) {
    console.error('❌ Failed to initiate wrap:', initiate.error);
    process.exit(1);
  }

  console.log(`   Lock address: ${initiate.lockAddress}`);
  console.log('\n   Instructions:');
  Object.entries(initiate.instructions).forEach(([step, instruction]) => {
    console.log(`   ${step}: ${instruction}`);
  });

  // Step 2: Simulate lock transaction
  console.log('\n🔒 Step 2: Simulating lock transaction...');
  const lockTxHash = `cardano-lock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  console.log(`   Lock TX: ${lockTxHash}`);

  // Step 3: Complete wrap
  console.log('\n✨ Step 3: Completing wrap (minting $midoink)...');
  
  const completeRes = await fetch(`${bridgeUrl}/wrap/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lockTxHash,
      sender: args.cardanoAddress,
      midnightAddress: args.midnightAddress,
      amount: args.amount,
    }),
  });

  const complete = await completeRes.json() as CompleteResponse;

  if (!complete.success) {
    console.error('❌ Failed to complete wrap:', complete.error);
    process.exit(1);
  }

  console.log('\n✅ WRAP COMPLETE');
  console.log('═'.repeat(50));
  console.log(`Operation ID:     ${complete.operation.id}`);
  console.log(`Status:           ${complete.operation.status}`);
  console.log(`Amount minted:    ${complete.operation.amount} $midoink`);
  console.log('─'.repeat(50));
  console.log('📊 Peg Status:');
  console.log(`   Total locked:  ${complete.pegStatus.totalLocked} $oink`);
  console.log(`   Total minted:  ${complete.pegStatus.totalMinted} $midoink`);
  console.log(`   Peg valid:     ${complete.pegStatus.pegValid ? '✅ Yes (1:1)' : '❌ NO!'}`);
  console.log('═'.repeat(50));
}

// Run
const args = parseArgs();
wrap(args).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
