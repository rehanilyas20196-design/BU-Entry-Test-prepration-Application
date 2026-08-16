import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, style }: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerLight }]}>
        <Feather name="cloud-off" size={30} color={colors.danger} />
      </View>
      <AppText variant="h3" style={styles.title}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="muted" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {onRetry ? (
        <View style={styles.action}>
          <Button title="Try again" onPress={onRetry} size="sm" fullWidth={false} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 300 },
  action: { marginTop: 12 },
});
