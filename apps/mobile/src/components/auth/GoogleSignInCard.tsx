import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/components/ui/Toast';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential: string }) => void;
}

interface GoogleAccountsWindow extends Window {
  google?: {
    accounts?: {
      id: {
        initialize: (config: GoogleIdConfiguration) => void;
        prompt: () => void;
        redirect: (config?: { login_hint?: string }) => void;
      };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccountsWindow['google'];
  }
}

interface GoogleSignInCardProps {
  onSuccess?: () => void;
}

/** Official 4-color Google "G" logo. */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export function GoogleSignInCard({ onSuccess }: GoogleSignInCardProps) {
  const { colors } = useTheme();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);
  const pendingPressRef = useRef(false);
  const isWeb = Platform.OS === 'web';

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setLoading(true);
      try {
        // Never trust the JWT on the client — the backend verifies it and only
        // then returns an app session (POST /api/v1/auth/google).
        const res = await api.post<{
          access_token: string;
          refresh_token: string;
          expires_at?: number | null;
        }>('/auth/google', { credential: response.credential });

        const { data, error } = await supabase.auth.setSession({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          ...(res.expires_at ? { expires_at: res.expires_at } : {}),
        });
        if (error || !data.session) {
          throw new Error('Could not start your session.');
        }
        onSuccess?.();
      } catch (e) {
        show(e instanceof Error ? e.message : 'Google sign-in failed.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, show],
  );

  useEffect(() => {
    if (!isWeb) return;
    const win = window as GoogleAccountsWindow;
    const init = () => {
      if (initializedRef.current || !win.google?.accounts?.id) return;
      initializedRef.current = true;
      win.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      if (pendingPressRef.current) {
        pendingPressRef.current = false;
        win.google.accounts.id.prompt();
      }
    };
    if (win.google?.accounts?.id) {
      init();
      return;
    }
    const existing = document.getElementById('gsi-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', init);
      init();
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [isWeb, handleCredentialResponse]);

  const handlePress = async () => {
    const win = window as GoogleAccountsWindow;
    if (isWeb) {
      if (win.google?.accounts?.id) {
        try {
          win.google.accounts.id.prompt();
        } catch {
          // One Tap unavailable in this browser — go straight to Google sign-in.
          win.google.accounts.id.redirect();
        }
      } else {
        // Script still loading — fire once GSI is initialized.
        pendingPressRef.current = true;
      }
      return;
    }
    // Native fallback: Supabase OAuth opens the system browser.
    try {
      setLoading(true);
      await useAuthStore.getState().signInWithGoogle();
      onSuccess?.();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Google sign-in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <AppText variant="small" color="muted">or</AppText>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <Pressable
        onPress={handlePress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ disabled: loading, busy: loading }}
        style={({ pressed }) => [styles.googleButton, pressed && !isWeb && styles.pressed]}
      >
        {loading ? (
          <ActivityIndicator color="#3B5CF5" size="small" />
        ) : (
          <View style={styles.content}>
            <GoogleIcon size={18} />
            <Text style={styles.label}>Continue with Google</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1 },
  googleButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B5CF5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: {
    color: '#3B5CF5',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
