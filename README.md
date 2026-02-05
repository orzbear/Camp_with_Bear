# CampMate

A comprehensive camping and outdoor trip planning application with weather integration, intelligent packing checklist generation, and footprint tracking. Built as a modern full-stack monorepo with React, Node.js, and deployed on AWS ECS Fargate.

## 🎯 Features

### Public Features (No Authentication Required)
- **Explore Campsites**: Browse and search campsites around Sydney with interactive map and list views
- **Geocoding Search**: Real-time location search using OpenStreetMap Nominatim API with rate limiting and retry logic
- **Demo Footprints**: View sample camping footprints to explore the app

### User Authentication
- **JWT-Based Auth**: Secure authentication with JSON Web Tokens (HS256)
- **Password Security**: Bcrypt password hashing for secure user accounts
- **Session Management**: Token-based session handling with protected routes

### Trip Planning & Management
- **Trip Creation**: Create trips by selecting campsites with date ranges
- **Weather Forecasts**: Real-time weather forecasts using OpenWeather API (2.5 Forecast API)
- **Intelligent Checklists**: Rule-based packing checklist generation based on:
  - Weather conditions (rain, cold, hot, windy)
  - Activity types (hiking, fishing, swimming, camping)
  - Experience level (beginner, intermediate, advanced, expert)
  - Trip duration and group size
- **Trip Management**: View, edit, and delete your trips

### Footprint Tracking
- **Camping Footprints**: Record and visualize your past camping experiences
- **Location Tracking**: Store GPS coordinates for each footprint
- **Rich Metadata**: Add notes, ratings, tags, and date ranges to footprints
- **Interactive Map**: View footprints on an interactive Leaflet map
- **CRUD Operations**: Full create, read, update, delete functionality

### Additional Features
- **Camp Recipes**: Placeholder page for future meal planning features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Search**: Debounced search with geocoding integration

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router DOM 6.21.1
- **Styling**: Tailwind CSS 3.3.6
- **Icons**: Lucide React 0.555.0
- **Maps**: Leaflet 1.9.4 + React Leaflet 4.2.1
- **Type Safety**: TypeScript 5.2.2 with OpenAPI TypeScript code generation
- **Development**: ESLint, PostCSS, Autoprefixer

### Backend API
- **Runtime**: Node.js with TypeScript
- **Framework**: Express 4.18.2
- **Database**: MongoDB with Mongoose 8.0.3
- **Authentication**: JSON Web Token (jsonwebtoken 9.0.2) + Bcrypt (bcryptjs 2.4.3)
- **Security**: Helmet 7.2.0, CORS 2.8.5
- **Validation**: Zod 3.22.4
- **Logging**: Morgan 1.10.1
- **Environment**: dotenv 16.3.1
- **Development**: tsx 4.7.0 (TypeScript execution)

### RAG Service (Future)
- **Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn with standard extras
- **Purpose**: AI/retrieval service (reserved for future features)

### Infrastructure & DevOps
- **Cloud Provider**: AWS (ap-southeast-2)
- **Container Orchestration**: AWS ECS Fargate (ARM64 architecture, Fargate Spot)
- **Container Registry**: AWS ECR (Elastic Container Registry)
- **Load Balancing**: AWS Application Load Balancer (ALB) with HTTPS redirect
- **Networking**: AWS VPC with public/private subnets, Internet Gateway
- **Secrets Management**: AWS Systems Manager Parameter Store / Secrets Manager
- **Logging**: AWS CloudWatch Logs (14-day retention)
- **Infrastructure as Code**: Terraform (modular structure)
- **CI/CD**: GitHub Actions with Docker Buildx (ARM64 support)
- **Containerization**: Docker with multi-stage builds

### External APIs
- **Weather**: OpenWeather 2.5 Forecast API
- **Geocoding**: OpenStreetMap Nominatim API (with rate limiting and retry logic)

### Development Tools
- **Container Orchestration**: Docker Compose
- **API Documentation**: OpenAPI/Swagger (Redocly CLI)
- **Type Generation**: openapi-typescript 6.7.3
- **Version Control**: Git

## 🏗️ Architecture

### Monorepo Structure
```
Camp_with_Bear/
├── api/              # Node.js/Express API service
├── frontend/         # React/Vite frontend application
├── rag/              # FastAPI Python service (future)
├── docker/           # Docker Compose and Dockerfiles
├── infra/            # Terraform infrastructure as code
│   ├── modules/      # Reusable Terraform modules
│   └── envs/dev/     # Development environment
└── docs/             # Documentation and API specs
```

### System Architecture

**Local Development:**
- Frontend (Vite dev server) → API (Express) → MongoDB
- Docker Compose orchestrates all services
- Universal API base URL: auto-detects dev vs production mode

**Production (AWS):**
- ALB (HTTPS) → ECS Fargate Services (Frontend + API) → MongoDB (external)
- Frontend serves static assets via nginx
- API handles all business logic and external API calls
- Secrets injected via AWS Parameter Store/Secrets Manager

### Data Flow
1. **Public Access**: Frontend displays demo data without API calls
2. **Authenticated Access**: Frontend → API → MongoDB
3. **External Services**: API → OpenWeather API, Nominatim API
4. **Infrastructure**: Terraform → AWS → ECS/ALB/ECR

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development without Docker)
- MongoDB (or use Docker Compose MongoDB service)

### Local Development with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd Camp_with_Bear

# Create .env file in docker/ directory (optional)
# See docs/env.md for required environment variables

# Start all services
cd docker
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8080
# MongoDB: localhost:27017
# Mongo Express: http://localhost:8081
```

### Local Development (Without Docker)

```bash
# Install dependencies
cd api && npm install
cd ../frontend && npm install

# Start MongoDB (or use Docker)
# mongod --dbpath ./data

# Start API (from api/ directory)
npm run dev

# Start Frontend (from frontend/ directory)
npm run dev
```

## 📚 Application Routes

### Public Routes (No Authentication)
- `/` - **Explore**: Interactive map and list view of campsites and demo footprints
- `/recipes` - **Camp Recipes**: Placeholder page for meal planning features

### Authentication Routes
- `/login` - User login page
- `/register` - User registration page

### Protected Routes (Requires Authentication)
- `/plan` - **Plan Your Trip**: Create trips, view weather forecasts, generate checklists
- `/footprints` - **My Footprints**: Manage your camping footprints (CRUD)
- `/dashboard` - **Dashboard**: User dashboard (if implemented)

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/public/campsites` - List campsites (with optional `query` and `type` filters)
- `GET /api/public/campsites/:id` - Get detailed campsite information
- `GET /api/geocode?q={query}` - Geocode location search (Nominatim)
- `GET /api/health` - Health check endpoint

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/me` - Get current user information (requires JWT)

### Trips (Requires JWT)
- `POST /api/trips` - Create a new trip
- `GET /api/trips` - List all trips for current user
- `GET /api/trips/:id` - Get trip details
- `DELETE /api/trips/:id` - Delete a trip

### Weather (Requires JWT)
- `GET /api/weather?lat={lat}&lon={lon}&from={from}&to={to}` - Get weather forecast

### Checklist (Requires JWT)
- `GET /api/checklist/:tripId` - Generate intelligent packing checklist for a trip

### Footprints (Requires JWT)
- `GET /api/footprints` - List all footprints for current user
- `POST /api/footprints` - Create a new footprint
- `GET /api/footprints/:id` - Get footprint details
- `PATCH /api/footprints/:id` - Update a footprint
- `DELETE /api/footprints/:id` - Delete a footprint

## 📦 Checklist Generation Logic

The intelligent checklist system uses rule-based logic to create personalized packing lists:

### Weather-Based Items
- **Rain**: Rain jacket, rain pants (optional for beginners), waterproof bag cover
- **Cold** (avg < 10°C or min < 5°C): Warm jacket, thermal underwear, warm hat, gloves
- **Hot** (avg > 25°C or max > 30°C): Sun hat, sunscreen, lightweight clothing
- **Windy**: Windbreaker

### Activity-Specific Items
- **Hiking/Camping**: Hiking boots, tent (for camping), sleeping bag, sleeping pad
- **Fishing**: Fishing rod (max 2), fishing tackle
- **Swimming**: Swimsuit, towel

### Experience Level Adjustments
- **Beginner**: Emergency whistle, headlamp (always recommended)
- **Advanced/Expert**: Multi-tool (recommended for experienced campers)
- **All Levels**: Map and compass (recommended for beginners and intermediates)

### Duration & Group Size
- **Trips > 3 days**: Extra batteries, portable charger
- **Groups > 4 people**: Group cooking equipment

### Base Essentials
Every checklist includes:
- Backpack (1 per trip)
- Water bottle (1 per person)
- First aid kit (1 per trip)
- Food supplies (calculated based on duration and group size)

## 🔒 Security Features

- **CORS Configuration**: Environment-based CORS with production safety checks
- **Password Hashing**: Bcrypt with secure salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Helmet.js**: Security headers middleware
- **Input Validation**: Zod schema validation for all API inputs
- **Secrets Management**: AWS Parameter Store/Secrets Manager for production secrets
- **HTTPS**: ALB with SSL/TLS termination (production)

## 📖 Documentation

- **API Documentation**: See `docs/API.md` and `docs/openapi/api.yaml`
- **Environment Variables**: See `docs/env.md`
- **Deployment Guide**: See `docs/RUNBOOK.md`
- **Build Log**: See `docs/BUILD_LOG.md`
- **Changelog**: See `docs/CHANGELOG.md`
- **Footprints Feature**: See `docs/FOOTPRINTS.md`

## 🚢 Deployment

### AWS Infrastructure (Terraform)

The application is deployed on AWS using Terraform:

- **Region**: ap-southeast-2 (Sydney)
- **Compute**: ECS Fargate (ARM64, Fargate Spot for cost optimization)
- **Networking**: VPC with public subnets, ALB with HTTPS
- **Container Registry**: ECR with image scanning and lifecycle policies
- **Monitoring**: CloudWatch Logs with 14-day retention
- **Secrets**: AWS Systems Manager Parameter Store / Secrets Manager

See `infra/envs/dev/` for Terraform configuration and `docs/BUILD_LOG.md` for detailed infrastructure setup.

### CI/CD Pipeline

GitHub Actions workflow (`/.github/workflows/deploy.yml`):
- Builds ARM64 Docker images using Docker Buildx
- Pushes to ECR with dual tagging (`github.sha` and `latest`)
- Updates ECS services with new task definitions

## 🧪 Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- OpenAPI TypeScript code generation for API types
- Terraform formatting and validation

### Environment Variables

See `docs/env.md` for complete environment variable documentation.

Key variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token signing
- `OPENWEATHER_API_KEY` - OpenWeather API key
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (production)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (production)

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contributing guidelines if applicable]

---

**Built with ❤️ for campers and outdoor enthusiasts**
