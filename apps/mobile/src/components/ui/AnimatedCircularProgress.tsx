import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedCircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  label?: string;
  sublabel?: string;
  activeColor?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedCircularProgress({
  size = 96,
  strokeWidth = 9,
  progress,
  label,
  sublabel,
  activeColor,
  delay = 300,
  duration = 1000,
}: AnimatedCircularProgressProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const stroke = activeColor ?? (clamped < 0.5 ? colors.warning : clamped < 0.75 ? colors.accent : colors.success);

  const offset = useSharedValue(circumference);

  useEffect(() => {
    offset.value = circumference;
    offset.value = withDelay(
      delay,
      withTiming(circumference * (1 - clamped), { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [clamped, circumference, delay, duration, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.label, { color: colors.text }]}>{label ?? `${Math.round(clamped * 100)}%`}</Text>
        {sublabel && <Text style={[styles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 22, fontWeight: '800' },
  sublabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});