# API Documentation

## API Service (Port 8080)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/auth/register` | Register new user | `{ email, password }` | `201 { userId }` |
| POST | `/auth/login` | User login | `{ email, password }` | `200 { accessToken }` |
| GET | `/me` | Get current user (requires auth) | - | `200 { userId, email }` |
| POST | `/trips` | Create new trip | `{ location{lat,lon,name}, startDate, endDate, groupSize, experience, activities[] }` | `201 { id }` |
| GET | `/trips/{id}` | Get trip details | - | `200 { full trip object }` |
| GET | `/weather` | Get weather data | Query: `lat, lon, from, to` | `200 { daily: [...], alerts: [...] }` |
| GET | `/checklist/{tripId}` | Get trip checklist | - | `200 { items: [{ name, qty, reason, recommended }] }` |
| POST | `/ai/ask` | Ask AI question | `{ question, tripId?, stream? }` | `200 { answer, citations: [{ title, url, score }] }` |
| GET | `/health` | Health check | - | `200 { status, service, version }` |

### Auth Endpoints Examples

#### POST /auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Error (409):**
```json
{
  "error": "User already exists"
}
```

#### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

#### GET /me
**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Error (401):**
```json
{
  "error": "Unauthorized: Missing or invalid token"
}
```

## RAG Service (Port 8000)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/ingest/url` | Ingest URL content | `{ url }` | `202 { accepted: true }` |
| POST | `/search` | Search documents | `{ query, topK? }` | `200 { results: [{ text, url, title, score }] }` |
| POST | `/answer` | Get AI answer | `{ question, tripContext?, weather? }` | `200 { answer, citations: [...] }` |
| POST | `/answer/stream` | Stream AI answer | `{ question, tripContext?, weather? }` | `200 text/event-stream` |
| GET | `/health` | Health check | - | `200 { ok, service, version }` |

