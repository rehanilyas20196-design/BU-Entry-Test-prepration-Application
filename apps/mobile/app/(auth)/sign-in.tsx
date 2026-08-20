import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Image, Pressable } from 'react-native';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card } from '@/components/ui/Card';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { GoogleSignInCard } from '@/components/auth/GoogleSignInCard';

export default function SignInScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isWeb, isDesktop } = useResponsive();
  const { signInWithEmail, requestEmailOtp, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'password' | 'otp'>('password');

  const handleSubmit = async () => {
    setError(null);
    const fe: { email?: string; password?: string } = {};
    if (!email.trim()) fe.email = 'Enter your email address.';
    if (mode === 'password' && !password) fe.password = 'Enter your password.';
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    if (mode === 'otp') {
      try {
        await requestEmailOtp(email.trim());
        router.replace({ pathname: '/(auth)/verify-otp', params: { email: email.trim(), type: 'email' } });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unable to send the code.';
        setError(message);
      }
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
      <ScreenScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.authCol, isWeb && isDesktop && styles.authColWide]}>
        <View style={styles.brandBlock}>
          <View style={styles.logoRing}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <AppText variant="h1" style={[styles.brandText, { color: colors.text }]}>BUET Prep AI</AppText>
          <AppText variant="body" color="secondary" style={styles.brandSub}>
            Independent preparation for the Bahria University Entry Test
          </AppText>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <AppText variant="h2" style={[styles.formTitle, { color: colors.text }]}>Welcome back</AppText>
            <AppText variant="body" color="secondary">Sign in to continue your prep</AppText>
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={15} color={colors.danger} />
              <AppText variant="small" color="danger" style={{ flex: 1 }}>{error}</AppText>
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
            error={fieldErrors.email}
            icon={<Feather name="mail" size={16} color={colors.textMuted} />}
          />
          {mode === 'password' && (
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              error={fieldErrors.password}
              icon={<Feather name="lock" size={16} color={colors.textMuted} />}
              trailing={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
                </Pressable>
              }
            />
          )}

          <Button
            title={mode === 'otp' ? 'Send me a code' : 'Sign in'}
            onPress={handleSubmit}
            loading={loading}
            size="lg"
          />

          <Pressable
            onPress={() => {
              setError(null);
              setMode((m) => (m === 'otp' ? 'password' : 'otp'));
            }}
            hitSlop={8}
            style={styles.link}
          >
            <AppText variant="body" color="primary">
              {mode === 'otp' ? 'Sign in with password instead' : 'Sign in with a one-time code'}
            </AppText>
          </Pressable>

          <GoogleSignInCard onSuccess={() => router.replace('/(tabs)')} />

          <Link href="/(auth)/forgot-password" style={styles.link}>
            <AppText variant="body" color="primary">Forgot your password?</AppText>
          </Link>

          <View style={styles.footerRow}>
            <AppText variant="body" color="secondary">New to BUET Prep?{' '}</AppText>
            <Link href="/(auth)/sign-up">
              <AppText variant="bodyMedium" color="primary">Create account</AppText>
            </Link>
          </View>
        </Card>

        <AppText variant="small" color="muted" style={styles.disclaimer}>
          This is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
        </AppText>

        <Link href="/sample-quiz" style={styles.tryQuizLink}>
          <AppText variant="bodyMedium" color="primary">Not ready to sign up? Try a free 5-question sample quiz →</AppText>
        </Link>
        </View>
      </ScreenScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 24 },
  authCol: { width: '100%', gap: 24 },
  authColWide: { maxWidth: 440, alignSelf: 'center' },
  brandBlock: { alignItems: 'center', gap: 6 },
  logoRing: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  logo: { width: 48, height: 48 },
  brandText: {},
  brandSub: { textAlign: 'center', maxWidth: 300 },
  formCard: { padding: 20, gap: 14 },
  formHeader: { gap: 2, marginBottom: 2 },
  formTitle: {},
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 8, borderWidth: 1,
  },
  link: { alignSelf: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  disclaimer: { textAlign: 'center' },
  tryQuizLink: { alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 4 },
});
