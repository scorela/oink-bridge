#!/bin/bash
#
# 🐷 $oink ↔ 🌙 $midoink Bridge
# One-tap install and start
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🐷 \$oink ↔ 🌙 \$midoink Bridge Installer                  ║${NC}"
echo -e "${BLUE}║              Cardano ↔ Midnight (1:1 Peg)                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Determine compose command
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# Parse arguments
ACTION=${1:-start}

case $ACTION in
    start|up)
        echo -e "${YELLOW}🚀 Building and starting bridge...${NC}"
        $COMPOSE up -d --build
        
        echo ""
        echo -e "${GREEN}✅ Bridge is starting...${NC}"
        echo ""
        
        # Wait for health check
        echo -e "${YELLOW}⏳ Waiting for bridge to be healthy...${NC}"
        for i in {1..30}; do
            if curl -s http://localhost:3008/health > /dev/null 2>&1; then
                echo ""
                echo -e "${GREEN}✅ Bridge is healthy!${NC}"
                break
            fi
            echo -n "."
            sleep 1
        done
        
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}🌉 Bridge running at: http://localhost:3008${NC}"
        echo ""
        echo "   Endpoints:"
        echo "   • GET  /health         - Health check"
        echo "   • GET  /status         - Bridge status"
        echo "   • POST /wrap/initiate  - Start wrap (oink → midoink)"
        echo "   • POST /wrap/complete  - Complete wrap"
        echo "   • POST /unwrap/initiate - Start unwrap (midoink → oink)"
        echo "   • POST /unwrap/complete - Complete unwrap"
        echo ""
        echo "   Quick test:"
        echo "   curl http://localhost:3008/health"
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        ;;
        
    stop|down)
        echo -e "${YELLOW}🛑 Stopping bridge...${NC}"
        $COMPOSE down
        echo -e "${GREEN}✅ Bridge stopped${NC}"
        ;;
        
    restart)
        echo -e "${YELLOW}🔄 Restarting bridge...${NC}"
        $COMPOSE restart
        echo -e "${GREEN}✅ Bridge restarted${NC}"
        ;;
        
    logs)
        $COMPOSE logs -f bridge
        ;;
        
    status)
        echo -e "${YELLOW}📊 Bridge Status:${NC}"
        curl -s http://localhost:3008/status | jq . 2>/dev/null || curl -s http://localhost:3008/status
        ;;
        
    test)
        echo -e "${YELLOW}🧪 Running simulation test...${NC}"
        npm run simulate
        ;;
        
    *)
        echo "Usage: ./start.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start   - Build and start the bridge (default)"
        echo "  stop    - Stop the bridge"
        echo "  restart - Restart the bridge"
        echo "  logs    - View bridge logs"
        echo "  status  - Check bridge status"
        echo "  test    - Run simulation test"
        ;;
esac

