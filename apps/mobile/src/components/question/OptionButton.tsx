import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
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

  let bg = selected ? colors.primaryLight : colors.surface;
  let border = selected ? colors.primary : colors.border;
  let fg = selected ? colors.primary : colors.text;
  let badgeBg = selected ? colors.primary : colors.surfaceAlt;
  let badgeFg = selected ? '#FFF' : colors.textSecondary;

  if (showCorrect) {
    if (isCorrectAnswer) {
      bg = colors.successLight;
      border = colors.success;
      fg = colors.success;
      badgeBg = colors.success;
      badgeFg = '#FFF';
    } else if (selected && !isCorrectAnswer) {
      bg = colors.dangerLight;
      border = colors.danger;
      fg = colors.danger;
      badgeBg = colors.danger;
      badgeFg = '#FFF';
    }
  }

  return (
    <Pressable
      onPress={() => !disabled && onSelect?.(option)}
      disabled={disabled || showCorrect}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: bg, borderColor: border },
        pressed && !disabled && { transform: [{ scale: 0.99 }], opacity: 0.9 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Option ${option.key}: ${option.text}`}
      accessibilityState={{ selected }}
    >
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={{ color: badgeFg, fontWeight: '700', fontSize: 14 }}>{option.key}</Text>
      </View>
      <Text style={[styles.text, { color: fg }]}>{option.text}</Text>
      {showCorrect && isCorrectAnswer && (
        <Text style={{ color: colors.success, fontSize: 18 }}>✓</Text>
      )}
      {showCorrect && selected && !isCorrectAnswer && (
        <Text style={{ color: colors.danger, fontSize: 18 }}>✗</Text>
      )}
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
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '500' },
});
