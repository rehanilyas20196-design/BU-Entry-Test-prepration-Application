import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function AnimatedSwitch({ value, onValueChange, disabled }: AnimatedSwitchProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = value ? 1 : 0;
      return;
    }
    progress.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 240, mass: 0.6 });
  }, [value, reduced, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0.5 ? colors.primary : colors.surfaceAlt,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 18 }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={styles.press}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumbInner, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { paddingVertical: 4 },
  track: { width: 42, height: 24, borderRadius: 12, padding: 3, justifyContent: 'center' },
  thumbInner: { width: 18, height: 18, borderRadius: 9 },
});
