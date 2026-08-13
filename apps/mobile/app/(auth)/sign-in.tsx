import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, ScrollView, Image, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { TextField } from '@/components/ui/TextField';
import { GlassCard } from '@/components/ui/GlassCard';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { palette } from '@/theme/colors';

export default function SignInScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, loading } = useAuthStore();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[palette.backgroundDark, palette.surfaceDark, palette.backgroundDark]}
        style={StyleSheet.absoluteFill}
      />
      <FloatingParticles count={16} color="#A78BFA" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandBlock}>
          <View style={styles.logoRing}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <AppText variant="h1" style={styles.brandText}>BUET Prep AI</AppText>
          <AppText variant="body" style={styles.brandSub}>
            Independent preparation for the Bahria University Entry Test
          </AppText>
        </View>

        <GlassCard style={styles.formCard}>
          <View style={styles.formHeader}>
            <AppText variant="h3" style={styles.formTitle}>Welcome back</AppText>
            <AppText variant="small" color="secondary">Sign in to continue your prep</AppText>
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
            icon={<Feather name="mail" size={17} color={colors.textMuted} />}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            icon={<Feather name="lock" size={17} color={colors.textMuted} />}
            trailing={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
              </Pressable>
            }
          />

          <AnimatedButton title="Sign In" onPress={handleSubmit} loading={loading} size="lg" />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <AppText variant="small" color="muted">or</AppText>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <AnimatedButton
            title="Continue with Google"
            variant="outline"
            onPress={() => signInWithGoogle().catch((e) => show(e instanceof Error ? e.message : 'Google sign-in failed', 'error'))}
          />

          <Link href="/(auth)/forgot-password" style={styles.link}>
            <AppText variant="body" color="primary">Forgot your password?</AppText>
          </Link>

          <View style={styles.footerRow}>
            <AppText variant="body" color="secondary">New to BUET Prep?{' '}</AppText>
            <Link href="/(auth)/sign-up">
              <AppText variant="bodyMedium" color="primary">Create account</AppText>
            </Link>
          </View>
        </GlassCard>

        <AppText variant="small" color="muted" style={styles.disclaimer}>
          This is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 28 },
  brandBlock: { alignItems: 'center', gap: 6 },
  logoRing: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 6,
  },
  logo: { width: 68, height: 68 },
  brandText: { color: '#FFF' },
  brandSub: { color: 'rgba(255,255,255,0.72)', textAlign: 'center', maxWidth: 300 },
  formCard: { padding: 20, gap: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' },
  formHeader: { gap: 2, marginBottom: 2 },
  formTitle: { color: '#FFF' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1 },
  link: { alignSelf: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  disclaimer: { textAlign: 'center', color: 'rgba(255,255,255,0.5)' },
});