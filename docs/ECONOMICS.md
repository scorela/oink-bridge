# 💰 Economic Model

## Token Overview

| Token | Network | Type | Supply |
|-------|---------|------|--------|
| **$oink** | Cardano | Native Asset | Fixed (set at mint) |
| **$midoink** | Midnight | Wrapped Token | Dynamic (= locked $oink) |

## Core Principle: 1:1 Peg

```
INVARIANT: totalMidoinkMinted === totalOinkLocked

At any point in time:
  - Every $midoink in circulation is backed by exactly 1 $oink
  - Locked $oink cannot be moved without burning $midoink
  - The peg CANNOT be broken by design
```

## Token Flow Economics

### Wrapping (Cardano → Midnight)

```
User Action:           Lock 1,000,000 $oink
Bridge Action:         Mint 1,000,000 $midoink
Result:
  - Cardano:  -1,000,000 $oink (locked in contract)
  - Midnight: +1,000,000 $midoink (in user wallet)
  - Peg:      1,000,000 locked = 1,000,000 minted ✓
```

### Unwrapping (Midnight → Cardano)

```
User Action:           Burn 500,000 $midoink
Bridge Action:         Unlock 500,000 $oink
Result:
  - Midnight: -500,000 $midoink (burned)
  - Cardano:  +500,000 $oink (returned to user)
  - Peg:      500,000 locked = 500,000 minted ✓
```

---

## Fee Structure

### Option A: Zero Fees (Current Default)

```typescript
// src/config/index.ts
fees: {
  wrapFeeBps: 0,      // 0% wrap fee
  unwrapFeeBps: 0,    // 0% unwrap fee
  bridgeOperatorFee: 0n,
}
```

**Pros:**
- Maximum adoption
- Simple UX
- Competitive advantage

**Cons:**
- No direct revenue
- Validator costs not covered

### Option B: Minimal Fees

```typescript
fees: {
  wrapFeeBps: 10,     // 0.1% wrap fee
  unwrapFeeBps: 10,   // 0.1% unwrap fee
  bridgeOperatorFee: BigInt('1000000'), // 1M tokens min
}
```

**Example:**
```
Wrap 10,000,000 $oink
Fee: 10,000 $oink (0.1%)
User receives: 9,990,000 $midoink
Fee distribution:
  - 50% to validators
  - 50% to treasury
```

### Option C: Dynamic Fees

```typescript
// Fee based on network congestion
function calculateFee(amount: bigint, congestion: number): bigint {
  const baseFee = 10; // 0.1% base
  const congestionMultiplier = 1 + (congestion * 0.5);
  return (amount * BigInt(Math.floor(baseFee * congestionMultiplier))) / 10000n;
}
```

---

## Revenue Model

### Bridge Operator Revenue

| Source | Amount | Frequency |
|--------|--------|-----------|
| Wrap fees | 0-0.1% of volume | Per transaction |
| Unwrap fees | 0-0.1% of volume | Per transaction |
| Integration fees | Flat fee | Per integration |

### Validator Revenue

| Source | Amount | Distribution |
|--------|--------|--------------|
| Fee share | 50% of bridge fees | Per approved operation |
| Block rewards | Network native | From Cardano/Midnight |
| Staking | Variable | If staking enabled |

### Treasury Revenue

| Source | Purpose |
|--------|---------|
| Fee share (50%) | Development, audits |
| Grants | Ecosystem grants |
| Partnerships | B2B integrations |

---

## Economic Scenarios

### Scenario 1: High Volume

```
Daily Volume: $10,000,000
Fee Rate: 0.1%
Daily Revenue: $10,000

Distribution:
  - Validators (50%): $5,000 / 3 = $1,666 each
  - Treasury (50%): $5,000

Annual:
  - Total: $3,650,000
  - Per validator: $608,333
```

### Scenario 2: Low Volume Start

```
Daily Volume: $100,000
Fee Rate: 0% (adoption phase)
Daily Revenue: $0

Strategy:
  - Subsidize validator costs from treasury
  - Focus on user acquisition
  - Enable fees after reaching $1M daily volume
```

### Scenario 3: Liquidity Incentives

```
Program: Liquidity Mining
Duration: 6 months
Budget: 100,000,000 $oink

Rewards:
  - Wrap & hold $midoink: 10% APY
  - Provide liquidity: 20% APY
  - Early adopters bonus: 2x multiplier
```

---

## Risk Management

### Peg Risk: ZERO

```
The bridge CANNOT mint $midoink without locked $oink.
The contract ENFORCES: minted <= locked
Mathematical impossibility of over-minting.
```

### Liquidity Risk

| Risk | Mitigation |
|------|------------|
| Bank run | All $midoink redeemable 1:1 always |
| Illiquidity | Emergency unlock after 7 days |
| Flash loan | Rate limiting, minimum lock time |

### Validator Risk

| Risk | Mitigation |
|------|------------|
| Collusion | 2-of-3 multisig, slashing |
| Downtime | Redundant validators, failover |
| Key compromise | HSM, key rotation, threshold sigs |

---

## Tokenomics Comparison

### $oink (Cardano)

```
Type: Native Asset (CNT)
Standard: CIP-25
Metadata: On-chain
Fees: ADA for transactions
Privacy: Public ledger
```

### $midoink (Midnight)

```
Type: Wrapped Token
Standard: Compact contract
Metadata: Off-chain (ZK)
Fees: DUST for transactions
Privacy: Zero-knowledge proofs
```

---

## Value Proposition

### For $oink Holders

| Benefit | Description |
|---------|-------------|
| Privacy | Transfer $midoink privately on Midnight |
| Ecosystem | Access Midnight DeFi, dApps |
| Arbitrage | Trade across ecosystems |
| Flexibility | Switch networks as needed |

### For $midoink Users

| Benefit | Description |
|---------|-------------|
| Full backing | Every token backed 1:1 |
| Redeemable | Unwrap anytime |
| Composable | Use in Midnight contracts |
| Private | ZK-enabled transfers |

---

## Growth Projections

### Phase 1: Testnet (Month 1-3)

```
Target: Prove technology works
Volume: $0 (testnet tokens)
Users: 100 developers
Revenue: $0
```

### Phase 2: Mainnet Launch (Month 4-6)

```
Target: Initial adoption
Volume: $100K-$1M daily
Users: 1,000
Revenue: $0 (zero fees)
Fee enablement: At $1M daily
```

### Phase 3: Growth (Month 7-12)

```
Target: Ecosystem integration
Volume: $1M-$10M daily
Users: 10,000
Revenue: $10K-$100K monthly
Partners: 5+ DeFi protocols
```

### Phase 4: Maturity (Year 2+)

```
Target: Standard bridge
Volume: $10M+ daily
Users: 100,000+
Revenue: $100K+ monthly
Status: Audited, insured
```

---

## Competitive Analysis

| Bridge | Fee | Peg Model | Security |
|--------|-----|-----------|----------|
| **oink-midoink** | 0-0.1% | 1:1 Lock/Mint | 2-of-3 multisig |
| WBTC | 0.25% | Custodial | BitGo |
| RenBTC | 0.1% | 1:1 Lock/Mint | Decentralized |
| Milkomeda | Variable | Sidechain | Centralized |

### Differentiators

1. **IOG Ecosystem Native**: Both networks by same team
2. **Privacy**: $midoink has ZK transfers
3. **Low Fees**: Designed for high volume
4. **Simple**: Just wrap/unwrap, no complex mechanics

