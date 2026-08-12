import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

type SkeletonWidth = number | `${number}%`;

interface SkeletonProps {
  width?: SkeletonWidth;
  height?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius.sm,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={16} width="60%" />
      <Skeleton height={12} width="90%" style={styles.gap} />
      <Skeleton height={12} width="80%" style={styles.gap} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10 },
  gap: { marginTop: 4 },
});
