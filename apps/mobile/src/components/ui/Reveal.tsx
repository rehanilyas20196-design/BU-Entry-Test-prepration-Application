import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RevealProps {
  scrollY: SharedValue<number>;
  index?: number;
  distance?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Reveals its content (fade + slide-up) the first time it scrolls into view.
 * Items already in the viewport on mount reveal with a staggered entrance.
 */
export function Reveal({ scrollY, index = 0, distance = 26, children, style }: RevealProps) {
  const reduced = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const y = useSharedValue(0);
  const progress = useSharedValue(reduced ? 1 : 0);
  const fired = useSharedValue(reduced);

  useAnimatedReaction(
    () => scrollY.value + windowHeight,
    (viewportBottom) => {
      if (!fired.value && viewportBottom > y.value + 8) {
        fired.value = true;
        progress.value = withDelay(
          index * 70,
          withSpring(1, { damping: 18, stiffness: 170, mass: 0.8 }),
        );
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return (
    <Animated.View
      onLayout={(e) => {
        y.value = e.nativeEvent.layout.y;
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </Animated.View>
  );
}

interface ScrollFadeProps {
  visible: boolean;
  index?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/** Simple mount-entrance used for headers (fires once when `visible` flips true). */
export function ScrollFade({ visible, index = 0, children, style }: ScrollFadeProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!visible) return;
    progress.value = withDelay(index * 70, withTiming(1, { duration: 500 }));
  }, [visible, index, progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 22 }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

export const revealStyles = StyleSheet.create({});