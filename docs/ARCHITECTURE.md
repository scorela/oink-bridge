# 🏗️ Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CARDANO NETWORK                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    AIKEN LOCK CONTRACT                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │ │
│  │  │   Lock       │  │   Unlock     │  │   Emergency Unlock           │ │ │
│  │  │   $oink   │  │   (2-of-3)   │  │   (owner after 7 days)       │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Lock Event
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BRIDGE VALIDATOR NETWORK                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │ Validator 1  │  │ Validator 2  │  │ Validator 3  │   2-of-3 Multisig    │
│  │   ✓ Sign     │  │   ✓ Sign     │  │   ✓ Sign     │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
│                           │                                                  │
│                           ▼                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    BRIDGE STATE MANAGER                                 │ │
│  │  • Tracks totalOinkLocked                                           │ │
│  │  • Tracks totalMidoinkMinted                                           │ │
│  │  • Enforces 1:1 peg: locked == minted ALWAYS                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Mint Approval
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MIDNIGHT NETWORK                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                   COMPACT MINT CONTRACT                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │ │
│  │  │ Mint         │  │ Burn         │  │ Transfer (Private)           │ │ │
│  │  │ $midoink     │  │ $midoink     │  │ Zero-Knowledge Proofs        │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
oink-bridge/
│
├── contracts/                      # Smart Contracts
│   ├── cardano/
│   │   ├── aiken.toml             # Aiken project config
│   │   └── validators/
│   │       └── lock.ak            # Lock/unlock validator
│   │
│   └── midnight/
│       └── midoink.compact        # Mint/burn/transfer contract
│
├── src/                           # TypeScript Source
│   ├── bridge/
│   │   ├── server.ts              # Express HTTP API
│   │   ├── state.ts               # Peg state manager
│   │   └── validator.ts           # Multisig coordinator
│   │
│   ├── cli/
│   │   ├── wrap.ts                # CLI: oink → midoink
│   │   ├── unwrap.ts              # CLI: midoink → oink
│   │   └── status.ts              # CLI: bridge status
│   │
│   ├── config/
│   │   └── index.ts               # Configuration (ports, thresholds)
│   │
│   ├── simulation/
│   │   ├── run.ts                 # Full simulation test
│   │   └── verify.ts              # Peg integrity verification
│   │
│   ├── tests/
│   │   └── bridge.test.ts         # 33 unit tests
│   │
│   └── types/
│       └── index.ts               # TypeScript interfaces
│
├── scripts/
│   ├── cardano/
│   │   ├── setup.sh               # Generate keys & policy
│   │   └── mint.sh                # Mint $oink_test
│   │
│   ├── midnight/
│   │   ├── setup.sh               # Midnight config
│   │   ├── check-access.sh        # SDK availability
│   │   └── test-available-sdk.ts  # SDK test
│   │
│   ├── testnet/
│   │   ├── setup-blockfrost.ts    # Blockfrost setup
│   │   └── mint-blockfrost.ts     # API-based minting
│   │
│   └── bridge-test.sh             # Integration test
│
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # This file
│   ├── DEPLOYMENT.md              # Deploy guide
│   ├── ECONOMICS.md               # Economic model
│   └── API.md                     # API reference
│
├── Dockerfile                     # Container image
├── docker-compose.yml             # Docker orchestration
├── start.sh                       # One-tap start
├── install-and-test.sh            # Full test suite
└── package.json                   # Node.js dependencies
```

## Component Details

### 1. Cardano Lock Contract (`lock.ak`)

```
Purpose: Securely lock $oink tokens
Language: Aiken (functional, type-safe)
Features:
  - Lock with Midnight recipient metadata
  - 2-of-3 multisig unlock
  - Emergency unlock after 7-day timeout
```

### 2. Midnight Mint Contract (`midoink.compact`)

```
Purpose: Mint/burn wrapped tokens with privacy
Language: Compact (TypeScript-like, ZK-enabled)
Features:
  - 1:1 mint matching locked amount
  - Burn with Cardano unlock reference
  - Private transfers via ZK proofs
  - Peg integrity assertion on every operation
```

### 3. Bridge Server (`src/bridge/`)

```
Purpose: Coordinate cross-chain operations
Framework: Express.js
Features:
  - REST API for wrap/unwrap
  - Real-time peg verification
  - Validator signature collection
  - Health monitoring
```

### 4. State Manager (`state.ts`)

```
Purpose: Enforce 1:1 peg invariant
Key invariant: totalOinkLocked === totalMidoinkMinted
Methods:
  - recordLock() - Track Cardano locks
  - recordMint() - Track Midnight mints
  - recordBurn() - Track Midnight burns
  - recordUnlock() - Track Cardano unlocks
  - verifyPegIntegrity() - Assert 1:1 peg
```

### 5. Validator Network (`validator.ts`)

```
Purpose: Decentralized approval of operations
Model: 2-of-3 multisig
Responsibilities:
  - Verify lock event authenticity
  - Verify burn event authenticity
  - Sign approvals cryptographically
```

## Data Flow

### Wrap Flow ($oink → $midoink)

```
1. User sends $oink to Lock Contract on Cardano
2. Lock Contract emits LockEvent with:
   - txHash, amount, sender, midnightRecipient
3. Bridge detects LockEvent (15 confirmations)
4. Validators verify and sign (2-of-3 required)
5. Bridge calls Mint on Midnight Contract
6. $midoink minted 1:1 to user's Midnight address
7. State updated: locked += amount, minted += amount
8. Peg verified: locked === minted ✓
```

### Unwrap Flow ($midoink → $oink)

```
1. User calls burn() on Midnight Contract
2. Burn event recorded with cardanoRecipient
3. Validators verify and sign (2-of-3 required)
4. Bridge triggers Unlock on Cardano Contract
5. $oink released to user's Cardano address
6. State updated: minted -= amount, locked -= amount
7. Peg verified: locked === minted ✓
```

## Security Model

| Layer | Protection |
|-------|------------|
| Smart Contracts | Formal verification, audit required |
| Bridge Validators | 2-of-3 multisig, geographic distribution |
| Peg Integrity | Assertion on every state change |
| Emergency Recovery | 7-day timeout unlock by owner |
| Private Transfers | Zero-knowledge proofs on Midnight |

