import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Four colorful diagonal bars (purple, teal, pink, orange) forming an abstract
 * "M" / checkmark. Bars are positioned with fractional coordinates so the whole
 * mark scales fluidly with its container (no fixed-pixel page layout).
 *
 * Entrance: each bar drops from above with a staggered delay (100ms apart),
 * lands with a slight rotation overshoot, springs into place, then idles with
 * a slow floating loop. When reduced motion is requested this component should
 * not be used — SplashScreen swaps in LogoMarkCSS instead.
 */

interface BarSpec {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate: number;
  colors: readonly [string, string];
  delay: number;
}

export const BAR_SPECS: readonly BarSpec[] = [
  {
    left: 0.04,
    top: 0.12,
    width: 0.375,
    height: 0.1,
    rotate: 45,
    colors: ['#C4B5FD', '#7C3AED'],
    delay: 100,
  },
  {
    left: 0.14,
    top: 0.32,
    width: 0.375,
    height: 0.1,
    rotate: 45,
    colors: ['#5EEAD4', '#0D9488'],
    delay: 200,
  },
  {
    left: 0.49,
    top: 0.32,
    width: 0.375,
    height: 0.1,
    rotate: -45,
    colors: ['#F9A8D4', '#DB2777'],
    delay: 300,
  },
  {
    left: 0.59,
    top: 0.12,
    width: 0.375,
    height: 0.1,
    rotate: -45,
    colors: ['#FDBA74', '#EA580C'],
    delay: 400,
  },
];

interface BarProps {
  spec: BarSpec;
  size: number;
}

function Bar({ spec, size }: BarProps) {
  const reduced = useReducedMotion();
  const drop = useSharedValue(0);
  const settle = useSharedValue(0);
  const idle = useSharedValue(0);

  useEffect(() => {
    drop.value = withDelay(
      spec.delay,
      withTiming(1, { duration: reduced ? 0 : 460, easing: Easing.out(Easing.cubic) }),
    );
    settle.value = withDelay(
      spec.delay + 460,
      withSpring(1, { damping: 10, stiffness: 90, mass: 0.8 }),
    );
    if (!reduced) {
      idle.value = withRepeat(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }
  }, [spec.delay, reduced, drop, settle, idle]);

  const animatedStyle = useAnimatedStyle(() => {
    const dropY = interpolate(drop.value, [0, 1], [-size * 0.7, 0]);
    const rotation = interpolate(drop.value, [0, 1], [spec.rotate + 12, spec.rotate]);
    const bounceY = (1 - settle.value) * 14;
    const idleY = Math.sin(idle.value * Math.PI * 2) * 3;
    const idleRot = Math.sin(idle.value * Math.PI * 2) * 2;
    return {
      opacity: reduced ? 1 : drop.value,
      transform: [
        { translateY: dropY + bounceY + idleY },
        { rotate: `${rotation + idleRot}deg` },
      ],
    };
  });

  const x = spec.left * size;
  const y = spec.top * size;
  const w = spec.width * size;
  const h = spec.height * size;

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: h / 2,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[...spec.colors] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.highlight} />
    </Animated.View>
  );
}

interface LogoMark3DProps {
  size?: number;
}

export function LogoMark3D({ size = 160 }: LogoMark3DProps) {
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {BAR_SPECS.map((spec) => (
        <Bar key={spec.delay} spec={spec} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});