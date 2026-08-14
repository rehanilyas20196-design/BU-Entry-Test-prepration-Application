import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { radiusTokens, glassTokens } from '@/theme/tokens';

interface GlassPanelProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle;
  radius?: number;
  accent?: readonly [string, string, ...string[]];
  accentOpacity?: number;
  press?: SharedValue<number>;
  sweep?: SharedValue<number>;
  gloss?: boolean;
  ring?: boolean;
  shadowIntensity?: number;
  surface?: 'auto' | 'light' | 'dark';
}

export function GlassPanel({
  children,
  style,
  contentStyle,
  radius = radiusTokens.card,
  accent,
  accentOpacity = 0.11,
  press,
  sweep,
  gloss = true,
  ring = false,
  shadowIntensity = 0.24,
  surface = 'auto',
}: GlassPanelProps) {
  const { colors } = useTheme();
  const dark = surface === 'dark' ? true : surface === 'light' ? false : colors.isDark;
  const glass = dark ? glassTokens.dark : glassTokens.light;

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: shadowIntensity + (press?.value ?? 0) * 0.22,
  }));

  const panelStyle = useAnimatedStyle(() => {
    const p = press?.value ?? 0;
    return {
      transform: [{ scale: 1 - p * 0.03 }, { translateY: p * 1.5 }],
    };
  });

  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity + (press?.value ?? 0) * 0.3,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ((sweep?.value ?? 0) * 2 - 1) * 140 }, { rotateZ: '24deg' }],
  }));

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.shadow,
          { borderRadius: radius, shadowColor: dark ? '#000000' : '#3A3F78', shadowRadius: 16, shadowOffset: { width: 0, height: 9 } },
          shadowStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.panel,
          panelStyle,
          contentStyle,
          { borderRadius: radius, borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.85)' },
        ]}
      >
        <LinearGradient
          colors={glass.surface}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {accent ? (
          <Animated.View style={[StyleSheet.absoluteFill, accentStyle]}>
            <LinearGradient
              colors={accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}
        {gloss ? (
          <LinearGradient
            pointerEvents="none"
            colors={glass.gloss}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {sweep ? (
          <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}
        {ring && accent ? (
          <View
            pointerEvents="none"
            style={[styles.ring, { borderRadius: radius - 2, borderColor: accent[accent.length - 1] }]}
          />
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '100%' },
  shadow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(120,130,200,0.02)',
    shadowOpacity: 1,
    elevation: 6,
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flex: 1,
  },
  sweep: {
    position: 'absolute',
    top: -16, bottom: -16, left: -16,
    width: 88,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
  },
});
