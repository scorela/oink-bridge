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

// CLI: Unwrap $midoink → $oink

import { config } from '../config/index.js';

interface UnwrapArgs {
  amount: string;
  midnightAddress: string;
  cardanoAddress: string;
}

interface InitiateResponse {
  success: boolean;
  instructions: Record<string, string>;
  error?: string;
}

interface CompleteResponse {
  success: boolean;
  operation: { id: string; status: string; amount: string; burnTxHash: string };
  pegStatus: { totalLocked: string; totalMinted: string; pegValid: boolean };
  error?: string;
}

function parseArgs(): UnwrapArgs {
  const args = process.argv.slice(2);
  const parsed: Partial<UnwrapArgs> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      parsed[key as keyof UnwrapArgs] = value;
    }
  }

  if (!parsed.amount || !parsed.midnightAddress || !parsed.cardanoAddress) {
    console.error(`
Usage: npm run cli:unwrap -- --amount <amount> --midnightAddress <addr> --cardanoAddress <addr>

Example:
  npm run cli:unwrap -- \\
    --amount 1000000 \\
    --midnightAddress midnight_test1... \\
    --cardanoAddress addr_test1qz...
`);
    process.exit(1);
  }

  return parsed as UnwrapArgs;
}

async function unwrap(args: UnwrapArgs) {
  const bridgeUrl = `http://localhost:${config.bridge.port}`;

  console.log('\n🌙 $midoink → $oink Unwrap');
  console.log('═'.repeat(50));
  console.log(`Amount:           ${args.amount} $midoink`);
  console.log(`From (Midnight):  ${args.midnightAddress}`);
  console.log(`To (Cardano):     ${args.cardanoAddress}`);
  console.log('═'.repeat(50));

  // Step 1: Initiate unwrap
  console.log('\n📝 Step 1: Initiating unwrap...');
  
  const initiateRes = await fetch(`${bridgeUrl}/unwrap/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      midnightAddress: args.midnightAddress,
      cardanoAddress: args.cardanoAddress,
      amount: args.amount,
    }),
  });

  const initiate = await initiateRes.json() as InitiateResponse;
  
  if (!initiate.success) {
    console.error('❌ Failed to initiate unwrap:', initiate.error);
    process.exit(1);
  }

  console.log('\n   Instructions:');
  Object.entries(initiate.instructions).forEach(([step, instruction]) => {
    console.log(`   ${step}: ${instruction}`);
  });

  // Step 2: Simulate burn transaction on Midnight
  console.log('\n🔥 Step 2: Simulating burn transaction...');
  const burnTxHash = `midnight-burn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  console.log(`   Burn TX: ${burnTxHash}`);

  // Step 3: Complete unwrap
  console.log('\n🔓 Step 3: Completing unwrap (unlocking $oink)...');
  
  const completeRes = await fetch(`${bridgeUrl}/unwrap/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      burnTxHash,
      sender: args.midnightAddress,
      cardanoAddress: args.cardanoAddress,
      amount: args.amount,
    }),
  });

  const complete = await completeRes.json() as CompleteResponse;

  if (!complete.success) {
    console.error('❌ Failed to complete unwrap:', complete.error);
    process.exit(1);
  }

  console.log('\n✅ UNWRAP COMPLETE');
  console.log('═'.repeat(50));
  console.log(`Operation ID:     ${complete.operation.id}`);
  console.log(`Status:           ${complete.operation.status}`);
  console.log(`Amount unlocked:  ${complete.operation.amount} $oink`);
  console.log('─'.repeat(50));
  console.log('📊 Peg Status:');
  console.log(`   Total locked:  ${complete.pegStatus.totalLocked} $oink`);
  console.log(`   Total minted:  ${complete.pegStatus.totalMinted} $midoink`);
  console.log(`   Peg valid:     ${complete.pegStatus.pegValid ? '✅ Yes (1:1)' : '❌ NO!'}`);
  console.log('═'.repeat(50));
}

// Run
const args = parseArgs();
unwrap(args).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
