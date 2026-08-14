import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PremiumState {
  isPremium: boolean;
  initialized: boolean;
  setPremium: (value: boolean) => void;
  hydrate: () => Promise<void>;
  purchase: () => Promise<boolean>;
}

const STORAGE_KEY = 'buetprep.premium';

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  initialized: false,

  setPremium: (value) => {
    set({ isPremium: value, initialized: true });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isPremium: value })).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ isPremium: parsed.isPremium ?? false, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  purchase: async () => {
    try {
      const { api } = await import('@/lib/api');
      await api.post('/premium/activate');
      set({ isPremium: true, initialized: true });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isPremium: true }));
      return true;
    } catch {
      return false;
    }
  },
}));
