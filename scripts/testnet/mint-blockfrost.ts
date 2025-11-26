#!/usr/bin/env npx tsx
/**
 * 🐷 Mint $oink_test using Blockfrost API
 */

import * as fs from 'fs';
import * as path from 'path';

const KEYS_DIR = path.join(process.cwd(), 'scripts/testnet/keys');
const BLOCKFROST_API = 'https://cardano-preview.blockfrost.io/api/v0';
const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID || '';

interface Config {
  network: string;
  wallet: { address: string; publicKey: string };
  token: { policyId: string; assetName: string; assetNameHex: string };
  assetId: string;
  totalSupply: string;
}

async function blockfrostRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${BLOCKFROST_API}${endpoint}`, {
    ...options,
    headers: {
      'project_id': BLOCKFROST_PROJECT_ID,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Blockfrost error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🐷 Minting $oink_test on Preview Testnet             ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Check Blockfrost API
  if (!BLOCKFROST_PROJECT_ID) {
    console.error('❌ BLOCKFROST_PROJECT_ID not set!');
    console.log('\nGet FREE API key: https://blockfrost.io/');
    console.log('Then: export BLOCKFROST_PROJECT_ID=previewXXX\n');
    process.exit(1);
  }

  // Load config
  const configPath = path.join(KEYS_DIR, 'config.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ Config not found. Run setup first:');
    console.log('   npx tsx scripts/testnet/setup-blockfrost.ts\n');
    process.exit(1);
  }

  const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log(`Token: $${config.token.assetName}`);
  console.log(`Policy ID: ${config.token.policyId}`);
  console.log(`Wallet: ${config.wallet.address}\n`);

  // Check wallet balance
  console.log('Checking wallet balance...');
  try {
    const utxos = await blockfrostRequest(`/addresses/${config.wallet.address}/utxos`);
    
    if (!utxos || utxos.length === 0) {
      console.log('\n❌ No UTxOs found. Please fund your wallet first:');
      console.log(`   Address: ${config.wallet.address}`);
      console.log('   Faucet: https://docs.cardano.org/cardano-testnets/tools/faucet/\n');
      process.exit(1);
    }

    let totalLovelace = 0n;
    for (const utxo of utxos) {
      for (const amount of utxo.amount) {
        if (amount.unit === 'lovelace') {
          totalLovelace += BigInt(amount.quantity);
        }
      }
    }

    console.log(`✅ Balance: ${totalLovelace} lovelace (${Number(totalLovelace) / 1_000_000} ADA)\n`);

    if (totalLovelace < 5_000_000n) {
      console.log('❌ Insufficient balance. Need at least 5 ADA for minting.\n');
      process.exit(1);
    }

    // In a real implementation, we would:
    // 1. Build the minting transaction using cardano-serialization-lib
    // 2. Sign with the wallet key
    // 3. Submit via Blockfrost

    console.log(`
═══════════════════════════════════════════════════════════════
✅ WALLET FUNDED - Ready to mint!
═══════════════════════════════════════════════════════════════

To complete minting on real testnet, you need:
1. cardano-serialization-lib for transaction building
2. Proper key derivation (HD wallet)

For this prototype, use our local simulation:
  npm run simulate

Or use cardano-cli via Docker:
  docker run -v $(pwd):/work ghcr.io/blinklabs-io/cardano-cli:latest \\
    transaction build ...

═══════════════════════════════════════════════════════════════
`);

  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log('\n⚠️  Address not found on chain (no UTxOs yet).');
      console.log('Please fund your wallet:');
      console.log(`   Address: ${config.wallet.address}`);
      console.log('   Faucet: https://docs.cardano.org/cardano-testnets/tools/faucet/\n');
    } else {
      console.error('Error:', error);
    }
  }
}

main().catch(console.error);

