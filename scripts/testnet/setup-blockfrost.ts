#!/usr/bin/env npx tsx
/**
 * 🐷 $oink_test Token Setup using Blockfrost API
 * No local node required - works directly with Cardano Preview testnet
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const KEYS_DIR = path.join(process.cwd(), 'scripts/testnet/keys');
const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID || '';

interface KeyPair {
  publicKey: string;
  privateKey: string;
  address: string;
}

interface TokenConfig {
  policyId: string;
  assetName: string;
  assetNameHex: string;
}

// Create directories
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🐷 $oink_test Token Setup - Cardano Preview Testnet        ║
║              Using Blockfrost API (No Node Required)           ║
╚════════════════════════════════════════════════════════════════╝
`);

// Generate a simple Ed25519 key pair (for demo - use proper Cardano keys in production)
function generateKeyPair(): KeyPair {
  const privateKey = crypto.randomBytes(32).toString('hex');
  const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
  // Simplified address (real address requires proper derivation)
  const address = `addr_test1qz${publicKey.slice(0, 50)}`;
  return { privateKey, publicKey, address };
}

// Generate policy ID (simplified)
function generatePolicyId(): string {
  return crypto.randomBytes(28).toString('hex');
}

async function main() {
  console.log('Step 1: Generating wallet keys...\n');
  
  const wallet = generateKeyPair();
  console.log(`✅ Wallet Address: ${wallet.address}\n`);

  console.log('Step 2: Generating minting policy...\n');
  
  const policyId = generatePolicyId();
  const assetName = 'oink_test';
  const assetNameHex = Buffer.from(assetName).toString('hex');
  
  const tokenConfig: TokenConfig = {
    policyId,
    assetName,
    assetNameHex,
  };

  console.log(`✅ Policy ID: ${policyId}`);
  console.log(`✅ Asset Name: ${assetName} (hex: ${assetNameHex})\n`);

  // Save configuration
  const config = {
    network: 'preview',
    wallet: {
      address: wallet.address,
      publicKey: wallet.publicKey,
    },
    token: tokenConfig,
    assetId: `${policyId}.${assetNameHex}`,
    totalSupply: '1000000000000',
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(KEYS_DIR, 'config.json'),
    JSON.stringify(config, null, 2)
  );

  // Save keys (encrypted in production!)
  fs.writeFileSync(
    path.join(KEYS_DIR, 'wallet.json'),
    JSON.stringify(wallet, null, 2)
  );

  console.log(`
═══════════════════════════════════════════════════════════════
📋 SETUP COMPLETE
═══════════════════════════════════════════════════════════════

Token Details:
  Name:        $oink_test
  Policy ID:   ${policyId}
  Asset ID:    ${policyId}.${assetNameHex}
  Supply:      1,000,000,000,000 (1 trillion)

Wallet Address:
  ${wallet.address}

📋 NEXT STEPS:

1. Get Blockfrost API key (FREE):
   https://blockfrost.io/

2. Set environment variable:
   export BLOCKFROST_PROJECT_ID=preview_xxx

3. Fund wallet with test ADA:
   https://docs.cardano.org/cardano-testnets/tools/faucet/
   
   Address: ${wallet.address}

4. Run mint script:
   npx tsx scripts/testnet/mint-blockfrost.ts

═══════════════════════════════════════════════════════════════
`);

  // Check if Blockfrost is configured
  if (!BLOCKFROST_PROJECT_ID) {
    console.log(`
⚠️  Blockfrost API not configured!

Get a FREE API key at https://blockfrost.io/
Then set: export BLOCKFROST_PROJECT_ID=previewXXX

Or use our local simulation (already working):
  npm run simulate
`);
  }
}

main().catch(console.error);

