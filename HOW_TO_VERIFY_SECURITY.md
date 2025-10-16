# How to Verify Security Updates

This guide explains how to verify that all security vulnerabilities have been properly addressed.

## Quick Verification

Run the automated verification script:

```bash
./verify-security.sh
```

Expected output:
```
=== Security Vulnerability Verification ===
...
✓ All security vulnerabilities have been addressed or documented
```

## Manual Verification

### Frontend Dependencies

1. Check PrismJS version (should be >= 1.30.0):
```bash
cd frontend
grep -A2 'prismjs@' yarn.lock | grep version
```

2. Check PostCSS version (should be >= 8.4.31):
```bash
grep -A2 'postcss@.*:' yarn.lock | grep version | head -1
```

3. Check webpack-dev-middleware version (should be >= 5.3.4):
```bash
grep -A2 'webpack-dev-middleware@' yarn.lock | grep version
```

4. Check @eslint/plugin-kit version (should be >= 0.2.3):
```bash
grep -A2 '@eslint/plugin-kit@' yarn.lock | grep version
```

### Backend Dependencies

1. Check python-ecdsa version (0.19.1 is latest, no fix available):
```bash
cd ../backend
grep '^ecdsa==' requirements.txt
```

2. Check python-jose version (should be >= 3.3.1):
```bash
grep '^python-jose==' requirements.txt
```

## Testing the Application

### Frontend

1. Install dependencies:
```bash
cd frontend
yarn install
```

2. Build the application:
```bash
yarn build
```

3. Verify build succeeded (should see "Compiled successfully"):
```bash
echo $?  # Should output 0
```

### Backend

Note: The `emergentintegrations` package is platform-specific and may not be available in all environments.

1. Install dependencies (excluding emergentintegrations for testing):
```bash
cd ../backend
grep -v "emergentintegrations" requirements.txt > /tmp/test-requirements.txt
pip install -r /tmp/test-requirements.txt
```

## Continuous Verification

To ensure security updates are maintained:

1. **Before each release**: Run `./verify-security.sh`
2. **In CI/CD**: Add the verification script to your CI pipeline
3. **Regular audits**: 
   - Frontend: `cd frontend && yarn audit`
   - Backend: `pip-audit` (install with `pip install pip-audit`)

## Understanding the Results

### ✅ Safe
The dependency is at or above the fixed version.

### ⚠️ Documented
The dependency has a known vulnerability with no fix available. This is documented with migration guidance.

### ✗ FAIL
The dependency is vulnerable and needs to be updated.

## Troubleshooting

### Verification script fails
1. Ensure you're in the project root directory
2. Make the script executable: `chmod +x verify-security.sh`
3. Check that required tools are installed:
   - `grep`
   - `sed`
   - `python3` with `packaging` module

### Build fails
1. Clear caches:
   ```bash
   cd frontend
   rm -rf node_modules yarn.lock
   yarn install
   ```

2. Check Node.js version (should be >= 18):
   ```bash
   node --version
   ```

### Dependencies install fails
Check your internet connection and try again. Some packages may be temporarily unavailable.

## Additional Resources

- [SECURITY_UPDATES.md](SECURITY_UPDATES.md) - Detailed information about all vulnerabilities
- [SECURITY_UPDATE_SUMMARY.md](SECURITY_UPDATE_SUMMARY.md) - Quick summary of changes
- [SECURITY.md](SECURITY.md) - Project security policy

## Support

If you encounter issues with security verification:
1. Check the documentation files listed above
2. Review recent commits for changes to dependencies
3. Contact the security team as outlined in SECURITY.md
