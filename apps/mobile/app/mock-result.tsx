import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedProgressBar } from '@/components/ui/Animated';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BUET_CONFIG } from '@/config/buet';
import { Feather } from '@expo/vector-icons';

interface ResultResponse {
  summary: {
    score: number;
    percentage: number;
    correct_count: number;
    incorrect_count: number;
    unanswered_count: number;
    duration_seconds: number | null;
    avg_time_per_question_seconds: number;
  };
  subject_performance: { name: string; attempted: number; correct: number; accuracy: number }[];
  topic_performance: { name: string; attempted: number; correct: number; accuracy: number }[];
  incorrect_questions: {
    question_id: string;
    question_text: string;
    selected_option: string | null;
    correct_option: string;
    explanation: string | null;
    subject: string;
    topic: string;
  }[];
}

export default function MockResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mock-result', attemptId],
    queryFn: () => api.get<ResultResponse>(`/tests/${attemptId}/result`),
    enabled: !!attemptId,
  });

  if (isLoading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <SkeletonCard lines={4} style={{ width: '100%' }} />
        <AppText variant="body" color="secondary">Calculating your results…</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ErrorState title="Couldn't load results" message="Please check your connection." onRetry={() => refetch()} />
        <Button title="Back" variant="outline" onPress={() => router.replace('/(tabs)/mock')} />
      </View>
    );
  }

  const { summary } = data;
  const mins = summary.duration_seconds ? Math.round(summary.duration_seconds / 60) : 0;
  const pct = Math.round(summary.percentage);
  const passed = pct >= BUET_CONFIG.PASS_PERCENTAGE;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
        <GlassCard
          gradient={passed ? ['#16A34A', '#0D9488', '#0EA5E9'] : [colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          glow
          style={styles.scoreCard}
        >
          <FloatingParticles count={12} color="#FFFFFF" />
          <View style={styles.heroTop}>
            <AppText variant="h1" style={styles.whiteText}>Test Complete!</AppText>
            <View style={styles.passPill}>
              <Feather name={passed ? 'award' : 'rotate-ccw'} size={13} color="#FFF" />
              <AppText variant="label" style={styles.whiteText}>{passed ? 'Passed' : 'Keep going'}</AppText>
            </View>
          </View>
          <ProgressRing
            progress={summary.percentage / 100}
            size={130}
            strokeWidth={12}
            delay={200}
            gradient={['#FFFFFF', '#FFFFFF']}
          >
            <View style={styles.ringCenter}>
              <AppText variant="display" style={styles.whiteText}>{pct}%</AppText>
              <AppText variant="caption" style={styles.white80}>score</AppText>
            </View>
          </ProgressRing>
          <View style={styles.scoreStats}>
            <View style={styles.stat}>
              <AppText variant="h3" style={styles.whiteText}>{summary.correct_count}</AppText>
              <AppText variant="small" style={styles.white80}>Correct</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AppText variant="h3" style={styles.whiteText}>{summary.incorrect_count}</AppText>
              <AppText variant="small" style={styles.white80}>Incorrect</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AppText variant="h3" style={styles.whiteText}>{summary.unanswered_count}</AppText>
              <AppText variant="small" style={styles.white80}>Skipped</AppText>
            </View>
          </View>
          <AppText variant="small" style={styles.white80}>
            Time used: {mins}m · avg {Math.round(summary.avg_time_per_question_seconds)}s/question
          </AppText>
        </GlassCard>
      </Animated.View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="pie-chart" size={16} color={colors.primary} />
          <AppText variant="h3">Subject performance</AppText>
        </View>
        <View style={styles.list}>
          {data.subject_performance.map((s, i) => (
            <GlassCard key={i} style={styles.perfRow}>
              <View style={styles.perfHeader}>
                <AppText variant="bodyMedium" style={{ flex: 1 }}>{s.name}</AppText>
                <AppText variant="small" color="muted">{s.correct}/{s.attempted}</AppText>
                <AppText variant="label" color={s.accuracy >= 60 ? 'success' : 'danger'}>{Math.round(s.accuracy)}%</AppText>
              </View>
              <AnimatedProgressBar progress={Math.min(1, s.accuracy / 100)} height={6} delay={i * 60} color={s.accuracy >= 60 ? colors.success : colors.danger} />
            </GlassCard>
          ))}
        </View>
      </View>

      {(data.topic_performance?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="list" size={16} color={colors.primary} />
            <AppText variant="h3">Topic performance</AppText>
          </View>
          <View style={styles.list}>
            {data.topic_performance.slice(0, 8).map((t, i) => (
              <GlassCard key={i} style={styles.perfRow}>
                <View style={styles.perfHeader}>
                  <AppText variant="bodyMedium" style={{ flex: 1 }}>{t.name}</AppText>
                  <AppText variant="label" color={t.accuracy >= 60 ? 'success' : 'danger'}>{Math.round(t.accuracy)}%</AppText>
                </View>
                <AnimatedProgressBar progress={Math.min(1, t.accuracy / 100)} height={5} delay={i * 40} color={t.accuracy >= 60 ? colors.success : colors.danger} />
              </GlassCard>
            ))}
          </View>
        </View>
      )}

      {(data.topic_performance?.some((t) => t.accuracy < 60) ?? false) && (
        <View style={styles.section}>
          <View style={[styles.weakBanner, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            <Feather name="alert-triangle" size={18} color={colors.danger} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyMedium" color="danger">Practice your weak areas</AppText>
              <AppText variant="small" color="muted">
                Focus on the topics below 60% to boost your score.
              </AppText>
            </View>
          </View>
          <Button
            title="Practice weak areas"
            icon={<Feather name="target" size={16} color="#FFFFFF" />}
            onPress={() => router.push({ pathname: '/practice-session', params: { smartRetry: '1', title: 'Weak Areas Practice' } })}
            size="lg"
          />
        </View>
      )}

      {(data.incorrect_questions?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={16} color={colors.danger} />
            <AppText variant="h3">Review incorrect ({data.incorrect_questions.length})</AppText>
          </View>
          <View style={styles.list}>
            {data.incorrect_questions.slice(0, 10).map((q, i) => (
              <Pressable
                key={i}
                onPress={() => router.push({ pathname: '/question/[id]', params: { id: q.question_id } })}
                accessibilityRole="button"
                accessibilityLabel={`Review question: ${q.question_text}`}
              >
                <GlassCard style={styles.reviewCard}>
                  <AppText variant="bodyMedium" numberOfLines={2}>{q.question_text}</AppText>
                  <View style={styles.reviewAnswers}>
                    <AppText variant="small" color="danger">Your: {q.selected_option ?? '—'}</AppText>
                    <AppText variant="small" color="success">Correct: {q.correct_option}</AppText>
                  </View>
                  {q.explanation && (
                    <AppText variant="small" color="secondary" style={{ marginTop: 6 }}>{q.explanation}</AppText>
                  )}
                </GlassCard>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button title="Back to Mock Tests" onPress={() => router.replace('/(tabs)/mock')} size="lg" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  hero: {},
  scoreCard: { padding: 22, alignItems: 'center', gap: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  passPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.82)' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  scoreStats: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  list: { gap: 8 },
  perfRow: { padding: 14, gap: 8 },
  perfHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewCard: { padding: 14, gap: 4 },
  reviewAnswers: { flexDirection: 'row', gap: 14, marginTop: 2 },
  actions: { marginTop: 8 },
});