# 🐷 $oink ↔ 🌙 $midoink Bridge

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-33%20passing-brightgreen.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)]()

Cross-chain wrapper token bridge between Cardano and Midnight networks with **1:1 peg guarantee**.

## 🚀 One-Tap Install (Docker)

```bash
# Start bridge with Docker
./start.sh

# Or use docker-compose directly
docker-compose up -d
```

The bridge will be available at `http://localhost:3008`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CARDANO NETWORK                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Aiken Lock Contract                                 │   │
│  │  - Locks $oink tokens                               │   │
│  │  - 2-of-3 multisig unlock                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ Bridge Validators (2-of-3 multisig)
                           │
┌─────────────────────────────────────────────────────────────┐
│                   MIDNIGHT NETWORK                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Compact Mint Contract                              │   │
│  │  - Mints $midoink 1:1 with locked $oink            │   │
│  │  - Burns $midoink for unwrap                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
# One command to start
./start.sh

# Check status
./start.sh status

# View logs
./start.sh logs

# Stop
./start.sh stop
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start dev server
npm run dev

# Run simulation
npm run simulate
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/status` | Bridge status & peg verification |
| POST | `/wrap/initiate` | Start wrap (oink → midoink) |
| POST | `/wrap/complete` | Complete wrap after lock confirmed |
| POST | `/unwrap/initiate` | Start unwrap (midoink → oink) |
| POST | `/unwrap/complete` | Complete unwrap after burn confirmed |
| GET | `/operations/:id` | Get operation by ID |
| GET | `/operations` | List operations |

## Commands

| Command | Description |
|---------|-------------|
| `./start.sh` | 🐳 One-tap Docker start |
| `npm run dev` | Start dev server |
| `npm run simulate` | Run full wrap/unwrap simulation |
| `npm run verify` | Verify peg integrity |
| `npm test` | Run 33 unit tests |
| `npm run test:coverage` | Run tests with coverage |

## CLI Tools

```bash
# Wrap $oink → $midoink
npm run cli:wrap -- \
  --amount 1000000 \
  --cardanoAddress addr_test1... \
  --midnightAddress midnight_test1...

# Unwrap $midoink → $oink
npm run cli:unwrap -- \
  --amount 500000 \
  --midnightAddress midnight_test1... \
  --cardanoAddress addr_test1...

# Check bridge status
npm run cli:status
```

## Token Details

| Property | $oink | $midoink |
|----------|-------|----------|
| Network | Cardano | Midnight |
| Type | Native Asset | Wrapped Token |
| Peg | Base | **1:1** with $oink |
| Contract | Aiken (lock.ak) | Compact (midoink.compact) |

## Test Coverage

```
state.ts     97.68%  ✅
validator.ts 97.82%  ✅
config.ts    100%    ✅
─────────────────────
33 tests passing
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BRIDGE_PORT` | 3008 | Server port |
| `BRIDGE_THRESHOLD` | 2 | Required validator signatures |
| `CARDANO_NETWORK` | preview | Cardano network |
| `MIDNIGHT_NETWORK` | testnet | Midnight network |

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design & code structure |
| [Deployment](docs/DEPLOYMENT.md) | Deploy to testnet & mainnet |
| [Economics](docs/ECONOMICS.md) | Token economics & fee model |
| [Governance](docs/GOVERNANCE_ROADMAP.md) | 🛡️ Security & Decentralization Roadmap |
| [API Reference](docs/API.md) | REST API documentation |
| [Testnet/Mainnet](docs/TESTNET_MAINNET.md) | Network-specific guides |

## 🔒 Security

- **1:1 Peg**: Every $midoink is backed by exactly 1 locked $oink
- **2-of-3 Multisig**: Validators must approve all operations
- **Emergency Unlock**: 7-day timeout for Community Multisig recovery
- **Zero-Knowledge**: Private transfers on Midnight

## 📊 Test Coverage

```
state.ts     97.68%  ✅  Core peg logic
validator.ts 97.82%  ✅  Multisig logic
config.ts    100%    ✅  Configuration
─────────────────────────
33 unit tests passing
6 peg verification tests
5 simulation scenarios
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [IOG](https://iohk.io/) - Cardano & Midnight development
- [Aiken](https://aiken-lang.org/) - Smart contract language
- [Blockfrost](https://blockfrost.io/) - Cardano API
