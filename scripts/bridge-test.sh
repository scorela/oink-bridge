#!/bin/bash
#
# 🌉 Bridge Integration Test
# Tests wrap/unwrap between $oink_test (Cardano) and $midoink_test (Midnight)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BRIDGE_URL="http://localhost:3008"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        🌉 Bridge Integration Test                              ║${NC}"
echo -e "${BLUE}║     \$oink_test (Cardano) ↔ \$midoink_test (Midnight)           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if bridge is running
echo -e "${YELLOW}Checking bridge status...${NC}"
HEALTH=$(curl -s $BRIDGE_URL/health 2>/dev/null || echo '{"status":"offline"}')
STATUS=$(echo $HEALTH | jq -r '.status' 2>/dev/null || echo "offline")

if [ "$STATUS" != "healthy" ]; then
    echo -e "${RED}❌ Bridge is not running${NC}"
    echo "   Start with: ./start.sh"
    exit 1
fi

echo -e "${GREEN}✅ Bridge is healthy${NC}"
echo ""

# Test configuration
CARDANO_ADDR="addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp"
MIDNIGHT_ADDR="midnight_test1_user_demo"
TEST_AMOUNT="1000000"

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Test 1: WRAP - Lock \$oink_test → Mint \$midoink_test${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Amount: $TEST_AMOUNT tokens"
echo "From:   $CARDANO_ADDR (Cardano)"
echo "To:     $MIDNIGHT_ADDR (Midnight)"
echo ""

# Simulate Cardano lock transaction
LOCK_TX="cardano-lock-$(date +%s)-$(openssl rand -hex 4)"
echo -e "${YELLOW}Simulating Cardano lock transaction...${NC}"
echo "Lock TX: $LOCK_TX"
echo ""

# Call wrap/complete
echo -e "${YELLOW}Calling bridge to mint \$midoink_test...${NC}"
WRAP_RESULT=$(curl -s -X POST $BRIDGE_URL/wrap/complete \
    -H "Content-Type: application/json" \
    -d "{
        \"lockTxHash\": \"$LOCK_TX\",
        \"sender\": \"$CARDANO_ADDR\",
        \"midnightAddress\": \"$MIDNIGHT_ADDR\",
        \"amount\": \"$TEST_AMOUNT\"
    }")

echo ""
echo "Response:"
echo $WRAP_RESULT | jq .
echo ""

WRAP_SUCCESS=$(echo $WRAP_RESULT | jq -r '.success')
if [ "$WRAP_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ WRAP SUCCESS - \$midoink_test minted!${NC}"
    LOCKED=$(echo $WRAP_RESULT | jq -r '.pegStatus.totalLocked')
    MINTED=$(echo $WRAP_RESULT | jq -r '.pegStatus.totalMinted')
    PEG_VALID=$(echo $WRAP_RESULT | jq -r '.pegStatus.pegValid')
    echo "   Locked: $LOCKED | Minted: $MINTED | Peg Valid: $PEG_VALID"
else
    echo -e "${RED}❌ WRAP FAILED${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Test 2: UNWRAP - Burn \$midoink_test → Unlock \$oink_test${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

UNWRAP_AMOUNT="500000"
echo "Amount: $UNWRAP_AMOUNT tokens"
echo "From:   $MIDNIGHT_ADDR (Midnight)"
echo "To:     $CARDANO_ADDR (Cardano)"
echo ""

# Simulate Midnight burn transaction
BURN_TX="midnight-burn-$(date +%s)-$(openssl rand -hex 4)"
echo -e "${YELLOW}Simulating Midnight burn transaction...${NC}"
echo "Burn TX: $BURN_TX"
echo ""

# Call unwrap/complete
echo -e "${YELLOW}Calling bridge to unlock \$oink_test...${NC}"
UNWRAP_RESULT=$(curl -s -X POST $BRIDGE_URL/unwrap/complete \
    -H "Content-Type: application/json" \
    -d "{
        \"burnTxHash\": \"$BURN_TX\",
        \"sender\": \"$MIDNIGHT_ADDR\",
        \"cardanoAddress\": \"$CARDANO_ADDR\",
        \"amount\": \"$UNWRAP_AMOUNT\"
    }")

echo ""
echo "Response:"
echo $UNWRAP_RESULT | jq .
echo ""

UNWRAP_SUCCESS=$(echo $UNWRAP_RESULT | jq -r '.success')
if [ "$UNWRAP_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ UNWRAP SUCCESS - \$oink_test unlocked!${NC}"
    LOCKED=$(echo $UNWRAP_RESULT | jq -r '.pegStatus.totalLocked')
    MINTED=$(echo $UNWRAP_RESULT | jq -r '.pegStatus.totalMinted')
    PEG_VALID=$(echo $UNWRAP_RESULT | jq -r '.pegStatus.pegValid')
    echo "   Locked: $LOCKED | Minted: $MINTED | Peg Valid: $PEG_VALID"
else
    echo -e "${RED}❌ UNWRAP FAILED${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Test 3: Final State Verification${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

FINAL_STATUS=$(curl -s $BRIDGE_URL/status)
echo "Bridge Status:"
echo $FINAL_STATUS | jq .

echo ""
FINAL_HEALTH=$(curl -s $BRIDGE_URL/health)
FINAL_LOCKED=$(echo $FINAL_HEALTH | jq -r '.totalLocked')
FINAL_MINTED=$(echo $FINAL_HEALTH | jq -r '.totalMinted')
FINAL_PEG=$(echo $FINAL_HEALTH | jq -r '.pegIntegrity')

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    TEST SUMMARY                                ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Expected after tests:"
echo "  - Wrapped:   $TEST_AMOUNT"
echo "  - Unwrapped: $UNWRAP_AMOUNT"
echo "  - Net:       $((TEST_AMOUNT - UNWRAP_AMOUNT))"
echo ""
echo "Actual state:"
echo "  - Locked:    $FINAL_LOCKED"
echo "  - Minted:    $FINAL_MINTED"
echo "  - Peg Valid: $FINAL_PEG"
echo ""

if [ "$FINAL_PEG" = "true" ] && [ "$FINAL_LOCKED" = "$FINAL_MINTED" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✅ ALL TESTS PASSED - 1:1 PEG MAINTAINED            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║           ❌ TESTS FAILED - CHECK PEG INTEGRITY               ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
fi
echo ""

