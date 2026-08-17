import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface BookSpec {
  id: number;
  width: number;
  height: number;
  tilt: number;
  fallDuration: number;
  delay: number;
  colors: readonly [string, string];
}

const BOOK_PALETTES: readonly (readonly [string, string])[] = [
  ['#6366F1', '#4F46E5'],
  ['#8B5CF6', '#7C3AED'],
  ['#A855F7', '#9333EA'],
  ['#06B6D4', '#0891B2'],
  ['#EC4899', '#DB2777'],
  ['#F59E0B', '#D97706'],
  ['#10B981', '#059669'],
  ['#3B82F6', '#2563EB'],
];

function makeBooks(seed = 0): BookSpec[] {
  const count = 7;
  const books: BookSpec[] = [];
  for (let i = 0; i < count; i++) {
    books.push({
      id: i,
      width: 16 + ((i * 5 + seed) % 7),
      height: 52 + ((i * 13 + seed * 3) % 34),
      tilt: ((i % 2 === 0 ? 1 : -1) * (4 + (i % 4) * 2)),
      fallDuration: 650 + ((i * 137 + seed) % 500),
      delay: i * 210 + ((seed * 40) % 120),
      colors: BOOK_PALETTES[(i + seed) % BOOK_PALETTES.length],
    });
  }
  return books;
}

function FallingBook({
  spec,
  stackIndex,
  groundY,
  centerX,
  onDone,
}: {
  spec: BookSpec;
  stackIndex: number;
  groundY: number;
  centerX: number;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const settle = useSharedValue(0);

  const targetY = groundY - spec.height;

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      spec.delay,
      withTiming(1, {
        duration: reduced ? 0 : spec.fallDuration,
        easing: Easing.in(Easing.quad),
      }),
    );
    settle.value = withDelay(
      spec.delay + (reduced ? 0 : spec.fallDuration),
      withSpring(1, { damping: 11, stiffness: 160, mass: 0.9 }),
    );
    if (onDone && stackIndex === 6) {
      const doneAt = spec.delay + spec.fallDuration + 420;
      const t = setTimeout(() => runOnJS(onDone)(), doneAt);
      return () => clearTimeout(t);
    }
  }, [spec, reduced, progress, settle, stackIndex, onDone]);

  const animatedStyle = useAnimatedStyle(() => {
    const fallY = interpolate(progress.value, [0, 1], [-(groundY + 60), 0]);
    const rotation = interpolate(progress.value, [0, 1], [spec.tilt * 5, 0]);
    const bounceY = (1 - settle.value) * 18;
    return {
      transform: [
        { translateX: centerX - spec.width / 2 },
        { translateY: targetY + fallY + bounceY },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.book,
        {
          width: spec.width,
          height: spec.height,
          borderRadius: 4,
          marginTop: 0,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[...spec.colors] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.spine} />
      <View style={styles.pageLine} />
    </Animated.View>
  );
}

interface AnimatedBookLoaderProps {
  height?: number;
  label?: string;
  subtitle?: string;
  onComplete?: () => void;
  showLabel?: boolean;
  shelfColor?: string;
  groundColor?: string;
}

export function AnimatedBookLoader({
  height = 240,
  label = 'BUET PREP AI',
  subtitle = 'Preparing your study stack',
  onComplete,
  showLabel = true,
  shelfColor,
  groundColor,
}: AnimatedBookLoaderProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const books = React.useMemo(() => makeBooks(), []);
  const groundY = height - 6;
  const totalStackWidth = books.reduce((acc, b) => acc + b.width, 0) + (books.length - 1) * 6;

  let cumulative = 0;
  const positions = books.map((b) => {
    const offset = cumulative;
    cumulative += b.width + 6;
    return offset;
  });

  let lastDone = false;
  const handleDone = () => {
    if (!lastDone) {
      lastDone = true;
      onComplete?.();
    }
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <View
        style={[
          styles.shelf,
          { width: Math.min(width * 0.82, totalStackWidth + 40), backgroundColor: shelfColor ?? colors.surfaceAlt },
        ]}
      />
      <View
        style={[
          styles.ground,
          {
            width: Math.min(width * 0.82, totalStackWidth + 40),
            backgroundColor: groundColor ?? colors.primary,
          },
        ]}
      />
      {books.map((b, i) => {
        const centerX = (Math.min(width * 0.82, totalStackWidth + 40) - totalStackWidth) / 2 + positions[i] + b.width / 2;
        return (
          <FallingBook
            key={b.id}
            spec={b}
            stackIndex={i}
            groundY={groundY}
            centerX={centerX}
            onDone={i === books.length - 1 ? handleDone : undefined}
          />
        );
      })}
      {showLabel && (
        <View style={styles.labelWrap}>
          <AppText variant="h3" color="primary" style={styles.label}>
            {label}
          </AppText>
          {subtitle ? (
            <AppText variant="small" color="muted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  book: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  spine: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  pageLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  shelf: { position: 'absolute', bottom: 1, height: 10, borderRadius: 3 },
  ground: { position: 'absolute', bottom: 0, height: 3, borderRadius: 2 },
  labelWrap: { position: 'absolute', top: 0, alignItems: 'center', gap: 2 },
  label: { letterSpacing: 1 },
});