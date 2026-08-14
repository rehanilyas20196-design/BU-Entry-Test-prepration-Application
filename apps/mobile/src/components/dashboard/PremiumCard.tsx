import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radiusTokens } from '@/theme/tokens';

const GOLD = {
  base: '#F59E0B',
  soft: '#FDE68A',
  ring: '#FCD34D',
  deep: '#B45309',
};

interface PremiumCardProps {
  onPress: () => void;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
}

export function PremiumCard({
  onPress,
  style,
  title = 'Go Premium',
  subtitle = 'Unlock every feature and ace the BUET',
}: PremiumCardProps) {
  const reduced = useReducedMotion();

  const press = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      sweep.value = 0;
    }
  }, [reduced, sweep]);

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + press.value * 0.18,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.025 }, { translateY: press.value * 1 }],
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -press.value * 2.5 }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (sweep.value * 2 - 1) * 150 }, { rotateZ: '22deg' }],
  }));

  const onPressIn = () => {
    press.value = withSpring(1, { damping: 20, stiffness: 360, mass: 0.6 });
    sweep.value = 0;
    sweep.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) });
  };

  const onPressOut = () => {
    press.value = withSpring(0, { damping: 18, stiffness: 280, mass: 0.7 });
  };

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.shadow,
          { shadowColor: '#1E1B4B', shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
          shadowStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Upgrade to Premium"
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            { borderColor: 'rgba(255,255,255,0.22)' },
          ]}
        >
          <LinearGradient
            colors={['#312E81', '#5B21B6', '#7C3AED'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.8 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.goldGlow} pointerEvents="none" />
          <FloatingParticles count={7} color={GOLD.soft} />
          <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.row}>
            <Animated.View style={[styles.crownWrap, crownStyle]}>
              <MaterialCommunityIcons name="crown" size={22} color={GOLD.soft} />
            </Animated.View>
            <View style={styles.textWrap}>
              <AppText variant="label" style={styles.title} numberOfLines={1}>
                {title}
              </AppText>
              <AppText variant="caption" style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </AppText>
            </View>
            <View style={styles.pill}>
              <AppText variant="caption" style={styles.pillText}>Upgrade</AppText>
              <MaterialCommunityIcons name="chevron-right" size={15} color={GOLD.soft} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '100%' },
  shadow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(76,29,149,0.02)',
    borderRadius: radiusTokens.card,
    shadowOpacity: 1,
    elevation: 8,
  },
  pressable: { borderRadius: radiusTokens.card },
  card: {
    borderRadius: radiusTokens.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 74,
    justifyContent: 'center',
  },
  goldGlow: {
    position: 'absolute',
    top: -40, right: -30,
    width: 150, height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(251,191,36,0.16)',
  },
  sweep: {
    position: 'absolute',
    top: -18, bottom: -18, left: -18,
    width: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  crownWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,191,36,0.45)',
  },
  textWrap: { flex: 1, gap: 1 },
  title: { color: '#FFFFFF', fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.82)' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,191,36,0.45)',
  },
  pillText: { color: GOLD.soft, fontWeight: '700' },
});