# CampMate Runbook

## What CampMate Does

CampMate is a camping trip tracking application that allows users to record and visualize their camping experiences. The MVP focuses on **Footprints** - user-owned records of past camping trips with location, dates, notes, ratings, and tags. 

**Main User Flow:**
1. **Explore** (`/`) - Public demo mode showing sample footprints (no login required)
2. **Footprints** (`/footprints`) - Authenticated users can view, create, edit, and delete their own footprints
3. **Plan** (`/plan`) - Trip planning with weather and checklist (requires login)
4. **Recipes** (`/recipes`) - Camping recipes (placeholder, coming soon)

Users can explore demo footprints without logging in, or create their own account to save and manage their personal camping history.

## Architecture Overview

CampMate is a monorepo with three main services:

- **Frontend** (React + TypeScript + Vite): User interface for viewing and managing footprints
- **API** (Express + TypeScript + MongoDB): RESTful API for authentication and footprint CRUD operations
- **RAG** (FastAPI + Python): AI/retrieval service (not used in MVP, reserved for future features)

### Data Flow

1. **Guest Mode**: Frontend displays demo footprints (read-only, no API calls)
2. **Authenticated Mode**: Frontend fetches real user footprints from API
3. **CRUD Operations**: Authenticated users can create, edit, and delete footprints via API
4. **Database**: MongoDB stores user accounts and footprint data

## Running Locally with Docker Compose (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- MongoDB connection string (or use local MongoDB)

### Quick Start

```bash
# From project root
cd docker
docker-compose up --build
```

This starts:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **MongoDB**: Running in container (port 27017)

### Environment Variables

Create a `.env` file in the `docker` directory or set environment variables:

```bash
# API
MONGODB_URI=mongodb://mongo:27017/campmate
JWT_SECRET=your-secret-key-here
PORT=8080
NODE_ENV=development

# Frontend (optional, defaults work)
VITE_API_BASE=http://localhost:8080
```

## Running Without Docker

### Prerequisites
- Node.js 20+
- MongoDB running locally or accessible MongoDB instance
- Python 3.11+ (only if running RAG service)

### Step 1: Start MongoDB

```bash
# Using Docker (easiest)
docker run -d -p 27017:27017 --name campmate-mongo mongo:6

# Or use local MongoDB installation
mongod
```

### Step 2: Start API

```bash
cd api
npm install

# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/campmate
# JWT_SECRET=your-secret-key-here
# PORT=8080
# NODE_ENV=development

npm run dev
```

API will be available at http://localhost:8080

### Step 3: Start Frontend

```bash
cd frontend
npm install

# Create .env.local file with (optional):
# VITE_API_BASE=http://localhost:8080

npm run dev
```

Frontend will be available at http://localhost:5173 (Vite default)

## Key Environment Variables

### API Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT token signing |
| `PORT` | No | 8080 | API server port |
| `NODE_ENV` | No | development | Environment (development/production) |

### Frontend Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE` | No | http://localhost:8080 | Base URL for API requests |

## How Guest Mode Works

1. **No Authentication**: User visits the app without logging in
2. **Demo Data**: Frontend displays 6 demo footprints from `frontend/src/data/demoFootprints.ts`
3. **Read-Only**: Guest users cannot create, edit, or delete footprints
4. **Sign-In Prompt**: Clicking "Add Footprint" redirects to login page
5. **No API Calls**: `/footprints` endpoint is never called in guest mode

## How Authenticated Mode Works

1. **User Registration/Login**: User creates account or logs in
2. **JWT Token**: Token stored in localStorage (`tw_token`)
3. **API Calls**: Frontend fetches real footprints from `GET /footprints`
4. **CRUD Operations**: User can create, edit, and delete their own footprints
5. **Data Isolation**: Backend ensures users can only access their own footprints

## Common Troubleshooting

### Port Conflicts

**Problem**: Port 8080, 3000, or 5173 already in use

**Solution**:
```bash
# Find process using port
# Windows:
netstat -ano | findstr :8080
# Linux/Mac:
lsof -i :8080

# Kill process or change PORT in .env
```

### MongoDB Connection Issues

**Problem**: API fails to connect to MongoDB

**Solution**:
1. Verify MongoDB is running: `docker ps` or `mongod --version`
2. Check `MONGODB_URI` in API `.env` file
3. For Docker Compose, ensure MongoDB service is up: `docker-compose ps`
4. Check MongoDB logs: `docker logs campmate-mongo` or `docker-compose logs mongo`

### CORS Errors

**Problem**: Frontend can't call API (CORS error in browser console)

**Solution**:
1. Verify `VITE_API_BASE` matches actual API URL
2. Check API CORS configuration in `api/src/index.ts`
3. Ensure frontend origin is in allowed origins list

### Build Errors

**Problem**: TypeScript compilation fails

**Solution**:
```bash
# Clean and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build

# Or for API:
cd api
rm -rf node_modules dist
npm install
npm run build
```

### Authentication Not Working

**Problem**: Can't login or tokens not persisting

**Solution**:
1. Check browser localStorage: Should see `tw_token` key
2. Verify JWT_SECRET is set in API `.env`
3. Check API logs for authentication errors
4. Clear browser cache and localStorage, try again

### Footprints Not Loading

**Problem**: Authenticated user sees no footprints

**Solution**:
1. Verify API is running and accessible
2. Check browser Network tab for API calls
3. Verify JWT token is being sent in Authorization header
4. Check API logs for errors
5. Try creating a new footprint to test API connectivity

## Testing the MVP

### Explore Page (Guest Mode)

1. Open app in incognito/private window (or log out)
2. Navigate to home page (`/`) - should show Explore page
3. **Verify**: See demo footprints in list and on map
4. **Verify**: See "Demo mode" banner at top
5. **Verify**: Can click footprints to view details (read-only)
6. **Verify**: Map markers are clickable and sync with list
7. **Verify**: If logged in, Explore page suggests visiting Footprints page

### Plan Page

1. Navigate to `/plan` while logged out
2. **Verify**: See login prompt with Login/Register buttons
3. Log in with valid credentials
4. Navigate to `/plan`
5. **Verify**: See trip planning interface with campsite picker, trip form, weather, and checklist

### Recipes Page

1. Navigate to `/recipes` (logged in or out)
2. **Verify**: See "Camping Recipes" page with "Coming Soon" message
3. **Verify**: Page is accessible without login (placeholder)

### Footprints Page (Authenticated Mode)

1. Register a new account or log in
2. Navigate to `/footprints` page
3. **Verify**: See "My Camping Footprints" section
4. **Verify**: See "Add Footprint" button
5. **Create**: Click "Add Footprint" → fill form → submit
6. **Verify**: New footprint appears in list and on map
7. **Edit**: Click "Edit" on a footprint → modify → save
8. **Verify**: Changes reflected immediately
9. **Delete**: Click "Delete" → confirm → verify footprint removed

### Footprints Page (Not Authenticated)

1. Log out or open in incognito
2. Navigate to `/footprints`
3. **Verify**: See login prompt with Login/Register buttons
4. **Verify**: Cannot access footprint management without login

### API Testing

```bash
# Health check
curl http://localhost:8080/health

# Register user
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# List footprints (use token from login)
curl http://localhost:8080/footprints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Roadmap: What Comes Next

The MVP is complete for the Footprints feature. Future enhancements may include:

- **RAG/AI Features**: Intelligent trip planning assistance, recommendations
- **Recipe Generator**: Camping recipe suggestions based on trip details
- **Map Click to Set Location**: Click map to set footprint coordinates
- **Bulk Operations**: Import/export footprints, batch editing
- **Social Features**: Share footprints, discover popular locations
- **Advanced Filtering**: Filter footprints by date range, rating, tags
- **Statistics**: Trip statistics, favorite locations, camping calendar

## Data Model Summary

### Footprint

```typescript
{
  _id: string;                    // MongoDB ObjectId
  userId: string;                 // ObjectId reference to User
  title: string;                  // Required, trimmed
  location: {
    lat: number;                  // Required, -90 to 90
    lon: number;                  // Required, -180 to 180
  };
  startDate: string;              // Required, ISO 8601
  endDate: string;                // Required, ISO 8601, >= startDate
  notes?: string;                 // Optional
  rating?: number;                // Optional, 1-5
  tags?: string[];                // Optional
  createdAt?: string;             // Auto-generated
  updatedAt?: string;             // Auto-generated
}
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /me` - Get current user info (requires auth)

### Footprints (all require authentication)
- `GET /footprints` - List user's footprints
- `POST /footprints` - Create new footprint
- `GET /footprints/:id` - Get single footprint
- `PATCH /footprints/:id` - Update footprint
- `DELETE /footprints/:id` - Delete footprint

### Public
- `GET /public/campsites` - List public campsites (no auth required)
- `GET /public/campsites/:id` - Get campsite details (no auth required)
- `GET /health` - Health check

## Support

For issues or questions:
1. Check this runbook first
2. Review `docs/FOOTPRINTS.md` for feature documentation
3. Check `docs/CHANGELOG.md` for recent changes
4. Review API logs and browser console for errors