import type { paths as ApiPaths } from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

type LoginRequest = ApiPaths['/auth/login']['post']['requestBody']['content']['application/json'];
type LoginResponse = ApiPaths['/auth/login']['post']['responses']['200']['content']['application/json'];

type RegisterRequest = ApiPaths['/auth/register']['post']['requestBody']['content']['application/json'];
type RegisterResponse = ApiPaths['/auth/register']['post']['responses']['201']['content']['application/json'];

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return http<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return http<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function me(token: string): Promise<{ userId: string; email: string }> {
  return http<{ userId: string; email: string }>('/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

type CreateTripRequest = ApiPaths['/trips']['post']['requestBody']['content']['application/json'];
type CreateTripResponse = ApiPaths['/trips']['post']['responses']['201']['content']['application/json'];
type Trip = ApiPaths['/trips']['get']['responses']['200']['content']['application/json'][number];
type WeatherResponse = ApiPaths['/weather']['get']['responses']['200']['content']['application/json'];
type ChecklistResponse = ApiPaths['/checklist/{tripId}']['get']['responses']['200']['content']['application/json'];

export async function createTrip(token: string, body: CreateTripRequest): Promise<CreateTripResponse> {
  return http<CreateTripResponse>('/trips', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function listTrips(token: string): Promise<Trip[]> {
  return http<Trip[]>('/trips', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function deleteTrip(token: string, id: string): Promise<void> {
  await http(`/trips/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getWeather(
  token: string,
  params: { lat: number; lon: number; from: string; to: string }
): Promise<WeatherResponse> {
  const queryParams = new URLSearchParams({
    lat: params.lat.toString(),
    lon: params.lon.toString(),
    from: params.from,
    to: params.to,
  });
  return http<WeatherResponse>(`/weather?${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getChecklist(token: string, tripId: string): Promise<ChecklistResponse> {
  return http<ChecklistResponse>(`/checklist/${tripId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Geocoding API (no auth required)
export interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const queryParams = new URLSearchParams({ q: query });
  return http<GeocodeResult[]>(`/geocode?${queryParams}`, {
    method: 'GET',
  });
}

// Public campsites API (no auth required)
export interface Campsite {
  _id: string;
  name: string;
  slug: string;
  parkName: string;
  region: string;
  location: { lat: number; lon: number };
  latitude: number; // Convenience field for map
  longitude: number; // Convenience field for map
  siteType: 'tent' | 'caravan' | 'both';
  facilities: {
    hasHotWater: boolean;
    hasPower: boolean;
    hasToilets: boolean;
    hasShowers: boolean;
    allowsCampfire: boolean;
    allowsFishing: boolean;
  };
  tags?: string[];
  description?: string;
  bookingUrl?: string;
}

export async function getCampsites(params?: { query?: string; type?: string }): Promise<Campsite[]> {
  const queryParams = new URLSearchParams();
  if (params?.query) queryParams.set('query', params.query);
  if (params?.type) queryParams.set('type', params.type);
  
  const queryString = queryParams.toString();
  const campsites = await http<Campsite[]>(`/public/campsites${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
  });
  
  // Inject mock coordinates around Sydney if not present
  // Sydney center: -33.8688, 151.2093
  const sydneyCenter = { lat: -33.8688, lon: 151.2093 };
  const offsets = [
    { lat: 0.05, lon: 0.05 },
    { lat: -0.05, lon: 0.03 },
    { lat: 0.03, lon: -0.05 },
    { lat: -0.03, lon: -0.03 },
    { lat: 0.08, lon: 0.02 },
  ];
  
  return campsites.map((campsite, index) => {
    // Use existing location if available, otherwise inject mock coordinates
    const hasLocation = campsite.location?.lat && campsite.location?.lon;
    const latitude = hasLocation ? campsite.location.lat : sydneyCenter.lat + (offsets[index % offsets.length]?.lat || 0);
    const longitude = hasLocation ? campsite.location.lon : sydneyCenter.lon + (offsets[index % offsets.length]?.lon || 0);
    
    return {
      ...campsite,
      latitude,
      longitude,
      location: {
        lat: latitude,
        lon: longitude,
      },
    };
  });
}

export async function getCampsite(id: string): Promise<Campsite> {
  return http<Campsite>(`/public/campsites/${id}`, {
    method: 'GET',
  });
}


// Footprints API (requires authentication)
export interface Footprint {
  _id: string;
  userId: string;
  title: string;
  location: {
    lat: number;
    lon: number;
  };
  startDate: string;
  endDate: string;
  notes?: string;
  rating?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export async function listFootprints(token: string): Promise<Footprint[]> {
  return http<Footprint[]>('/footprints', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export interface CreateFootprintRequest {
  title: string;
  location: {
    lat: number;
    lon: number;
  };
  startDate: string;
  endDate: string;
  notes?: string;
  rating?: number;
  tags?: string[];
}

export interface UpdateFootprintRequest {
  title?: string;
  location?: {
    lat: number;
    lon: number;
  };
  startDate?: string;
  endDate?: string;
  notes?: string;
  rating?: number;
  tags?: string[];
}

export async function createFootprint(token: string, body: CreateFootprintRequest): Promise<Footprint> {
  return http<Footprint>('/footprints', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function updateFootprint(token: string, id: string, body: UpdateFootprintRequest): Promise<Footprint> {
  return http<Footprint>(`/footprints/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function deleteFootprint(token: string, id: string): Promise<void> {
  await http(`/footprints/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

