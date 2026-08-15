import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Image } from 'react-native';
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

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signUp, signInWithGoogle, loading } = useAuthStore();
  const { show } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = () => {
    signInWithGoogle().catch((e) => show(e instanceof Error ? e.message : 'Google sign-in failed', 'error'));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!fullName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[palette.backgroundDark, palette.surfaceDark, palette.backgroundDark]}
        style={StyleSheet.absoluteFill}
      />
      <FloatingParticles count={16} color="#A78BFA" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <AppText variant="h1" style={styles.title}>Create your account</AppText>
          <AppText variant="body" style={styles.subtitle}>
            Set up your personalized BUET preparation.
          </AppText>
        </View>

        <GlassCard style={styles.formCard}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={15} color={colors.danger} />
              <AppText variant="small" color="danger" style={{ flex: 1 }}>{error}</AppText>
            </View>
          )}

          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Ali Khan" autoComplete="name" icon={<Feather name="user" size={17} color={colors.textMuted} />} />
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" icon={<Feather name="mail" size={17} color={colors.textMuted} />} />
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" icon={<Feather name="lock" size={17} color={colors.textMuted} />} />
          <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry autoComplete="new-password" icon={<Feather name="lock" size={17} color={colors.textMuted} />} />

          <AnimatedButton title="Create Account" onPress={handleSubmit} loading={loading} size="lg" />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <AppText variant="small" color="muted">or</AppText>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <AnimatedButton
            title="Continue with Google"
            variant="outline"
            onPress={handleGoogle}
          />

          <View style={styles.footerRow}>
            <AppText variant="body" color="secondary">Already have an account?{' '}</AppText>
            <Link href="/(auth)/sign-in">
              <AppText variant="bodyMedium" color="primary">Sign in</AppText>
            </Link>
          </View>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 28 },
  header: { gap: 6, alignItems: 'center' },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 6,
  },
  logo: { width: 60, height: 60 },
  title: { color: '#FFF' },
  subtitle: { color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
  formCard: { padding: 20, gap: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
});