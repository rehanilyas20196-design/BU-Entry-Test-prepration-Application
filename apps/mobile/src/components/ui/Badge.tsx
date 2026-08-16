import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();

  const toneStyles: Record<BadgeTone, { bg: string; fg: string }> = {
    primary: { bg: colors.primaryLight, fg: colors.primary },
    success: { bg: colors.successLight, fg: colors.success },
    warning: { bg: colors.warningLight, fg: colors.warning },
    danger: { bg: colors.dangerLight, fg: colors.danger },
    info: { bg: colors.infoLight, fg: colors.info },
    neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
  };

  return (
    <View style={[styles.badge, { backgroundColor: toneStyles[tone].bg }]}>
      <Text style={[styles.text, { color: toneStyles[tone].fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '500' },
});
