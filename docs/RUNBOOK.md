# Runbook

This document describes how to run CampMate services locally and via Docker.

## Prerequisites

- Node.js 20+ (for frontend and API)
- Python 3.11+ (for RAG)
- Docker and Docker Compose (for containerized deployment)

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000

### API

```bash
cd api
npm install
npm run dev
```

API will be available at http://localhost:8080
Health check: http://localhost:8080/health

### RAG

```bash
cd rag
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

RAG service will be available at http://localhost:8000
Health check: http://localhost:8000/health

## Docker Deployment

### Using Docker Compose

From the project root:

```bash
cd docker
docker-compose up --build
```

This will build and start all three services:
- Frontend: http://localhost:3000
- API: http://localhost:8080
- RAG: http://localhost:8000

### Individual Docker Builds

#### Frontend
```bash
docker build -f docker/frontend/Dockerfile -t campmate-frontend .
docker run -p 3000:3000 campmate-frontend
```

#### API
```bash
docker build -f docker/api/Dockerfile -t campmate-api .
docker run -p 8080:8080 campmate-api
```

#### RAG
```bash
docker build -f docker/rag/Dockerfile -t campmate-rag .
docker run -p 8000:8000 campmate-rag
```

## Environment Variables

### API
- `PORT` - Server port (default: 8080)

### RAG
- `PORT` - Server port (default: 8000)
- `RAG_VERSION` - Service version (default: 0.0.1)

## Health Checks

- Frontend: Visit http://localhost:3000 (should show "CampMate OK" with version)
- API: `curl http://localhost:8080/health`
- RAG: `curl http://localhost:8000/health`

