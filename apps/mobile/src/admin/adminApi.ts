import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Same base-URL resolution as the user-facing API client, but kept fully
// independent so the admin token never mixes with the user session token.
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

  const cleanUrl = url.replace(/\/$/, '');
  if (!cleanUrl.endsWith('/api/v1')) {
    return `${cleanUrl}/api/v1`;
  }
  return cleanUrl;
}

const BASE_URL = resolveBaseUrl();

let adminToken: string | null = null;

export function setAdminToken(token: string | null) {
  adminToken = token;
}

export function getAdminToken(): string | null {
  return adminToken;
}

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (adminToken) headers.Authorization = `Bearer ${adminToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = 'Request failed. Please try again.';
    try {
      const body = await res.json();
      message = Array.isArray(body?.message)
        ? body.message.join(', ')
        : (body?.message ?? message);
    } catch {
      // fallback message
    }
    throw new AdminApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { BASE_URL };
