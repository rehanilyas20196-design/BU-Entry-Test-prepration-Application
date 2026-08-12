import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send reset email.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppText variant="h1">Reset password</AppText>
      <AppText variant="body" color="secondary">
        We'll email you a link to reset your password.
      </AppText>

      {sent ? (
        <View style={styles.sentBox}>
          <AppText variant="bodyMedium" color="success">
            Reset link sent! Check your inbox.
          </AppText>
          <Button title="Back to Sign In" variant="outline" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      ) : (
        <View style={styles.form}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <AppText variant="small" color="danger">
                {error}
              </AppText>
            </View>
          )}
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Button title="Send Reset Link" onPress={handleSubmit} />
          <Link href="/(auth)/sign-in" style={styles.backLink}>
            <AppText variant="bodyMedium" color="primary">
              Back to sign in
            </AppText>
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  form: { gap: 16, marginTop: 16 },
  errorBox: { padding: 12, borderRadius: 10 },
  sentBox: { gap: 16, marginTop: 24 },
  backLink: { alignSelf: 'center', marginTop: 8 },
});
