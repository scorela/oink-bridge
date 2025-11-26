# 🛡️ Governance & Security Roadmap

This document outlines the phased decentralization plan for the $oink Bridge, moving from community-guarded security to full protocol immutability.

## 📅 Phase 1: Community Guarded (Current)
**"Trust but Verify"**

In this phase, the protocol protects against potential bugs or bridge stalls using a **Community Multisig**. This ensures that if the bridge validators fail or the system halts, funds can be recovered by a consensus of trusted community members, but no single person can steal funds.

### Mechanism
- **Contract**: `lock.ak` (Cardano)
- **Control**: The `LockDatum` on every locked UTXO contains:
  - `owners`: A list of Verification Key Hashes (PKHs) representing community guardians.
  - `required_owner_signatures`: The threshold (M-of-N) needed to trigger emergency unlock.
- **Emergency Action**: 
  - If funds are stuck for > 7 days (`emergency_timeout`), the Community Multisig can sign a transaction to release them back to the original senders.

### Setup Example
- **Guardians**: 5 trusted entities (DAO members, reputable stake pool operators).
- **Threshold**: 3-of-5 signatures required.
- **Risk**: Guardians could theoretically collude, but it requires coordination.

---

## 🔥 Phase 2: Protocol Ossification (The "Burn")
**"Code is Law"**

In this phase, the emergency recovery capability is permanently revoked ("burned"). This makes the protocol fully immutable and trustless. Once executed, **no one**—not the developers, not the guardians, not the DAO—can access locked funds via the emergency path. The only way funds move is via valid cross-chain bridge operations.

### Mechanism
- **Transition**: The bridge interface (CLI/Server) is updated to construct `LockDatum` with "Burned" parameters.
- **Burned Datum**:
  - `owners`: `[]` (Empty list) OR `[0x000000...]` (Null hash)
  - `required_owner_signatures`: `1` (or any number > 0)
- **Result**: 
  - The `EmergencyUnlock` validator logic checks:
    ```aiken
    count_owner_signatures(tx, []) == 0
    0 >= 1 // Returns False
    ```
  - The `EmergencyUnlock` path becomes mathematically impossible to execute.

### Why Phase 2?
- **Absolute Trustlessness**: Users don't need to trust any humans.
- **Censorship Resistance**: No entity can be coerced into unlocking funds.
- **Verification**: Anyone can verify on-chain that the `owners` list is empty for their locked UTXOs.

### Execution Plan
1. **Audit**: Confirm `lock.ak` contains no other backdoors.
2. **Signal**: Community vote to move to Phase 2.
3. **Deploy**: Update `server.ts` and `wrap.ts` config to use the "Burned Datum" standard for all new locks.
4. **Verify**: Provide scripts for users to verify their funds are under "Burned" protection.

