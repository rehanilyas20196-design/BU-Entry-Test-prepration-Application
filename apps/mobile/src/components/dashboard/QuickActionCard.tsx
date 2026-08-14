import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type QuickActionAccent = { main: string; soft: string; ring: string };
export type QuickActionTone = 'primary' | 'secondary' | 'info' | 'utility';
export type QuickActionIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface QuickActionCardProps {
  label: string;
  subtitle: string;
  icon: QuickActionIcon;
  accent: QuickActionAccent;
  tone?: QuickActionTone;
  index: number;
  badge?: QuickActionIcon;
  onPress: () => void;
}

export function QuickActionCard({
  label,
  subtitle,
  icon,
  accent,
  tone = 'secondary',
  index,
  badge,
  onPress,
}: QuickActionCardProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  const reveal = useSharedValue(0);
  const press = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    reveal.value = withDelay(index * 65, withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
    if (!reduced) {
      sweep.value = withDelay(
        320 + index * 340,
        withRepeat(withTiming(1, { duration: 4600, easing: Easing.inOut(Easing.sin) }), -1, false),
      );
    }
  }, [index, reduced, reveal, sweep]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 22 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + press.value * 0.26,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.03 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -press.value * 3 }],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: (tone === 'primary' ? 0.24 : tone === 'info' ? 0.2 : 0.18) + press.value * 0.28,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (sweep.value * 2 - 1) * 120 }, { rotateZ: '24deg' }],
  }));

  const onPressIn = () => {
    press.value = withSpring(1, { damping: 20, stiffness: 340, mass: 0.6 });
  };

  const onPressOut = () => {
    press.value = withSpring(0, { damping: 18, stiffness: 260, mass: 0.7 });
  };

  const dark = colors.isDark;
  const emphasis = tone === 'primary';
  const iconColor = dark ? accent.soft : accent.main;

  return (
    <Animated.View style={[styles.wrap, revealStyle]}>
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
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.34)',
                  borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.55)',
                },
              ]}
            >
              {emphasis && (
                <LinearGradient
                  colors={[`${accent.soft}2E`, `${accent.main}1F`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Animated.View style={iconStyle}>
                <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
              </Animated.View>
            </View>

            <View style={styles.textWrap}>
              <AppText variant="label" numberOfLines={1} style={[styles.title, emphasis && styles.titlePrimary]}>
                {label}
              </AppText>
              <AppText variant="small" color="muted" style={styles.subtitle}>
                {subtitle}
              </AppText>
            </View>

            {badge ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)' },
                ]}
              >
                <MaterialCommunityIcons name={badge} size={13} color={iconColor} />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flexBasis: '100%' },
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
    minHeight: 88,
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
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  iconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontWeight: '700' },
  titlePrimary: { fontWeight: '800' },
  subtitle: { fontWeight: '500' },
  badge: {
    width: 26, height: 26,
    borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
