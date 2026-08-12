import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, ScrollView, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';

export default function SignInScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, loading } = useAuthStore();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to sign in.';
      setError(message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBlock}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <AppText variant="h1">BUET Prep AI</AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            Independent preparation for the Bahria University Entry Test
          </AppText>
        </View>

        <Image source={require('../../assets/banner1.png')} style={styles.banner} resizeMode="cover" />

        <View style={styles.form}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <AppText variant="small" color="danger">
                {error}
              </AppText>
            </View>
          )}

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
          />

          <Button title="Sign In" onPress={handleSubmit} loading={loading} size="lg" />

          <Button title="Continue with Google" variant="outline" onPress={() => signInWithGoogle().catch((e) => show(e instanceof Error ? e.message : 'Google sign-in failed', 'error'))} />

          <Link href="/(auth)/forgot-password" style={styles.link}>
            <AppText variant="body" color="primary">
              Forgot your password?
            </AppText>
          </Link>

          <View style={styles.footerRow}>
            <AppText variant="body" color="secondary">
              New to BUET Prep?{' '}
            </AppText>
            <Link href="/(auth)/sign-up">
              <AppText variant="bodyMedium" color="primary">
                Create account
              </AppText>
            </Link>
          </View>
        </View>

        <AppText variant="small" color="muted" style={styles.disclaimer}>
          This is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 32 },
  brandBlock: { alignItems: 'center', gap: 8 },
  logo: { width: 90, height: 90, marginBottom: 4 },
  banner: { width: '100%', height: 120, borderRadius: 16, overflow: 'hidden' },
  subtitle: { textAlign: 'center' },
  form: { gap: 16 },
  errorBox: { padding: 12, borderRadius: 10 },
  link: { alignSelf: 'center', marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  disclaimer: { textAlign: 'center', marginTop: 16 },
});
