# Changelog

All notable changes to this project will be documented in this file.

## [0.0.5] - Stage 4 Trips + Weather + Checklist

### Added
- Trip CRUD operations (Create, Read, Delete) with JWT authentication
- Trip model with location, dates, group size, experience level, and activities
- Weather integration with OpenWeather 2.5 Forecast API (5-day / 3-hour forecast)
- Frontend trip management UI with create form and trips list
- Weather preview functionality for trips
- **Trip Checklist Generation** - Rule-based packing checklist generation
  - GET `/checklist/{tripId}` endpoint with JWT authentication
  - Weather-based item recommendations (rain, cold, hot, windy conditions)
  - Activity-specific items (hiking, camping, fishing, swimming)
  - Experience-level adjustments (beginner safety items, expert gear)
  - Duration and group size considerations
  - Frontend checklist UI with item details and recommendations
- OpenAPI specification updates with security schemes (bearerAuth)
- All trip, weather, and checklist endpoints protected with JWT authentication

### Files Created
- `api/src/models/Trip.ts` - Trip Mongoose model with location, dates, and metadata
- `api/src/routes/trips.ts` - Trip CRUD routes (POST, GET list, GET by id, DELETE)
- `api/src/routes/weather.ts` - Weather route with OpenWeather API integration
- `api/src/routes/checklist.ts` - Checklist generation route
- `api/src/services/checklist.ts` - Checklist business logic (classifyWeather, generateChecklist)

### Files Modified
- `api/src/config/env.ts` - Added OPENWEATHER_API_KEY (required)
- `api/src/index.ts` - Mounted trips, weather, and checklist routes with auth middleware
- `docs/openapi/api.yaml` - Added GET /trips, DELETE /trips/{id}, GET /checklist/{tripId}, security schemes, and bearerAuth
- `frontend/src/api/client.ts` - Added createTrip, listTrips, deleteTrip, getWeather, getChecklist functions
- `frontend/src/pages/Dashboard.tsx` - Complete trip management UI with form, table, weather preview, and checklist generation
- `frontend/package.json` - Added `prebuild` script to auto-generate types before build; simplified `gen:types` to only generate API types
- `api/src/routes/weather.ts` - Switched from One Call 3.0 to 2.5 Forecast API for free tier compatibility
- `docker/frontend/Dockerfile` - Added COPY command for docs directory to make OpenAPI specs available during build

### Features
- **Trip Management:**
  - Create trips with location (name, lat, lon), dates, group size, experience level, activities
  - List all trips for authenticated user
  - View individual trip details
  - Delete trips (with confirmation)
  - All operations require JWT authentication

- **Weather Integration:**
  - Fetch weather data for trip location and date range
  - Uses OpenWeather 2.5 Forecast API (5-day / 3-hour forecast)
  - Returns normalized JSON with location and forecasts array
  - Error handling for invalid parameters and API failures

- **Checklist Generation:**
  - Rule-based packing checklist generation
  - Weather classification: rain, cold, hot, windy, normal
  - Activity-specific items (hiking boots, tent, fishing gear, etc.)
  - Experience-level adjustments (beginner safety items, expert gear)
  - Duration-based items (extra batteries for long trips)
  - Group size considerations (group cooking equipment for large groups)
  - Each item includes name, quantity, reason, and recommended flag

- **Frontend UI:**
  - Create trip form with all required fields
  - Responsive trips table with location, dates, group size, experience
  - Weather button per trip to fetch and display weather data
  - Checklist button per trip to generate and display packing checklist
  - Delete button with confirmation dialog
  - JSON preview for weather data
  - Formatted checklist display with item details and recommendations

### Dependencies
- OpenWeather API key required in environment variables

### Build Improvements
- Added `prebuild` hook to automatically generate TypeScript types from OpenAPI spec before build
- Simplified `gen:types` script to only generate API types (RAG types can be generated separately if needed)

### Fixed
- TypeScript build error in weather route: Added type assertion for `weatherData` to fix strict type checking (TS18046)
- Docker build error in frontend: Updated Dockerfile to copy `docs/` directory so OpenAPI specs are available for type generation during build

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

