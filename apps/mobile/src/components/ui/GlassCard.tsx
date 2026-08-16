import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  gradient?: readonly [string, string, ...string[]];
  borderless?: boolean;
  glow?: boolean;
}

/** Clean light surface card (hairline border, 12px radius). */
export function GlassCard({ children, style, borderless = false }: GlassCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: borderless ? 'transparent' : colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
