import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
  testID?: string;
}

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

  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.primaryLight
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? colors.primary
        : variant === 'outline'
          ? colors.primary
          : colors.textSecondary;

  const borderColor = variant === 'outline' ? colors.primary : variant === 'ghost' ? 'transparent' : colors.border;

  const padding =
    size === 'sm' ? { paddingVertical: 8, paddingHorizontal: 14 } : size === 'lg' ? { paddingVertical: 16, paddingHorizontal: 24 } : { paddingVertical: 12, paddingHorizontal: 18 };

  const font =
    size === 'sm' ? 14 : size === 'lg' ? 17 : 16;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        padding,
        fullWidth && styles.fullWidth,
        { backgroundColor: background, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0 },
        pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor, fontSize: font }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontWeight: '700' },
});
