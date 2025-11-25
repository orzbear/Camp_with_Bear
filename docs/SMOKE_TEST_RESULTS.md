# Smoke Test Results

**Date:** 2025-11-12 17:16:09  
**Environment:** Docker Compose  
**OpenWeather API Key:** c5df017a7961da45a250532bba658b24

## Prerequisites

- API server running on http://localhost:8080 ✅
- MongoDB running and connected ✅
- User: bear@test.com / Password123! ✅

## Test Results Summary

| Test | Status | Status Code | Notes |
|------|--------|-------------|-------|
| 1. Login | ✅ SUCCESS | 200 | Token obtained successfully |
| 2. Create Trip | ✅ SUCCESS | 201 | Trip ID: 6914263a10cc9c6c7c75ece1 |
| 3. List Trips | ✅ SUCCESS | 200 | Found 1 trip |
| 4. Get Single Trip | ✅ SUCCESS | 200 | Trip retrieved successfully |
| 5. Weather | ❌ FAILED | 502 | Bad Gateway - OpenWeather API error |
| 6. Delete Trip | ✅ SUCCESS | 204 | Trip deleted successfully |

---

## Detailed Test Results

### 1. Login Test

**Command:**
```powershell
$login = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"bear@test.com","password":"Password123!"}'
$token = $login.accessToken
```

**Expected:** 200 OK with accessToken  
**Actual:** ✅ **SUCCESS** - Status Code: 200

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Token (first 20 chars):** `eyJhbGciOiJIUzI1NiIs...`

---

### 2. Create Trip Test

**Command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/trips" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "location":{"lat":-33.7,"lon":150.3,"name":"Blue Mountains"},
    "startDate":"2026-01-10T00:00:00.000Z",
    "endDate":"2026-01-12T00:00:00.000Z",
    "groupSize":2,
    "experience":"beginner",
    "activities":["hiking","camping"]
  }'
```

**Expected:** 201 Created with { "id": "<mongo_id>" }  
**Actual:** ✅ **SUCCESS** - Status Code: 201

**Response:**
```json
{
  "id": "6914263a10cc9c6c7c75ece1"
}
```

**Trip ID:** `6914263a10cc9c6c7c75ece1`

---

### 3. List Trips Test

**Command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/trips" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

**Expected:** 200 OK with array of trips  
**Actual:** ✅ **SUCCESS** - Status Code: 200

**Response:**
- **Count:** 1 trip
- **First Trip:**
```json
{
  "_id": "6914263a10cc9c6c7c75ece1",
  "userId": "6914083b14e1512746e0e44e",
  "location": {
    "lat": -33.7,
    "lon": 150.3,
    "name": "Blue Mountains"
  },
  "startDate": "2026-01-10T00:00:00.000Z",
  "endDate": "2026-01-12T00:00:00.000Z",
  "groupSize": 2,
  "experience": "beginner",
  "activities": ["hiking", "camping"],
  "createdAt": "2025-11-12T06:16:26.566Z",
  "updatedAt": "2025-11-12T06:16:26.566Z",
  "__v": 0
}
```

---

### 4. Get Single Trip Test

**Command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/trips/6914263a10cc9c6c7c75ece1" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

**Expected:** 200 OK with single trip object  
**Actual:** ✅ **SUCCESS** - Status Code: 200

**Response:** Same trip object as listed above.

---

### 5. Weather Test

**Command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/weather?lat=-33.7&lon=150.3&from=2026-01-10T00:00:00.000Z&to=2026-01-12T00:00:00.000Z" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

**Expected:** 200 OK with { "daily":[...], "alerts":[...] }  
**Actual:** ❌ **FAILED** - Status Code: 502 Bad Gateway

**Error:**
```
The remote server returned an error: (502) Bad Gateway.
```

**Possible Causes:**
1. OpenWeather API One Call 3.0 may require subscription/paid plan
2. Date range might be too far in the future (2026-01-10)
3. API endpoint or parameters might be incorrect
4. OpenWeather API key might not have access to One Call 3.0

**Recommendation:**
- Check OpenWeather API subscription level
- Verify One Call 3.0 API access
- Try with current dates or dates within the free tier range
- Check API logs for detailed error message

---

### 6. Delete Trip Test

**Command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/trips/6914263a10cc9c6c7c75ece1" `
  -Method DELETE `
  -Headers @{ "Authorization" = "Bearer $token" }
```

**Expected:** 204 No Content  
**Actual:** ✅ **SUCCESS** - Status Code: 204

**Response:** No content (as expected)

---

## Overall Results

**Tests Passed:** 5/6 (83.3%)  
**Tests Failed:** 1/6 (16.7%)

### Successful Tests ✅
- Authentication (Login)
- Trip CRUD Operations (Create, Read, Delete)
- Authorization (JWT token validation)

### Failed Tests ❌
- Weather API integration (502 Bad Gateway from OpenWeather API)

## Notes

- All authentication and authorization tests passed
- All trip CRUD operations work correctly
- Weather API integration needs investigation:
  - OpenWeather One Call 3.0 may require paid subscription
  - Date range validation may be needed
  - Error handling is working (returns 502 as expected)
- MongoDB connection and data persistence working correctly
- JWT token generation and validation working correctly
- Weather endpoint now proxies the OpenWeather 5-day/3-hour forecast API (metric units) instead of One Call 3.0.

## Next Steps for Debugging

**Update 2025-11-24:** Step 4 complete – `/weather` now calls the 2.5 forecast endpoint and returns normalized `location` + `forecasts` data. Continue with the checks below to confirm the upstream service works with your OpenWeather account.

1. **Validate OpenWeather Access**
   - Verify the API key in `.env` matches the OpenWeather dashboard.
   - Remember the free 5-day forecast only supports ~120 hours ahead; clamp requests accordingly until a historical plan is available.
   - Run a direct curl/PowerShell request against `api.openweathermap.org/data/2.5/forecast` with *today’s* dates to ensure the service responds outside of TrailWise.

2. **Inspect API Service Logs**
   - `docker logs docker-api-1 --tail 200 | Select-String Weather` to capture the proxied error from OpenWeather.
   - If you see repeated 401/429 responses, rotate the key or throttle requests before retrying the smoke test.

3. **Re-run Weather Smoke Test with Known-Good Params**
   - Use the trip’s lat/lon but clamp `from` / `to` to a 48‑hour window starting today to stay inside the free tier.
   - If the call succeeds, restore the desired travel dates and note that historical forecasts require the paid plan; otherwise capture the failing response body and attach it to the bug report.
