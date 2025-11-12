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

