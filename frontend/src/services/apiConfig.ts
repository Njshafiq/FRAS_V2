// Centralized API configuration for FRAS Frontend
// Connected via VITE_API_BASE_URL (defaults to http://localhost:8081/api for Spring Boot backend-v2)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('fras_auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('fras_auth_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('fras_auth_token');
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new Error('Network error: Unable to reach backend server. Please check your connection.');
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (typeof errorJson?.message === 'string') {
        errorMessage = errorJson.message;
      } else if (typeof errorJson?.message === 'object') {
        errorMessage = Object.entries(errorJson.message)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      } else if (errorJson?.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // Non-JSON error
      if (response.status === 401) errorMessage = 'Session expired or unauthenticated. Please log in again.';
      else if (response.status === 403) errorMessage = 'Access denied: insufficient administrator permissions.';
      else if (response.status === 404) errorMessage = 'Requested resource not found.';
      else if (response.status === 409) errorMessage = 'Conflict: operation cannot be performed in current state.';
      else if (response.status >= 500) errorMessage = 'Internal server error. Please try again later.';
    }
    throw new Error(errorMessage);
  }

  // Handle empty bodies (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

