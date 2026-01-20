# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - Stage 2A: AWS Networking Infrastructure (Terraform)

### Added
- **Terraform Infrastructure as Code**:
  - Created reusable network module (`infra/modules/network`)
  - VPC with CIDR 10.10.0.0/16 in ap-southeast-2 region
  - 2 public subnets across 2 availability zones
  - 2 private subnets across 2 availability zones
  - Internet Gateway for public subnet internet access
  - Public route table with route to Internet Gateway
  - Route table associations for public subnets

- **Dev Environment Configuration** (`infra/envs/dev`):
  - Main Terraform configuration wiring network module
  - Variables for region (ap-southeast-2), project (campmate), env (dev)
  - Outputs for VPC ID, subnet IDs, route table ID, IGW ID
  - S3 backend configuration for state management

### Infrastructure Resources
- **VPC**: `campmate-dev-vpc` (10.10.0.0/16) with DNS support
- **Internet Gateway**: `campmate-dev-igw` attached to VPC
- **Public Subnets**: 2 subnets (10.10.0.0/24, 10.10.1.0/24) with auto-assign public IP
- **Private Subnets**: 2 subnets (10.10.2.0/24, 10.10.3.0/24) - isolated (no NAT Gateway yet)
- **Public Route Table**: Routes 0.0.0.0/0 to Internet Gateway

### Tagging
All resources tagged with:
- `Project = "campmate"`
- `Env = "dev"`
- `Name = "campmate-dev-<resource-type>"`

### Files Created
- `infra/modules/network/main.tf` - Network module resources
- `infra/modules/network/variables.tf` - Module inputs
- `infra/modules/network/outputs.tf` - Module outputs
- `infra/envs/dev/main.tf` - Dev environment configuration
- `infra/envs/dev/variables.tf` - Environment variables
- `infra/envs/dev/outputs.tf` - Environment outputs

### Files Modified
- `docs/BUILD_LOG.md` - Added Stage 2A networking infrastructure documentation
- `docs/CHANGELOG.md` - Added version 0.1.0 entry

### Commands
- `terraform init` - Initialize Terraform backend and providers
- `terraform fmt -recursive` - Format all Terraform files
- `terraform validate` - Validate Terraform configuration
- `terraform plan` - Preview infrastructure changes
- `terraform apply` - Create infrastructure resources

### Verification
After `terraform apply`, verify in AWS Console:
- VPC exists with correct CIDR
- 2 public subnets in different AZs
- 2 private subnets in different AZs
- Internet Gateway attached to VPC
- Public route table configured correctly

### Notes
- Private subnets are isolated (no NAT Gateway yet - will be added in Stage 2B)
- Module structure allows reuse for staging/prod environments
- Availability zones selected dynamically using `data.aws_availability_zones`
- Follows AWS best practices for VPC design and resource tagging

## [1.0.10] - Improvement: Health Endpoint Robustness

### Improved
- **Health Endpoint Error Handling** (`api/src/routes/health.ts`):
  - Wrapped `package.json` read in try-catch block
  - If reading fails, version defaults to `"unknown"` instead of crashing
  - Endpoint remains functional even if `package.json` is missing or unreadable
  - Added warning log when version cannot be read (for debugging)

### Added
- **Health Response Enhancement**:
  - Added `timestamp` field to health check response (ISO 8601 format)
  - Provides request time for monitoring and debugging purposes

### Changed
- **Health Endpoint Response**:
  - Response now includes: `status`, `service`, `version`, `timestamp`
  - Version field gracefully handles read failures (returns `"unknown"`)

### Files Modified
- `api/src/routes/health.ts` - Added error handling and timestamp field
- `docs/API.md` - Added detailed health endpoint documentation
- `docs/CHANGELOG.md` - Documented improvements

### Important Notes
- **Backward Compatibility**: Health endpoint still returns 200 OK even if version cannot be read
- **Liveness Check**: Endpoint remains a simple liveness check (no database or external API dependencies)
- **Production Ready**: Suitable for AWS Load Balancer health checks with improved error resilience

## [1.0.9] - Security: Production-Safe CORS Configuration

### Security
- **CORS Refactoring**: Implemented environment-based CORS configuration for production safety
  - Development: Allows localhost origins + configured origins
  - Production: Only allows configured origins (no localhost)
  - Production fails fast if no allowed origins configured

### Changed
- **CORS Configuration** (`api/src/index.ts`):
  - Introduced `NODE_ENV`-based behavior
  - Development mode: Allows localhost origins (`http://localhost:5173`, `http://localhost:3000`, `http://localhost:3001`) plus `FRONTEND_URL` or `ALLOWED_ORIGINS`
  - Production mode: Only allows origins from `FRONTEND_URL` or `ALLOWED_ORIGINS` (localhost explicitly disallowed)
  - Added startup logging of allowed origins for debugging
  - Production fails fast with clear error if no allowed origins configured

- **Environment Variables**:
  - Added `ALLOWED_ORIGINS` support (comma-separated list for multiple origins)
  - `FRONTEND_URL` now required in production (or `ALLOWED_ORIGINS`)
  - Updated documentation in `docs/env.md` with new CORS variables and behavior

### Added
- **Multiple Origins Support**: 
  - `ALLOWED_ORIGINS` environment variable for comma-separated list of origins
  - `FRONTEND_URL` continues to work for single origin
  - Both can be used together (origins are merged and deduplicated)

### Files Modified
- `api/src/index.ts` - Refactored CORS configuration with environment-based logic
- `docs/env.md` - Documented `ALLOWED_ORIGINS` and updated CORS behavior
- `docs/API.md` - Added CORS configuration section

### Important Notes
- **Production Deployment**: Must set either `FRONTEND_URL` or `ALLOWED_ORIGINS` in production
- **Security**: Localhost origins are automatically disallowed in production
- **Backward Compatibility**: Development mode behavior unchanged (localhost still allowed)
- **No Wildcards**: Wildcard origins (`*`) are not supported for security

## [1.0.8] - Documentation: Sanitize Test Data

### Security
- **Test Data Sanitization**: Replaced sensitive test data in documentation with placeholders
  - Test credentials: Replaced real email/password with `user@example.com / ********`
  - MongoDB ObjectIds: Replaced real IDs with fake example IDs (`64f0abc123def45678901234`, etc.)

### Changed
- **Documentation**: Updated `docs/SMOKE_TEST_RESULTS.md` to remove sensitive test data
  - Added disclaimer note at the top: "All credentials and IDs are redacted examples"
  - Replaced all real MongoDB ObjectIds with fake example IDs
  - Replaced real test credentials with generic placeholders
  - Test structure and meaning preserved for documentation purposes

### Files Modified
- `docs/SMOKE_TEST_RESULTS.md` - Sanitized test credentials and MongoDB ObjectIds

### Important Notes
- **Test Documentation**: All sensitive data has been redacted while maintaining test structure
- **Example IDs**: All MongoDB ObjectIds are now clearly fake examples (24-character hex strings)
- **Credentials**: Test credentials are now generic placeholders that cannot be used for authentication

## [1.0.7] - Security: Sanitize Exposed Secrets

### Security
- **Secret Sanitization**: Replaced all exposed secrets with placeholder values
  - OpenWeather API key: Replaced real key with `__REPLACE_IN_ENV__` placeholder
  - JWT secret: Replaced weak default `dev_change_me` with `__REPLACE_IN_ENV__` placeholder
  - MongoDB admin passwords: Replaced weak defaults with `__REPLACE_IN_ENV__` placeholders

### Changed
- **Docker Compose**: All secret values now use `__REPLACE_IN_ENV__` placeholders
  - Users must provide actual values via `.env` file or environment variables
  - Docker Compose still works locally with `.env` file overrides
- **Documentation**: Updated `docs/env.md` and `docs/SMOKE_TEST_RESULTS.md` with placeholders
- **Audit**: Updated `docs/SECRET_AUDIT.md` with remediation status

### Files Modified
- `docker/docker-compose.yml` - Replaced hardcoded secrets with placeholders
- `docs/env.md` - Updated examples to use placeholders
- `docs/SMOKE_TEST_RESULTS.md` - Sanitized API key in test results
- `docs/SECRET_AUDIT.md` - Added remediation status section

### Important Notes
- **Production Deployment**: All secrets must be provided via environment variables or `.env` file
- **Local Development**: Create a `.env` file in `docker/` directory with actual values
- **API Key Rotation**: If the exposed OpenWeather API key was real, it should be rotated immediately

## [1.0.6] - Fix: Docker Production Configuration

### Fixed
- **Frontend API Base URL**: Fixed Docker build to properly set `VITE_API_BASE` at build time
  - Added build argument to frontend Dockerfile
  - Updated docker-compose.yml to pass build args
  - Vite environment variables are embedded at build time, not runtime

- **CORS Configuration**: Updated API to allow requests from Docker frontend
  - Added support for `FRONTEND_URL` environment variable
  - Maintained localhost origins for local development
  - Removed Docker service name from CORS (browsers use localhost via port mapping)

### Files Modified
- `docker/frontend/Dockerfile` - Added `ARG` and `ENV` for `VITE_API_BASE` build-time variable
- `docker/docker-compose.yml` - Added build args for frontend service
- `api/src/index.ts` - Updated CORS allowedOrigins with environment variable support

### Technical Details
- **Vite Environment Variables**: Must be set at build time (not runtime) using `ARG` and `ENV` in Dockerfile
- **Docker Networking**: Browsers access services via localhost port mapping (not Docker service names)
  - Frontend: `http://localhost:3000` (browser → nginx container)
  - API: `http://localhost:8080` (browser → API container)
- **CORS**: API now accepts requests from `http://localhost:3000` and configurable via `FRONTEND_URL` env var

### Production Readiness
- ✅ Frontend can reach API in Docker
- ✅ CORS allows browser requests from frontend
- ✅ All environment variables properly configured
- ✅ Build-time vs runtime variables correctly handled

## [1.0.5] - Stage E: Merge Explore + Footprints into Unified Experience

### Changed
- **Unified Footprints Experience**:
  - Merged "Explore" (demo browsing) and "Footprints" (user data) into single unified page
  - Footprints page now handles both demo mode (not logged in) and authenticated mode (logged in)
  - Default route (`/`) now points to Footprints page
  - `/footprints` route also points to Footprints page

### Removed
- **Navigation**: Removed standalone "Explore" tab from navbar
  - Explore functionality is now available as demo mode inside Footprints
  - Explore page moved to `/legacy/explore` (not linked in navigation)

### Added
- **Demo Mode in Footprints**:
  - When not logged in: Shows demo footprints with banner
  - Banner: "You're exploring demo footprints. Sign in to save your own camping memories."
  - CRUD actions disabled for demo users (Edit/Delete buttons hidden)
  - "Sign in to Save" button in header for demo users
  - "Sign in to manage footprints" button on each footprint card in demo mode
  - Map browsing, search, and marker selection enabled for demo users

- **Authenticated Mode in Footprints**:
  - When logged in: Shows real user footprints from database
  - Full CRUD operations enabled (Add, Edit, Delete)
  - No demo banner shown
  - "My Camping Footprints" header title

### Files Modified
- `frontend/src/pages/Footprints.tsx` - Unified demo and authenticated modes
- `frontend/src/App.tsx` - Made Footprints default route, moved Explore to legacy
- `frontend/src/components/NavBar.tsx` - Removed Explore link, kept Footprints as main tab

### Migration Note
- **Explore functionality is now available as demo mode inside Footprints**
- Users visiting `/` or `/footprints` will see:
  - Demo footprints if not logged in
  - Their own footprints if logged in
- Old Explore page still accessible at `/legacy/explore` but not linked in navigation

### User Experience
- **Not Logged In**:
  - See demo footprints in list and on map
  - Can browse, click markers, view details
  - Cannot create, edit, or delete
  - Banner prompts sign-in
  - Multiple sign-in CTAs throughout UI

- **Logged In**:
  - See own footprints from database
  - Full CRUD operations available
  - No demo banner
  - Standard "My Camping Footprints" experience

### Preserved Features
- **Planning** (`/plan`) - Unchanged, still accessible
- **Recipes** (`/recipes`) - Unchanged, still accessible
- All existing functionality preserved, only navigation reorganized

## [1.0.4] - Fix: TypeScript Build Error (NodeJS Namespace)

### Fixed
- **TypeScript Build Error**: Fixed `Cannot find namespace 'NodeJS'` error in Docker build
  - Changed `NodeJS.Timeout` to `ReturnType<typeof setTimeout>` in `FootprintForm.tsx`
  - Browser-compatible type that works in both Node.js and browser environments

### Files Modified
- `frontend/src/components/FootprintForm.tsx` - Fixed timeout ref type for browser compatibility

## [1.0.3] - Stage D: Free Campsite Search (Nominatim) + Map-First UX

### Added
- **Geocoding API Endpoint**:
  - `GET /geocode?q=<search text>` - Proxies to OpenStreetMap Nominatim
  - Returns up to 5 location results with name, lat, lon
  - Public endpoint (no authentication required)
  - Proper User-Agent header: `Campmate/0.1 (contact: dev@campmate.app)`
  - Error handling: 400 for missing query, 502 for upstream failures

### Changed
- **FootprintForm UX Improvement**:
  - ❌ Removed manual latitude/longitude input fields
  - ✅ Added campsite/place search input with dropdown suggestions
  - ✅ Added interactive map preview (250px height) with click-to-fine-tune
  - ✅ Auto-centers map and shows marker when location is selected
  - ✅ Search results show location name and coordinates
  - ✅ Map click updates location coordinates
  - ✅ Debounced search (300ms) to reduce API calls
  - ✅ Loading indicator during geocoding requests

### Files Created
- `api/src/routes/geocode.ts` - Geocoding proxy route using Nominatim

### Files Modified
- `api/src/index.ts` - Added `/geocode` route (public, no auth)
- `frontend/src/api/client.ts` - Added `geocode()` function and `GeocodeResult` interface
- `frontend/src/components/FootprintForm.tsx` - Complete rewrite with search-first UX

### User Experience
- **Search-First Flow**:
  1. User types place name (e.g., "Royal National Park")
  2. Dropdown shows up to 5 suggestions with name and coordinates
  3. User selects a location → map auto-centers and shows marker
  4. User can click map to fine-tune location
  5. Coordinates stored internally (never shown as manual inputs)

- **Map Behavior**:
  - Search result → map flies to location (zoom 13)
  - Marker click updates selected footprint
  - Map click updates lat/lon for fine-tuning
  - Helper text: "Tip: Click the map to fine-tune location"

- **Demo Users**:
  - Can search and explore locations
  - Cannot save footprints (auth required)

- **Logged-in Users**:
  - Full search + map interaction
  - Can save footprints with selected location

### Technical Details
- **Geocoding Service**: OpenStreetMap Nominatim (free, no API key required)
- **Rate Limiting**: Nominatim has usage policy (1 request per second recommended)
- **Error Handling**: Graceful fallback with user-friendly error messages
- **Backend Logging**: All geocode requests logged with query and result count
- **Frontend Debouncing**: 300ms delay to prevent excessive API calls

### Tradeoffs
- **Free Service**: Using Nominatim instead of paid services (Mapbox, Google Maps)
- **No Autocomplete Billing**: Simple search with dropdown, no autocomplete API costs
- **MVP-Friendly**: Easy to replace with Mapbox later if needed
- **Human-First UX**: Users never see coordinates, only place names

### API Endpoints

#### GET /geocode
**Query Parameters:**
- `q` (required): Search query string

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
- `400`: Invalid query parameter
- `502`: Geocoding service unavailable

## [1.0.2] - Fix: Restored Plan and Recipe Navigation

### Fixed
- **Navigation Regression**: Restored Plan and Recipe pages to primary navigation
  - Plan page restored to `/plan` route (was accidentally moved to `/legacy/plan`)
  - Recipe page restored to `/recipes` route (was accidentally moved to `/legacy/recipes`)
  - Both pages now visible in navbar as primary tabs

### Changed
- **Navbar**: Now shows four primary tabs:
  - Explore (public, default route `/`)
  - Footprints (requires login, route `/footprints`)
  - Plan (requires login, route `/plan`)
  - Recipes (visible, route `/recipes`)

### Files Modified
- `frontend/src/App.tsx` - Restored Plan and Recipe to main routes (removed from legacy)
- `frontend/src/components/NavBar.tsx` - Added Plan and Recipe links back to navbar

### Legacy Routes
- Campsites directory (Search page) remains at `/legacy/search` (not in navbar)
- Only campsites directory was demoted to legacy, not Plan/Recipe

### Auth Gating
- **Plan**: Requires login (shows login prompt if not authenticated) ✅
- **Footprints**: Requires login (shows login prompt if not authenticated) ✅
- **Explore**: Public, no login required ✅
- **Recipes**: Visible to all (placeholder page, no auth required)

## [1.0.1] - Navigation Restructure: Explore & Footprints as Primary Flow

### Changed
- **Navigation Restructure**:
  - Default route (`/`) now shows **Explore** page (demo footprints, no login required)
  - **Footprints** page accessible at `/footprints` (requires login, full CRUD)
  - Removed campsites directory from primary navigation
  - Simplified navbar to show only "Explore" and "Footprints" links

### Added
- **New Pages**:
  - `Explore.tsx` - Public demo mode page showing sample footprints (read-only)
  - `Footprints.tsx` - Authenticated user's footprint management page (full CRUD)

### Files Created
- `frontend/src/pages/Explore.tsx` - Explore page for demo footprints
- `frontend/src/pages/Footprints.tsx` - Footprints page for authenticated users

### Files Modified
- `frontend/src/App.tsx` - Updated routing: `/` → Explore, `/footprints` → Footprints, moved legacy routes to `/legacy/*`
- `frontend/src/components/NavBar.tsx` - Updated navigation links to show "Explore" and "Footprints" only

### Legacy Routes
- Old routes moved to `/legacy/*` paths (not linked in navigation):
  - `/legacy/search` - Original Search page (campsites + footprints)
  - `/legacy/plan` - Plan Your Trip page
  - `/legacy/recipes` - Camp Recipes page
- Legacy code preserved but not accessible from normal navigation

### User Experience
- **Explore Page (`/`)**:
  - Shows demo footprints without requiring login
  - If user is logged in, suggests visiting Footprints page
  - Read-only experience with sign-in prompts
- **Footprints Page (`/footprints`)**:
  - Requires authentication (shows login prompt if not logged in)
  - Full CRUD operations for user's footprints
  - No campsites shown (focused experience)

### Technical Details
- No breaking changes to existing functionality
- Legacy routes still accessible if directly navigated to
- All existing code preserved for backward compatibility
- Clean separation between public (Explore) and authenticated (Footprints) experiences

## [1.0.0] - Final MVP: Complete Footprints CRUD Experience

### Added
- **Complete CRUD UI for Footprints**:
  - Create footprint form with validation (title, location, dates, notes, rating, tags)
  - Edit footprint functionality with pre-filled form
  - Delete footprint with confirmation dialog
  - "Add Footprint" button with guest mode protection (redirects to login)
  - Edit/Delete buttons on each footprint card (authenticated users only)
  - Success/error message feedback for all operations
  - Form validation: lat/lon ranges, date relationships, required fields

### Files Created
- `frontend/src/components/FootprintForm.tsx` - Reusable form component for create/edit operations

### Files Modified
- `frontend/src/api/client.ts` - Added `createFootprint()`, `updateFootprint()`, `deleteFootprint()` functions
- `frontend/src/pages/Search.tsx` - Integrated CRUD UI with form modal, buttons, and error handling

### Features
- **Authentication Boundaries**:
  - Only logged-in users can create/edit/delete footprints
  - Guest users see demo data (read-only)
  - Guest users redirected to login if they try to create/edit/delete
- **Form Validation**:
  - Frontend validation for all fields
  - Latitude: -90 to 90
  - Longitude: -180 to 180
  - End date must be >= start date
  - Rating: 1-5 (optional)
  - Real-time error display
- **User Experience**:
  - Modal form for create/edit (non-intrusive)
  - Pre-filled form when editing
  - Confirmation dialog for delete
  - Success messages after operations
  - Automatic list refresh after create/edit/delete
  - Selection preserved when possible

### Privacy & Security
- **Guest Mode Protection**: Guest users cannot modify demo data
- **API Security**: All CRUD operations require authentication
- **Data Isolation**: Users can only modify their own footprints (enforced by backend)

### Technical Details
- Form component handles both create and edit modes
- State management for form visibility, editing footprint, and submission status
- Error handling with user-friendly messages
- TypeScript types for all request/response objects
- No breaking changes to existing functionality

### What's NOT Included (Intentionally Postponed)
- **RAG/AI Features**: Postponed to future release
- **Recipe Generator**: Postponed to future release
- **Map Click to Set Location**: Nice-to-have feature, can be added later
- **Bulk Operations**: Not in MVP scope
- **Export/Import**: Not in MVP scope

### MVP Scope Summary
The MVP focuses on the core Footprints experience:
- ✅ User-owned camping footprint records
- ✅ Full CRUD operations for authenticated users
- ✅ Guest demo mode for exploration
- ✅ Map + list visualization
- ✅ Authentication and data privacy

## [0.0.11] - Stage C: Guest Demo Mode for Footprints

### Added
- **Guest Demo Mode**:
  - Created `demoFootprints.ts` with 6 realistic NSW/Sydney-area camping footprints
  - Demo footprints displayed when user is NOT authenticated (read-only)
  - Guest mode banner with "Demo mode" message and "Sign in" CTA button
  - Demo data never writes to database (privacy boundary enforced)
  - Full map + list UI functionality works in guest mode (markers, selection sync, fly-to)

### Files Created
- `frontend/src/data/demoFootprints.ts` - Demo footprint data (6 realistic NSW locations)

### Files Modified
- `frontend/src/pages/Search.tsx` - Added guest mode support with demo data and banner

### Features
- **Data Source Switching**: 
  - Authenticated users: Fetch real footprints from API (existing Stage B behavior)
  - Guest users: Display demo footprints (no API calls)
- **Guest Mode Banner**: 
  - Subtle blue banner at top of page
  - Clear "Demo mode" messaging
  - "Sign in" button linking to login route
  - Only visible when not authenticated
- **Empty States**:
  - Guest mode: Never shows empty state (demo footprints always populate)
  - Authenticated mode: Shows "No camping footprints yet" when user has no footprints

### Privacy & Security
- **Read-Only Demo Data**: Guest users never write to database
- **No API Calls in Guest Mode**: `/footprints` endpoint never called when not authenticated
- **Clear Separation**: Demo data clearly marked and separate from real user data

### Technical Details
- Demo footprints use same `Footprint` type as API data
- Data source decision: `if (token) -> API else -> demoFootprints`
- Demo footprints include realistic NSW locations: Royal National Park, Blue Mountains, Ku-ring-gai Chase, Wollondilly River, Bouddi National Park, Yengo National Park
- Map and list selection sync works identically for demo and real footprints

### Limitations
- No create/edit UI for footprints yet (planned for Stage D)
- Backend was NOT modified in this stage

## [0.0.10] - Stage B: Frontend Integration for User-Owned Footprints

### Added
- **Footprint Frontend Integration**:
  - Added `Footprint` TypeScript interface in API client
  - Added `listFootprints()` API client function for authenticated requests
  - Integrated footprint display in Search page when user is authenticated
  - Footprints appear as green markers on the map and cards in the list
  - Map and list selection stay synchronized for footprints
  - Empty state message when authenticated but no footprints exist: "No camping footprints yet. Add your first trip."
  - Loading states for footprint data fetching
  - Error handling for footprint API requests
  - Footprint detail modal showing title, dates, rating, notes, and tags

### Files Modified
- `frontend/src/api/client.ts` - Added `Footprint` interface and `listFootprints()` function
- `frontend/src/pages/Search.tsx` - Integrated footprint fetching and display with map/list sync

### Features
- **Authentication-Aware Display**: Footprints only fetched and displayed when user is authenticated
- **Map Integration**: Footprints appear as green markers on the map alongside campsites
- **List Integration**: Footprints appear in a dedicated section at the top of the list when authenticated
- **Synchronized Selection**: Clicking a footprint in the list or map selects it in both views
- **Empty State**: Friendly message when authenticated but no footprints exist
- **Loading States**: Separate loading indicators for campsites and footprints

### Limitations
- No guest demo data yet (planned for Stage C)
- No create/edit UI for footprints yet (planned for Stage D)
- Backend was NOT modified in this stage

### Technical Details
- Footprints are fetched automatically when user logs in
- Footprints are cleared when user logs out
- Map center calculation includes both campsites and footprints
- Footprint markers use green color (#10b981) to distinguish from campsite markers

## [0.0.9] - Stage A: Backend Support for User-Owned Camping Footprints

### Added
- **Footprint Data Model**:
  - Created Mongoose `Footprint` model with all required fields
  - Fields: userId (ObjectId, ref: User), title (string, required, trimmed), location (lat/lon numbers, required), startDate/endDate (Date, required), notes (string, optional), rating (number, optional, min 1, max 5), tags (array of strings, optional)
  - Timestamps enabled (createdAt, updatedAt)

- **Footprint API Routes**:
  - `POST /footprints` - Create new footprint (userId from auth context)
  - `GET /footprints` - List all user's footprints (sorted by startDate descending)
  - `GET /footprints/:id` - Get single footprint (user-scoped)
  - `PATCH /footprints/:id` - Update footprint (user-scoped, partial updates)
  - `DELETE /footprints/:id` - Delete footprint (user-scoped, returns 204)

- **Validation**:
  - Zod schemas for create and update operations
  - Validation rules: lat (-90 to 90), lon (-180 to 180), endDate >= startDate, rating (1-5)
  - Comprehensive error handling with appropriate HTTP status codes

### Files Created
- `api/src/models/Footprint.ts` - Footprint Mongoose model
- `api/src/routes/footprints.ts` - Footprint API routes with full CRUD operations

### Files Modified
- `api/src/index.ts` - Registered footprints router with auth middleware at `/footprints`

### Features
- **Authentication Required**: All routes require JWT authentication middleware
- **User Scoping**: All queries filter by `userId === req.user.userId` to ensure data isolation
- **Type Safety**: No `any` types, full TypeScript support
- **Error Handling**: 401 for unauthenticated, 404 for not found/not owned, 400 for validation errors
- **Security**: No data leakage - returns 404 for unauthorized access attempts

### Technical Details
- Footprint model follows same patterns as existing Trip model
- Routes use existing auth middleware and AuthRequest type
- Validation uses zod with custom refinements for date validation
- PATCH endpoint validates date relationships against existing data when updating

## [0.0.8] - Navigation Logo Support

### Added
- **Logo Support in Navigation Bar**:
  - Added `Logo` component with graceful fallback to text
  - Logo image loads from `src/assets/logo.png` if available
  - Falls back to "CampMate" text if logo image is missing or fails to load
  - Logo is clickable and navigates to home page (`/`)
  - Proper alt text for accessibility
  - Responsive sizing with Tailwind (`h-8 w-auto`)

### Files Created
- `frontend/src/components/Logo.tsx` - Reusable logo component with image/text fallback

### Files Modified
- `frontend/src/components/NavBar.tsx` - Integrated Logo component replacing text-only branding
- `frontend/src/vite-env.d.ts` - Added TypeScript declarations for image imports (`.png`, `.svg`, `.jpg`, `.jpeg`, `.gif`, `.webp`)

### Technical Details
- Logo component handles missing images gracefully with runtime error handling
- Uses Vite's `import.meta.url` for asset resolution
- TypeScript types properly configured for image imports
- Build process handles logo bundling automatically

## [0.0.7] - Map + List Split-View Search

### Added
- **Interactive Map Integration**: 
  - Integrated `react-leaflet` for interactive map visualization
  - Split-view layout: 40% list panel (left) + 60% map panel (right) on desktop
  - Mobile-responsive with toggle button to switch between list and full-screen map
  - Custom SVG marker icons color-coded by site type (Blue for Tent, Purple for Caravan, Gray for Both)
  - CartoDB Voyager tile layer for clean map styling
- **Map-List Interactivity**:
  - Clicking a campsite card in the list flies the map to that marker's location
  - Clicking a map marker selects the corresponding campsite card
  - Hover effects on list cards for better UX
  - Selected campsite highlighted in both list and map
- **Coordinate System**:
  - Added `latitude` and `longitude` convenience fields to Campsite type
  - Automatic injection of mock coordinates around Sydney for testing when coordinates not available in DB
- **UI Improvements**:
  - More compact campsite cards in list view
  - Better visual hierarchy and spacing
  - Sticky filters on desktop, mobile-friendly filter layout
  - Full-height layout using `calc(100vh - header_height)` to prevent window scrolling

### Files Modified
- `frontend/src/pages/Search.tsx` - Complete refactor with split-view map + list layout
- `frontend/src/api/client.ts` - Added latitude/longitude fields and mock coordinate injection
- `frontend/src/index.css` - Added Leaflet CSS imports
- `frontend/package.json` - Added `leaflet`, `react-leaflet@^4.2.1`, `@types/leaflet`, and `lucide-react` dependencies

### Technical Details
- Used react-leaflet v4.2.1 for React 18 compatibility
- Custom DivIcon markers using inline SVG to avoid image asset loading issues
- MapController component handles programmatic map navigation using `flyTo` animation
- Responsive design: mobile shows list by default with floating map toggle button

## [0.0.6] - UI Restructure + Public Campsite Explore

### Added
- **Top Navigation Bar**: Shared navigation component with app name, main sections (Search Trips, Plan Your Trip, Camp Recipes), and auth-aware user menu
- **Public Campsite Explore**: 
  - Campsite Mongoose model with location, facilities, site type, and booking information
  - Public API endpoints: `GET /public/campsites` (with search and type filters) and `GET /public/campsites/:id`
  - Automatic seeding of 5 Sydney-area campsites in non-production environments
- **Public Search Page** (`/`): 
  - Hero section with heading
  - Two-column layout with filters (search by name/park, site type) and campsite grid
  - Clickable campsite cards with detail modal showing facilities, description, and booking link
  - No authentication required
- **Plan Your Trip Page** (`/plan`):
  - Login check with friendly message and login/register buttons for unauthenticated users
  - Campsite picker dropdown
  - Trip creation form (dates, group size, experience, activities)
  - Trip summary, weather forecast, and packing checklist display
  - Reuses existing trip, weather, and checklist APIs
- **Camp Recipes Placeholder Page** (`/recipes`): Coming soon page with planned features description
- **Shared Layout Component**: Wraps all pages with consistent navigation bar

### Files Created
- `api/src/models/Campsite.ts` - Campsite Mongoose model
- `api/src/routes/publicCampsites.ts` - Public campsite API routes (no auth required)
- `api/src/scripts/seedCampsites.ts` - Campsite seeding script with 5 Sydney-area examples
- `frontend/src/components/NavBar.tsx` - Top navigation bar component
- `frontend/src/components/Layout.tsx` - Shared layout wrapper
- `frontend/src/pages/Search.tsx` - Public campsite search page
- `frontend/src/pages/Plan.tsx` - Trip planning page (replaces dashboard functionality)
- `frontend/src/pages/Recipes.tsx` - Camp recipes placeholder page

### Files Modified
- `api/src/index.ts` - Added public campsites route and campsite seeding on startup
- `frontend/src/App.tsx` - Updated routing structure with new pages
- `frontend/src/api/client.ts` - Added `getCampsites()` and `getCampsite()` functions
- `frontend/src/pages/Login.tsx` - Updated to use Layout and redirect to `/plan`
- `frontend/src/pages/Register.tsx` - Updated to use Layout and redirect to `/plan`

### Features
- **Public Campsite Search**: Browse and filter campsites without authentication
- **Integrated Trip Planning**: Select campsite, create trip, and view weather/checklist in one flow
- **Consistent Navigation**: All pages share the same top navigation bar
- **Responsive Design**: Mobile-friendly layout with collapsible navigation

### Technical Details
- Campsite seeding only runs in non-production environments
- Seeding checks for existing campsites to prevent duplicates
- Public campsite API supports case-insensitive text search and site type filtering
- All existing auth, trip, weather, and checklist functionality preserved

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

