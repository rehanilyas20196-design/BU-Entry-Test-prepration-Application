import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Web only: Google returns here after the OAuth redirect with the id_token in
// the URL hash (#id_token=...). We hand it to the backend, which verifies it
// via Supabase, and start the session.
export default function GoogleAuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = async () => {
      if (Platform.OS !== 'web') {
        router.replace('/sign-in');
        return;
      }
      try {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const credential = params.get('id_token');

        // Optional replay protection: reject if the nonce we stored before the
        // redirect doesn't match the one Google echoed back.
        let expectedNonce: string | null = null;
        try {
          expectedNonce = sessionStorage.getItem('google_oauth_nonce');
        } catch {
          // ignore — private mode
        }
        if (expectedNonce && params.get('nonce') !== expectedNonce) {
          throw new Error('Sign-in request expired. Please try again.');
        }
        if (!credential) {
          throw new Error('No Google credential was received.');
        }

        const res = await api.post<{
          access_token: string;
          refresh_token: string;
          expires_at?: number | null;
        }>('/auth/google', { credential });

        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          ...(res.expires_at ? { expires_at: res.expires_at } : {}),
        });
        if (sessionError || !data.session) {
          throw new Error('Could not start your session.');
        }
        router.replace('/(tabs)');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Google sign-in failed.';
        console.error('[google-auth]', e);
        setError(message);
      }
    };
    void handle();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? (
        <>
          <AppText variant="h3">Google sign-in failed</AppText>
          <AppText variant="body" color="secondary" style={styles.errorText}>
            {error}
          </AppText>
          <Button title="Back to sign in" onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <>
          <AppText variant="body" color="secondary">Completing sign in…</AppText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { textAlign: 'center' },
});