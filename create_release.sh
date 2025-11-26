#!/bin/bash
set -e

# Configuration
VERSION="v1.0.0"
TITLE="Initial Release: $oink ↔ $midoink Bridge"
REPO="scorela/oink-bridge"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Preparing to release $VERSION for $REPO...${NC}"

# 1. Check Authentication
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not logged in. Please run 'gh auth login' first.${NC}"
    exit 1
fi

# 2. Check if tag exists locally or remotely
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Tag $VERSION already exists locally.${NC}"
else
    echo -e "${GREEN}📦 Creating git tag $VERSION...${NC}"
    git tag -a "$VERSION" -m "Release $VERSION"
fi

# 3. Push Tag
echo -e "${GREEN}⬆️  Pushing tag to remote...${NC}"
git push origin "$VERSION"

# 4. Generate Release Notes
echo -e "${YELLOW}📝 Generating release notes...${NC}"
cat > release_notes.md <<EOF
# 🐷 $oink ↔ 🌙 $midoink Bridge v1.0.0

First official release of the Cross-chain wrapper token bridge between Cardano and Midnight networks.

## ✨ Features
- **1:1 Peg Guarantee**: Strictly enforced locking and minting.
- **Multisig Security**: 2-of-3 validator signature requirement.
- **Privacy**: Zero-Knowledge transfers on Midnight.
- **Docker Support**: One-tap deployment with \`./start.sh\`.
- **CLI Tools**: Full suite for wrapping, unwrapping, and status checks.

## 🛠 Installation

\`\`\`bash
git clone https://github.com/scorela/oink-bridge.git
cd oink-bridge
./start.sh
\`\`\`

## 📊 Verification
- 33 Unit Tests passing
- Full simulation coverage
- Peg integrity verification scripts included

**Full Changelog**: https://github.com/$REPO/commits/$VERSION
EOF

# 5. Create GitHub Release
echo -e "${GREEN}🚀 Creating GitHub Release...${NC}"
gh release create "$VERSION" \
    --repo "$REPO" \
    --title "$TITLE" \
    --notes-file release_notes.md \
    --latest

# Cleanup
rm release_notes.md

echo -e "${GREEN}✅ Release $VERSION created successfully!${NC}"
echo -e "👉 View it here: https://github.com/$REPO/releases/tag/$VERSION"

