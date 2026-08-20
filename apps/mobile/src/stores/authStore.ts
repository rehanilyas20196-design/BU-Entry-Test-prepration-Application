import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { setAccessToken } from '@/lib/api';

export type EmailOtpType = 'signup' | 'email';

interface AuthState {
  session: Session | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  setSession: (session: Session | null) => void;
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsEmailConfirmation: boolean }>;
  requestEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string, type?: EmailOtpType) => Promise<void>;
  resendEmailOtp: (email: string, type?: EmailOtpType) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  loading: false,
  error: null,

  setSession: (session) => {
    setAccessToken(session?.access_token ?? null);
    set({ session });
  },

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    setAccessToken(data.session?.access_token ?? null);
    set({ session: data.session, initialized: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      set({ session });
    });
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    setAccessToken(data.session?.access_token ?? null);
    set({ session: data.session, loading: false });
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null });
    const isWeb = Platform.OS === 'web';
    const redirectTo = isWeb
      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081'}/auth-callback`
      : 'buetprep://auth/callback';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    if (!data.session) {
      setAccessToken(null);
      set({ loading: false, session: null });
      return { needsEmailConfirmation: true };
    }
    setAccessToken(data.session?.access_token ?? null);
    set({ session: data.session, loading: false });
    return { needsEmailConfirmation: false };
  },

  verifyEmailOtp: async (email, token, type = 'signup') => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    setAccessToken(data.session?.access_token ?? null);
    set({ session: data.session ?? null, loading: false });
  },

  resendEmailOtp: async (email, type = 'signup') => {
    if (type === 'email') {
      const isWeb = Platform.OS === 'web';
      const redirectTo = isWeb
        ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081'}/auth-callback`
        : 'buetprep://auth/callback';
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
          data: { full_name: email.split('@')[0] },
        },
      });
      if (error) throw error;
      return;
    }
    const { error } = await supabase.auth.resend({ type, email });
    if (error) throw error;
  },

  requestEmailOtp: async (email) => {
    set({ loading: true, error: null });
    const isWeb = Platform.OS === 'web';
    const redirectTo = isWeb
      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081'}/auth-callback`
      : 'buetprep://auth/callback';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
        data: { full_name: email.split('@')[0] },
      },
    });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    set({ loading: false });
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    const isWeb = Platform.OS === 'web';
    const base = isWeb
      ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081')
      : null;
    const redirectTo = isWeb
      ? `${base}/auth-callback`
      : 'buetprep://auth/callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    if (!isWeb && data?.url) {
      // On native the SDK does not auto-redirect, so open the provider URL
      // ourselves. The callback (buetprep://auth/callback) is handled by the
      // auth-callback screen, which exchanges the PKCE code for a session.
      await Linking.openURL(data.url).catch((e) => {
        set({ loading: false });
        throw new Error(`Unable to open the browser: ${e instanceof Error ? e.message : 'unknown error'}`);
      });
    }
    set({ loading: false });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'buetprep://auth/reset-password',
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    set({ session: null });
  },
}));
