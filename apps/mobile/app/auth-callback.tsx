import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const url = Linking.useURL();

  useEffect(() => {
    const handle = async () => {
      if (!isWeb && url) {
        const raw = Linking.parse(url).queryParams ?? {};
        const asString = (v: string | string[] | undefined) => (typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined);
        const code = asString(raw.code);
        const accessToken = asString(raw.access_token);
        const refreshToken = asString(raw.refresh_token);
        if (code) {
          // Native OAuth uses the PKCE flow: exchange the code in the deep
          // link (buetprep://auth/callback?code=...) for a session.
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          if (!error && data.session) {
            router.replace('/(tabs)');
            return;
          }
        } else if (accessToken) {
          // Email magic links / OTP confirmations deliver the tokens in the
          // URL hash on the deep link.
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (!error && data.session) {
            router.replace('/(tabs)');
            return;
          }
        }
      }
      // Web: the SDK (detectSessionInUrl) parses the tokens from the URL hash,
      // so a stored session is already available here. Fall back to it.
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.replace('/sign-in');
        return;
      }
      router.replace('/(tabs)');
    };
    // On native wait for the deep-link URL to arrive (cold start returns it
    // via getInitialURL, warm start via the url event).
    if (!isWeb && !url) return;
    void handle();
  }, [router, isWeb, url]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <AppText variant="body" color="secondary">Completing sign in…</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});