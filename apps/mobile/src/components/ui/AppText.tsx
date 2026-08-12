import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AppTextProps {
  children: React.ReactNode;
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'label' | 'caption' | 'small' | 'micro';
  color?: 'text' | 'secondary' | 'muted' | 'primary' | 'danger' | 'success' | 'warning';
  numberOfLines?: number;
  style?: object;
}

const variantToStyle = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
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
