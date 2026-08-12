import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

interface StateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function LoadingState({ title = 'Loading…' }: { title?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

export function EmptyState({ title, message, onRetry, retryLabel = 'Browse practice' }: StateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={{ fontSize: 28 }}>📚</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
      {onRetry && <Button title={retryLabel} variant="outline" onPress={onRetry} />}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }: StateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerLight }]}>
        <Text style={{ fontSize: 28 }}>⚠️</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
      {onRetry && <Button title={retryLabel} variant="outline" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
});
