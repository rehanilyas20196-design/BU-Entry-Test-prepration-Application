import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: object;
}

export function FadeInView({ children, delay = 0, distance = 20, style }: FadeInViewProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, distance, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: object;
}

export function AnimatedNumber({ value, duration = 900, delay = 200, style }: AnimatedNumberProps) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [value, duration, delay, progress]);

  useAnimatedReaction(
    () => progress.value,
    (p) => {
      runOnJS(setDisplay)(Math.round(p * value));
    },
    [value],
  );

  return <AppText style={style}>{display}</AppText>;
}

interface AnimatedProgressBarProps {
  progress: number; // 0..1
  height?: number;
  color?: string;
  gradient?: readonly [string, string, ...string[]];
  trackColor?: string;
  delay?: number;
  style?: object;
}

export function AnimatedProgressBar({
  progress,
  height = 8,
  color,
  gradient,
  trackColor,
  delay = 100,
  style,
}: AnimatedProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = 0;
    width.value = withDelay(
      delay,
      withTiming(clamped, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [clamped, delay, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    backgroundColor: gradient ? undefined : color ?? colors.primary,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? colors.surfaceAlt },
        style,
      ]}
    >
      <Animated.View style={[styles.fill, animatedStyle]}>
        {gradient ? (
          <LinearGradient
            colors={[...gradient] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});