import Constants from 'expo-constants';
import { Platform } from 'react-native';

// On a physical device (Expo Go), "localhost" points to the phone itself.
// Derive the dev machine's LAN IP from the Expo host URI so API calls reach
// the machine running `expo start`. Falls back to EXPO_PUBLIC_API_URL.
function resolveBaseUrl(): string {
  let url = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

  if (Platform.OS === 'web') {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        const host = globalThis.location?.hostname;
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          parsed.hostname = host;
          url = parsed.toString().replace(/\/$/, '');
        }
      }
    } catch {
      // ignore URL parsing error
    }
  } else {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      const devHost = hostUri.split(':')[0];
      if (devHost) {
        url = `http://${devHost}:4000/api/v1`;
      }
    }
  }

  // Ensure url ends with /api/v1 if not present
  const cleanUrl = url.replace(/\/$/, '');
  if (!cleanUrl.endsWith('/api/v1')) {
    return `${cleanUrl}/api/v1`;
  }
  return cleanUrl;
}

const BASE_URL = resolveBaseUrl();

export interface ApiError {
  status: number;
  message: string;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function getAccessToken(): string | null {
  // Always prefer the live session from the auth store. The module-level
  // variable can go stale (e.g. after Metro hot reload resets module state),
  // which would otherwise send requests without a token and cause 401s.
  try {
    const { useAuthStore } = require('./authStore');
    return useAuthStore.getState().session?.access_token ?? accessToken;
  } catch {
    return accessToken;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (getAccessToken()) headers.Authorization = `Bearer ${getAccessToken()}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    throw new ApiClientError(res.status, 'You are not authorized. Please sign in again.');
  }
  if (!res.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const body = await res.json();
      message = Array.isArray(body?.message)
        ? body.message.join(', ')
        : (body?.message ?? message);
    } catch {
      // fallback message
    }
    throw new ApiClientError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
