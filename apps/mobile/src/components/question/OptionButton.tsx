import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius } from '@/theme/theme';

export interface QuestionOption {
  key: string;
  text: string;
}

export interface OptionButtonProps {
  option: QuestionOption;
  selected: boolean;
  disabled?: boolean;
  showCorrect?: boolean;
  isCorrectAnswer?: boolean;
  onSelect?: (option: QuestionOption) => void;
}

export function OptionButton({
  option,
  selected,
  disabled,
  showCorrect,
  isCorrectAnswer,
  onSelect,
}: OptionButtonProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const reveal = useSharedValue(0);

  const isCorrectShown = showCorrect && isCorrectAnswer;
  const isWrongShown = showCorrect && selected && !isCorrectAnswer;

  useEffect(() => {
    if (reduced) return;
    if (isCorrectShown) {
      scale.value = withSequence(
        withTiming(1.03, { duration: 120 }),
        withSpring(1, { damping: 9, stiffness: 220 }),
      );
    } else if (isWrongShown) {
      shake.value = withSequence(
        withTiming(-8, { duration: 70 }),
        withTiming(8, { duration: 70 }),
        withTiming(-5, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
    reveal.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
  }, [isCorrectShown, isWrongShown, reduced, scale, shake, reveal]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { scale: scale.value },
    ],
  }));

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ scale: 0.5 + reveal.value * 0.5 }],
  }));

  let bg: string = selected ? colors.primaryLight : colors.surface;
  let border: string = selected ? colors.primary : colors.border;
  let fg: string = selected ? colors.primary : colors.text;
  let badgeBg: string = selected ? colors.primary : colors.surfaceAlt;
  let badgeFg: string = selected ? '#FFF' : colors.textSecondary;

  if (isCorrectShown) {
    bg = colors.successLight;
    border = colors.success;
    fg = colors.success;
    badgeBg = colors.success;
    badgeFg = '#FFF';
  } else if (isWrongShown) {
    bg = colors.dangerLight;
    border = colors.danger;
    fg = colors.danger;
    badgeBg = colors.danger;
    badgeFg = '#FFF';
  }

  return (
    <Pressable
      onPress={() => !disabled && onSelect?.(option)}
      disabled={disabled || showCorrect}
      style={({ pressed }) => [
        pressed && !disabled && { transform: [{ scale: 0.985 }], opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Option ${option.key}: ${option.text}`}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          styles.option,
          { backgroundColor: bg, borderColor: border },
          animatedStyle,
        ]}
      >
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <AppText variant="label" style={{ color: badgeFg }}>{option.key}</AppText>
        </View>
        <AppText variant="body" style={[styles.text, { color: fg }]}>
          {option.text}
        </AppText>
        {showCorrect && (
          <Animated.View style={[styles.status, revealStyle]}>
            {isCorrectShown && (
              <View style={[styles.statusCircle, { backgroundColor: colors.success }]}>
                <AppText variant="label" style={styles.statusText}>✓</AppText>
              </View>
            )}
            {isWrongShown && (
              <View style={[styles.statusCircle, { backgroundColor: colors.danger }]}>
                <AppText variant="label" style={styles.statusText}>✗</AppText>
              </View>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, lineHeight: 21 },
  status: { marginLeft: 2 },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { color: '#FFF' },
});