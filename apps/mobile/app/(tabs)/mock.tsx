import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { FadeInView } from '@/components/ui/Animated';
import { Reveal } from '@/components/ui/Reveal';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';

interface MockTest {
  id: string;
  name: string;
  description: string | null;
  question_count: number;
  actual_question_count: number;
  duration_minutes: number;
}

type Mode = 'practice' | 'timed_practice' | 'full_mock';

const MODES: { key: Mode; label: string; icon: keyof typeof Feather.glyphMap; hint: string }[] = [
  { key: 'practice', label: 'Practice', icon: 'edit-3', hint: 'Untimed · learn as you go' },
  { key: 'timed_practice', label: 'Timed', icon: 'clock', hint: 'Short sprint · timer on' },
  { key: 'full_mock', label: 'Full Mock', icon: 'clipboard', hint: 'Full exam · real conditions' },
];

export default function MockTestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data: tests, isLoading, error, refetch } = useQuery({
    queryKey: ['mock-tests'],
    queryFn: () => api.get<MockTest[]>('/tests'),
    enabled: !!session,
  });

  const start = (test: MockTest, mode: Mode) => {
    router.push({ pathname: '/mock-test', params: { testId: test.id, mode } });
  };

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <FadeInView>
        <GlassCard
          gradient={['#0EA5E9', colors.gradientMid, colors.gradientEnd]}
          glow
          style={styles.arena}
        >
          <FloatingParticles count={9} color="#FFFFFF" />
          <View style={styles.arenaIcon}>
            <Feather name="crosshair" size={22} color="#FFF" />
          </View>
          <AppText variant="h2" style={styles.whiteText}>Mock Arena</AppText>
          <AppText variant="body" style={styles.white80}>
            Realistic simulations · no negative marking · instant scoring & review
          </AppText>
        </GlassCard>
      </FadeInView>

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1].map((i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </View>
      ) : error ? (
        <ErrorState
          title="Couldn't load mock tests"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : (tests?.length ?? 0) === 0 ? (
        <EmptyState
          icon="clipboard"
          title="No mock tests yet"
          message="New simulations will appear here soon."
        />
      ) : (
        <View style={styles.list}>
          {(tests ?? []).map((t, idx) => {
            const count = t.actual_question_count || t.question_count;
            return (
              <Reveal key={t.id} scrollY={scrollY} index={idx}>
                <GlassCard style={styles.testCard}>
                  <View style={styles.testHeader}>
                    <View style={styles.testIcon}>
                      <Feather name="clipboard" size={20} color="#FFF" />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <AppText variant="label">{t.name}</AppText>
                      <AppText variant="small" color="muted">
                        {count} questions · {t.duration_minutes} min · no negative marking
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.modeRow}>
                    {MODES.map((m) => (
                      <Pressable
                        key={m.key}
                        onPress={() => start(t, m.key)}
                        accessibilityRole="button"
                        accessibilityLabel={`${m.label} mode`}
                        style={({ pressed }) => [styles.modeTile, pressed && styles.pressed]}
                      >
                        <View style={styles.modeTileIcon}>
                          <Feather name={m.icon} size={19} color={colors.primary} />
                        </View>
                        <AppText variant="caption" color="primary" numberOfLines={1}>
                          {m.label}
                        </AppText>
                        <AppText variant="micro" color="muted" numberOfLines={2} style={styles.modeTileHint}>
                          {m.hint}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>

                  <AnimatedButton
                    title="Start Full Mock"
                    onPress={() => start(t, 'full_mock')}
                    size="md"
                  />
                </GlassCard>
              </Reveal>
            );
          })}
        </View>
      )}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  arena: { padding: 22, gap: 8 },
  arenaIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 6,
  },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)' },
  list: { gap: 14 },
  testCard: { padding: 18, gap: 14 },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6366F1',
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  modeTileIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.16)',
    marginBottom: 2,
  },
  modeTileHint: { textAlign: 'center' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});