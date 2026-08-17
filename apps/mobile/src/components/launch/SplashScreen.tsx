import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoMark3D } from '@/components/launch/LogoMark3D';
import { LogoMarkCSS } from '@/components/launch/LogoMarkCSS';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const LAUNCH_KEY = 'buetprep.launchSeen';

export async function isFirstLaunch(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LAUNCH_KEY)) !== '1';
  } catch {
    return false;
  }
}

export async function markLaunchSeen() {
  try {
    await AsyncStorage.setItem(LAUNCH_KEY, '1');
  } catch {
    // ignore
  }
}

interface SplashScreenProps {
  onComplete: () => void;
  minimumMs: number;
}

/**
 * BUET Prep AI splash / loading screen.
 *
 * Layout is a single flex column, centered on both axes, inside a full-height
 * container with safe-area padding. Every element occupies its own flex row and
 * nothing is layered with fixed-pixel offsets, so text and the progress bar can
 * never collide at any viewport width (360 / 390 / 768 / 1024 / 1920).
 *
 * Entrance choreography (declarative, via withDelay sequencing):
 *   0.0s  background gradient fades in
 *   0.1–0.6s  logo bars drop / stagger in (inside LogoMark3D)
 *   0.5s  wordmark fades + slides up 12px
 *   0.7s  university badge scales 0.9 → 1 with fade
 *   0.9s  tagline fades in
 *   1.0s  progress track fades in, fill animates 0 → 100% over ~2.5s
 *   last  skip button fades in (always tappable regardless of timing)
 *
 * onComplete fires when the progress bar finishes or when Skip is pressed.
 * Auto-dismiss is also capped at a hard timeout so a slow device is never stuck.
 */
export function SplashScreen({ onComplete, minimumMs }: SplashScreenProps) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();

  // Fluid sizing — clamp() equivalents, no fixed pixels in the page layout.
  const brandSize = Math.max(20, Math.min(width * 0.05, 32)); // clamp(1.25rem, 5vw, 2rem)
  const logoSize = Math.max(120, Math.min(width * 0.4, 168));
  const progressMax = width >= 640 ? 384 : 320; // max-w-xs sm:max-w-sm

  const bgOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const brandOpacity = useSharedValue(0);
  const brandY = useSharedValue(12);
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.9);
  const taglineOpacity = useSharedValue(0);
  const trackOpacity = useSharedValue(0);
  const progress = useSharedValue(0);
  const skipOpacity = useSharedValue(0);
  const rootOpacity = useSharedValue(1);

  const firedRef = useRef(false);

  const complete = useMemo(
    () => () => {
      if (firedRef.current) return;
      firedRef.current = true;
      rootOpacity.value = withTiming(0, { duration: 350 });
      setTimeout(onComplete, 360);
    },
    [onComplete, rootOpacity],
  );

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: reduced ? 0 : 600 });

    logoOpacity.value = withDelay(100, withTiming(1, { duration: reduced ? 0 : 300 }));

    brandOpacity.value = withDelay(500, withTiming(1, { duration: reduced ? 0 : 400 }));
    brandY.value = withDelay(500, withTiming(0, { duration: reduced ? 0 : 400 }));

    badgeOpacity.value = withDelay(700, withTiming(1, { duration: reduced ? 0 : 300 }));
    badgeScale.value = withDelay(700, withSpring(1, { damping: 14, stiffness: 120, mass: 0.9 }));

    taglineOpacity.value = withDelay(900, withTiming(1, { duration: reduced ? 0 : 350 }));

    trackOpacity.value = withDelay(1000, withTiming(1, { duration: reduced ? 0 : 300 }));
    progress.value = withDelay(
      1000,
      withTiming(1, { duration: reduced ? 0 : 2500, easing: Easing.out(Easing.cubic) }),
    );

    skipOpacity.value = withDelay(1400, withTiming(1, { duration: reduced ? 0 : 300 }));

    // Dismiss once the fill is done (1s delay + 2.5s fill) or after a hard cap,
    // whichever comes first — never before the caller's minimum display time.
    const doneAt = Math.max(minimumMs, Math.min(1000 + 2500, 4000));
    const timer = setTimeout(complete, doneAt);
    return () => clearTimeout(timer);
  }, [bgOpacity, logoOpacity, brandOpacity, brandY, badgeOpacity, badgeScale, taglineOpacity, trackOpacity, progress, skipOpacity, reduced, minimumMs, complete]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandY.value }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const trackStyle = useAnimatedStyle(() => ({ opacity: trackOpacity.value }));
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOpacity.value }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={['#0d1029', '#1a1f4d', '#2b3577']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(99,102,241,0.16)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Animated.View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.main}>
          <View style={styles.content}>
            <Animated.View style={[styles.logoRow, logoStyle]}>
              {reduced ? (
                <LogoMarkCSS size={logoSize} />
              ) : (
                <LogoMark3D size={logoSize} />
              )}
            </Animated.View>

            <Animated.View style={brandStyle}>
              <Text
                style={[styles.brand, { fontSize: brandSize }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                BUET Prep AI
              </Text>
            </Animated.View>

            <Animated.View style={badgeStyle}>
              <View style={styles.badgeCard}>
                <View style={styles.badgeDot} />
                <View>
                  <Text style={styles.badgeTitle}>Bahria University Entry Test</Text>
                  <Text style={styles.badgeSubtitle}>Preparation Platform</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View style={taglineStyle}>
              <Text style={styles.tagline}>Preparing your study stack</Text>
            </Animated.View>

            <Animated.View style={[styles.progressWrap, trackStyle]}>
              <View style={[styles.progressTrack, { maxWidth: progressMax }]}>
                <Animated.View style={[styles.progressFill, fillStyle]}>
                  <LinearGradient
                    colors={['#6366F1', '#38BDF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.skipRow, skipStyle]}>
            <Pressable
              onPress={complete}
              accessibilityRole="button"
              accessibilityLabel="Skip"
              hitSlop={12}
              style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  main: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
  },
  badgeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  badgeSubtitle: {
    color: '#93A4D8',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tagline: {
    color: '#A5B4FC',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  skipRow: {
    marginTop: 24,
    paddingBottom: 4,
    alignItems: 'center',
  },
  skip: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipPressed: {
    opacity: 0.6,
  },
  skipText: {
    color: '#A5B4FC',
    fontSize: 14,
    letterSpacing: 1,
  },
});