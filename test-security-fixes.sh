#!/bin/bash
# Comprehensive test script for security fixes

set -e

echo "=========================================="
echo "Security Fixes - Comprehensive Test"
echo "=========================================="
echo ""

# Test 1: Frontend dependencies install
echo "Test 1: Installing frontend dependencies..."
cd frontend
yarn install --frozen-lockfile > /dev/null 2>&1
echo "✓ Frontend dependencies installed successfully"
echo ""

# Test 2: Frontend build
echo "Test 2: Building frontend..."
yarn build > /dev/null 2>&1
echo "✓ Frontend built successfully"
echo ""

# Test 3: Verify security fixes
echo "Test 3: Running security verification..."
cd ..
./verify-security.sh
echo ""

# Test 4: Check documentation
echo "Test 4: Checking documentation..."
if [ -f "SECURITY_UPDATES.md" ]; then
    echo "✓ SECURITY_UPDATES.md exists"
else
    echo "✗ SECURITY_UPDATES.md missing"
    exit 1
fi

if [ -f "SECURITY_UPDATE_SUMMARY.md" ]; then
    echo "✓ SECURITY_UPDATE_SUMMARY.md exists"
else
    echo "✗ SECURITY_UPDATE_SUMMARY.md missing"
    exit 1
fi

echo ""
echo "=========================================="
echo "All tests passed successfully!"
echo "=========================================="
