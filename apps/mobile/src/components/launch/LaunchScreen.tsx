import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, Image } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedBookLoader } from '@/components/ui/AnimatedBookLoader';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { AppText } from '@/components/ui/AppText';
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

interface LaunchScreenProps {
  onDone: () => void;
  minimumMs: number;
}

export function LaunchScreen({ onDone, minimumMs }: LaunchScreenProps) {
  const opacity = useSharedValue(1);
  const reduced = useReducedMotion();
  const pop = useSharedValue(0);
  const float = useSharedValue(0);
  const [canSkip, setCanSkip] = React.useState(false);

  useEffect(() => {
    pop.value = withSpring(1, { damping: 13, stiffness: 110, mass: 0.8 });
    if (!reduced) {
      float.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
  }, [pop, float, reduced]);

  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) });
      setTimeout(onDone, 460);
    }, minimumMs);
    return () => clearTimeout(t);
  }, [minimumMs, onDone, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [
      { scale: pop.value },
      { translateY: reduced ? 0 : -Math.sin(float.value * Math.PI) * 5 },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fade]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F172A', '#1E1B4B', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glow} pointerEvents="none" />
      <FloatingParticles count={22} color="#A78BFA" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerMark}>
            <View style={styles.headerDot} />
            <AppText variant="caption" style={styles.headerText}>
              Entry Test Preparation
            </AppText>
          </View>
        </View>

        <View style={styles.center}>
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <Image
              source={require('../../../assets/launch-logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </Animated.View>

          <AppText variant="display" style={styles.brand}>
            BUET Prep AI
          </AppText>
          <AppText variant="body" style={styles.tagline}>
            Smart preparation for your BUET admission
          </AppText>

          <View style={styles.divider} />

          <View style={styles.bookStage}>
            <AnimatedBookLoader
              height={120}
              showLabel={false}
              shelfColor="rgba(255,255,255,0.10)"
              groundColor="#60A5FA"
              onComplete={() => undefined}
            />
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          {canSkip ? (
            <Pressable
              onPress={() => {
                opacity.value = withTiming(0, { duration: 250 });
                setTimeout(onDone, 260);
                void markLaunchSeen();
              }}
              accessibilityRole="button"
              accessibilityLabel="Skip"
              style={styles.skip}
            >
              <AppText variant="caption" style={styles.skipText}>
                Skip
              </AppText>
            </Pressable>
          ) : (
            <View style={styles.skip} />
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingTop: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
  headerText: { color: '#93A4D8', letterSpacing: 1.5 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glow: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 230,
    top: '16%',
    alignSelf: 'center',
    backgroundColor: 'rgba(96,165,250,0.14)',
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  logo: { width: 104, height: 104, borderRadius: 26 },
  brand: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: { color: '#A5B4FC', marginTop: 8, textAlign: 'center' },
  divider: {
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
    marginTop: 22,
    marginBottom: 4,
  },
  bookStage: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  bottom: {
    paddingBottom: 36,
    alignItems: 'center',
    gap: 14,
  },
  progressTrack: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
  },
  skip: { paddingVertical: 8, paddingHorizontal: 28, minHeight: 32, justifyContent: 'center' },
  skipText: { color: '#A5B4FC' },
});