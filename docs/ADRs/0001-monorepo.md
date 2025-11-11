# ADR 0001: Monorepo Structure

## Status
Accepted

## Context
We need to organize multiple services (frontend, API, RAG) in a way that allows for:
- Shared tooling and configuration
- Coordinated releases
- Simplified development workflow
- Easy local development

## Decision
We will use a monorepo structure with separate directories for each service:
- `frontend/` - React frontend application
- `api/` - Node.js/Express API service
- `rag/` - Python/FastAPI RAG service
- `docker/` - Docker configurations
- `docs/` - Documentation

## Consequences

### Positive
- Single repository for all services
- Easier to coordinate changes across services
- Shared CI/CD pipeline
- Simplified dependency management per service

### Negative
- Larger repository size
- Potential for tighter coupling if not careful
- More complex initial setup

## Reversibility
This decision is reversible. We can split into separate repositories if needed, though it would require:
- Setting up separate CI/CD pipelines
- Coordinating releases across repositories
- Managing cross-repo dependencies

