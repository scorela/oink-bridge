# 🚀 Deployment Guide

## Prerequisites

| Requirement | Testnet | Mainnet |
|-------------|---------|---------|
| Node.js | 18+ | 18+ |
| Docker | Required | Required |
| Blockfrost API | Free tier | Paid tier |
| Cardano Wallet | Test ADA | Real ADA |
| Midnight Wallet | tDUST | DUST |

## Quick Start (Local Development)

```bash
# Clone repository
git clone https://github.com/scorela/oink-bridge.git
cd oink-bridge

# Install and test (one command)
./install-and-test.sh

# Start bridge server
./start.sh
```

---

## Testnet Deployment

### Step 1: Cardano Preview Testnet

#### 1.1 Get Blockfrost API Key (FREE)

```bash
# 1. Register at https://blockfrost.io
# 2. Create project for "Cardano Preview"
# 3. Copy API key

export BLOCKFROST_PROJECT_ID=previewXXXXXXXXXXXX
```

#### 1.2 Generate Wallet & Policy

```bash
cd scripts/cardano
./setup.sh
```

Output:
```
✅ Payment address: addr_test1qz...
✅ Policy ID: 7ea674...
✅ Asset ID: 7ea674...6e696b655f74657374
```

#### 1.3 Fund Wallet with Test ADA

1. Go to: https://docs.cardano.org/cardano-testnets/tools/faucet/
2. Select "Preview" network
3. Paste your address
4. Request test ADA (10 ADA minimum)

#### 1.4 Mint $oink_test Token

```bash
./mint.sh
```

Verify on explorer:
```
https://preview.cardanoscan.io/token/<POLICY_ID>.<ASSET_NAME_HEX>
```

### Step 2: Midnight Testnet

#### 2.1 Register for Developer Access

1. Go to: https://midnight.network/developers
2. Register and wait for approval
3. Get tDUST from testnet faucet

#### 2.2 Deploy Compact Contract

```bash
# When SDK access granted:
cd contracts/midnight

# Compile contract
compactc compile midoink.compact -o midoink.wasm

# Deploy to testnet
midnight-cli deploy midoink.wasm \
  --network testnet \
  --wallet <your-wallet>
```

#### 2.3 Configure Bridge

```bash
# Update environment
export MIDNIGHT_CONTRACT_ADDRESS=<deployed-address>
export MIDNIGHT_RPC_URL=https://rpc.testnet.midnight.network
```

### Step 3: Deploy Bridge Server

#### 3.1 Docker (Recommended)

```bash
# Build and start
./start.sh start

# Verify
curl http://localhost:3008/health
```

#### 3.2 Cloud Deployment (AWS/GCP/Azure)

```bash
# Build image
docker build -t oink-bridge .

# Push to registry
docker tag oink-bridge:latest your-registry/oink-bridge:latest
docker push your-registry/oink-bridge:latest

# Deploy to Kubernetes/ECS/Cloud Run
# (Use provided docker-compose.yml as reference)
```

### Step 4: Test Bridge Flow

```bash
# Run integration test
./scripts/bridge-test.sh

# Manual test via CLI
npm run cli:wrap -- \
  --amount 1000000 \
  --cardanoAddress addr_test1... \
  --midnightAddress midnight_test1...
```

---

## Mainnet Deployment

### ⚠️ Pre-Mainnet Checklist

| Item | Status |
|------|--------|
| Smart contract audit | ❌ Required |
| Validator key ceremony | ❌ Required |
| Multi-region deployment | ❌ Required |
| Monitoring & alerting | ❌ Required |
| Insurance/backing fund | ❌ Required |
| Legal review | ❌ Required |

### Mainnet Configuration

```bash
# Environment variables for mainnet
export NODE_ENV=production
export CARDANO_NETWORK=mainnet
export MIDNIGHT_NETWORK=mainnet
export BLOCKFROST_PROJECT_ID=mainnetXXXXXXXXXXXX
export BRIDGE_VALIDATORS=<validator1>,<validator2>,<validator3>
```

### Validator Setup

Each validator operator must:

1. **Generate secure keys**
   ```bash
   # Generate Ed25519 keypair (use HSM in production)
   openssl genpkey -algorithm ED25519 -out validator.key
   openssl pkey -in validator.key -pubout -out validator.pub
   ```

2. **Register with bridge**
   ```bash
   # Submit public key to bridge admin
   cat validator.pub
   ```

3. **Run validator node**
   ```bash
   docker run -d \
     -e VALIDATOR_KEY_PATH=/keys/validator.key \
     -v /secure/path:/keys:ro \
     oink-bridge-validator
   ```

### Mainnet Contract Deployment

#### Cardano Mainnet

```bash
# Use mainnet magic
export CARDANO_TESTNET_MAGIC=764824073

# Deploy via cardano-cli with REAL ADA
cardano-cli transaction build \
  --mainnet \
  --tx-in <utxo> \
  --tx-out <lock-contract-address>+<min-ada> \
  --mint "<supply> <policy-id>.<asset-name>" \
  --minting-script-file policy.script \
  --out-file tx.raw
```

#### Midnight Mainnet

```bash
# Deploy with production config
midnight-cli deploy midoink.wasm \
  --network mainnet \
  --wallet <production-wallet> \
  --gas-limit 10000000
```

---

## Monitoring

### Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Bridge health status |
| `GET /status` | Detailed bridge status |
| `GET /operations` | Pending operations |

### Recommended Monitoring Stack

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Alert Conditions

| Alert | Condition | Severity |
|-------|-----------|----------|
| Peg Deviation | locked ≠ minted | CRITICAL |
| Bridge Offline | health != healthy | HIGH |
| Validator Down | < 2 validators | HIGH |
| Pending > 1hr | operation.age > 3600s | MEDIUM |

---

## Rollback Procedure

If issues detected:

1. **Pause bridge** (stop accepting new operations)
   ```bash
   ./start.sh stop
   ```

2. **Verify peg integrity**
   ```bash
   npm run verify
   ```

3. **If peg violated**: Trigger emergency unlock
   - Cardano: Use emergency unlock after timeout
   - Midnight: Admin can pause contract

4. **Investigate and fix**

5. **Resume operations**
   ```bash
   ./start.sh start
   ```

