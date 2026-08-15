import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAdminAuthStore } from '@/admin/adminAuth';

export default function AdminLayout() {
  const { session, hydrated, hydrate, logout, touchActivity, isSessionValid } = useAdminAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const isLoggedIn = !!session;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const touch = () => touchActivity();
      window.addEventListener('click', touch);
      window.addEventListener('keydown', touch);
      window.addEventListener('mousemove', touch);
      return () => {
        window.removeEventListener('click', touch);
        window.removeEventListener('keydown', touch);
        window.removeEventListener('mousemove', touch);
      };
    }
  }, [touchActivity]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isLoggedIn) {
      timerRef.current = setInterval(() => {
        if (!isSessionValid()) {
          void logout().then(() => router.replace('/admin/login' as any));
        }
      }, 60_000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoggedIn, isSessionValid, logout, router]);

  useEffect(() => {
    if (!hydrated) return;
    const last = segments[segments.length - 1] as string;
    const onLoginScreen = last === 'login';
    if (!isLoggedIn && !onLoginScreen) {
      router.replace('/admin/login' as any);
    } else if (isLoggedIn && onLoginScreen) {
      router.replace('/admin' as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isLoggedIn, segments]);

  if (!hydrated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="user-detail" />
      <Stack.Screen name="tests" />
      <Stack.Screen name="questions" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="catalog" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="coupons" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="activity" />
    </Stack>
  );
}
