#!/bin/bash

echo "==================================="
echo "FocusBoard Complete Test Suite"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "Checking backend server..."
if curl -s http://localhost:3000/api/auth/dev-login > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running. Please start it first.${NC}"
    exit 1
fi

# Check if ML service is running
echo "Checking ML service..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}✓ ML service is running${NC}"
else
    echo -e "${YELLOW}⚠ ML service is not running. Some tests may fail.${NC}"
fi

echo ""
echo "-----------------------------------"
echo "Test 1: Real Data Integration"
echo "-----------------------------------"
node tests/real-data-test.js

echo ""
echo "-----------------------------------"
echo "Test 2: Performance Test (150 activities)"
echo "-----------------------------------"
node tests/performance-bulk-test.js

echo ""
echo "-----------------------------------"
echo "Test 3: 3-Tier Categorization"
echo "-----------------------------------"
node tests/3-tier-comprehensive-test.js

echo ""
echo "==================================="
echo "All Tests Complete!"
echo "==================================="
