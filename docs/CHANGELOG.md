# Changelog

All notable changes to this project will be documented in this file.

## [0.0.4] - Stage 3 Frontend Auth (Login/Register/Dashboard)

### Added
- Frontend authentication with React Context API
- Login page with email/password form
- Register page with email/password form
- Dashboard page showing current user and logout
- Protected route component with authentication check
- API client with typed functions for login, register, and me endpoints
- Token persistence in localStorage (key: `tw_token`)
- Automatic user fetch on app mount if token exists
- React Router setup with routes: `/login`, `/register`, `/dashboard`
- CORS configuration for frontend origin (http://localhost:5173)
- Tailwind CSS styling for forms and UI components

### Files Created
- `frontend/.env.local` - Environment variable for API base URL
- `frontend/src/vite-env.d.ts` - Vite TypeScript environment types
- `frontend/src/api/client.ts` - API client with typed HTTP wrapper
- `frontend/src/auth/AuthContext.tsx` - React context for authentication state
- `frontend/src/auth/ProtectedRoute.tsx` - Route protection component
- `frontend/src/pages/Login.tsx` - Login page component
- `frontend/src/pages/Register.tsx` - Registration page component
- `frontend/src/pages/Dashboard.tsx` - Dashboard page component

### Files Modified
- `frontend/package.json` - Added `react-router-dom` dependency
- `frontend/src/App.tsx` - Added routing with AuthProvider and protected routes
- `frontend/src/auth/AuthContext.tsx` - Added null check for optional accessToken
- `api/src/index.ts` - Updated CORS configuration for frontend origin

### Features
- User registration with automatic login after success
- User login with token storage
- Protected dashboard route requiring authentication
- Loading states during authentication
- Error handling with inline error messages
- Responsive UI with Tailwind CSS
- Form validation (email format, password length)

### Fixed
- TypeScript build errors in Docker: Added `vite-env.d.ts` for Vite `import.meta.env` types
- Type safety: Added null check for optional `accessToken` in login response
- Build process: Fixed TypeScript compilation errors that prevented Docker builds

### Verified
- User registration, login, and logout
- JWT persisted in localStorage
- Protected routes redirect unauthenticated users

## [0.0.3] - Stage 2 Auth + MongoDB Wiring

### Added
- MongoDB integration with Mongoose
- User model with email (unique, lowercase) and passwordHash
- JWT-based authentication (HS256, 7-day expiration)
- Auth routes: POST `/auth/register`, POST `/auth/login`
- Protected route: GET `/me` (requires JWT)
- Auth middleware for JWT verification
- Environment configuration with fail-fast validation
- MongoDB connection with retry/backoff logic
- Security middleware: Helmet, CORS, Morgan
- Docker Compose MongoDB service (mongo:6)
- `.env.example` for environment variables
- ADR 0003: JWT vs Session-based authentication

### Dependencies Added
- `mongoose` - MongoDB ODM
- `zod` - Schema validation
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT generation/verification
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP request logging
- `dotenv` - Environment variable management

### Files Created
- `api/src/config/env.ts` - Environment variable configuration
- `api/src/config/db.ts` - MongoDB connection logic
- `api/src/models/User.ts` - User Mongoose model
- `api/src/routes/auth.ts` - Authentication routes
- `api/src/middleware/auth.ts` - JWT authentication middleware
- `api/src/routes/me.ts` - Protected user info route
- `docs/ADRs/0003-auth-jwt-vs-session.md` - Authentication ADR

### Files Modified
- `api/package.json` - Added dependencies and devDependencies
- `api/src/index.ts` - Integrated MongoDB, auth routes, and security middleware
- `docker/docker-compose.yml` - Added MongoDB service
- `docs/API.md` - Added auth endpoint examples
- `.env.example` - Environment variable template

## [0.0.2] - Stage 1 API Contracts & Types

### Added
- OpenAPI 3.0.3 specifications for API and RAG services
- `docs/openapi/api.yaml` - Complete API specification (version 0.1.0)
- `docs/openapi/rag.yaml` - RAG service specification (version 0.1.0)
- `docs/API.md` - Concise endpoint documentation table
- Frontend type generation using `openapi-typescript`
- Type generation scripts: `gen:types:api`, `gen:types:rag`, `gen:types`
- `frontend/src/types/example-usage.ts` - Type compilation verification
- CI workflow updated to generate and validate types

### API Endpoints Documented
- POST `/auth/register` - User registration
- POST `/auth/login` - User authentication
- POST `/trips` - Create trip
- GET `/trips/{id}` - Get trip details
- GET `/weather` - Weather data query
- GET `/checklist/{tripId}` - Trip checklist
- POST `/ai/ask` - AI question answering
- GET `/health` - Health check

### RAG Endpoints Documented
- POST `/ingest/url` - URL content ingestion
- POST `/search` - Document search
- POST `/answer` - AI answer generation
- POST `/answer/stream` - Streaming AI answers
- GET `/health` - Health check

## [0.0.1] - Stage 0 Scaffold

### Added
- Initial monorepo structure with frontend, API, and RAG services
- Frontend: Vite + React + TypeScript + Tailwind CSS setup
- API: Express + TypeScript setup with health endpoint
- RAG: FastAPI setup with health endpoint
- Docker configuration for all services
- CI workflow stub
- Documentation structure
- .gitignore for Node.js, Python, build outputs, and IDE files

### Fixed
- API: Replaced ts-node-dev with tsx for proper ES module support

