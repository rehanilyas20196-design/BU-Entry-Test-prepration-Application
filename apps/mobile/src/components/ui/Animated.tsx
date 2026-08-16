import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: object;
}

/** Entrance fade is disabled for the clean, minimal design. */
export function FadeInView({ children, style }: FadeInViewProps) {
  return <View style={style}>{children}</View>;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: object;
}

export function AnimatedNumber({ value, style }: AnimatedNumberProps) {
  return <AppText style={style}>{value}</AppText>;
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
  height = 6,
  color,
  trackColor,
  style,
}: AnimatedProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const fillColor = color ?? colors.primary;

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
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
