# 📡 API Reference

## Base URL

```
Development: http://localhost:3008
Production:  https://bridge.oink.io (example)
```

## Authentication

Currently no authentication required. Production should implement:
- API keys for rate limiting
- JWT for user operations
- Webhook signatures for callbacks

---

## Endpoints

### Health & Status

#### GET /health

Check bridge health status.

**Response:**
```json
{
  "status": "healthy",
  "pegIntegrity": true,
  "totalLocked": "1500000",
  "totalMinted": "1500000",
  "pendingOperations": 0,
  "completedOperations": 42
}
```

| Field | Type | Description |
|-------|------|-------------|
| status | string | "healthy" or "unhealthy" |
| pegIntegrity | boolean | true if locked === minted |
| totalLocked | string | Total $oink locked (bigint as string) |
| totalMinted | string | Total $midoink minted (bigint as string) |
| pendingOperations | number | Operations in progress |
| completedOperations | number | Completed operations |

---

#### GET /status

Get detailed bridge status.

**Response:**
```json
{
  "bridge": {
    "oinkLocked": "1500000",
    "midoinkMinted": "1500000",
    "pegRatio": "1:1",
    "pegValid": true
  },
  "validators": [
    { "id": "validator-1", "active": true },
    { "id": "validator-2", "active": true },
    { "id": "validator-3", "active": true }
  ],
  "threshold": "2-of-3",
  "pendingOperations": 0
}
```

---

### Wrap Operations (Cardano → Midnight)

#### POST /wrap/initiate

Start a wrap operation.

**Request:**
```json
{
  "cardanoAddress": "addr_test1qz2fxv2...",
  "midnightAddress": "midnight_test1...",
  "amount": "1000000"
}
```

**Response:**
```json
{
  "success": true,
  "lockAddress": "addr_test1_lock_contract",
  "instructions": {
    "step1": "Send 1000000 $oink to lock address",
    "step2": "Include your Midnight address in transaction metadata",
    "step3": "Wait for 15 confirmations",
    "step4": "Call /wrap/complete with lock tx hash"
  },
  "midnightRecipient": "midnight_test1...",
  "amount": "1000000"
}
```

---

#### POST /wrap/complete

Complete wrap after Cardano lock is confirmed.

**Request:**
```json
{
  "lockTxHash": "abc123...",
  "sender": "addr_test1qz2fxv2...",
  "midnightAddress": "midnight_test1...",
  "amount": "1000000"
}
```

**Response (Success):**
```json
{
  "success": true,
  "operation": {
    "id": "wrap-abc123",
    "status": "minted",
    "amount": "1000000",
    "lockTxHash": "abc123..."
  },
  "pegStatus": {
    "totalLocked": "2500000",
    "totalMinted": "2500000",
    "pegValid": true
  }
}
```

**Response (Error):**
```json
{
  "error": "Insufficient validator approvals",
  "collected": 1,
  "required": 2
}
```

---

### Unwrap Operations (Midnight → Cardano)

#### POST /unwrap/initiate

Start an unwrap operation.

**Request:**
```json
{
  "midnightAddress": "midnight_test1...",
  "cardanoAddress": "addr_test1qz2fxv2...",
  "amount": "500000"
}
```

**Response:**
```json
{
  "success": true,
  "instructions": {
    "step1": "Call burn() on Midnight contract with 500000 $midoink",
    "step2": "Include your Cardano address",
    "step3": "Call /unwrap/complete with burn tx hash"
  },
  "cardanoRecipient": "addr_test1qz2fxv2...",
  "amount": "500000"
}
```

---

#### POST /unwrap/complete

Complete unwrap after Midnight burn is confirmed.

**Request:**
```json
{
  "burnTxHash": "def456...",
  "sender": "midnight_test1...",
  "cardanoAddress": "addr_test1qz2fxv2...",
  "amount": "500000"
}
```

**Response:**
```json
{
  "success": true,
  "operation": {
    "id": "unwrap-def456",
    "status": "unlocked",
    "amount": "500000",
    "burnTxHash": "def456..."
  },
  "pegStatus": {
    "totalLocked": "2000000",
    "totalMinted": "2000000",
    "pegValid": true
  }
}
```

---

### Operations Query

#### GET /operations/:id

Get a specific operation by ID.

**Response:**
```json
{
  "operation": {
    "id": "wrap-abc123",
    "type": "wrap",
    "status": "minted",
    "amount": "1000000",
    "cardanoAddress": "addr_test1qz2fxv2...",
    "midnightAddress": "midnight_test1...",
    "lockTxHash": "abc123...",
    "mintTxHash": "midnight-mint-123...",
    "createdAt": 1699900000000,
    "completedAt": 1699900060000
  }
}
```

---

#### GET /operations

List operations, optionally filtered by address.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| address | string | Filter by Cardano or Midnight address |

**Response:**
```json
{
  "operations": [
    {
      "id": "wrap-abc123",
      "type": "wrap",
      "status": "minted",
      "amount": "1000000"
    },
    {
      "id": "unwrap-def456",
      "type": "unwrap",
      "status": "unlocked",
      "amount": "500000"
    }
  ]
}
```

---

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid request | Missing or malformed parameters |
| 400 | Insufficient validator approvals | Not enough signatures |
| 404 | Operation not found | Unknown operation ID |
| 500 | Internal server error | Bridge error |
| 500 | Wrap failed | Lock/mint error |
| 500 | Unwrap failed | Burn/unlock error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /health | 100 | 1 minute |
| /status | 100 | 1 minute |
| /wrap/* | 10 | 1 minute |
| /unwrap/* | 10 | 1 minute |
| /operations | 50 | 1 minute |

---

## Webhooks (Future)

```json
POST /your-callback-url

{
  "event": "wrap.completed",
  "operation": {
    "id": "wrap-abc123",
    "status": "minted",
    "amount": "1000000"
  },
  "timestamp": 1699900060000,
  "signature": "sha256_hmac_signature"
}
```

| Event | Description |
|-------|-------------|
| wrap.initiated | Wrap operation started |
| wrap.completed | $midoink minted |
| wrap.failed | Wrap failed |
| unwrap.initiated | Unwrap operation started |
| unwrap.completed | $oink unlocked |
| unwrap.failed | Unwrap failed |

---

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
const BRIDGE_URL = 'http://localhost:3008';

// Check health
const health = await fetch(`${BRIDGE_URL}/health`).then(r => r.json());
console.log('Bridge healthy:', health.status === 'healthy');

// Initiate wrap
const wrapInit = await fetch(`${BRIDGE_URL}/wrap/initiate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cardanoAddress: 'addr_test1...',
    midnightAddress: 'midnight_test1...',
    amount: '1000000'
  })
}).then(r => r.json());

console.log('Lock address:', wrapInit.lockAddress);

// After locking on Cardano, complete wrap
const wrapComplete = await fetch(`${BRIDGE_URL}/wrap/complete`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lockTxHash: 'cardano-tx-hash...',
    sender: 'addr_test1...',
    midnightAddress: 'midnight_test1...',
    amount: '1000000'
  })
}).then(r => r.json());

console.log('Minted:', wrapComplete.success);
console.log('Peg valid:', wrapComplete.pegStatus.pegValid);
```

### cURL

```bash
# Health check
curl http://localhost:3008/health | jq

# Initiate wrap
curl -X POST http://localhost:3008/wrap/initiate \
  -H "Content-Type: application/json" \
  -d '{"cardanoAddress":"addr_test1...","midnightAddress":"midnight_test1...","amount":"1000000"}' \
  | jq

# Complete wrap
curl -X POST http://localhost:3008/wrap/complete \
  -H "Content-Type: application/json" \
  -d '{"lockTxHash":"abc123","sender":"addr_test1...","midnightAddress":"midnight_test1...","amount":"1000000"}' \
  | jq
```

### Python

```python
import requests

BRIDGE_URL = 'http://localhost:3008'

# Health check
health = requests.get(f'{BRIDGE_URL}/health').json()
print(f"Bridge healthy: {health['status'] == 'healthy'}")

# Wrap
wrap_result = requests.post(f'{BRIDGE_URL}/wrap/complete', json={
    'lockTxHash': 'abc123',
    'sender': 'addr_test1...',
    'midnightAddress': 'midnight_test1...',
    'amount': '1000000'
}).json()

print(f"Minted: {wrap_result['success']}")
print(f"Peg valid: {wrap_result['pegStatus']['pegValid']}")
```

