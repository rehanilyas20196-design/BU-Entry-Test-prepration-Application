import React from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

  const { data, isLoading } = useQuery({
    queryKey: ['mock-result', attemptId],
    queryFn: () => api.get<ResultResponse>(`/tests/${attemptId}/result`),
    enabled: !!attemptId,
  });

  if (isLoading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="body" color="secondary">Calculating your results…</AppText>
      </View>
    );
  }

  const { summary } = data;
  const mins = summary.duration_seconds ? Math.round(summary.duration_seconds / 60) : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1" color="primary">Test Complete!</AppText>
        <AppText variant="body" color="secondary">Here's how you did</AppText>
      </View>

      <Card style={styles.scoreCard}>
        <CircularProgress progress={summary.percentage / 100} label={`${Math.round(summary.percentage)}%`} sublabel="Score" size={120} />
        <View style={styles.scoreStats}>
          <Stat label="Correct" value={summary.correct_count} color={colors.success} />
          <Stat label="Incorrect" value={summary.incorrect_count} color={colors.danger} />
          <Stat label="Unanswered" value={summary.unanswered_count} color={colors.textMuted} />
        </View>
        <View style={styles.timeRow}>
          <AppText variant="small" color="muted">
            Time used: {mins}m · Avg/question: {summary.avg_time_per_question_seconds}s
          </AppText>
        </View>
      </Card>

      <View style={styles.section}>
        <AppText variant="h3">Subject performance</AppText>
        <View style={styles.list}>
          {data.subject_performance.map((s, i) => (
            <Card key={i} elevated={false} style={styles.performanceRow}>
              <AppText variant="bodyMedium" style={{ flex: 1 }}>{s.name}</AppText>
              <AppText variant="small" color="muted">{s.correct}/{s.attempted}</AppText>
              <AppText variant="label" color={s.accuracy >= 60 ? 'success' : 'danger'}>{Math.round(s.accuracy)}%</AppText>
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Topic performance</AppText>
        <View style={styles.list}>
          {data.topic_performance.slice(0, 8).map((t, i) => (
            <Card key={i} elevated={false} style={styles.performanceRow}>
              <AppText variant="bodyMedium" style={{ flex: 1 }}>{t.name}</AppText>
              <AppText variant="label" color={t.accuracy >= 60 ? 'success' : 'danger'}>{Math.round(t.accuracy)}%</AppText>
            </Card>
          ))}
        </View>
      </View>

      {(data.incorrect_questions?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <AppText variant="h3">Review incorrect ({data.incorrect_questions.length})</AppText>
          <View style={styles.list}>
            {data.incorrect_questions.slice(0, 10).map((q, i) => (
              <Card key={i} elevated={false} style={styles.reviewCard}>
                <AppText variant="bodyMedium" numberOfLines={2}>{q.question_text}</AppText>
                <AppText variant="small" color="danger">
                  Your answer: {q.selected_option ?? '—'} · Correct: {q.correct_option}
                </AppText>
                {q.explanation && (
                  <AppText variant="small" color="secondary" style={{ marginTop: 6 }}>
                    {q.explanation}
                  </AppText>
                )}
              </Card>
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

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="h3" style={{ color }}>{value}</AppText>
      <AppText variant="small" color="muted">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { gap: 4, marginTop: 8 },
  scoreCard: { padding: 20, alignItems: 'center', gap: 16 },
  scoreStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  stat: { alignItems: 'center' },
  timeRow: { marginTop: 4 },
  section: { gap: 12 },
  list: { gap: 8 },
  performanceRow: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewCard: { padding: 14, gap: 4 },
  actions: { marginTop: 8 },
});
