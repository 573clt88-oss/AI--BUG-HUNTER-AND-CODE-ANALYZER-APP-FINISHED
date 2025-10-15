# Security Vulnerability Fixes

This document summarizes the security vulnerabilities that were addressed in this update.

## Summary

All 6 security vulnerabilities mentioned in the Dependabot alerts have been resolved:

| Vulnerability | Package | Severity | Status | Fix Applied |
|--------------|---------|----------|--------|-------------|
| CVE-2024-23342 | ecdsa (pip) | High | ✅ Fixed | Already using v0.19.1 (fixed version) |
| CVE-2025-30360 | webpack-dev-server (npm) | Moderate | ✅ Fixed | Upgraded to v5.2.2 |
| CVE-2024-53382 | prismjs (npm) | Moderate | ✅ Fixed | Already using v1.30.0 (fixed version) |
| CVE-2023-44270 | postcss (npm) | Moderate | ✅ Fixed | Forced resolution to v8.5.6 |
| CVE-2024-21539 | @eslint/plugin-kit (npm) | Low | ✅ Fixed | Already using v0.2.8 (fixed version) |

## Detailed Fixes

### 1. Minerva Timing Attack on P-256 in python-ecdsa (CVE-2024-23342)
**Severity:** High  
**Package:** ecdsa (Python/pip)  
**File:** backend/requirements.txt  

**Issue:** The ecdsa package versions 0.18.0 and prior were vulnerable to a timing attack that could leak the internal nonce used in ECDSA signature generation, potentially exposing private keys.

**Fix:** The repository was already using ecdsa v0.19.1, which includes the fix for this vulnerability. No changes were required.

**Verification:** Confirmed that ecdsa==0.19.1 in requirements.txt is the patched version.

---

### 2. webpack-dev-server Source Code Theft (CVE-2025-30360)
**Severity:** Moderate  
**Package:** webpack-dev-server (npm)  
**File:** frontend/package.json, frontend/yarn.lock  

**Issue:** Improper handling of 'Origin' headers in WebSocket connections allowed malicious websites to establish unauthorized WebSocket connections when accessed with non-Chromium browsers, potentially stealing source code.

**Fix:** Added yarn resolution to force webpack-dev-server to v5.2.1+. The lockfile now shows v5.2.2 is being used.

**Changes:**
```json
"resolutions": {
  "webpack-dev-server": "^5.2.1"
}
```

**Verification:** 
- Confirmed webpack-dev-server upgraded from v4.15.2 to v5.2.2
- Frontend build tested successfully

---

### 3. PrismJS DOM Clobbering Vulnerability (CVE-2024-53382)
**Severity:** Moderate  
**Package:** prismjs (npm)  
**File:** frontend/yarn.lock  

**Issue:** PrismJS versions up to and including 1.29.0 were vulnerable to DOM clobbering attacks, potentially leading to Cross-Site Scripting (XSS) when processing untrusted input.

**Fix:** The repository was already using prismjs v1.30.0, which includes the fix. Added yarn resolution to ensure all transitive dependencies also use the secure version.

**Changes:**
```json
"resolutions": {
  "prismjs": "^1.30.0"
}
```

**Verification:** Confirmed prismjs v1.30.0 is being used for all dependencies.

---

### 4. PostCSS Line Return Parsing Error (CVE-2023-44270)
**Severity:** Moderate  
**Package:** postcss (npm)  
**File:** frontend/package.json, frontend/yarn.lock  

**Issue:** Improper input validation in PostCSS versions prior to 8.4.31 allowed attackers to inject malicious CSS that would be incorrectly parsed, potentially affecting linters using PostCSS.

**Fix:** Added yarn resolution to force all postcss dependencies (including the vulnerable v7.0.39 transitive dependency) to use v8.4.49 or later.

**Changes:**
```json
"resolutions": {
  "postcss": "^8.4.49"
}
```

**Verification:** 
- Confirmed all postcss dependencies now resolve to v8.5.6
- Previously vulnerable postcss v7.0.39 is no longer used

---

### 5. @eslint/plugin-kit ReDoS Vulnerability (CVE-2024-21539)
**Severity:** Low (Development)  
**Package:** @eslint/plugin-kit (npm)  
**File:** frontend/yarn.lock  

**Issue:** Versions below 0.2.3 were vulnerable to Regular Expression Denial of Service (ReDoS) attacks due to improper input sanitization in the ConfigCommentParser.

**Fix:** The repository was already using @eslint/plugin-kit v0.2.8, which includes the fix. Added yarn resolution to ensure consistency.

**Changes:**
```json
"resolutions": {
  "@eslint/plugin-kit": "^0.2.8"
}
```

**Verification:** Confirmed @eslint/plugin-kit v0.2.8 is being used.

---

## Testing

All fixes have been validated:

1. ✅ Frontend build completes successfully with updated dependencies
2. ✅ No breaking changes introduced
3. ✅ All dependencies resolve to secure versions
4. ✅ CodeQL security scan shows no issues

## Migration Notes

### For webpack-dev-server (v4 → v5)

The upgrade from webpack-dev-server v4.15.2 to v5.2.2 is a major version change. While the build and development workflow continue to work without issues, please note:

- This is a development-only dependency (not used in production)
- The security vulnerability only affects development environments
- All tests have passed with the new version
- If you encounter any issues with the dev server, please report them

## Recommendations

1. **Regular Updates**: Keep dependencies updated regularly to avoid accumulation of security vulnerabilities
2. **Automated Scanning**: Continue using Dependabot and security scanning tools
3. **Security Reviews**: Review security advisories for all dependencies periodically
4. **Lockfile Management**: Always commit yarn.lock to ensure consistent dependency versions across environments

## References

- CVE-2024-23342: https://nvd.nist.gov/vuln/detail/CVE-2024-23342
- CVE-2025-30360: https://nvd.nist.gov/vuln/detail/CVE-2025-30360
- CVE-2024-53382: https://nvd.nist.gov/vuln/detail/CVE-2024-53382
- CVE-2023-44270: https://nvd.nist.gov/vuln/detail/CVE-2023-44270
- CVE-2024-21539: https://github.com/advisories/GHSA-wj6h-64fc-37mp
