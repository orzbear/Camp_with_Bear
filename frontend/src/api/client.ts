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

