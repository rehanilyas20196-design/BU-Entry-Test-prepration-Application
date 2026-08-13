import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedProgressBar } from '@/components/ui/Animated';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';

interface SubjectScore {
  name: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

interface PerformanceResponse {
  overall_accuracy: number;
  subject_breakdown: SubjectScore[];
  weak_topics?: { topic?: { name: string }; last_accuracy: number }[];
}

function topicName(t: { topic?: { name: string } }): string | null {
  return Array.isArray(t.topic) ? t.topic[0]?.name ?? null : t.topic?.name ?? null;
}

export default function PerformanceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['performance'],
    queryFn: () => api.get<PerformanceResponse>('/analytics/me'),
    enabled: !!session,
  });

  const subjects = data?.subject_breakdown ?? [];
  const overall = Math.round(data?.overall_accuracy ?? 0);
  const weakest = subjects.length > 0 ? subjects[0] : null;
  const weakestTopic = data?.weak_topics?.[0] ? topicName(data.weak_topics[0]) : null;
  const totalAttempted = subjects.reduce((s, x) => s + x.attempted, 0);
  const totalCorrect = subjects.reduce((s, x) => s + x.correct, 0);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h2">Performance</AppText>
      </View>

      {isLoading ? (
        <View style={{ gap: 14 }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </View>
      ) : error ? (
        <ErrorState title="Couldn't load performance" message="Please check your connection." onRetry={() => refetch()} />
      ) : (
        <>
          <GlassCard gradient={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} glow style={styles.scoreCard}>
            <ProgressRing progress={Math.min(1, overall / 100)} size={132} strokeWidth={11} delay={150} gradient={['#FFFFFF', '#FFFFFF']}>
              <View style={styles.ringCenter}>
                <AppText variant="display" style={styles.whiteText}>{overall}%</AppText>
                <AppText variant="caption" style={styles.white80}>Overall</AppText>
              </View>
            </ProgressRing>
            <View style={styles.scoreStats}>
              <View style={styles.stat}>
                <AppText variant="h3" style={styles.whiteText}>{totalAttempted}</AppText>
                <AppText variant="small" style={styles.white80}>Questions</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <AppText variant="h3" style={styles.whiteText}>{totalCorrect}</AppText>
                <AppText variant="small" style={styles.white80}>Correct</AppText>
              </View>
            </View>
          </GlassCard>

          {subjects.length > 0 ? (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="pie-chart" size={16} color={colors.primary} />
                  <AppText variant="h3">Subject scores</AppText>
                </View>
                <View style={styles.list}>
                  {subjects.map((s, i) => (
                    <GlassCard key={i} style={styles.subjectRow}>
                      <View style={styles.subjectHeader}>
                        <AppText variant="bodyMedium" style={{ flex: 1 }}>{s.name}</AppText>
                        <AppText variant="label" color={s.accuracy >= 60 ? 'success' : 'danger'}>
                          {Math.round(s.accuracy)}%
                        </AppText>
                      </View>
                      <AnimatedProgressBar
                        progress={Math.min(1, s.accuracy / 100)}
                        height={7}
                        delay={i * 60}
                        color={s.accuracy >= 60 ? colors.success : colors.danger}
                        trackColor={colors.surfaceAlt}
                      />
                      <AppText variant="small" color="muted">{s.correct}/{s.attempted} correct</AppText>
                    </GlassCard>
                  ))}
                </View>
              </View>

              {(weakest || weakestTopic) && (
                <GlassCard gradient={[colors.warningLight, colors.warningLight]}>
                  <Feather name="alert-triangle" size={18} color={colors.warning} />
                  <AppText variant="bodyMedium" color="warning" style={{ flex: 1 }}>
                    {weakest
                      ? `Your weakest area is ${weakest.name} at ${Math.round(weakest.accuracy)}%.`
                      : `Your weakest topic is ${weakestTopic}.`}
                  </AppText>
                  <Pressable onPress={() => router.push('/weak-areas')} hitSlop={8} accessibilityLabel="View weak areas">
                    <AppText variant="label" color="primary">Fix it</AppText>
                  </Pressable>
                </GlassCard>
              )}
            </>
          ) : (
            <EmptyState
              icon="bar-chart-2"
              title="No performance data yet"
              message="Answer some practice questions to see your subject scores here."
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { padding: 4 },
  scoreCard: { padding: 20, alignItems: 'center', gap: 16 },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)' },
  scoreStats: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  list: { gap: 10 },
  subjectRow: { padding: 14, gap: 8 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  warning: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14,
  },
});