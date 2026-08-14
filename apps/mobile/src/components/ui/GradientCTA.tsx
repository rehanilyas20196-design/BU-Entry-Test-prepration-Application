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
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radiusTokens } from '@/theme/tokens';

interface GradientCTAProps {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  gradient?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

export function GradientCTA({
  title,
  icon,
  onPress,
  gradient,
  style,
}: GradientCTAProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  const press = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (!reduced) {
      sweep.value = 0;
    }
  }, [reduced, sweep]);

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + press.value * 0.2,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.02 }, { translateY: press.value * 1 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -press.value * 2.5 }],
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + press.value * 0.55,
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

  const stops = gradient ?? [colors.gradientStart, colors.gradientMid, colors.gradientEnd];

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.shadow,
          { shadowColor: colors.isDark ? '#000000' : '#312E81', shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
          shadowStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={styles.pressable}
      >
        <Animated.View style={[styles.cta, ctaStyle, { borderColor: 'rgba(255,255,255,0.25)' }]}>
          <LinearGradient
            colors={[...stops] as [string, string, ...string[]]}
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
          <Animated.View style={[StyleSheet.absoluteFill, sheenStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.content}>
            {icon ? (
              <View style={styles.iconWrap}>
                <Animated.View style={iconStyle}>
                  <MaterialCommunityIcons name={icon} size={17} color="#FFFFFF" />
                </Animated.View>
              </View>
            ) : null}
            <AppText variant="label" style={styles.title} numberOfLines={1}>
              {title}
            </AppText>
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
    backgroundColor: 'rgba(99,102,241,0.03)',
    borderRadius: radiusTokens.card,
    shadowOpacity: 1,
    elevation: 7,
  },
  pressable: { borderRadius: radiusTokens.card },
  cta: {
    borderRadius: radiusTokens.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 52,
    justifyContent: 'center',
  },
  sweep: {
    position: 'absolute',
    top: -18, bottom: -18, left: -18,
    width: 96,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 30, height: 30,
    borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: { color: '#FFFFFF', fontWeight: '700' },
});
