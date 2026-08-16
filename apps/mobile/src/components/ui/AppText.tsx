import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/theme';

interface AppTextProps {
  children: React.ReactNode;
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'label' | 'caption' | 'small' | 'micro';
  color?: 'text' | 'secondary' | 'muted' | 'primary' | 'danger' | 'success' | 'warning';
  numberOfLines?: number;
  style?: object;
}

const variantToStyle = {
  display: typography.display,
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  body: typography.body,
  bodyMedium: typography.bodyMedium,
  label: typography.label,
  caption: typography.caption,
  small: typography.small,
  micro: typography.micro,
};

export function AppText({ children, variant = 'body', color = 'text', numberOfLines, style }: AppTextProps) {
  const { colors } = useTheme();

  const colorMap = {
    text: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[variantToStyle[variant], { color: colorMap[color] }, style]}
      accessibilityRole="text"
    >
      {children}
    </Text>
  );
}
