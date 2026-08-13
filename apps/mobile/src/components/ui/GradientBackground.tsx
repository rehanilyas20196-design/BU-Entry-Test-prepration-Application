import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  animated?: boolean;
}

export function GradientBackground({
  children,
  colors,
  animated = false,
}: GradientBackgroundProps) {
  const { colors: c } = useTheme();
  const reduced = useReducedMotion();
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!animated || reduced) return;
    glow.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [animated, reduced, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.3,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  const stops = colors ?? [c.gradientStart, c.gradientMid, c.gradientEnd];

  return (
    <Animated.View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[...stops] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {animated && (
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent'] as [string, string, ...string[]]}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 1, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      {children}
    </Animated.View>
  );
}