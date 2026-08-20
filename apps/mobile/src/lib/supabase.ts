import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const url = Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Secure storage on native, fallback to AsyncStorage for web.
const isNative = Platform.OS !== 'web';
const isSSR = typeof window === 'undefined';
const secureStorage = {
  getItem: (key: string) =>
    isSSR
      ? Promise.resolve(null)
      : isNative
        ? SecureStore.getItemAsync(key)
        : AsyncStorage.getItem(key),
  setItem: (key: string, value: string) =>
    isSSR
      ? Promise.resolve()
      : isNative
        ? SecureStore.setItemAsync(key, value)
        : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    isSSR
      ? Promise.resolve()
      : isNative
        ? SecureStore.deleteItemAsync(key)
        : AsyncStorage.removeItem(key),
};

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web the OAuth tokens come back in the URL hash, so the SDK must
    // detect them itself. On native we use the PKCE flow and exchange the
    // code manually in the auth-callback screen.
    detectSessionInUrl: Platform.OS === 'web',
    flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
  },
});
