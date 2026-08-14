import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type PracticeAccent = { main: string; soft: string; ring: string };
export type PracticeEffect = 'zap' | 'target' | 'activity' | 'calendar' | 'clock' | 'shield' | 'undo';
export type PracticeModeIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface PracticeModeCardProps {
  label: string;
  subtitle: string;
  icon: PracticeModeIcon;
  accent: PracticeAccent;
  effect: PracticeEffect;
  index: number;
  wide?: boolean;
  premium?: boolean;
  onPress: () => void;
}

export function PracticeModeCard({
  label,
  subtitle,
  icon,
  accent,
  effect,
  index,
  wide = false,
  premium = false,
  onPress,
}: PracticeModeCardProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  const reveal = useSharedValue(0);
  const press = useSharedValue(0);
  const sweep = useSharedValue(0);
  const micro = useSharedValue(0);

  useEffect(() => {
    reveal.value = withDelay(index * 70, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
  }, [index, reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 14 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + press.value * 0.24,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - press.value * 0.03 },
      { translateY: press.value * 1.5 },
    ],
  }));

  const iconLiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -press.value * 3 }],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + press.value * 0.26,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (sweep.value * 2 - 1) * 120 }, { rotateZ: '24deg' }],
  }));

  const microStyle = useAnimatedStyle(() => {
    const p = micro.value;
    switch (effect) {
      case 'zap':
        return { transform: [{ scale: 1 + Math.sin(p * Math.PI) * 0.14 }] };
      case 'target':
        return { transform: [{ scale: 1 + Math.sin(p * Math.PI) * 0.1 }] };
      case 'activity':
        return {
          opacity: 0.8 + 0.2 * Math.sin(p * Math.PI * 2),
          transform: [{ scale: 1 + Math.sin(p * Math.PI * 2) * 0.05 }],
        };
      case 'calendar':
        return { transform: [{ translateY: Math.sin(p * Math.PI) * 3 }] };
      case 'clock':
        return { transform: [{ rotate: `${Math.sin(p * Math.PI) * 14}deg` }] };
      case 'shield':
        return { opacity: 0.6 + 0.4 * p };
      case 'undo':
        return { transform: [{ rotate: `${Math.sin(p * Math.PI) * -18}deg` }] };
      default:
        return {};
    }
  });

  const triggerMicro = () => {
    if (reduced) return;
    micro.value = 0;
    micro.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.quad) });
  };

  const onPressIn = () => {
    press.value = withSpring(1, { damping: 20, stiffness: 340, mass: 0.6 });
    sweep.value = 0;
    sweep.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
    triggerMicro();
  };

  const onPressOut = () => {
    press.value = withSpring(0, { damping: 18, stiffness: 260, mass: 0.7 });
  };

  const dark = colors.isDark;
  const iconColor = dark ? accent.soft : accent.main;

  return (
    <Animated.View style={[styles.wrap, wide && styles.wrapWide, revealStyle]}>
      <Animated.View
        style={[
          styles.shadow,
          {
            shadowColor: dark ? '#000000' : '#3A3F78',
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 9 },
          },
          shadowStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            { borderColor: dark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.9)' },
          ]}
        >
          <LinearGradient
            colors={
              dark
                ? (['rgba(28,35,60,0.72)', 'rgba(19,24,44,0.58)'] as [string, string])
                : (['rgba(255,255,255,0.74)', 'rgba(245,247,253,0.55)'] as [string, string])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[StyleSheet.absoluteFill, accentStyle]}>
            <LinearGradient
              colors={[accent.soft, accent.main]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <LinearGradient
            colors={
              dark
                ? (['rgba(255,255,255,0.09)', 'rgba(255,255,255,0)'] as [string, string])
                : (['rgba(255,255,255,0.95)', 'rgba(255,255,255,0)'] as [string, string])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.content}>
            {premium && (
              <View style={styles.premiumBadge}>
                <MaterialCommunityIcons name="crown" size={10} color="#B45309" />
              </View>
            )}
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.34)',
                  borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.55)',
                },
              ]}
            >
              <LinearGradient
                colors={[`${accent.soft}2E`, `${accent.main}1F`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={[microStyle, iconLiftStyle]}>
                <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
              </Animated.View>
            </View>

            <View style={styles.textWrap}>
              <AppText variant="label" numberOfLines={1} style={styles.title}>
                {label}
              </AppText>
              <AppText variant="small" color="muted" style={styles.subtitle}>
                {subtitle}
              </AppText>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flexBasis: '100%' },
  wrapWide: { flexBasis: '100%' },
  shadow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 22,
    backgroundColor: 'rgba(120,130,200,0.02)',
    shadowOpacity: 1,
    elevation: 6,
  },
  pressable: { borderRadius: 22, flex: 1 },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 100,
    justifyContent: 'center',
  },
  sweep: {
    position: 'absolute',
    top: -16, bottom: -16, left: -16,
    width: 88,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDE68A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F59E0B',
    zIndex: 2,
  },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontWeight: '700' },
  subtitle: { fontWeight: '500', lineHeight: 15 },
});