import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
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

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isWeb, isDesktop } = useResponsive();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setFieldError('Enter your email address.');
      return;
    }
    setFieldError(undefined);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send reset email.');
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
            <Feather name="key" size={22} color={colors.primary} />
          </View>
          <AppText variant="h1" style={[styles.title, { color: colors.text }]}>Reset password</AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            We'll email you a link to reset your password.
          </AppText>
        </View>

        <Card style={styles.formCard}>
          {sent ? (
            <View style={styles.sentBox}>
              <View style={[styles.sentIcon, { backgroundColor: colors.successLight }]}>
                <Feather name="check" size={20} color={colors.success} />
              </View>
              <AppText variant="h3" style={{ color: colors.text }}>Check your inbox</AppText>
              <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
                A reset link has been sent to {email}. It may take a few minutes to arrive.
              </AppText>
              <Button title="Back to sign in" variant="outline" onPress={() => router.replace('/(auth)/sign-in')} />
            </View>
          ) : (
            <View style={styles.form}>
              {error && (
                <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
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
                error={fieldError}
                icon={<Feather name="mail" size={16} color={colors.textMuted} />}
              />
              <Button title="Send reset link" onPress={handleSubmit} />
              <Link href="/(auth)/sign-in" style={styles.backLink}>
                <AppText variant="bodyMedium" color="primary">
                  Back to sign in
                </AppText>
              </Link>
            </View>
          )}
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
  brandBlock: { alignItems: 'center', gap: 6 },
  logoRing: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  title: {},
  subtitle: { textAlign: 'center', maxWidth: 300 },
  formCard: { padding: 20 },
  form: { gap: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8 },
  sentBox: { alignItems: 'center', gap: 12 },
  sentIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backLink: { alignSelf: 'center', marginTop: 8 },
});
