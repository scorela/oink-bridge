#!/bin/bash
#
# 🐷 Mint $oink_test tokens on Cardano Preview Testnet
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

KEYS_DIR="./keys"
TESTNET_MAGIC=2

cd $KEYS_DIR

# Load config
if [ ! -f config.json ]; then
    echo -e "${RED}❌ Config not found. Run setup.sh first${NC}"
    exit 1
fi

PAYMENT_ADDR=$(cat payment.addr)
POLICY_ID=$(jq -r '.policyId' config.json)
TOKEN_NAME=$(jq -r '.tokenName' config.json)
TOKEN_NAME_HEX=$(jq -r '.tokenNameHex' config.json)
TOKEN_AMOUNT=$(jq -r '.totalSupply' config.json)

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🐷 Minting \$oink_test Tokens                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Step 1: Checking balance...${NC}"

# Query UTxOs
cardano-cli query utxo \
    --address $PAYMENT_ADDR \
    --testnet-magic $TESTNET_MAGIC \
    --out-file utxos.json

# Check if we have UTxOs
UTXO_COUNT=$(jq 'length' utxos.json)
if [ "$UTXO_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No UTxOs found. Please fund your address first:${NC}"
    echo "   Address: $PAYMENT_ADDR"
    echo "   Faucet:  https://docs.cardano.org/cardano-testnets/tools/faucet/"
    exit 1
fi

# Get first UTxO
UTXO_TXID=$(jq -r 'keys[0]' utxos.json | cut -d'#' -f1)
UTXO_TXIX=$(jq -r 'keys[0]' utxos.json | cut -d'#' -f2)
UTXO_LOVELACE=$(jq -r '.[keys[0]].value.lovelace' utxos.json)

echo -e "${GREEN}✅ Found UTxO: ${UTXO_TXID}#${UTXO_TXIX}${NC}"
echo "   Balance: $UTXO_LOVELACE lovelace"

echo ""
echo -e "${YELLOW}Step 2: Getting protocol parameters...${NC}"

cardano-cli query protocol-parameters \
    --testnet-magic $TESTNET_MAGIC \
    --out-file protocol.json

echo -e "${GREEN}✅ Protocol parameters fetched${NC}"

echo ""
echo -e "${YELLOW}Step 3: Building mint transaction...${NC}"

# Calculate fees (rough estimate, will refine)
FEE=300000
OUTPUT_LOVELACE=$((UTXO_LOVELACE - FEE))

# Build transaction
cardano-cli transaction build-raw \
    --tx-in "${UTXO_TXID}#${UTXO_TXIX}" \
    --tx-out "${PAYMENT_ADDR}+${OUTPUT_LOVELACE}+${TOKEN_AMOUNT} ${POLICY_ID}.${TOKEN_NAME_HEX}" \
    --mint "${TOKEN_AMOUNT} ${POLICY_ID}.${TOKEN_NAME_HEX}" \
    --minting-script-file policy.script \
    --fee $FEE \
    --out-file mint.raw

# Calculate actual fee
FEE=$(cardano-cli transaction calculate-min-fee \
    --tx-body-file mint.raw \
    --tx-in-count 1 \
    --tx-out-count 1 \
    --witness-count 2 \
    --testnet-magic $TESTNET_MAGIC \
    --protocol-params-file protocol.json | awk '{print $1}')

OUTPUT_LOVELACE=$((UTXO_LOVELACE - FEE))

# Rebuild with correct fee
cardano-cli transaction build-raw \
    --tx-in "${UTXO_TXID}#${UTXO_TXIX}" \
    --tx-out "${PAYMENT_ADDR}+${OUTPUT_LOVELACE}+${TOKEN_AMOUNT} ${POLICY_ID}.${TOKEN_NAME_HEX}" \
    --mint "${TOKEN_AMOUNT} ${POLICY_ID}.${TOKEN_NAME_HEX}" \
    --minting-script-file policy.script \
    --fee $FEE \
    --out-file mint.raw

echo -e "${GREEN}✅ Transaction built (fee: $FEE lovelace)${NC}"

echo ""
echo -e "${YELLOW}Step 4: Signing transaction...${NC}"

cardano-cli transaction sign \
    --tx-body-file mint.raw \
    --signing-key-file payment.skey \
    --signing-key-file policy.skey \
    --testnet-magic $TESTNET_MAGIC \
    --out-file mint.signed

echo -e "${GREEN}✅ Transaction signed${NC}"

echo ""
echo -e "${YELLOW}Step 5: Submitting transaction...${NC}"

cardano-cli transaction submit \
    --tx-file mint.signed \
    --testnet-magic $TESTNET_MAGIC

TX_HASH=$(cardano-cli transaction txid --tx-file mint.signed)

echo ""
echo -e "${GREEN}✅ MINTING SUCCESSFUL!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo "Transaction Hash: $TX_HASH"
echo ""
echo "Token Details:"
echo "  - Name:      $TOKEN_NAME"
echo "  - Policy ID: $POLICY_ID"
echo "  - Amount:    $TOKEN_AMOUNT"
echo ""
echo "View on explorer:"
echo "  https://preview.cardanoscan.io/transaction/$TX_HASH"
echo ""
echo "View token:"
echo "  https://preview.cardanoscan.io/token/${POLICY_ID}.${TOKEN_NAME_HEX}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Update config with tx hash
jq --arg txhash "$TX_HASH" '. + {mintTxHash: $txhash}' config.json > config.tmp.json
mv config.tmp.json config.json

