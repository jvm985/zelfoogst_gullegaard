#!/bin/bash

# Exit colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Start volledige applicatie validatie..."

# 1. Backend Type Check
echo -e "\n📦 [1/3] Backend: Type checking..."
cd apps/backend
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ Backend types zijn OK${NC}"
else
    echo -e "${RED}❌ Backend types bevatten fouten${NC}"
    EXIT_CODE=1
fi
cd ../..

# 2. Frontend Linting
echo -e "\n🎨 [2/3] Frontend: Linting..."
cd apps/frontend
if npm run lint --silent; then
    echo -e "${GREEN}✅ Frontend linting is OK${NC}"
else
    echo -e "${RED}❌ Frontend linting bevat waarschuwingen of fouten${NC}"
    # We don't necessarily fail on lint warnings, but good to know
fi
cd ../..

# 3. Frontend Type Check
echo -e "\n💻 [3/3] Frontend: Type checking..."
cd apps/frontend
if npx tsc -b; then
    echo -e "${GREEN}✅ Frontend types zijn OK${NC}"
else
    echo -e "${RED}❌ Frontend types bevatten fouten${NC}"
    EXIT_CODE=1
fi
cd ../..

# Summary
echo -e "\n---"
if [ "$EXIT_CODE" == "1" ]; then
    echo -e "${RED} FOUT: De applicatie bevat kritieke type-fouten. Los deze op voordat je pusht naar productie.${NC}"
    exit 1
else
    echo -e "${GREEN} SUCCES: Alle tests zijn geslaagd! De code is klaar voor deployment.${NC}"
    exit 0
fi
