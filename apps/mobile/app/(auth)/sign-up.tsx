import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Image } from 'react-native';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card } from '@/components/ui/Card';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { GoogleSignInCard } from '@/components/auth/GoogleSignInCard';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { isWeb, isDesktop } = useResponsive();
  const { signUp, loading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; password?: string; confirm?: string }>({});

  const handleSubmit = async () => {
    setError(null);
    const fe: typeof fieldErrors = {};
    if (!fullName.trim()) fe.fullName = 'Enter your full name.';
    if (!email.trim()) fe.email = 'Enter your email address.';
    if (!password) fe.password = 'Create a password.';
    else if (password.length < 8) fe.password = 'Password must be at least 8 characters.';
    if (confirm !== password) fe.confirm = 'Passwords do not match.';
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    try {
      const result = await signUp(email.trim(), password, fullName.trim());
      if (result.needsEmailConfirmation) {
        router.replace({ pathname: '/(auth)/verify-otp', params: { email: email.trim() } });
      } else {
        router.replace('/onboarding');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.authCol, isWeb && isDesktop && styles.authColWide]}>
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <AppText variant="h1" style={[styles.title, { color: colors.text }]}>Create your account</AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            Set up your personalized BUET preparation.
          </AppText>
        </View>

        <Card style={styles.formCard}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={15} color={colors.danger} />
              <AppText variant="small" color="danger" style={{ flex: 1 }}>{error}</AppText>
            </View>
          )}

          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Ali Khan" autoComplete="name" error={fieldErrors.fullName} icon={<Feather name="user" size={16} color={colors.textMuted} />} />
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={fieldErrors.email} icon={<Feather name="mail" size={16} color={colors.textMuted} />} />
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" error={fieldErrors.password} icon={<Feather name="lock" size={16} color={colors.textMuted} />} />
          <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry autoComplete="new-password" error={fieldErrors.confirm} icon={<Feather name="lock" size={16} color={colors.textMuted} />} />

          <Button title="Create account" onPress={handleSubmit} loading={loading} size="lg" />

          <GoogleSignInCard onSuccess={() => router.replace('/(tabs)')} />

          <View style={styles.footerRow}>
            <AppText variant="body" color="secondary">Already have an account?{' '}</AppText>
            <Link href="/(auth)/sign-in">
              <AppText variant="bodyMedium" color="primary">Sign in</AppText>
            </Link>
          </View>
        </Card>
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
  header: { gap: 6, alignItems: 'center' },
  logoRing: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  logo: { width: 48, height: 48 },
  title: {},
  subtitle: { textAlign: 'center' },
  formCard: { padding: 20, gap: 14 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 8, borderWidth: 1,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
});
