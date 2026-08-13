import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction, style }: EmptyStateProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.back(1.4)) });
  }, [progress]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.4 + progress.value * 0.6 },
      { translateY: (1 - progress.value) * -16 },
    ],
  }));

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.primaryLight },
          iconStyle,
        ]}
      >
        <Feather name={icon} size={34} color={colors.primary} />
      </Animated.View>
      <AppText variant="h3" style={styles.title}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="muted" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <AnimatedButton title={actionLabel} onPress={onAction} size="sm" fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  iconCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 280 },
  action: { marginTop: 12 },
});