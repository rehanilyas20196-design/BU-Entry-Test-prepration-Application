import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  gradient?: readonly [string, string, ...string[]];
  borderless?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, style, gradient, borderless = false, glow = false }: GlassCardProps) {
  const { colors } = useTheme();

  if (gradient) {
    return (
      <LinearGradient
        colors={[...gradient] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, { borderRadius: radius.lg }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  const bgColors = colors.isDark
    ? ([colors.surface, colors.surfaceAlt] as [string, string, ...string[]])
    : (['#FFFFFF', '#F1F4FC'] as [string, string, ...string[]]);

  const glossColors = colors.isDark
    ? (['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as [string, string, ...string[]])
    : (['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'] as [string, string, ...string[]]);

  return (
    <View
      style={[
        styles.base,
        {
          borderColor: colors.isDark ? '#2A3454' : '#E0E4F1',
          shadowColor: glow ? colors.secondary : colors.isDark ? '#000000' : '#6366F1',
          shadowOpacity: glow ? 0.32 : colors.isDark ? 0.35 : 0.15,
          shadowRadius: glow ? 22 : 16,
        },
        !borderless && styles.bordered,
        style,
      ]}
    >
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={glossColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  bordered: { borderWidth: StyleSheet.hairlineWidth },
});