# Environment Variables

This document lists all environment variables required for CampMate services.

## Frontend

| Variable | Default | Required (Production) | Where Used | Description |
|----------|---------|----------------------|------------|-------------|
| `VITE_API_BASE` | `http://localhost:8080` | No | `frontend/src/api/client.ts` | Base URL for API requests. Must be set at **build time** (not runtime) for Vite. In Docker, browsers access via localhost port mapping. |

**Notes:**
- Vite environment variables are embedded at build time, not runtime
- In Docker, set via build args in `docker/frontend/Dockerfile`
- Default works for local development (Vite dev server → API on localhost:8080)
- For production Docker, typically set to `http://localhost:8080` (browser → API via port mapping)

## API

| Variable | Default | Required (Production) | Where Used | Description |
|----------|---------|----------------------|------------|-------------|
| `MONGO_URI` | None | **Yes** | `api/src/config/env.ts`, `api/src/config/db.ts` | MongoDB connection string. Format: `mongodb://host:port/database` or `mongodb://user:pass@host:port/database`. In Docker: `mongodb://mongo:27017/campmate` |
| `JWT_SECRET` | None | **Yes** | `api/src/config/env.ts`, `api/src/middleware/auth.ts`, `api/src/routes/auth.ts` | Secret key for signing and verifying JWT tokens. Must be a strong, random string. |
| `OPENWEATHER_API_KEY` | None | **Yes** | `api/src/config/env.ts`, `api/src/routes/weather.ts`, `api/src/routes/checklist.ts` | OpenWeather API key for weather forecast data. Required for weather and checklist features. |
| `PORT` | `8080` | No | `api/src/config/env.ts`, `api/src/index.ts` | Port number for the API server to listen on. |
| `NODE_ENV` | `development` | No | `api/src/config/env.ts`, `api/src/index.ts` | Environment mode. When set to `production`, campsite seeding is disabled and CORS is restricted. |
| `FRONTEND_URL` | None | **Yes (Production)** | `api/src/index.ts` | Single frontend URL for CORS configuration. Used in production when only one origin is needed. |
| `ALLOWED_ORIGINS` | None | **Yes (Production)** | `api/src/index.ts` | Comma-separated list of allowed origins for CORS. Alternative to `FRONTEND_URL` when multiple origins are needed. Example: `https://app.example.com,https://www.example.com` |

**Notes:**
- `MONGO_URI`, `JWT_SECRET`, and `OPENWEATHER_API_KEY` are validated at startup and will cause the server to fail fast if missing
- `NODE_ENV=production` disables automatic campsite seeding and restricts CORS to configured origins only
- **CORS Configuration:**
  - **Development**: Localhost origins (`http://localhost:5173`, `http://localhost:3000`, `http://localhost:3001`) are automatically allowed, plus any origins from `FRONTEND_URL` or `ALLOWED_ORIGINS`
  - **Production**: Only origins from `FRONTEND_URL` or `ALLOWED_ORIGINS` are allowed. Localhost origins are **not** allowed. Server will fail to start if no allowed origins are configured.
- Use `FRONTEND_URL` for a single origin, or `ALLOWED_ORIGINS` for multiple origins (comma-separated)

## Database (MongoDB)

| Variable | Default | Required (Production) | Where Used | Description |
|----------|---------|----------------------|------------|-------------|
| None | N/A | N/A | N/A | MongoDB does not require environment variables. Connection is configured via `MONGO_URI` in the API service. |

**Notes:**
- MongoDB connection is managed by the API service via `MONGO_URI`
- In Docker Compose, MongoDB runs as a service named `mongo` on port 27017
- No authentication configured by default (development setup)

## RAG Service

| Variable | Default | Required (Production) | Where Used | Description |
|----------|---------|----------------------|------------|-------------|
| `RAG_VERSION` | `0.0.1` | No | `rag/app.py` | Version string for the RAG service. Used in health check endpoint. |
| `PORT` | `8000` | No | `docker/rag/Dockerfile` | Port number for the RAG service to listen on. Used in uvicorn command. |

**Notes:**
- RAG service is currently a minimal placeholder (health check only)
- Not actively used in MVP, but included in Docker Compose for future use

## Docker Compose Environment Variables

The following environment variables are set in `docker/docker-compose.yml`:

### Frontend Service
- `PORT=3000` (nginx port, not used by Vite in production build)
- `VITE_API_BASE=http://localhost:8080` (build arg, set at build time)

### API Service
- `PORT=8080`
- `MONGO_URI=mongodb://mongo:27017/campmate`
- `JWT_SECRET=__REPLACE_IN_ENV__` (⚠️ **Must be set via .env file or environment variable!**)
- `OPENWEATHER_API_KEY=__REPLACE_IN_ENV__` (⚠️ **Must be set via .env file or environment variable!**)

### RAG Service
- `PORT=8000`
- `RAG_VERSION=0.0.1`

### MongoDB Service
- No environment variables required (uses default MongoDB configuration)

## Production Checklist

Before deploying to production, ensure:

- [ ] `JWT_SECRET` is set to a strong, random string (replace `__REPLACE_IN_ENV__` placeholder)
- [ ] `OPENWEATHER_API_KEY` is set to your own OpenWeather API key (replace `__REPLACE_IN_ENV__` placeholder)
- [ ] `MONGO_URI` points to your production MongoDB instance
- [ ] `NODE_ENV=production` is set (disables campsite seeding and restricts CORS)
- [ ] `VITE_API_BASE` is set correctly for your deployment (build-time variable)
- [ ] **CORS Configuration**: Either `FRONTEND_URL` or `ALLOWED_ORIGINS` is set (required in production)
  - `FRONTEND_URL=https://app.example.com` (for single origin)
  - OR `ALLOWED_ORIGINS=https://app.example.com,https://www.example.com` (for multiple origins)
- [ ] MongoDB has proper authentication configured (if applicable)

## Local Development

For local development without Docker:

1. **API**: Create `.env` file in `api/` directory:
   ```
   MONGO_URI=mongodb://localhost:27017/campmate
   JWT_SECRET=your-dev-secret-key
   OPENWEATHER_API_KEY=your-openweather-api-key
   PORT=8080
   NODE_ENV=development
   ```

2. **Frontend**: Create `.env.local` file in `frontend/` directory (optional):
   ```
   VITE_API_BASE=http://localhost:8080
   ```

## References

- API environment configuration: `api/src/config/env.ts`
- Frontend API client: `frontend/src/api/client.ts`
- Docker Compose: `docker/docker-compose.yml`
- Dockerfiles: `docker/frontend/Dockerfile`, `docker/api/Dockerfile`, `docker/rag/Dockerfile`
