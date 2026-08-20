import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

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
  const isWeb = Platform.OS === 'web';

  // Web + native both go through Supabase's Google OAuth. It is a plain
  // browser redirect chain (no GSI popup, no FedCM, no nonce), so it works
  // even when "third-party sign-in" is blocked. Supabase handles the Google
  // exchange and sends the session back to /auth-callback.
  const handlePress = async () => {
    setLoading(true);
    try {
      if (isWeb) {
        const redirectTo = `${window.location.origin}/auth-callback`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) throw error;
        // The SDK navigates away to Supabase's authorize URL; on return the
        // auth-callback screen finishes the sign-in.
        return;
      }
      // Native: SDK does not auto-redirect, so open the provider URL ourselves.
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