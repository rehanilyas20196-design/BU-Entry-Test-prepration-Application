import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.replace('/sign-in');
        return;
      }
      router.replace('/(tabs)');
    };
    handle();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppText variant="body" color="secondary">Completing sign in…</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
