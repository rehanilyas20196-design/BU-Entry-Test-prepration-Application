import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      await signUp(email.trim(), password, fullName.trim());
      router.replace('/onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <AppText variant="h1">Create your account</AppText>
          <AppText variant="body" color="secondary">
            Set up your personalized BUET preparation.
          </AppText>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <AppText variant="small" color="danger">
                {error}
              </AppText>
            </View>
          )}

          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Ali Khan" autoComplete="name" />
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" />
          <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry autoComplete="new-password" />

          <Button title="Create Account" onPress={handleSubmit} loading={loading} size="lg" />

          <View style={styles.footerRow}>
            <AppText variant="body" color="secondary">
              Already have an account?{' '}
            </AppText>
            <Link href="/(auth)/sign-in">
              <AppText variant="bodyMedium" color="primary">
                Sign in
              </AppText>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 32 },
  header: { gap: 6, alignItems: 'center' },
  logo: { width: 72, height: 72, marginBottom: 4 },
  form: { gap: 16 },
  errorBox: { padding: 12, borderRadius: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
});
