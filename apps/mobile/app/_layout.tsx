import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { useOnboardingStore, hydrateOnboardingStore } from '@/stores/onboardingStore';
import { hydrateBookmarkTagsStore } from '@/stores/bookmarkTagsStore';
import { ToastProvider } from '@/components/ui/Toast';
import { SplashScreen, isFirstLaunch, markLaunchSeen } from '@/components/launch/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const { session, initialized, initialize } = useAuthStore();
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydratePremium = usePremiumStore((s) => s.hydrate);
  const router = useRouter();
  const pathname = usePathname();
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [showLaunch, setShowLaunch] = useState(true);
  const [launchMs, setLaunchMs] = useState(1600);

  useEffect(() => {
    initialize();
    hydrate();
    hydratePremium();
    hydrateOnboardingStore().then(() => setOnboardingReady(true));
    void hydrateBookmarkTagsStore();
    void isFirstLaunch().then((first) => setLaunchMs(first ? 2800 : 1300));
  }, [initialize, hydrate, hydratePremium]);

  useEffect(() => {
    if (!initialized || !onboardingReady || !showLaunch) return;
    void markLaunchSeen();
  }, [initialized, onboardingReady, showLaunch]);

  const onboarded = useOnboardingStore((s) => s.onboarded);

  // Redirect logic: signed-in users who haven't onboarded go to onboarding.
  // Admin console (/admin/*) and the auth flows (/sign-in, /sign-up,
  // /verify-otp, /forgot-password, /auth-callback) are self-contained, so the
  // redirect must not hijack those routes.
  useEffect(() => {
    if (!initialized || !onboardingReady) return;
    if (pathname.startsWith('/admin')) return;
    if (
      pathname === '/sign-in' ||
      pathname === '/sign-up' ||
      pathname === '/verify-otp' ||
      pathname === '/forgot-password' ||
      pathname === '/auth-callback' ||
      pathname === '/sample-quiz'
    ) {
      return;
    }
    if (session) {
      if (!onboarded) {
        router.replace('/onboarding');
      }
    } else {
      router.replace('/sign-in');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, session, onboarded, onboardingReady, pathname]);

  if (!initialized || !onboardingReady) {
    return <View style={[styles.splash, { backgroundColor: '#0A0E1F' }]} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <StatusBar style={systemScheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="auth-callback" />
              <Stack.Screen name="practice-session" />
              <Stack.Screen name="mock-test" />
              <Stack.Screen name="mock-result" />
              <Stack.Screen name="ai-tutor" />
              <Stack.Screen name="question/[id]" />
              <Stack.Screen name="learn-topics" />
              <Stack.Screen name="lesson" />
              <Stack.Screen name="achievements" />
              <Stack.Screen name="leaderboard" />
              <Stack.Screen name="sample-quiz" />
              <Stack.Screen name="admission/[id]" />
              <Stack.Screen name="admin" />
            </Stack>
            {showLaunch && (
              <SplashScreen
                minimumMs={launchMs}
                onComplete={() => {
                  setShowLaunch(false);
                  void markLaunchSeen();
                }}
              />
            )}
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1 },
});
