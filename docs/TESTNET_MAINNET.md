# 🌐 Testnet & Mainnet Guide

## Network Overview

| Network | Cardano | Midnight | Purpose |
|---------|---------|----------|---------|
| **Testnet** | Preview | Testnet | Development & testing |
| **Mainnet** | Mainnet | Mainnet | Production |

---

## Part 1: Testnet Setup

### 1.1 Cardano Preview Testnet

#### Requirements
- Test ADA (free from faucet)
- Blockfrost API key (free tier)

#### Step-by-Step

```bash
# 1. Get Blockfrost API key
# Go to: https://blockfrost.io
# Create project: "Cardano Preview"
# Copy API key

export BLOCKFROST_PROJECT_ID=previewXXXXXXX

# 2. Generate wallet and policy
cd scripts/cardano
./setup.sh

# Output:
# ✅ Payment address: addr_test1qz...
# ✅ Policy ID: 7ea674...

# 3. Fund wallet (10+ test ADA)
# Go to: https://docs.cardano.org/cardano-testnets/tools/faucet/
# Select "Preview", paste your address

# 4. Wait for funding (1-2 minutes)
# Check balance:
curl "https://cardano-preview.blockfrost.io/api/v0/addresses/$(cat keys/payment.addr)" \
  -H "project_id: $BLOCKFROST_PROJECT_ID" | jq '.amount'

# 5. Mint $oink_test token
./mint.sh

# 6. Verify on explorer
# https://preview.cardanoscan.io/token/<your-policy-id>
```

### 1.2 Midnight Testnet

#### Requirements
- Developer account (apply at midnight.network)
- tDUST (testnet gas tokens)

#### Step-by-Step

```bash
# 1. Register for developer access
# Go to: https://midnight.network/developers
# Fill form and wait for approval (1-3 days)

# 2. Install Lace wallet
# Go to: https://www.lace.io/
# Enable Midnight mode in settings

# 3. Get tDUST from faucet
# Go to: https://midnight.network/testnet
# Connect wallet, request tDUST

# 4. Deploy contract (when SDK available)
cd contracts/midnight
compactc compile midoink.compact -o midoink.wasm
midnight-cli deploy midoink.wasm --network testnet

# 5. Save contract address
export MIDNIGHT_CONTRACT_ADDRESS=<deployed-address>
```

### 1.3 Bridge Server (Testnet)

```bash
# 1. Configure environment
cat > .env << EOF
NODE_ENV=testnet
CARDANO_NETWORK=preview
MIDNIGHT_NETWORK=testnet
BLOCKFROST_PROJECT_ID=previewXXXXXXX
BRIDGE_PORT=3008
BRIDGE_THRESHOLD=2
EOF

# 2. Start bridge
./start.sh start

# 3. Test bridge
./scripts/bridge-test.sh

# 4. Manual wrap test
npm run cli:wrap -- \
  --amount 1000000 \
  --cardanoAddress $(cat scripts/cardano/keys/payment.addr) \
  --midnightAddress midnight_test1_your_address
```

### 1.4 Testnet Verification Checklist

| Step | Command | Expected |
|------|---------|----------|
| Cardano wallet funded | Check explorer | 10+ tADA |
| $oink_test minted | Check explorer | Token visible |
| Bridge healthy | `curl :3008/health` | status: healthy |
| Wrap works | Run wrap CLI | success: true |
| Peg maintained | `curl :3008/status` | pegValid: true |

---

## Part 2: Mainnet Deployment

### ⚠️ CRITICAL: Pre-Mainnet Requirements

| Requirement | Status | Action |
|-------------|--------|--------|
| Smart contract audit | ❌ | Hire auditor (CertiK, Trail of Bits) |
| Validator key ceremony | ❌ | Secure multi-party computation |
| Insurance fund | ❌ | Reserve 5-10% of TVL |
| Legal review | ❌ | Compliance check |
| Bug bounty | ❌ | Launch program |
| Monitoring | ❌ | Set up alerts |

### 2.1 Cardano Mainnet

#### Requirements
- Real ADA (purchase from exchange)
- Mainnet Blockfrost API (paid tier)
- Hardware wallet (Ledger/Trezor recommended)

#### Deployment

```bash
# 1. Get mainnet Blockfrost API
# Paid tier: ~$10/month
export BLOCKFROST_PROJECT_ID=mainnetXXXXXXX

# 2. Configure for mainnet
export CARDANO_NETWORK=mainnet
export CARDANO_TESTNET_MAGIC=764824073

# 3. Generate PRODUCTION keys
# Use hardware wallet or air-gapped machine
cardano-cli address key-gen \
  --verification-key-file payment.vkey \
  --signing-key-file payment.skey

# 4. Create mainnet address
cardano-cli address build \
  --payment-verification-key-file payment.vkey \
  --mainnet \
  --out-file payment.addr

# 5. Fund with REAL ADA (minimum 50 ADA recommended)

# 6. Deploy lock contract
cardano-cli transaction build \
  --mainnet \
  --tx-in <utxo> \
  --tx-out <script-address>+<min-ada> \
  --change-address <your-address> \
  --out-file deploy.raw

cardano-cli transaction sign \
  --tx-body-file deploy.raw \
  --signing-key-file payment.skey \
  --mainnet \
  --out-file deploy.signed

cardano-cli transaction submit \
  --tx-file deploy.signed \
  --mainnet

# 7. Mint $oink tokens
# (Similar to testnet but with --mainnet flag)
```

### 2.2 Midnight Mainnet

```bash
# 1. Configure for mainnet
export MIDNIGHT_NETWORK=mainnet

# 2. Deploy contract
midnight-cli deploy midoink.wasm \
  --network mainnet \
  --wallet <production-wallet> \
  --gas-limit 10000000

# 3. Verify deployment
midnight-cli contract info <contract-address> --network mainnet
```

### 2.3 Bridge Server (Production)

#### Infrastructure

```yaml
# Recommended: Multi-region deployment
# docker-compose.production.yml

version: '3.8'
services:
  bridge:
    image: oink-bridge:latest
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.region != ${REGION}
    environment:
      - NODE_ENV=production
      - CARDANO_NETWORK=mainnet
      - MIDNIGHT_NETWORK=mainnet
    secrets:
      - validator_key
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3008/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
```

#### Validator Setup (Production)

```bash
# Each validator (3 separate operators):

# 1. Generate keys with HSM
# Use hardware security module for production keys

# 2. Register validator
curl -X POST https://bridge-admin.oink.io/validators/register \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"publicKey": "<validator-pubkey>", "operator": "Operator Name"}'

# 3. Run validator node
docker run -d \
  --name validator-1 \
  --restart unless-stopped \
  -e VALIDATOR_ID=validator-1 \
  -v /secure/keys:/keys:ro \
  oink-bridge-validator:latest
```

### 2.4 Mainnet Verification Checklist

| Step | Verification | Sign-off |
|------|--------------|----------|
| Contract audit complete | Audit report | ☐ |
| Validator keys generated | Key ceremony complete | ☐ |
| Insurance fund deposited | Treasury funded | ☐ |
| Monitoring active | Grafana dashboards | ☐ |
| Bug bounty live | Program published | ☐ |
| Legal review complete | Compliance approved | ☐ |
| Testnet stable 30 days | No incidents | ☐ |
| Load testing passed | 1000 TPS verified | ☐ |

---

## Part 3: Migration Guide

### Testnet → Mainnet Migration

```bash
# 1. Freeze testnet (no new operations)
./start.sh stop

# 2. Export configuration
cp .env .env.testnet
cp -r scripts/cardano/keys scripts/cardano/keys.testnet

# 3. Create mainnet configuration
cat > .env.mainnet << EOF
NODE_ENV=production
CARDANO_NETWORK=mainnet
MIDNIGHT_NETWORK=mainnet
BLOCKFROST_PROJECT_ID=mainnetXXXXXXX
BRIDGE_PORT=3008
BRIDGE_THRESHOLD=2
BRIDGE_VALIDATORS=validator1,validator2,validator3
EOF

# 4. Deploy mainnet contracts
# (As described in sections 2.1 and 2.2)

# 5. Start mainnet bridge
cp .env.mainnet .env
./start.sh start

# 6. Verify mainnet
curl https://bridge.oink.io/health
```

### Rollback Procedure

```bash
# If mainnet issues detected:

# 1. Pause bridge
./start.sh stop

# 2. Alert users
# Post on social media, website

# 3. Investigate
npm run verify
docker logs oink-bridge

# 4. If peg intact, fix and resume
./start.sh start

# 5. If peg violated, trigger emergency
# Validators initiate emergency unlock
# Users can reclaim after 7-day timeout
```

---

## Part 4: Operational Runbook

### Daily Operations

```bash
# Morning check
curl https://bridge.oink.io/health | jq
curl https://bridge.oink.io/status | jq

# Verify peg
npm run verify

# Check pending operations
curl https://bridge.oink.io/operations | jq '.operations | length'
```

### Incident Response

| Severity | Response Time | Action |
|----------|---------------|--------|
| P0 (Peg broken) | Immediate | Pause bridge, alert team |
| P1 (Bridge down) | 15 minutes | Restart, investigate |
| P2 (Slow operations) | 1 hour | Scale, optimize |
| P3 (Minor issues) | 24 hours | Log, fix in next release |

### Monitoring Alerts

```yaml
# prometheus/alerts.yml
groups:
  - name: bridge-alerts
    rules:
      - alert: PegViolation
        expr: bridge_locked != bridge_minted
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "1:1 peg violated!"

      - alert: BridgeUnhealthy
        expr: bridge_health != 1
        for: 5m
        labels:
          severity: high

      - alert: ValidatorDown
        expr: bridge_active_validators < 2
        for: 5m
        labels:
          severity: high

      - alert: HighPendingOperations
        expr: bridge_pending_operations > 100
        for: 30m
        labels:
          severity: medium
```

---

## Summary

| Phase | Network | Status | Next Step |
|-------|---------|--------|-----------|
| Development | Local | ✅ Complete | Test on testnet |
| Testnet | Preview/Testnet | 🟡 Ready | Deploy & test |
| Mainnet | Mainnet | ⏳ Pending | Complete audit |

```
Current Progress:
[████████████████░░░░] 80%

✅ Architecture
✅ Smart contracts
✅ Bridge server
✅ Unit tests (33)
✅ Integration tests
✅ Docker deployment
✅ Documentation
🟡 Testnet deployment
⏳ Security audit
⏳ Mainnet deployment
```

