#!/bin/bash
# Security Vulnerability Verification Script
# This script verifies that all known security vulnerabilities have been addressed

echo "=== Security Vulnerability Verification ==="
echo ""

FAILED=0

echo "Checking Frontend Dependencies..."
echo "=================================="

cd frontend || exit 1

# Check prismjs version
PRISMJS_VERSION=$(grep -A1 'prismjs@' yarn.lock | grep "version" | head -1 | sed 's/.*"\(.*\)".*/\1/')
echo "✓ PrismJS version: $PRISMJS_VERSION"
# Using Python for version comparison
python3 -c "from packaging import version; exit(0 if version.parse('$PRISMJS_VERSION') >= version.parse('1.29.1') else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "✗ FAIL: PrismJS version $PRISMJS_VERSION is vulnerable (CVE-2024-53382). Required: 1.29.1+"
    FAILED=1
else
    echo "  Status: Safe (CVE-2024-53382 fixed in 1.29.1)"
fi

# Check postcss version
POSTCSS_VERSION=$(grep -A1 'postcss@.*:' yarn.lock | grep "version" | head -1 | sed 's/.*"\(.*\)".*/\1/')
echo ""
echo "✓ PostCSS version: $POSTCSS_VERSION"
python3 -c "from packaging import version; exit(0 if version.parse('$POSTCSS_VERSION') >= version.parse('8.4.31') else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "✗ FAIL: PostCSS version $POSTCSS_VERSION is vulnerable (CVE-2023-44270). Required: 8.4.31+"
    FAILED=1
else
    echo "  Status: Safe (CVE-2023-44270 fixed in 8.4.31)"
fi

# Check webpack-dev-middleware version
WEBPACK_DEV_VERSION=$(grep -A1 'webpack-dev-middleware@' yarn.lock | grep "version" | head -1 | sed 's/.*"\(.*\)".*/\1/')
echo ""
echo "✓ webpack-dev-middleware version: $WEBPACK_DEV_VERSION"
python3 -c "from packaging import version; exit(0 if version.parse('$WEBPACK_DEV_VERSION') >= version.parse('5.3.4') else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "✗ FAIL: webpack-dev-middleware version $WEBPACK_DEV_VERSION is vulnerable (CVE-2024-29180). Required: 5.3.4+"
    FAILED=1
else
    echo "  Status: Safe (CVE-2024-29180 fixed in 5.3.4)"
fi

# Check @eslint/plugin-kit version
ESLINT_PLUGIN_VERSION=$(grep -A1 '@eslint/plugin-kit@' yarn.lock | grep "version" | head -1 | sed 's/.*"\(.*\)".*/\1/')
echo ""
echo "✓ @eslint/plugin-kit version: $ESLINT_PLUGIN_VERSION"
python3 -c "from packaging import version; exit(0 if version.parse('$ESLINT_PLUGIN_VERSION') >= version.parse('0.2.3') else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "✗ FAIL: @eslint/plugin-kit version $ESLINT_PLUGIN_VERSION is vulnerable (CVE-2024-21539). Required: 0.2.3+"
    FAILED=1
else
    echo "  Status: Safe (CVE-2024-21539 fixed in 0.2.3)"
fi

echo ""
echo "Checking Backend Dependencies..."
echo "=================================="

cd ../backend || exit 1

# Check ecdsa version
ECDSA_VERSION=$(grep "^ecdsa==" requirements.txt | sed 's/ecdsa==\(.*\)/\1/')
echo "⚠ python-ecdsa version: $ECDSA_VERSION"
echo "  Status: No fix available (CVE-2024-23342)"
echo "  Note: Maintainers do not plan to fix. Latest version documented."

# Check python-jose version
JOSE_VERSION=$(grep "^python-jose==" requirements.txt | sed 's/python-jose==\(.*\)/\1/')
echo ""
echo "✓ python-jose version: $JOSE_VERSION"
python3 -c "from packaging import version; exit(0 if version.parse('$JOSE_VERSION') >= version.parse('3.3.1') else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "✗ FAIL: python-jose version $JOSE_VERSION is vulnerable (CVE-2024-33663). Required: 3.3.1+"
    FAILED=1
else
    echo "  Status: Safe (CVE-2024-33663 fixed in 3.3.1)"
fi

echo ""
echo "=== Verification Summary ==="
if [ $FAILED -eq 0 ]; then
    echo "✓ All security vulnerabilities have been addressed or documented"
    exit 0
else
    echo "✗ Some security vulnerabilities remain unaddressed"
    exit 1
fi
