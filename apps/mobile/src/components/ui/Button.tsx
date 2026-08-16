import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, motion } from '@/theme/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
  testID?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 36, md: 40, lg: 44 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = true,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(press, { toValue: 0, duration: 0, useNativeDriver: true }).start();
  }, [press]);

  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  const background =
    isPrimary ? colors.primary
    : isDanger ? colors.danger
    : variant === 'secondary' ? colors.primaryLight
    : 'transparent';

  const textColor =
    isPrimary || isDanger ? '#FFFFFF'
    : variant === 'secondary' || variant === 'outline' ? colors.primary
    : colors.textSecondary;

  const borderColor = variant === 'outline' ? colors.primary : colors.border;
  const borderWidth = variant === 'outline' ? 1 : variant === 'ghost' ? 0 : 1;

  const fontSizes: Record<ButtonSize, number> = { sm: 14, md: 15, lg: 15 };

  const opacity = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] });

  return (
    <Animated.View style={[{ opacity, alignSelf: fullWidth ? 'stretch' : 'flex-start' }]}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={() => Animated.timing(press, { toValue: 1, duration: motion.fast, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(press, { toValue: 0, duration: motion.fast, useNativeDriver: true }).start()}
        disabled={disabled || loading}
        style={[
          styles.base,
          {
            height: HEIGHTS[size],
            paddingHorizontal: size === 'sm' ? 14 : size === 'lg' ? 24 : 20,
            backgroundColor: background,
            borderColor,
            borderWidth,
            opacity: disabled || loading ? 0.55 : 1,
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text style={[styles.label, { color: textColor, fontSize: fontSizes[size] }]}>{title}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontWeight: '500' },
});
