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

// CLI: Check bridge status

import { config } from '../config/index.js';

interface HealthResponse {
  status: string;
  pegIntegrity: boolean;
  totalLocked: string;
  totalMinted: string;
  pendingOperations: number;
  completedOperations: number;
}

interface StatusResponse {
  bridge: { pegRatio: string };
  threshold: string;
  validators: Array<{ id: string; active: boolean }>;
}

async function checkStatus() {
  const bridgeUrl = `http://localhost:${config.bridge.port}`;

  console.log('\n🌉 Bridge Status');
  console.log('═'.repeat(60));

  try {
    // Health check
    const healthRes = await fetch(`${bridgeUrl}/health`);
    const health = await healthRes.json() as HealthResponse;

    // Status check
    const statusRes = await fetch(`${bridgeUrl}/status`);
    const status = await statusRes.json() as StatusResponse;

    // Display results
    console.log('\n📊 Bridge Health');
    console.log('─'.repeat(60));
    console.log(`Status:              ${health.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Peg Integrity:       ${health.pegIntegrity ? '✅ Valid' : '❌ VIOLATED!'}`);

    console.log('\n💰 Token Balances');
    console.log('─'.repeat(60));
    console.log(`$oink locked:        ${health.totalLocked}`);
    console.log(`$midoink minted:     ${health.totalMinted}`);
    console.log(`Peg ratio:           ${status.bridge.pegRatio}`);

    console.log('\n🔐 Validators');
    console.log('─'.repeat(60));
    console.log(`Threshold:           ${status.threshold}`);
    status.validators.forEach((v) => {
      console.log(`  ${v.id}: ${v.active ? '✅ Active' : '❌ Inactive'}`);
    });

    console.log('\n📋 Operations');
    console.log('─'.repeat(60));
    console.log(`Pending:             ${health.pendingOperations}`);
    console.log(`Completed:           ${health.completedOperations}`);

    console.log('\n═'.repeat(60));

    // Peg verification summary
    if (health.pegIntegrity) {
      console.log('✅ 1:1 PEG MAINTAINED - All $midoink backed by $oink');
    } else {
      console.log('❌ PEG INTEGRITY VIOLATION - IMMEDIATE ACTION REQUIRED!');
      console.log(`   Difference: ${BigInt(health.totalLocked) - BigInt(health.totalMinted)}`);
    }
    
    console.log('═'.repeat(60));

  } catch {
    console.error('❌ Failed to connect to bridge server');
    console.error(`   Make sure the server is running: npm run bridge:start`);
    console.error(`   Expected URL: ${bridgeUrl}`);
    process.exit(1);
  }
}

// Run
checkStatus().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
