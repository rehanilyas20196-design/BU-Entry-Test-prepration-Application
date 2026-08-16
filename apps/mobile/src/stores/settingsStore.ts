import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsState {
  themePreference: ThemePreference;
  notificationsEnabled: boolean;
  reducedMotion: boolean;
  leaderboardOptIn: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setLeaderboardOptIn: (optIn: boolean) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'buetprep.settings';

export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  notificationsEnabled: true,
  reducedMotion: false,
  leaderboardOptIn: false,
  setThemePreference: (pref) => {
    set({ themePreference: pref });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ themePreference: pref }));
  },
  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ notificationsEnabled: enabled }));
  },
  setReducedMotion: (reduced) => {
    set({ reducedMotion: reduced });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ reducedMotion: reduced }));
  },
  setLeaderboardOptIn: (optIn) => {
    set({ leaderboardOptIn: optIn });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ leaderboardOptIn: optIn }));
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          themePreference: parsed.themePreference ?? 'system',
          notificationsEnabled: parsed.notificationsEnabled ?? true,
          reducedMotion: parsed.reducedMotion ?? false,
          leaderboardOptIn: parsed.leaderboardOptIn ?? false,
        });
      }
    } catch {
      // ignore hydration errors
    }
  },
}));
