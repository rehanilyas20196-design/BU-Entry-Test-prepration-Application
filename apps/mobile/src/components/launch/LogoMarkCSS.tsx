import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BAR_SPECS } from '@/components/launch/LogoMark3D';

/**
 * Reduced-motion / low-end fallback for the logo mark.
 * Same four diagonal bars, but static — only opacity fades are handled by
 * SplashScreen so nothing here animates or moves.
 */

interface LogoMarkCSSProps {
  size?: number;
}

export function LogoMarkCSS({ size = 160 }: LogoMarkCSSProps) {
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {BAR_SPECS.map((spec) => {
        const w = spec.width * size;
        const h = spec.height * size;
        return (
          <View
            key={spec.delay}
            style={[
              styles.bar,
              {
                left: spec.left * size,
                top: spec.top * size,
                width: w,
                height: h,
                borderRadius: h / 2,
                transform: [{ rotate: `${spec.rotate}deg` }],
              },
            ]}
          >
            <LinearGradient
              colors={[...spec.colors] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.highlight} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});