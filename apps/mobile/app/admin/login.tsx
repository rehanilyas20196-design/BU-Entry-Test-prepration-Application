import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAdminAuthStore } from '@/admin/adminAuth';
import { adminColors, AdminButton, AdminInput } from '@/admin/components/ui';

export default function AdminLoginScreen() {
  const { login, loading, error } = useAdminAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Enter both email and password');
      return;
    }
    try {
      await login(email.trim(), password);
      router.replace('/admin' as any);
    } catch (e: any) {
      setFormError(e?.message ?? 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: adminColors.bg }]}
    >
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Feather name="shield" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandText}>BUET Prep AI</Text>
            <Text style={styles.brandSub}>Admin Console</Text>
          </View>
        </View>

        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Use your admin credentials to manage the platform.</Text>

        <AdminInput
          label="Admin email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="admin@buetprep.ai"
          editable={!loading}
        />
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              placeholder="••••••••"
              placeholderTextColor={adminColors.textMuted}
              autoCapitalize="none"
              autoComplete="password"
              onSubmitEditing={submit}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={adminColors.textMuted} />
            </Pressable>
          </View>
        </View>

        {(formError || error) ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color={adminColors.danger} />
            <Text style={styles.errorText}>{formError ?? error}</Text>
          </View>
        ) : null}

        <AdminButton title={loading ? 'Signing in...' : 'Sign in'} onPress={submit} loading={loading} style={{ marginTop: 4 }} />

        <Text style={styles.footnote}>Default: admin@buetprep.ai / Admin@123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: adminColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 28,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: adminColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.text,
  },
  brandSub: {
    fontSize: 12,
    color: adminColors.textMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.text,
  },
  subtitle: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginBottom: 16,
  },
  fieldWrap: {
    marginBottom: 12,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.text,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: adminColors.surface,
    minHeight: 44,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: adminColors.text,
    paddingVertical: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: adminColors.dangerLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: adminColors.danger,
    flex: 1,
  },
  footnote: {
    fontSize: 12,
    color: adminColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
