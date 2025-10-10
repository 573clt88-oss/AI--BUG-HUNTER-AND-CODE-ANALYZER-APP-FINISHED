#!/bin/bash
# Health Check Script for AI Bug Hunter
# Tests all critical endpoints before deployment

BACKEND_URL="${REACT_APP_BACKEND_URL:-https://your-domain.com}"
API_URL="$BACKEND_URL/api"

echo "🏥 Health Check for AI Bug Hunter"
echo "================================="
echo "Testing: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response, expected $expected_code)"
        ((FAILED++))
    fi
}

# Test API Root
test_endpoint "API Root" "$API_URL/"

# Test Health Endpoint
test_endpoint "Health Check" "$API_URL/health"

# Test Version Endpoint
test_endpoint "Version Info" "$API_URL/version"

# Test Supported Languages
test_endpoint "Supported Languages" "$API_URL/supported-languages"

# Test Analysis Types
test_endpoint "Analysis Types" "$API_URL/analysis-types"

# Test Frontend Pages
test_endpoint "Homepage" "$BACKEND_URL/"
test_endpoint "Terms of Service" "$BACKEND_URL/terms"
test_endpoint "Privacy Policy" "$BACKEND_URL/privacy"
test_endpoint "Support Page" "$BACKEND_URL/support"
test_endpoint "Login Page" "$BACKEND_URL/login"
test_endpoint "Register Page" "$BACKEND_URL/register"

echo ""
echo "================================="
echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "================================="

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}⚠️  Health check failed! Fix issues before deploying.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All health checks passed!${NC}"
    exit 0
fi
