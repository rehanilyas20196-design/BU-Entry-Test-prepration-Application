import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, motion } from '@/theme/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function Input({ label, error, icon, trailing, ...props }: InputProps) {
  const { colors } = useTheme();
  const focused = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);

  const focusRing = focused.interpolate({ inputRange: [0, 1], outputRange: ['rgba(37,99,235,0)', 'rgba(37,99,235,0.4)'] });

  return (
    <View style={styles.wrap}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : isFocused ? colors.primary : colors.border,
            borderWidth: error || isFocused ? 1.5 : 1,
            shadowColor: error ? colors.danger : colors.primary,
            shadowRadius: focusRing,
          },
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          onFocus={(e) => {
            setIsFocused(true);
            Animated.timing(focused, { toValue: 1, duration: motion.fast, useNativeDriver: false }).start();
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            Animated.timing(focused, { toValue: 0, duration: motion.fast, useNativeDriver: false }).start();
            props.onBlur?.(e);
          }}
          {...props}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </Animated.View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

/** Alias kept for backwards compatibility. */
export const TextField = Input;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  inputWrap: {
    minHeight: 40,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
  },
  trailing: { marginLeft: 8 },
  error: { fontSize: 13, fontWeight: '500' },
});
