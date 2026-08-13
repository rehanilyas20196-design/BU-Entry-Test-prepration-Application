import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Float3DProps {
  children: React.ReactNode;
  phase?: number;
  intensity?: number;
  duration?: number;
  style?: ViewStyle;
}

/**
 * Wraps content in a gentle, continuous 3D float: slow rotation on both axes
 * (perspective tilt) plus a soft bob. Reduced-motion aware.
 */
export function Float3D({ children, phase = 0, intensity = 2.4, duration = 4600, style }: Float3DProps) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, t, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    const a = (t.value + phase) * Math.PI * 2;
    return {
      transform: [
        { perspective: 700 },
        { rotateX: `${Math.sin(a) * intensity}deg` },
        { rotateY: `${Math.cos(a) * intensity * 0.8}deg` },
        { translateY: -Math.abs(Math.sin((t.value + phase) * Math.PI)) * 3 },
      ],
    };
  });

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}