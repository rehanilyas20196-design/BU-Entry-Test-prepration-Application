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
import { palette } from '@/theme/colors';

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
        colors={[palette.backgroundDark, '#0B1026', '#141237']}
        style={StyleSheet.absoluteFill}
      />
      <FloatingParticles count={22} color="#A78BFA" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.top} />
        <View style={styles.center}>
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <Image
              source={require('../../../assets/app-logo.jpg')}
              style={styles.logo}
              resizeMode="cover"
            />
          </Animated.View>
          <AnimatedBookLoader height={150} onComplete={() => undefined} />
          <AppText variant="small" style={styles.hint}>
            Your journey begins with the first book
          </AppText>
        </View>
        <View style={styles.bottom}>
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
  top: { height: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  logoWrap: {
    width: 116, height: 116, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    overflow: 'hidden',
  },
  logo: { width: 116, height: 116, borderRadius: 28 },
  bottom: { paddingBottom: 32, alignItems: 'center' },
  skip: { paddingVertical: 10, paddingHorizontal: 28, minHeight: 40, justifyContent: 'center' },
  skipText: { color: '#8B93B8' },
  hint: { opacity: 0.9 },
});