import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingData {
  fullName: string;
  targetUniversity: string;
  campus: string;
  programId: string | null;
  programName: string;
  testDate: string | null;
  preparationLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  dailyStudyMinutes: number | null;
  onboarded: boolean;
}

interface OnboardingState extends OnboardingData {
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  reset: () => void;
}

const STORAGE_KEY = 'buetprep.onboarding';

const initial: OnboardingData = {
  fullName: '',
  targetUniversity: 'Bahria University',
  campus: '',
  programId: null,
  programName: '',
  testDate: null,
  preparationLevel: null,
  dailyStudyMinutes: null,
  onboarded: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initial,
  setField: (key, value) => {
    set({ [key]: value } as Partial<OnboardingData>);
    if (key === 'onboarded') {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ onboarded: value }));
    }
  },
  reset: () => set({ ...initial }),
}));

export async function hydrateOnboardingStore() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      useOnboardingStore.setState({ onboarded: parsed.onboarded ?? false });
    }
  } catch {
    // ignore hydration errors
  }
}
