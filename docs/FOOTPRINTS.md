# Footprints Feature Documentation

## Overview

Footprints are user-owned records of past camping trips. They allow authenticated users to track where they've camped, when they visited, and add personal notes, ratings, and tags to remember their experiences.

## Conceptual Model

A **Footprint** represents a completed camping trip that a user has recorded. Unlike "Trips" (which are planned future trips), Footprints are historical records of where users have actually camped.

### Key Characteristics

- **User-Owned**: Each footprint belongs to a specific authenticated user
- **Location-Based**: Each footprint has a geographic location (latitude/longitude)
- **Time-Bounded**: Each footprint has a start and end date
- **Personal**: Users can add notes, ratings (1-5 stars), and tags to personalize their records

## Implementation Stages

The Footprints feature is being implemented in stages:

### Stage A: Backend Support (✅ Complete)
- Created Footprint Mongoose model
- Implemented full CRUD API endpoints
- Added authentication and user scoping
- Added validation with zod schemas

### Stage B: Frontend Integration (✅ Complete)
- Integrated footprint fetching in frontend
- Display footprints on map and in list
- Synchronized map/list selection
- Added loading and empty states

### Stage C: Guest Demo Data (✅ Complete)
- Added demo footprints for unauthenticated users
- Allow exploration without requiring login
- Read-only demo data (never writes to database)
- Guest mode banner with sign-in CTA

### Stage D: Create/Edit UI (⏳ Planned)
- Add forms to create new footprints
- Add edit functionality for existing footprints
- Add delete functionality from UI

## Backend API

### Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### `POST /footprints`
Create a new footprint for the logged-in user.

**Request Body:**
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

**Response:** `201 Created` with footprint object

#### `GET /footprints`
List all footprints belonging to the logged-in user, sorted by startDate descending (most recent first).

**Response:** `200 OK` with array of footprint objects

#### `GET /footprints/:id`
Get a single footprint by ID. Only returns footprint if it belongs to the logged-in user.

**Response:** `200 OK` with footprint object, or `404 Not Found` if not found or not owned

#### `PATCH /footprints/:id`
Update a footprint. Only allowed fields can be updated, and only if the footprint belongs to the user.

**Allowed Fields:** title, location, startDate, endDate, notes, rating, tags

**Response:** `200 OK` with updated footprint object, or `404 Not Found` if not found or not owned

#### `DELETE /footprints/:id`
Delete a footprint. Only allowed if the footprint belongs to the user.

**Response:** `204 No Content` on success, or `404 Not Found` if not found or not owned

### Data Model

```typescript
interface Footprint {
  _id: string;                    // MongoDB ObjectId
  userId: string;                  // ObjectId reference to User
  title: string;                   // Required, trimmed
  location: {
    lat: number;                    // Required, -90 to 90
    lon: number;                   // Required, -180 to 180
  };
  startDate: string;               // Required, ISO 8601 date-time
  endDate: string;                 // Required, ISO 8601 date-time, must be >= startDate
  notes?: string;                  // Optional
  rating?: number;                 // Optional, 1-5
  tags?: string[];                 // Optional array of strings
  createdAt?: string;              // Auto-generated timestamp
  updatedAt?: string;              // Auto-generated timestamp
}
```

### Validation Rules

- **title**: Required, non-empty string (trimmed)
- **location.lat**: Required, number between -90 and 90
- **location.lon**: Required, number between -180 and 180
- **startDate**: Required, valid ISO 8601 date-time string
- **endDate**: Required, valid ISO 8601 date-time string, must be >= startDate
- **notes**: Optional string
- **rating**: Optional integer between 1 and 5 (inclusive)
- **tags**: Optional array of strings

### Security

- All endpoints require authentication
- User ID is taken from JWT token, never from request body
- All queries filter by `userId === req.user.userId`
- 404 responses for unauthorized access (does not leak existence of other users' data)

## Frontend Integration

### Navigation Structure

The MVP uses a simplified two-page navigation:

1. **Explore Page** (`/`) - Public demo mode
   - Shows demo footprints without requiring login
   - Read-only experience
   - If user is logged in, suggests visiting Footprints page

2. **Footprints Page** (`/footprints`) - Authenticated user management
   - Requires authentication (shows login prompt if not logged in)
   - Full CRUD operations for user's footprints
   - No demo data shown

### Authentication Dependency & Guest Demo Mode

The frontend supports two modes:

**Authenticated Mode (Footprints Page):**
1. User navigates to `/footprints`
2. Checks authentication status using `useAuth()` hook
3. If authenticated: Fetches footprints from `GET /footprints`
4. Displays real user-owned footprints with CRUD operations
5. If not authenticated: Shows login prompt

**Guest Demo Mode (Explore Page):**
1. User navigates to `/` (Explore page)
2. When `token` is not available, uses demo footprints from `demoFootprints.ts`
3. No API calls to `/footprints` endpoint
4. Demo data is read-only (never writes to database)
5. Guest mode banner displayed with sign-in CTA
6. If user is logged in, suggests visiting Footprints page

### Data Flow

**Authenticated Mode:**
1. **User Logs In**: `token` becomes available in AuthContext
2. **Effect Hook Triggers**: `useEffect` detects `token` change
3. **API Call**: `listFootprints(token)` is called
4. **State Update**: Real footprints are stored in component state
5. **UI Update**: Map markers and list cards are rendered

**Guest Demo Mode:**
1. **No Token**: `token` is `null` in AuthContext
2. **Effect Hook Triggers**: `useEffect` detects no `token`
3. **Demo Data**: `demoFootprints` array is set directly (no API call)
4. **State Update**: Demo footprints are stored in component state
5. **UI Update**: Map markers and list cards are rendered with demo data

### Display Locations

#### Map View
- Footprints appear as **green markers** on the map
- Clicking a marker selects the footprint and shows details
- Map center calculation includes both campsites and footprints

#### List View
- Footprints appear in a dedicated section at the top of the list (when authenticated)
- Section has green background to distinguish from campsites
- Each footprint card shows:
  - Title
  - Date range (formatted)
  - Rating (star emojis)
  - Tags (first 3 tags)
- Clicking a card selects it and syncs with map

### State Management

The Search page maintains separate state for:

- `footprints`: Array of Footprint objects
- `footprintsLoading`: Boolean loading state
- `footprintsError`: String error message (if any)
- `selectedFootprint`: Currently selected footprint (for detail modal)
- `hoveredFootprint`: Currently hovered footprint ID (for visual feedback)

### Empty States

**When Authenticated but No Footprints:**
- Shows message: "No camping footprints yet. Add your first trip."
- Displayed in the footprints section of the list

**When Not Authenticated (Guest Mode):**
- Demo footprints are always displayed (never empty)
- Guest mode banner shown at top of page
- Full map + list functionality available with demo data

### Loading States

- Separate loading indicator for footprints: "Loading footprints..."
- Does not block campsite loading
- Errors are displayed separately from campsite errors

## Guest Demo Mode (Stage C)

### Purpose

Guest demo mode allows unauthenticated users to explore the Footprints feature without requiring login. This provides a better onboarding experience and demonstrates the value of the feature.

### Implementation

**Data Source:**
- Demo footprints stored in `frontend/src/data/demoFootprints.ts`
- 6 realistic NSW/Sydney-area camping locations
- Same `Footprint` type as API data for consistency

**Data Source Switching Logic:**
```typescript
if (token) {
  // Authenticated: fetch from API
  loadFootprints(); // calls listFootprints(token)
} else {
  // Guest: use demo data (no API call)
  setFootprints(demoFootprints);
}
```

**Privacy Boundary:**
- **Critical**: Guest users NEVER write to the database
- No API calls to `/footprints` when not authenticated
- Demo data is completely read-only
- Real user data remains private and requires authentication

**UI Elements:**
- Guest mode banner: Blue banner at top with "Demo mode" message and "Sign in" button
- Section title: "Camping Footprints (Demo)" in guest mode vs "My Camping Footprints" when authenticated
- All map/list interactions work identically (markers, selection sync, fly-to)

**Testing:**
- **Guest Mode**: Log out or open in incognito → Should see demo footprints and banner
- **Authenticated Mode**: Log in → Should see real footprints (or empty state if none), no banner

## Future Enhancements

### Stage D: Create/Edit UI
- Form to create new footprints
- Edit existing footprints
- Delete footprints from UI
- Validation feedback
- Success/error notifications

## Related Features

- **Trips**: Planned future trips (different from Footprints which are past trips)
- **Campsites**: Public campsite database (separate from user-owned footprints)
- **Authentication**: Required for all footprint operations

## API Client Usage

```typescript
import { listFootprints, type Footprint } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function MyComponent() {
  const { token } = useAuth();
  const [footprints, setFootprints] = useState<Footprint[]>([]);

  useEffect(() => {
    if (token) {
      listFootprints(token)
        .then(setFootprints)
        .catch(console.error);
    }
  }, [token]);

  // Use footprints...
}
```

## Error Handling

### Backend Errors
- `401 Unauthorized`: User not authenticated
- `400 Bad Request`: Validation errors (with details)
- `404 Not Found`: Footprint not found or not owned by user
- `500 Internal Server Error`: Server errors

### Frontend Errors
- Network errors are caught and displayed to user
- Validation errors show field-specific messages
- Authentication errors trigger logout flow
