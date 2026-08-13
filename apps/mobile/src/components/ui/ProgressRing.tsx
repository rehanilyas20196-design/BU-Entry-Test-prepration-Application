import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  delay?: number;
  label?: string;
  sublabel?: string;
  gradient?: readonly [string, string, ...string[]];
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function ProgressRing({
  size = 110,
  strokeWidth = 10,
  progress,
  delay = 150,
  label,
  sublabel,
  gradient,
  children,
  style,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const [display, setDisplay] = React.useState(0);

  const offset = useSharedValue(circumference);

  useEffect(() => {
    offset.value = circumference;
    offset.value = withDelay(
      delay,
      withTiming(circumference * (1 - clamped), {
        duration: reduced ? 0 : 1100,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [clamped, circumference, delay, reduced, offset]);

  useAnimatedReaction(
    () => offset.value,
    (o) => {
      if (o > 0 && o < circumference) {
        runOnJS(setDisplay)(Math.round((1 - o / circumference) * clamped * 100));
      } else if (o <= 0) {
        runOnJS(setDisplay)(Math.round(clamped * 100));
      }
    },
    [clamped, circumference],
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  const stops = gradient ?? [colors.gradientStart, colors.gradientMid, colors.gradientEnd];

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={stops[0]} />
            <Stop offset="50%" stopColor={stops[1]} />
            <Stop offset="100%" stopColor={stops[2]} />
          </SvgGradient>
        </Defs>
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
          stroke="url(#ring-gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>
        {children ? (
          children
        ) : (
          <>
            <AppText variant="h2" style={styles.label}>
              {label ?? display}
            </AppText>
            {sublabel && (
              <AppText variant="micro" color="muted">
                {sublabel}
              </AppText>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '800' },
});