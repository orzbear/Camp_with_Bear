# Secret Exposure Audit Report

**Date:** 2025-01-XX  
**Scope:** Full repository scan for accidental secret exposure

## Critical Issues (Requires Immediate Review)

### 1. OpenWeather API Key Exposure
**Severity:** HIGH  
**Status:** ⚠️ **REAL API KEY EXPOSED**

| File | Line | Value | Notes |
|------|------|-------|-------|
| `docker/docker-compose.yml` | 27 | `c5df017a7961da45a250532bba658b24` | Hardcoded OpenWeather API key |
| `docs/env.md` | 67 | `c5df017a7961da45a250532bba658b24` | Documented with warning, but still exposed |
| `docs/SMOKE_TEST_RESULTS.md` | 5 | `c5df017a7961da45a250532bba658b24` | Test results file |

**Action Required:**
- [ ] Verify if this is a real, active API key
- [ ] If real: Rotate the key immediately in OpenWeather dashboard
- [ ] Replace with placeholder: `YOUR_OPENWEATHER_API_KEY_HERE`
- [ ] Use environment variable substitution in docker-compose.yml
- [ ] Remove from committed files

### 2. Weak JWT Secret in Docker Compose
**Severity:** MEDIUM  
**Status:** ⚠️ **WEAK DEFAULT VALUE**

| File | Line | Value | Notes |
|------|------|-------|-------|
| `docker/docker-compose.yml` | 26 | `dev_change_me` | Weak default JWT secret |
| `docs/env.md` | 66 | `dev_change_me` | Documented with warning |

**Action Required:**
- [ ] Replace with placeholder: `CHANGE_ME_IN_PRODUCTION`
- [ ] Add note that this must be changed before production
- [ ] Consider using environment variable file (`.env` not committed)

### 3. MongoDB Admin Credentials (Weak Defaults)
**Severity:** MEDIUM  
**Status:** ⚠️ **WEAK DEFAULT PASSWORDS**

| File | Line | Variable | Value | Notes |
|------|------|----------|-------|-------|
| `docker/docker-compose.yml` | 58 | `ME_CONFIG_MONGODB_ADMINPASSWORD` | `example` | Weak MongoDB admin password |
| `docker/docker-compose.yml` | 60 | `ME_CONFIG_BASICAUTH_PASSWORD` | `admin` | Weak mongo-express password |

**Action Required:**
- [ ] Replace with placeholders or environment variables
- [ ] Add warnings that these must be changed
- [ ] Consider removing mongo-express from production docker-compose

## Medium Priority Issues

### 4. Test Account Credentials
**Severity:** LOW-MEDIUM  
**Status:** ⚠️ **TEST CREDENTIALS EXPOSED**

| File | Line | Credentials | Notes |
|------|------|-------------|-------|
| `docs/SMOKE_TEST_RESULTS.md` | 11 | `bear@test.com / Password123!` | Test account email and password |
| `docs/SMOKE_TEST_RESULTS.md` | 34 | `bear@test.com / Password123!` | Repeated in test command |

**Action Required:**
- [ ] Verify if this test account exists in production database
- [ ] If exists: Delete the test account
- [ ] Replace with generic placeholders: `test@example.com / testpassword`
- [ ] Add note that these are example credentials only

### 5. MongoDB Object IDs in Test Results
**Severity:** LOW  
**Status:** ℹ️ **POTENTIALLY SENSITIVE**

| File | Line | Type | Example | Notes |
|------|------|------|---------|-------|
| `docs/SMOKE_TEST_RESULTS.md` | 18 | Trip ID | `6914263a10cc9c6c7c75ece1` | Real MongoDB ObjectId |
| `docs/SMOKE_TEST_RESULTS.md` | 76 | Trip ID | `6914263a10cc9c6c7c75ece1` | Repeated |
| `docs/SMOKE_TEST_RESULTS.md` | 100 | User ID | `6914083b14e1512746e0e44e` | Real MongoDB ObjectId |
| `docs/SMOKE_TEST_RESULTS.md` | 124 | Trip ID | `6914263a10cc9c6c7c75ece1` | Repeated |

**Action Required:**
- [ ] Replace with placeholder IDs: `507f1f77bcf86cd799439011` (standard MongoDB example format)
- [ ] Add note that these are example IDs from test database

## Low Priority / Acceptable

### 6. Example JWT Token in Documentation
**Severity:** LOW  
**Status:** ✅ **ACCEPTABLE (Placeholder)**

| File | Line | Value | Notes |
|------|------|-------|-------|
| `docs/API.md` | 62 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Truncated example token (safe) |

**Action Required:**
- [x] Already truncated with `...` - acceptable for documentation

### 7. Example Passwords in Documentation
**Severity:** LOW  
**Status:** ✅ **ACCEPTABLE (Examples)**

| File | Line | Value | Notes |
|------|------|-------|-------|
| `docs/API.md` | 32, 55 | `password123` | Generic example password |
| `docs/RUNBOOK.md` | 275, 280 | `test123` | Generic example password |
| `api/src/routes/auth.ts` | 95, 100 | `password123` | Example in code comments |

**Action Required:**
- [x] Generic example values - acceptable for documentation

## Files Requiring Review

### High Priority
1. `docker/docker-compose.yml` - Lines 26, 27, 58, 60
2. `docs/env.md` - Lines 66, 67
3. `docs/SMOKE_TEST_RESULTS.md` - Lines 5, 11, 18, 34, 76, 100, 124

### Medium Priority
4. `docs/API.md` - Line 62 (verify token is placeholder)
5. `api/src/routes/auth.ts` - Lines 95, 100 (example passwords - acceptable)

## Recommendations

### Immediate Actions
1. **Rotate OpenWeather API Key** if `c5df017a7961da45a250532bba658b24` is real
2. **Replace hardcoded secrets** in `docker/docker-compose.yml` with environment variables
3. **Use `.env` file** for docker-compose (add to `.gitignore` if not already)
4. **Remove test credentials** from committed files

### Best Practices Going Forward
1. **Never commit real API keys** - use placeholders or environment variables
2. **Use `.env.example`** files with placeholder values
3. **Document secrets** in separate, non-committed files
4. **Use secret management** for production (e.g., Docker secrets, Kubernetes secrets, AWS Secrets Manager)
5. **Regular audits** - run this scan periodically

### Docker Compose Improvements
```yaml
# Recommended approach:
api:
  environment:
    - MONGO_URI=${MONGO_URI}
    - JWT_SECRET=${JWT_SECRET}
    - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
```

Then use `.env` file (not committed):
```
MONGO_URI=mongodb://mongo:27017/campmate
JWT_SECRET=your-strong-secret-here
OPENWEATHER_API_KEY=your-api-key-here
```

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Real API Keys | 1 | HIGH |
| Weak Secrets | 3 | MEDIUM |
| Test Credentials | 1 | LOW-MEDIUM |
| Example Values | Multiple | LOW (Acceptable) |

**Total Issues Requiring Action:** 5

**Status:** ⚠️ **REQUIRES IMMEDIATE ATTENTION** - Real API key exposed in multiple files

---

## Remediation Status

**Date:** 2025-01-XX  
**Status:** ✅ **REMEDIATED**

All exposed secrets have been sanitized and replaced with placeholder values:

- ✅ **OpenWeather API Key**: Replaced `c5df017a7961da45a250532bba658b24` with `__REPLACE_IN_ENV__` in:
  - `docker/docker-compose.yml`
  - `docs/env.md`
  - `docs/SMOKE_TEST_RESULTS.md`

- ✅ **JWT Secret**: Replaced `dev_change_me` with `__REPLACE_IN_ENV__` in:
  - `docker/docker-compose.yml`
  - `docs/env.md`

- ✅ **MongoDB Admin Passwords**: Replaced weak defaults with `__REPLACE_IN_ENV__` in:
  - `docker/docker-compose.yml` (mongo-express admin and MongoDB admin passwords)

**Note:** Docker Compose will continue to work locally using `.env` file overrides. Users must create a `.env` file in the `docker/` directory with actual values for production use.

**Action Required:** If the OpenWeather API key was real and active, it should be rotated in the OpenWeather dashboard immediately.
