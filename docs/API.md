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
| GET | `/footprints` | List user's footprints (requires auth) | - | `200 [{ footprint objects }]` |
| POST | `/footprints` | Create footprint (requires auth) | `{ title, location{lat,lon}, startDate, endDate, notes?, rating?, tags?[] }` | `201 { footprint object }` |
| GET | `/footprints/:id` | Get footprint (requires auth) | - | `200 { footprint object }` |
| PATCH | `/footprints/:id` | Update footprint (requires auth) | `{ title?, location?, startDate?, endDate?, notes?, rating?, tags?[] }` | `200 { footprint object }` |
| DELETE | `/footprints/:id` | Delete footprint (requires auth) | - | `204 No Content` |
| GET | `/public/campsites` | List public campsites | Query: `query?, type?` | `200 [{ campsite objects }]` |
| GET | `/public/campsites/:id` | Get campsite details | - | `200 { campsite object }` |
| GET | `/geocode` | Geocode place name (public) | Query: `q=<search text>` | `200 [{ name, lat, lon }]` |
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

### Footprints Endpoints (All require authentication)

#### GET /footprints
**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Blue Mountains Adventure",
    "location": {
      "lat": -33.7128,
      "lon": 150.3115
    },
    "startDate": "2024-04-10T00:00:00.000Z",
    "endDate": "2024-04-13T00:00:00.000Z",
    "notes": "Stunning mountain views",
    "rating": 4,
    "tags": ["mountains", "hiking"],
    "createdAt": "2024-04-15T10:00:00.000Z",
    "updatedAt": "2024-04-15T10:00:00.000Z"
  }
]
```

#### POST /footprints
**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Yosemite Valley Camping",
  "location": {
    "lat": 37.8651,
    "lon": -119.5383
  },
  "startDate": "2024-06-15T00:00:00Z",
  "endDate": "2024-06-18T00:00:00Z",
  "notes": "Beautiful weather, saw bears!",
  "rating": 5,
  "tags": ["hiking", "wildlife", "scenic"]
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439012",
  "title": "Yosemite Valley Camping",
  "location": {
    "lat": 37.8651,
    "lon": -119.5383
  },
  "startDate": "2024-06-15T00:00:00.000Z",
  "endDate": "2024-06-18T00:00:00.000Z",
  "notes": "Beautiful weather, saw bears!",
  "rating": 5,
  "tags": ["hiking", "wildlife", "scenic"],
  "createdAt": "2024-06-20T10:00:00.000Z",
  "updatedAt": "2024-06-20T10:00:00.000Z"
}
```

**Error (400):**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "path": ["endDate"],
      "message": "endDate must be greater than or equal to startDate"
    }
  ]
}
```

#### PATCH /footprints/:id
**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request (partial update):**
```json
{
  "title": "Updated Title",
  "rating": 5
}
```

**Response (200):** Updated footprint object

**Error (404):**
```json
{
  "error": "Footprint not found"
}
```

#### DELETE /footprints/:id
**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (204):** No Content

**Error (404):**
```json
{
  "error": "Footprint not found"
}
```

### Geocoding Endpoint (Public, no authentication required)

#### GET /geocode
**Query Parameters:**
- `q` (required): Search query string (e.g., "Royal National Park")

**Response (200):**
```json
[
  {
    "name": "Euroka Campground, Blue Mountains, NSW, Australia",
    "lat": -33.7167,
    "lon": 150.5833
  },
  {
    "name": "Royal National Park, NSW, Australia",
    "lat": -34.0833,
    "lon": 151.0500
  }
]
```

**Error (400):**
```json
{
  "error": "Invalid query parameter",
  "details": [
    {
      "path": ["q"],
      "message": "Query parameter is required"
    }
  ]
}
```

**Error (502):**
```json
{
  "error": "Geocoding service unavailable"
}
```

**Notes:**
- Proxies to OpenStreetMap Nominatim API
- Returns up to 5 results
- No authentication required (public endpoint)
- Backend sets proper User-Agent header: `Campmate/0.1 (contact: dev@campmate.app)`
- Nominatim usage policy: 1 request per second recommended

## RAG Service (Port 8000)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/ingest/url` | Ingest URL content | `{ url }` | `202 { accepted: true }` |
| POST | `/search` | Search documents | `{ query, topK? }` | `200 { results: [{ text, url, title, score }] }` |
| POST | `/answer` | Get AI answer | `{ question, tripContext?, weather? }` | `200 { answer, citations: [...] }` |
| POST | `/answer/stream` | Stream AI answer | `{ question, tripContext?, weather? }` | `200 text/event-stream` |
| GET | `/health` | Health check | - | `200 { ok, service, version }` |

