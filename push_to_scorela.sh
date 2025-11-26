#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting automated GitHub push for oink-bridge...${NC}"

# 1. Check GitHub CLI status
echo -e "\n${YELLOW}1. Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not logged in.${NC}"
    echo -e "${YELLOW}👉 Please log in as 'scorela' when prompted:${NC}"
    gh auth login
else
    CURRENT_USER=$(gh api user | grep login | cut -d '"' -f 4)
    echo -e "${GREEN}✅ Logged in as: $CURRENT_USER${NC}"
    
    if [ "$CURRENT_USER" != "scorela" ]; then
        echo -e "${RED}⚠️  Warning: You are logged in as '$CURRENT_USER', but requested 'scorela'.${NC}"
        read -p "Do you want to continue? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Please run 'gh auth login' to switch accounts, then run this script again.${NC}"
            exit 1
        fi
    fi
fi

# 2. Create Repository
echo -e "\n${YELLOW}2. Creating repository on GitHub (scorela/oink-bridge)...${NC}"
if gh repo view scorela/oink-bridge &> /dev/null; then
    echo -e "${GREEN}✅ Repository already exists.${NC}"
else
    # Try creating in organization 'scorela' or user 'scorela'
    if gh repo create scorela/oink-bridge --public --source=. --remote=origin --push; then
         echo -e "${GREEN}✅ Repository created and code pushed!${NC}"
         exit 0
    else
         echo -e "${RED}❌ Failed to create repository. You might not have permissions for 'scorela' or the name is taken.${NC}"
         
         echo -e "${YELLOW}Attempting to create under your personal account...${NC}"
         if gh repo create oink-bridge --public --source=. --remote=origin --push; then
             echo -e "${GREEN}✅ Repository created under your account and code pushed!${NC}"
             exit 0
         else
             echo -e "${RED}❌ Failed to create repository.${NC}"
             exit 1
         fi
    fi
fi

# 3. Push Code (if repo existed but code wasn't pushed)
echo -e "\n${YELLOW}3. Pushing code...${NC}"
git remote remove origin 2> /dev/null || true
git remote add origin https://github.com/scorela/oink-bridge.git
git branch -M main
if git push -u origin main; then
    echo -e "${GREEN}✅ Successfully pushed to https://github.com/scorela/oink-bridge${NC}"
else
    echo -e "${RED}❌ Push failed. Check your permissions.${NC}"
    exit 1
fi

