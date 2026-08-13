import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Subject3DIconProps {
  emoji: string;
  size?: number;
  duration?: number;
}

/**
 * A pseudo-3D animated icon: the OS-rendered 3D emoji glyph floats and gently
 * rotates on two axes (perspective tilt) to feel like a spinning 3D badge.
 */
export function Subject3DIcon({ emoji, size = 30, duration = 3400 }: Subject3DIconProps) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      float.value = 0;
      tiltX.value = 0;
      tiltY.value = 0;
      return;
    }
    float.value = withRepeat(withTiming(1, { duration: duration * 0.5, easing: Easing.inOut(Easing.sin) }), -1, true);
    tiltX.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
    tiltY.value = withRepeat(withTiming(1, { duration: duration * 0.72, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, float, tiltX, tiltY, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) return { transform: [{ perspective: 300 }] };
    return {
      transform: [
        { perspective: 300 },
        { rotateX: `${Math.sin(tiltX.value * Math.PI) * 16}deg` },
        { rotateY: `${Math.sin(tiltY.value * Math.PI) * 14}deg` },
        { translateY: -Math.sin(float.value * Math.PI) * 5 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <Text style={[styles.emoji, { fontSize: size, lineHeight: size + 8 }]} allowFontScaling={false}>
        {emoji}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  emoji: { textAlign: 'center' },
});
