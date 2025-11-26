#!/bin/bash
set -e

# Repository Info
REPO="scorela/oink-bridge"
DESCRIPTION="Cross-chain bridge: \$oink (Cardano) ↔ \$midoink (Midnight) with 1:1 peg"
TOPICS="cardano,midnight-network,bridge,cross-chain,typescript,aiken,compact,blockchain,interoperability"
HOMEPAGE=""

echo "🛠 Updating repository information for $REPO..."

# Check login
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in. Please run 'gh auth login' first."
    exit 1
fi

# Update Description and Homepage
echo "📝 Updating description..."
gh repo edit "$REPO" --description "$DESCRIPTION"

# Update Topics
echo "🏷 Updating topics..."
gh repo edit "$REPO" --add-topic "cardano"
gh repo edit "$REPO" --add-topic "midnight-network"
gh repo edit "$REPO" --add-topic "bridge"
gh repo edit "$REPO" --add-topic "cross-chain"
gh repo edit "$REPO" --add-topic "typescript"
gh repo edit "$REPO" --add-topic "aiken"
gh repo edit "$REPO" --add-topic "compact"
gh repo edit "$REPO" --add-topic "blockchain"
gh repo edit "$REPO" --add-topic "interoperability"

echo "✅ Repository metadata updated successfully!"
echo "👉 Check it here: https://github.com/$REPO"

