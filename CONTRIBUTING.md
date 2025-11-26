# Contributing to oink-bridge

First off, thank you for considering contributing to the oink-midoink bridge! 🐷🌙

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming environment. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When you create a bug report, include:
- Clear and descriptive title
- Steps to reproduce the behavior
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Relevant logs and screenshots

### Suggesting Features

Feature suggestions are welcome! Please:
- Use a clear and descriptive title
- Provide a detailed description of the proposed feature
- Explain why this feature would be useful
- Consider the impact on the 1:1 peg guarantee

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes**
4. **Add tests** if applicable
5. **Run the test suite**:
   ```bash
   npm test              # 33 unit tests
   npm run verify        # Peg verification
   npm run simulate      # Integration test
   ```
6. **Update documentation** if needed
7. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/oink-bridge.git
cd oink-bridge

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Run full test suite
./install-and-test.sh
```

## Project Structure

```
src/
├── bridge/          # Core bridge logic
│   ├── server.ts    # Express API
│   ├── state.ts     # Peg state manager
│   └── validator.ts # Multisig logic
├── cli/             # Command line tools
├── config/          # Configuration
├── simulation/      # Test scenarios
├── tests/           # Unit tests
└── types/           # TypeScript types

contracts/
├── cardano/         # Aiken lock contract
└── midnight/        # Compact mint contract
```

## Coding Guidelines

### TypeScript
- Use strict mode
- Define types for all parameters and return values
- Avoid `any` type

### Testing
- Write tests for new features
- Maintain test coverage above 90%
- Test peg integrity for all state changes

### Git Commits
- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Use conventional commits format:
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation
  - `test:` Tests
  - `refactor:` Refactoring

## Critical Rules

### 1:1 Peg Integrity
The bridge MUST maintain `totalOinkLocked === totalMidoinkMinted` at all times. Any PR that could compromise this will be rejected.

### Security
- Never commit secrets, keys, or tokens
- Review security implications of changes
- Report security vulnerabilities privately

## Getting Help

- Check the [documentation](docs/)
- Open an issue for questions
- Join discussions in GitHub Discussions

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project documentation

Thank you for contributing! 🙏

