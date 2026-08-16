import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Pressable, TextInput } from 'react-native';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyOtpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isWeb, isDesktop } = useResponsive();
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
      setError('Enter the 6-digit code sent to your email.');
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
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.authCol, isWeb && isDesktop && styles.authColWide]}>
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <Feather name="shield" size={22} color={colors.primary} />
          </View>
          <AppText variant="h1" style={[styles.title, { color: colors.text }]}>{isLogin ? 'Check your email' : 'Confirm your account'}</AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <AppText variant="bodyMedium" style={{ color: colors.text }}>{maskedEmail}</AppText>. Enter it below to{isLogin ? ' sign in' : ' confirm your account'}.
          </AppText>
        </View>

        <Card style={styles.formCard}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={15} color={colors.danger} />
              <AppText variant="small" color="danger" style={{ flex: 1 }}>{error}</AppText>
            </View>
          )}

          <View style={styles.otpLabel}>
            <Feather name="key" size={16} color={colors.textSecondary} />
            <AppText variant="label" style={{ color: colors.text }}>Verification code</AppText>
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
              <View style={[styles.otpComplete, { backgroundColor: colors.success }]}>
                <Feather name="check" size={14} color="#FFF" />
              </View>
            )}
          </View>

          <Button title={isLogin ? 'Verify and sign in' : 'Verify and confirm account'} onPress={handleVerify} loading={loading} size="lg" />

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
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  title: {},
  subtitle: { textAlign: 'center', maxWidth: 320 },
  formCard: { padding: 20, gap: 16 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 8, borderWidth: 1,
  },
  otpLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  otpInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  otpInput: { flex: 1, fontSize: 24, letterSpacing: 12, paddingVertical: 12, textAlign: 'center', fontVariant: ['tabular-nums'] },
  otpComplete: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  resendRow: { alignItems: 'center', minHeight: 24 },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
});
