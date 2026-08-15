import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { palette } from '@/theme/colors';

export default function VerifyOtpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; type?: 'signup' | 'email' }>();
  const email = (params.email ?? '').trim();
  const otpType = params.type === 'email' ? 'email' : 'signup';
  const isLogin = otpType === 'email';
  const { verifyEmailOtp, resendEmailOtp, loading } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [resent, setResent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resent]);

  const handleVerify = async () => {
    setError(null);
    if (!email) {
      setError('Missing email. Please go back and sign up again.');
      return;
    }
    if (otp.trim().length < 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    try {
      await verifyEmailOtp(email, otp.trim(), otpType);
      router.replace(isLogin ? '/(tabs)' : '/onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to verify code.');
    }
  };

  const handleResend = async () => {
    setError(null);
    if (!email) return;
    try {
      await resendEmailOtp(email, otpType);
      setResent((r) => !r);
      setCountdown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to resend the code.');
    }
  };

  const maskedEmail = email.length > 4 ? `${email.slice(0, 2)}***${email.slice(email.indexOf('@'))}` : email;

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
            <Feather name="shield" size={26} color="#A78BFA" />
          </View>
          <AppText variant="h1" style={styles.title}>{isLogin ? 'Check your email' : 'Confirm your account'}</AppText>
          <AppText variant="body" style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <AppText variant="bodyMedium" style={styles.highlight}>{maskedEmail}</AppText>. Enter it below to{isLogin ? ' sign in' : ' confirm your account'}.
          </AppText>
        </View>

        <GlassCard style={styles.formCard}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={15} color={colors.danger} />
              <AppText variant="small" color="danger" style={{ flex: 1 }}>{error}</AppText>
            </View>
          )}

          <View style={styles.otpLabel}>
            <Feather name="key" size={16} color={colors.textMuted} />
            <AppText variant="label" color="secondary">Verification code</AppText>
          </View>
          <View
            style={[
              styles.otpInputWrap,
              { backgroundColor: colors.surface, borderColor: otp.length === 6 ? colors.primary : colors.border },
            ]}
          >
            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              accessibilityLabel="Verification code"
              style={[styles.otpInput, { color: colors.text }]}
            />
            {otp.length === 6 && (
              <View style={styles.otpComplete}>
                <Feather name="check" size={14} color="#FFF" />
              </View>
            )}
          </View>

          <AnimatedButton title={isLogin ? 'Verify & Sign In' : 'Verify & Confirm Account'} onPress={handleVerify} loading={loading} size="lg" />

          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <AppText variant="small" color="muted">
                Resend code in {countdown}s
              </AppText>
            ) : (
              <Pressable onPress={handleResend} hitSlop={8}>
                <AppText variant="bodyMedium" color="primary">Resend code</AppText>
              </Pressable>
            )}
          </View>

          <View style={styles.footerRow}>
            <AppText variant="body" color="secondary">Wrong email?{' '}</AppText>
            <Link href={isLogin ? '/(auth)/sign-in' : '/(auth)/sign-up'}>
              <AppText variant="bodyMedium" color="primary">Go back</AppText>
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
  title: { color: '#FFF' },
  subtitle: { color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
  highlight: { color: '#A78BFA', fontWeight: '700' },
  formCard: { padding: 20, gap: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  otpLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  otpInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  otpInput: { flex: 1, fontSize: 24, letterSpacing: 12, paddingVertical: 14, textAlign: 'center', fontVariant: ['tabular-nums'] },
  otpComplete: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E',
  },
  resendRow: { alignItems: 'center', minHeight: 24 },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
});
