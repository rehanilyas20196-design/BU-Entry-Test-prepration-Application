import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  animated?: boolean;
}

/** Renders the app background surface. Animated glow intentionally removed. */
export function GradientBackground({ children, colors: _colors, animated: _animated }: GradientBackgroundProps) {
  const { colors } = useTheme();
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>{children}</View>;
}
