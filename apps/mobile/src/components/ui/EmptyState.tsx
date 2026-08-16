import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction, style }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
        <Feather name={icon} size={30} color={colors.textMuted} />
      </View>
      <AppText variant="h3" style={styles.title}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="muted" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} size="sm" fullWidth={false} />
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
