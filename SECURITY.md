# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### DO NOT

- Open a public GitHub issue
- Discuss the vulnerability publicly
- Exploit the vulnerability

### DO

1. **Email us privately** at [security@oink.io] (replace with actual email)
2. **Include details**:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. **Wait for response** within 48 hours

### What to Expect

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Assessment**: We'll assess the vulnerability within 7 days
3. **Fix**: Critical vulnerabilities will be patched within 14 days
4. **Disclosure**: We'll coordinate public disclosure with you

## Security Measures

### Smart Contracts

| Measure | Status |
|---------|--------|
| Formal verification | Planned |
| External audit | Required before mainnet |
| Bug bounty program | Planned |

### Bridge Server

| Measure | Status |
|---------|--------|
| 2-of-3 multisig | ✅ Implemented |
| Rate limiting | ✅ Implemented |
| Input validation | ✅ Implemented |
| HTTPS only (production) | Required |

### 1:1 Peg Protection

The core security invariant of this bridge:

```
INVARIANT: totalOinkLocked === totalMidoinkMinted
```

This is enforced by:
- Smart contract logic (cannot mint without lock)
- State manager assertions on every operation
- Verification tests on every code change

### Key Management

For production deployment:
- Use Hardware Security Modules (HSM)
- Implement key rotation
- Geographic distribution of validators
- Threshold signatures

## Known Limitations

1. **Centralization**: Current 3-validator setup is semi-centralized
2. **Emergency unlock**: 7-day timeout could delay recovery
3. **Cross-chain latency**: Operations require confirmations on both chains

## Bug Bounty (Future)

We plan to launch a bug bounty program covering:

| Severity | Reward |
|----------|--------|
| Critical (peg violation) | Up to $50,000 |
| High (fund loss risk) | Up to $10,000 |
| Medium (service disruption) | Up to $2,000 |
| Low (minor issues) | Up to $500 |

Details will be published when the program launches.

## Security Contacts

- Security issues: [security@oink.io]
- General inquiries: [info@oink.io]

## Audit Reports

Audit reports will be published here once completed:
- [ ] Smart contract audit (pending)
- [ ] Penetration testing (pending)
- [ ] Code review (pending)

