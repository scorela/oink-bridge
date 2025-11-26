#!/bin/bash
#
# 🌙 $mid_oink_test Token Setup on Midnight Testnet
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

KEYS_DIR="./keys"
CONTRACT_DIR="../contracts/midnight"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    🌙 \$mid_oink_test Token Setup - Midnight Testnet           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for Midnight CLI (compactc)
if command -v compactc &> /dev/null; then
    echo -e "${GREEN}✅ compactc (Compact compiler) found${NC}"
    compactc --version
else
    echo -e "${YELLOW}⚠️  Midnight tools not installed locally${NC}"
    echo ""
    echo "Midnight is in early testnet. Setup options:"
    echo ""
    echo "1. Join Midnight Testnet:"
    echo -e "   ${GREEN}https://midnight.network/developers${NC}"
    echo ""
    echo "2. Get testnet access:"
    echo -e "   ${GREEN}https://midnight.network/testnet${NC}"
    echo ""
    echo "3. Install Midnight SDK (when available):"
    echo "   npm install @midnight-ntwrk/midnight-sdk"
    echo ""
fi

# Create directories
mkdir -p $KEYS_DIR

echo ""
echo -e "${YELLOW}Creating Midnight contract configuration...${NC}"

# Create contract config
cat > $KEYS_DIR/midnight-config.json << 'EOF'
{
  "network": "testnet",
  "contractName": "mid_oink_test",
  "tokenConfig": {
    "name": "mid_oink_test",
    "symbol": "MOINK",
    "decimals": 6,
    "totalSupply": "1000000000000"
  },
  "bridgeConfig": {
    "cardanoPolicyId": "TO_BE_SET",
    "cardanoAssetName": "oink_test",
    "pegRatio": "1:1",
    "validators": [
      "validator-1",
      "validator-2", 
      "validator-3"
    ],
    "threshold": 2
  }
}
EOF

echo -e "${GREEN}✅ Config created at $KEYS_DIR/midnight-config.json${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 MIDNIGHT TESTNET STATUS:${NC}"
echo ""
echo "Midnight Network launched mainnet in late 2025."
echo "For testnet access:"
echo ""
echo "1. Register at: https://midnight.network/developers"
echo "2. Get tDUST (testnet tokens) from faucet"
echo "3. Deploy the Compact contract"
echo ""
echo "Contract file: contracts/midnight/midoink.compact"
echo ""
echo -e "${YELLOW}📋 TO DEPLOY:${NC}"
echo ""
echo "# Once you have Midnight CLI access:"
echo "compactc compile ../contracts/midnight/midoink.compact"
echo "midnight-cli deploy midoink.wasm --network testnet"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

