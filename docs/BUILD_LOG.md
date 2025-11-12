# Build Log

This document lists all generated commands and files.

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

