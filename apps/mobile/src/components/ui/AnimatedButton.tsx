import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius } from '@/theme/theme';

interface AnimatedButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  gradient?: readonly [string, string, ...string[]];
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  gradient,
  fullWidth = true,
  style,
}: AnimatedButtonProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (reduced) return;
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 300 });
  };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  const background = !isPrimary && !isSecondary ? 'transparent' : undefined;
  const borderColor = isOutline ? colors.primary : variant === 'ghost' ? 'transparent' : colors.border;
  const textColor = isPrimary ? '#FFFFFF' : isSecondary ? colors.primary : isOutline ? colors.primary : colors.textSecondary;

  const padding =
    size === 'sm' ? { paddingVertical: 9, paddingHorizontal: 14 } : size === 'lg' ? { paddingVertical: 16, paddingHorizontal: 24 } : { paddingVertical: 13, paddingHorizontal: 18 };
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 16;

  const content = (
    <Animated.View style={[styles.inner, animatedStyle]}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFF' : textColor} />
      ) : (
        <>
          {icon}
          <AppText variant="label" style={{ color: textColor, fontSize, lineHeight: fontSize + 6 }} numberOfLines={1}>
            {title}
          </AppText>
        </>
      )}
    </Animated.View>
  );

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        padding,
        fullWidth && styles.fullWidth,
        { borderColor, borderWidth: isOutline ? 1.5 : 0, borderRadius: radius.lg },
        background ? { backgroundColor: background } : null,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[...(gradient ?? [colors.gradientStart, colors.gradientMid, colors.gradientEnd])] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {isPrimary ? <View style={styles.shine} /> : null}
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fullWidth: { width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.92 },
  shine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
    opacity: 0,
  },
});