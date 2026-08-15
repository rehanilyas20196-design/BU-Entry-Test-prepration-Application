import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminApi, setAdminToken } from './adminApi';

const STORAGE_KEY = 'buetprep.admin.session.v1';
const DEFAULT_IDLE_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // matches API token expiry

export interface AdminSession {
  token: string;
  email: string;
  display_name: string;
  logged_in_at: number;
}

interface AdminAuthState {
  session: AdminSession | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  lastActivityAt: number;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  touchActivity: () => void;
  isSessionValid: () => boolean;
}

async function readSession(): Promise<AdminSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  session: null,
  hydrated: false,
  loading: false,
  error: null,
  lastActivityAt: Date.now(),

  hydrate: async () => {
    const session = await readSession();
    if (session) {
      const age = Date.now() - session.logged_in_at;
      if (age > SESSION_TTL_MS) {
        setAdminToken(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
        set({ session: null, hydrated: true, lastActivityAt: Date.now() });
        return;
      }
      setAdminToken(session.token);
      set({ session, hydrated: true, lastActivityAt: Date.now() });
      return;
    }
    set({ session: null, hydrated: true });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await adminApi.post<{
        token: string;
        email: string;
        display_name?: string;
      }>('/admin-dash/auth/login', { email, password });
      const session: AdminSession = {
        token: res.token,
        email: res.email,
        display_name: res.display_name ?? '',
        logged_in_at: Date.now(),
      };
      setAdminToken(res.token);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      set({ session, loading: false, lastActivityAt: Date.now() });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Login failed' });
      throw e;
    }
  },

  logout: async () => {
    const { session } = get();
    try {
      if (session) await adminApi.post('/admin-dash/auth/logout');
    } catch {
      // best-effort server logout
    }
    setAdminToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ session: null });
  },

  touchActivity: () => set({ lastActivityAt: Date.now() }),

  isSessionValid: () => {
    const { session, lastActivityAt } = get();
    if (!session) return false;
    if (Date.now() - session.logged_in_at > SESSION_TTL_MS) return false;
    if (Date.now() - lastActivityAt > DEFAULT_IDLE_MS) return false;
    return true;
  },
}));
