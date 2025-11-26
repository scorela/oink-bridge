#!/usr/bin/env npx tsx
/**
 * 🌙 Midnight SDK - Test Available Packages
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🌙 Midnight SDK - Available Packages Test            ║
╚════════════════════════════════════════════════════════════════╝
`);

async function testAvailablePackages() {
  const results: Record<string, boolean> = {};
  
  // Test compact-runtime
  console.log('Testing @midnight-ntwrk/compact-runtime...');
  try {
    const runtime = await import('@midnight-ntwrk/compact-runtime');
    console.log('✅ compact-runtime loaded');
    console.log('   Exports:', Object.keys(runtime).slice(0, 8).join(', '), '...');
    results['compact-runtime'] = true;
  } catch (e) {
    console.log('❌ compact-runtime failed:', (e as Error).message.slice(0, 50));
    results['compact-runtime'] = false;
  }
  
  // Test wallet
  console.log('\nTesting @midnight-ntwrk/wallet...');
  try {
    const wallet = await import('@midnight-ntwrk/wallet');
    console.log('✅ wallet loaded');
    console.log('   Exports:', Object.keys(wallet).slice(0, 8).join(', '), '...');
    results['wallet'] = true;
  } catch (e) {
    console.log('❌ wallet failed:', (e as Error).message.slice(0, 50));
    results['wallet'] = false;
  }
  
  // Test network-id
  console.log('\nTesting @midnight-ntwrk/midnight-js-network-id...');
  try {
    const networkId = await import('@midnight-ntwrk/midnight-js-network-id');
    console.log('✅ network-id loaded');
    console.log('   Exports:', Object.keys(networkId).join(', '));
    results['network-id'] = true;
  } catch (e) {
    console.log('❌ network-id failed:', (e as Error).message.slice(0, 50));
    results['network-id'] = false;
  }
  
  // Test utils
  console.log('\nTesting @midnight-ntwrk/midnight-js-utils...');
  try {
    const utils = await import('@midnight-ntwrk/midnight-js-utils');
    console.log('✅ utils loaded');
    console.log('   Exports:', Object.keys(utils).slice(0, 8).join(', '), '...');
    results['utils'] = true;
  } catch (e) {
    console.log('❌ utils failed:', (e as Error).message.slice(0, 50));
    results['utils'] = false;
  }
  
  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('MIDNIGHT SDK STATUS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const working = Object.entries(results).filter(([_, v]) => v).length;
  const total = Object.keys(results).length;
  
  console.log(`\nWorking packages: ${working}/${total}`);
  console.log('');
  
  for (const [name, status] of Object.entries(results)) {
    console.log(`  ${status ? '✅' : '❌'} @midnight-ntwrk/${name}`);
  }
  
  console.log('');
  console.log('Note: Some packages require private @midnight-ntwrk/ledger-v6');
  console.log('      which is not publicly available on npm.');
  console.log('');
  console.log('To get full SDK access:');
  console.log('  1. Register: https://midnight.network/developers');
  console.log('  2. Request private registry access');
  console.log('═══════════════════════════════════════════════════════════════');
  
  return working > 0;
}

testAvailablePackages()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

