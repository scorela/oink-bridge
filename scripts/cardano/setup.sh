#!/bin/bash
#
# 🐷 $oink_test Token Setup on Cardano Preview Testnet
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NETWORK="preview"
TESTNET_MAGIC=2
KEYS_DIR="./keys"
TOKEN_NAME="oink_test"
TOKEN_AMOUNT=1000000000000  # 1 trillion tokens

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🐷 \$oink_test Token Minting - Cardano Preview Testnet     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for cardano-cli
if ! command -v cardano-cli &> /dev/null; then
    echo -e "${RED}❌ cardano-cli not found${NC}"
    echo ""
    echo "Install options:"
    echo "  1. Docker: docker pull inputoutput/cardano-node"
    echo "  2. Build from source: https://github.com/input-output-hk/cardano-node"
    echo "  3. Use Demeter.run (cloud): https://demeter.run"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ cardano-cli found${NC}"
cardano-cli --version

# Create keys directory
mkdir -p $KEYS_DIR
cd $KEYS_DIR

echo ""
echo -e "${YELLOW}Step 1: Generating payment keys...${NC}"

if [ ! -f payment.skey ]; then
    cardano-cli address key-gen \
        --verification-key-file payment.vkey \
        --signing-key-file payment.skey
    echo -e "${GREEN}✅ Payment keys generated${NC}"
else
    echo -e "${GREEN}✅ Payment keys already exist${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Creating payment address...${NC}"

cardano-cli address build \
    --payment-verification-key-file payment.vkey \
    --out-file payment.addr \
    --testnet-magic $TESTNET_MAGIC

PAYMENT_ADDR=$(cat payment.addr)
echo -e "${GREEN}✅ Payment address: ${NC}"
echo "   $PAYMENT_ADDR"

echo ""
echo -e "${YELLOW}Step 3: Creating minting policy...${NC}"

# Generate policy keys
if [ ! -f policy.skey ]; then
    cardano-cli address key-gen \
        --verification-key-file policy.vkey \
        --signing-key-file policy.skey
fi

# Get policy key hash
POLICY_KEYHASH=$(cardano-cli address key-hash --payment-verification-key-file policy.vkey)

# Create policy script (simple signature policy)
cat > policy.script << EOF
{
  "type": "sig",
  "keyHash": "$POLICY_KEYHASH"
}
EOF

# Generate policy ID
POLICY_ID=$(cardano-cli transaction policyid --script-file policy.script)

echo -e "${GREEN}✅ Policy ID: ${NC}$POLICY_ID"

# Token name in hex
TOKEN_NAME_HEX=$(echo -n $TOKEN_NAME | xxd -p)
ASSET_ID="${POLICY_ID}.${TOKEN_NAME_HEX}"

echo -e "${GREEN}✅ Asset ID: ${NC}$ASSET_ID"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo ""
echo "1. Fund your address with test ADA:"
echo -e "   ${GREEN}https://docs.cardano.org/cardano-testnets/tools/faucet/${NC}"
echo ""
echo "   Address to fund:"
echo -e "   ${BLUE}$PAYMENT_ADDR${NC}"
echo ""
echo "2. After funding, run the mint script:"
echo -e "   ${GREEN}./mint.sh${NC}"
echo ""
echo "3. Your token details:"
echo "   - Token Name: $TOKEN_NAME"
echo "   - Policy ID:  $POLICY_ID"
echo "   - Asset ID:   $ASSET_ID"
echo "   - Amount:     $TOKEN_AMOUNT"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Save config
cat > config.json << EOF
{
  "network": "$NETWORK",
  "testnetMagic": $TESTNET_MAGIC,
  "paymentAddress": "$PAYMENT_ADDR",
  "policyId": "$POLICY_ID",
  "tokenName": "$TOKEN_NAME",
  "tokenNameHex": "$TOKEN_NAME_HEX",
  "assetId": "$ASSET_ID",
  "totalSupply": $TOKEN_AMOUNT
}
EOF

echo ""
echo -e "${GREEN}✅ Config saved to $KEYS_DIR/config.json${NC}"

