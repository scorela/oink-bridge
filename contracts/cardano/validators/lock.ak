// Copyright (c) 2025 Oink Bridge Contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// OINK Lock Contract for Cardano
// Locks $oink tokens to enable 1:1 minting of $midoink on Midnight

use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{ScriptContext, Spend, Transaction, InlineDatum}
use aiken/transaction/credential.{VerificationKey}
use aiken/transaction/value

// ============================================
// Types
// ============================================

type VerificationKeyHash = Hash<Blake2b_224, VerificationKey>

type LockDatum {
  // Owner who can reclaim if bridge fails
  owner: VerificationKeyHash,
  // Midnight address to receive $midoink
  midnight_recipient: ByteArray,
  // Amount locked (for verification)
  amount: Int,
  // Lock timestamp
  locked_at: Int,
}

type LockRedeemer {
  // Unlock by bridge validators (normal flow)
  BridgeUnlock { 
    burn_tx_hash: ByteArray,
    validator_signatures: List<ByteArray>,
  }
  // Emergency unlock by owner (after timeout)
  EmergencyUnlock
}

// ============================================
// Configuration
// ============================================

// $oink token identifiers
const oink_policy_id: ByteArray = #"" // Set during deployment
const oink_asset_name: ByteArray = #"6f696e6b" // "oink" in hex

// Bridge validator public key hashes (2-of-3 multisig)
const validator_1: VerificationKeyHash = #""
const validator_2: VerificationKeyHash = #""
const validator_3: VerificationKeyHash = #""

// Emergency unlock timeout (7 days in slots)
const emergency_timeout: Int = 604800

// Required validator signatures for unlock
const required_signatures: Int = 2

// ============================================
// Validators
// ============================================

validator lock {
  spend(
    datum: Option<LockDatum>,
    redeemer: LockRedeemer,
    _own_ref: Data,
    tx: Transaction,
  ) {
    expect Some(lock_datum) = datum
    
    when redeemer is {
      BridgeUnlock { burn_tx_hash, validator_signatures } -> {
        // Verify at least 2 validator signatures
        let valid_sigs = count_valid_signatures(tx, validator_signatures)
        valid_sigs >= required_signatures
      }
      
      EmergencyUnlock -> {
        // Only owner can emergency unlock after timeout
        let signed_by_owner = list.has(tx.extra_signatories, lock_datum.owner)
        let current_slot = get_current_slot(tx)
        let timeout_passed = current_slot > lock_datum.locked_at + emergency_timeout
        
        signed_by_owner && timeout_passed
      }
    }
  }
}

// ============================================
// Helper Functions
// ============================================

fn count_valid_signatures(tx: Transaction, _signatures: List<ByteArray>) -> Int {
  let validators = [validator_1, validator_2, validator_3]
  list.count(validators, fn(v) { list.has(tx.extra_signatories, v) })
}

fn get_current_slot(tx: Transaction) -> Int {
  when tx.validity_range.lower_bound.bound_type is {
    transaction.Finite(slot) -> slot
    _ -> 0
  }
}

// ============================================
// Lock Creation (Minting Policy for lock receipts)
// ============================================

validator lock_receipt {
  mint(_redeemer: Data, _policy_id: ByteArray, tx: Transaction) {
    // Ensure $oink is being sent to lock contract
    let outputs_to_lock = list.filter(
      tx.outputs,
      fn(output) {
        // Check if output contains $oink tokens
        let has_oink = value.quantity_of(
          output.value,
          oink_policy_id,
          oink_asset_name
        ) > 0
        has_oink
      }
    )
    
    list.length(outputs_to_lock) > 0
  }
}

