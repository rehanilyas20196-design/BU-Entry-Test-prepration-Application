import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOnboardingStore, hydrateOnboardingStore } from '@/stores/onboardingStore';
import { ToastProvider } from '@/components/ui/Toast';

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
  const router = useRouter();
  const [onboardingReady, setOnboardingReady] = useState(false);

  useEffect(() => {
    initialize();
    hydrate();
    hydrateOnboardingStore().then(() => setOnboardingReady(true));
  }, [initialize, hydrate]);

  const onboarded = useOnboardingStore((s) => s.onboarded);

  // Redirect logic: signed-in users who haven't onboarded go to onboarding.
  useEffect(() => {
    if (!initialized || !onboardingReady) return;
    if (session) {
      if (!onboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/sign-in');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, session, onboarded, onboardingReady]);

  if (!initialized) {
    return (
      <View style={[styles.splash, { backgroundColor: '#0F172A' }]}>
        <Image source={require('../assets/logo.png')} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.splashText}>BUET Prep AI</Text>
        <Text style={styles.splashSub}>Loading your preparation…</Text>
      </View>
    );
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
              <Stack.Screen name="practice" />
              <Stack.Screen name="mock-test" />
              <Stack.Screen name="mock-result" />
              <Stack.Screen name="ai-tutor" />
              <Stack.Screen name="question/[id]" />
            </Stack>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  splashLogo: { width: 120, height: 120, marginBottom: 8 },
  splashText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  splashSub: { color: '#94A3B8', fontSize: 14 },
});
