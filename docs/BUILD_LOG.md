# Build Log

This document lists all generated commands and files.

## Stage E: Merge Explore + Footprints into Unified Experience

### Goal
Create one unified Footprints experience that adapts based on authentication state:
- Not logged in → Demo mode (explore demo footprints)
- Logged in → Authenticated mode (manage real footprints)

### Files Modified
- `frontend/src/pages/Footprints.tsx` - Unified demo and authenticated modes
  - Added demo footprint loading when not authenticated
  - Added demo mode banner
  - Conditionally show/hide CRUD actions based on auth state
  - Same UI layout for both modes, only actions differ
- `frontend/src/App.tsx` - Routing changes
  - Default route (`/`) now points to Footprints
  - `/footprints` also points to Footprints
  - Explore moved to `/legacy/explore` (not linked)
- `frontend/src/components/NavBar.tsx` - Navigation changes
  - Removed "Explore" link from navbar
  - Kept "Footprints" as main tab
  - Planning and Recipes links unchanged

### Routes
- `/` → Footprints (default)
- `/footprints` → Footprints
- `/plan` → Plan (unchanged)
- `/recipes` → Recipes (unchanged)
- `/legacy/explore` → Explore (legacy, not linked)

### Behavior

#### Demo Mode (Not Logged In)
- Loads demo footprints from `demoFootprints.ts`
- Shows banner: "You're exploring demo footprints. Sign in to save your own camping memories."
- Header: "Camping Footprints (Demo)"
- Actions enabled: Map browsing, marker selection, view details
- Actions disabled: Add, Edit, Delete
- Sign-in CTAs: Banner button, header button, footprint card buttons

#### Authenticated Mode (Logged In)
- Loads real footprints from API (`GET /footprints`)
- No demo banner
- Header: "My Camping Footprints"
- Actions enabled: Full CRUD (Add, Edit, Delete)
- Standard authenticated experience

### Migration
- Explore functionality merged into Footprints as demo mode
- No features deleted, only reorganized
- Old Explore page preserved at `/legacy/explore` for backward compatibility

## Fix: TypeScript Build Error (NodeJS Namespace)

### Issue
- Docker build failing with: `error TS2503: Cannot find namespace 'NodeJS'`
- Occurred in `FootprintForm.tsx` at line 50 when using `NodeJS.Timeout` type

### Fix
- Changed `NodeJS.Timeout` to `ReturnType<typeof setTimeout>` 
- Browser-compatible type that works in both Node.js and browser environments
- No functional changes, only type definition update

### Files Modified
- `frontend/src/components/FootprintForm.tsx` - Fixed timeout ref type

## Stage D: Free Campsite Search (Nominatim) + Map-First UX

### Files Created
- `api/src/routes/geocode.ts` - Geocoding proxy route using OpenStreetMap Nominatim

### Files Modified
- `api/src/index.ts` - Added `/geocode` route (public, no auth required)
- `frontend/src/api/client.ts` - Added `geocode()` function and `GeocodeResult` interface
- `frontend/src/components/FootprintForm.tsx` - Complete rewrite with search-first UX

### Commands
- `npm run dev` - Start API (unchanged, no new env vars required)
- `npm run dev` - Start frontend (unchanged)

### Environment Variables Required
- None (Nominatim is free, no API key needed)

### API Endpoints

#### GET /geocode?q=<search text>
**Query Parameters:**
- `q` (required): Search query string (e.g., "Royal National Park")

**Response (200):**
```json
[
  {
    "name": "Euroka Campground, Blue Mountains, NSW, Australia",
    "lat": -33.7167,
    "lon": 150.5833
  }
]
```

**Error Responses:**
- `400`: Invalid query parameter (missing `q`)
- `502`: Geocoding service unavailable (Nominatim error)

**Headers:**
- User-Agent: `Campmate/0.1 (contact: dev@campmate.app)` (required by Nominatim)

### Features Implemented
- **Geocoding Proxy**:
  - Proxies requests to Nominatim OpenStreetMap API
  - Limits results to 5
  - Returns simplified format (name, lat, lon)
  - Proper error handling and logging

- **Frontend Search UX**:
  - Search input with placeholder: "Search campsite or place (e.g. Royal National Park)"
  - Debounced search (300ms delay)
  - Dropdown suggestions with location name and coordinates
  - Loading indicator during search
  - Auto-fills lat/lon when location selected

- **Map Preview**:
  - Interactive map (250px height) in form
  - Auto-centers and shows marker when location selected
  - Click map to fine-tune location
  - Helper text: "Tip: Click the map to fine-tune location"
  - Map flies to location on selection (zoom 13)

- **Form Improvements**:
  - Removed manual lat/lon input fields
  - Coordinates stored internally (never shown to user)
  - Validation ensures location is selected before submission
  - Error message: "Location is required. Please search for a campsite or place."

### Technical Details
- **Geocoding Service**: OpenStreetMap Nominatim (free, no API key)
- **Rate Limiting**: Nominatim usage policy (1 request per second recommended)
- **Backend Logging**: All geocode requests logged with query and result count
- **Frontend Debouncing**: 300ms delay prevents excessive API calls
- **Error Handling**: Graceful fallback with user-friendly messages

### UX Flow
1. User types place name in search input
2. After 300ms, dropdown shows up to 5 suggestions
3. User selects a location → map auto-centers and shows marker
4. User can click map to fine-tune location
5. Coordinates stored internally, form validates location is set
6. Submit creates/updates footprint with selected location

### Tradeoffs
- **Free Service**: Using Nominatim instead of paid services (Mapbox, Google Maps)
- **No Autocomplete Billing**: Simple search with dropdown, no autocomplete API costs
- **MVP-Friendly**: Easy to replace with Mapbox later if needed
- **Human-First UX**: Users never see coordinates, only place names

## Stage 4 Changes

### Files Created
- `api/src/models/Trip.ts` - Trip Mongoose model with location, dates, group size, experience, activities
- `api/src/routes/trips.ts` - Trip CRUD routes with Zod validation and JWT auth
- `api/src/routes/weather.ts` - Weather route integrating OpenWeather One Call API 3.0

### Files Modified
- `api/src/config/env.ts` - Added OPENWEATHER_API_KEY (required, fail-fast)
- `api/src/index.ts` - Mounted `/trips` and `/weather` routes with authMiddleware
- `docs/openapi/api.yaml` - Added GET /trips, DELETE /trips/{id}, securitySchemes (bearerAuth)
- `frontend/src/api/client.ts` - Added createTrip, listTrips, deleteTrip, getWeather functions
- `frontend/src/pages/Dashboard.tsx` - Complete trip management UI with form, table, weather preview

### Commands
- `npm run dev` - Start API (requires MONGO_URI, JWT_SECRET, OPENWEATHER_API_KEY)
- `npm run dev` - Start frontend (unchanged)

### Environment Variables Required
- `OPENWEATHER_API_KEY` - OpenWeather API key (required, fail-fast if missing)

### API Endpoints

#### POST /trips
**Request:**
```json
{
  "location": { "lat": 37.8651, "lon": -119.5383, "name": "Yosemite" },
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-05T00:00:00Z",
  "groupSize": 4,
  "experience": "intermediate",
  "activities": ["hiking", "camping"]
}
```

**Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

#### GET /trips
**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "location": { "lat": 37.8651, "lon": -119.5383, "name": "Yosemite" },
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-06-05T00:00:00Z",
    "groupSize": 4,
    "experience": "intermediate",
    "activities": ["hiking", "camping"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### GET /trips/:id
**Response (200):** Single trip object (same structure as above)

#### DELETE /trips/:id
**Response (204):** No content

#### GET /weather?lat=37.8651&lon=-119.5383&from=2024-06-01T00:00:00Z&to=2024-06-05T00:00:00Z
**Response (200):**
```json
{
  "daily": [...],
  "alerts": [...]
}
```

### Features Implemented
- **Trip CRUD:**
  - Create: POST /trips with full trip data
  - Read: GET /trips (list all for user), GET /trips/:id (single trip)
  - Delete: DELETE /trips/:id (with ownership check)
  - All routes protected with JWT authentication
  - Zod validation for all inputs

- **Weather Integration:**
  - GET /weather with lat, lon, from, to query parameters
  - Calls OpenWeather One Call API 3.0
  - Returns normalized JSON with daily forecast and alerts
  - Error handling: 400 (bad params), 502 (API error)

- **Frontend UI:**
  - Create trip form with all fields
  - Trips table showing location, dates, group size, experience
  - Weather button to fetch and preview weather data
  - Delete button with confirmation
  - Responsive Tailwind CSS styling

## Stage 3 Changes

### Files Created
- `frontend/.env.local` - Environment variable: `VITE_API_BASE=http://localhost:8080`
- `frontend/src/api/client.ts` - API client with `login()`, `register()`, and `me()` functions
- `frontend/src/auth/AuthContext.tsx` - React context provider for authentication state
- `frontend/src/auth/ProtectedRoute.tsx` - Component to protect routes requiring authentication
- `frontend/src/pages/Login.tsx` - Login page with email/password form
- `frontend/src/pages/Register.tsx` - Registration page with email/password form
- `frontend/src/pages/Dashboard.tsx` - Dashboard showing user email and logout button

### Files Modified
- `frontend/package.json` - Added `react-router-dom@^6.21.1` dependency
- `frontend/src/App.tsx` - Replaced static content with React Router setup and AuthProvider
- `api/src/index.ts` - Updated CORS to allow `http://localhost:5173` origin

### Commands
- `npm run dev` - Start frontend dev server (Vite on port 5173)
- `npm run build` - Build frontend for production (unchanged)
- `npm run typecheck` - Type check frontend (unchanged)

### Environment Variables
- `VITE_API_BASE` - API base URL (default: http://localhost:8080)

### Features Implemented
- **Authentication Flow:**
  1. User registers → token stored in localStorage
  2. User logs in → token stored in localStorage
  3. On app mount → if token exists, fetch user info
  4. Protected routes → redirect to /login if no token
  5. Logout → clear token and redirect to /login

- **UI Components:**
  - Centered card layout with Tailwind CSS
  - Form inputs with focus rings
  - Loading states during API calls
  - Inline error messages for API failures
  - Navigation links between login/register

### Testing
1. Start API: `cd api && npm run dev` (requires MongoDB)
2. Start Frontend: `cd frontend && npm run dev`
3. Navigate to http://localhost:5173
4. Register a new user or login
5. Access dashboard (protected route)
6. Test logout functionality

## Stage 2 Changes

### Files Created
- `api/src/config/env.ts` - Environment variable configuration with validation
- `api/src/config/db.ts` - MongoDB connection with retry/backoff
- `api/src/models/User.ts` - User Mongoose schema and model
- `api/src/routes/auth.ts` - Registration and login routes with Zod validation
- `api/src/middleware/auth.ts` - JWT authentication middleware
- `api/src/routes/me.ts` - Protected route to get current user
- `docs/ADRs/0003-auth-jwt-vs-session.md` - Authentication decision record
- `.env.example` - Environment variable template

### Files Modified
- `api/package.json` - Added dependencies (mongoose, zod, bcryptjs, jsonwebtoken, cors, helmet, morgan, dotenv) and devDependencies (@types/bcryptjs, @types/jsonwebtoken, @types/morgan)
- `api/src/index.ts` - Integrated MongoDB connection, security middleware, and auth routes
- `docker/docker-compose.yml` - Added MongoDB service (mongo:6) with named volume
- `docs/API.md` - Added request/response examples for auth endpoints
- `docs/CHANGELOG.md` - Added Stage 2 entry

### Commands
- `npm run dev` - Start API with MongoDB connection (requires MONGO_URI and JWT_SECRET)
- `npm run build` - Build TypeScript (unchanged)
- `npm run start` - Start production server (unchanged)

### Environment Variables Required
- `MONGO_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Secret for JWT signing (required)
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (default: development)

### Docker Compose
- MongoDB service added: `mongo:6` on port 27017
- Named volume: `mongo_data` for data persistence
- API service updated with MongoDB connection string and JWT secret

### Manual Testing
See curl examples in `api/src/routes/auth.ts` comments for testing register, login, and /me endpoints.

## Stage 1 Changes

### Files Created
- `docs/API.md` - API endpoint documentation table
- `docs/openapi/api.yaml` - OpenAPI 3.0.3 specification for API service
- `docs/openapi/rag.yaml` - OpenAPI 3.0.3 specification for RAG service
- `frontend/src/types/example-usage.ts` - Type compilation verification

### Files Modified
- `frontend/package.json` - Added `openapi-typescript` devDependency and type generation scripts
- `.github/workflows/ci.yml` - Added type generation and validation steps

### Commands Added (Frontend)
- `npm run gen:types:api` - Generate TypeScript types from API OpenAPI spec
- `npm run gen:types:rag` - Generate TypeScript types from RAG OpenAPI spec
- `npm run gen:types` - Generate all types

### CI Changes
- Frontend job now includes:
  1. Install dependencies
  2. Generate types (`npm run gen:types`)
  3. Type check (`tsc --noEmit`)
  4. Build

## Stage 0 Files

## Generated Files

### Frontend (`frontend/`)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tsconfig.node.json` - Node-specific TypeScript config
- `vite.config.ts` - Vite configuration
- `index.html` - HTML entry point
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `src/main.tsx` - React entry point
- `src/App.tsx` - Main App component
- `src/index.css` - Global styles with Tailwind

### API (`api/`)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Express server entry point
- `src/routes/health.ts` - Health check route
- `.eslintrc.cjs` - ESLint configuration

### RAG (`rag/`)
- `pyproject.toml` - Python project configuration
- `requirements.txt` - Python dependencies
- `app.py` - FastAPI application
- `__init__.py` - Python package marker

### Docker (`docker/`)
- `frontend/Dockerfile` - Frontend container definition
- `api/Dockerfile` - API container definition
- `rag/Dockerfile` - RAG container definition
- `docker-compose.yml` - Multi-service orchestration

### Documentation (`docs/`)
- `CHANGELOG.md` - Version history
- `BUILD_LOG.md` - This file
- `RUNBOOK.md` - Operations guide
- `ADRs/0001-monorepo.md` - Architecture decision record

### CI (`.github/workflows/`)
- `ci.yml` - Continuous integration workflow

## Commands Generated

### Frontend
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting

### API
- `npm run dev` - Start development server with hot reload (port 8080)
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting
- `npm test` - Placeholder test command

### RAG
- `uvicorn app:app --host 0.0.0.0 --port 8000` - Start FastAPI server

