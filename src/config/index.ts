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

// Bridge Configuration - All parameters configurable for optimization
export const config = {
  // Cardano settings
  cardano: {
    network: process.env.CARDANO_NETWORK || 'preview',
    blockfrostApiKey: process.env.BLOCKFROST_API_KEY || '',
    oinkPolicyId: process.env.OINK_POLICY_ID || '',
    oinkAssetName: process.env.OINK_ASSET_NAME || '6f696e6b', // "oink" hex
    lockContractAddress: process.env.LOCK_CONTRACT_ADDRESS || '',
  },

  // Midnight settings
  midnight: {
    network: process.env.MIDNIGHT_NETWORK || 'testnet',
    rpcUrl: process.env.MIDNIGHT_RPC_URL || 'https://rpc.testnet.midnight.network',
    midoinkContractAddress: process.env.MIDOINK_CONTRACT_ADDRESS || '',
  },

  // Bridge settings
  bridge: {
    port: parseInt(process.env.BRIDGE_PORT || '3008'),
    validators: (process.env.BRIDGE_VALIDATORS || '').split(',').filter(Boolean),
    threshold: parseInt(process.env.BRIDGE_THRESHOLD || '2'), // 2-of-3 multisig
    confirmationsRequired: 15, // Cardano confirmations before mint
    maxLockAmount: BigInt('1000000000000'), // Max single lock: 1T tokens
    minLockAmount: BigInt('100000'), // Min single lock: 100K tokens
  },

  // Fee settings (configurable)
  fees: {
    wrapFeeBps: 0, // 0 bps = no fee, 1:1 peg
    unwrapFeeBps: 0,
    bridgeOperatorFee: BigInt('0'),
  },
} as const;

export type Config = typeof config;

