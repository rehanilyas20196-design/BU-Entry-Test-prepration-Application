import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ParticleSpec {
  id: number;
  size: number;
  x: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface FloatingParticlesProps {
  count?: number;
  style?: ViewStyle;
  color?: string;
}

function makeParticles(count: number, seed = 1): ParticleSpec[] {
  const particles: ParticleSpec[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      size: 3 + ((i * seed * 7) % 4),
      x: ((i * 37 + seed * 11) % 100) / 100,
      duration: 3800 + ((i * 971) % 3600),
      delay: (i * 533) % 4000,
      opacity: 0.25 + ((i * 13) % 40) / 100,
    });
  }
  return particles;
}

function Particle({ particle, color }: { particle: ParticleSpec; color: string }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(1.1);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    y.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(-0.1, { duration: particle.duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    x.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1, { duration: particle.duration * 0.6, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    opacity.value = withDelay(
      particle.delay,
      withTiming(particle.opacity, { duration: 600 }),
    );
  }, [particle, reduced, y, x, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: (x.value - 0.5) * 120 },
      { translateY: y.value * 400 },
      { scale: reduced ? 1 : 0.8 + x.value * 0.4 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { width: particle.size, height: particle.size, backgroundColor: color, left: particle.x * 100 },
        style,
      ]}
    />
  );
}

export function FloatingParticles({ count = 14, style, color }: FloatingParticlesProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const particles = useMemo(() => makeParticles(count), [count]);

  if (reduced) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wrap, style]}>
      {particles.map((p) => (
        <Particle key={p.id} particle={p} color={color ?? colors.accent} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  particle: { position: 'absolute', borderRadius: 999 },
});