import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';

interface DashboardResponse {
  stats: {
    xp: number;
    level: number;
    current_streak: number;
    total_questions_answered: number;
    total_questions_correct: number;
  } | null;
  accuracy: number | null;
  current_streak: number;
  weak_topics?: { topic?: { name: string }; last_accuracy: number }[];
  strong_topics?: { topic?: { name: string }; last_accuracy: number }[];
  mock_tests?: { score: number; correct_count: number; total_questions: number }[];
  daily_activity?: { date: string; questions_answered: number }[];
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
  return diff;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/analytics/me'),
    enabled: !!session,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ test_date: string | null; full_name: string | null }>('/users/me/profile'),
    enabled: !!session,
  });

  const days = daysUntil(profile?.test_date);
  const accuracy =
    data?.accuracy ??
    (data?.stats && data.stats.total_questions_answered > 0
      ? Math.round((data.stats.total_questions_correct / data.stats.total_questions_answered) * 100)
      : 0);

  const todayTarget = 30;
  const todayDone = data?.daily_activity?.[0]?.questions_answered ?? 0;
  const targetProgress = Math.min(1, todayDone / todayTarget);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <AppText variant="caption" color="muted">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
          <AppText variant="h2">
            Hello, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋
          </AppText>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: colors.primaryLight }]}>
          <Feather name="award" size={16} color={colors.primary} />
          <AppText variant="label" color="primary">
            Lv {data?.stats?.level ?? 1}
          </AppText>
        </View>
      </View>

      <View style={styles.countdownRow}>
        <Card style={[styles.countdownCard, { flex: 2 }]}>
          <AppText variant="caption" color="muted">Your BUET preparation</AppText>
          <View style={styles.countdownValueRow}>
            {days !== null ? (
              <AppText variant="display" color="primary">{days}</AppText>
            ) : (
              <AppText variant="display" color="primary">—</AppText>
            )}
            <AppText variant="body" color="secondary">days remaining</AppText>
          </View>
          <View style={styles.targetRow}>
            <AppText variant="small" color="secondary">Today's target</AppText>
            <AppText variant="bodyMedium">{todayDone}/{todayTarget} questions</AppText>
          </View>
          <ProgressBar progress={targetProgress} height={8} />
        </Card>
        <View style={{ flex: 1 }}>
          <CircularProgress progress={accuracy / 100} label={`${accuracy}%`} sublabel="Accuracy" />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Questions solved" value={data?.stats?.total_questions_answered ?? 0} icon={<Feather name="edit-3" size={18} color={colors.primary} />} />
        <StatCard label="Current streak" value={`${data?.current_streak ?? 0}d`} icon={<Feather name="zap" size={18} color={colors.warning} />} accent={colors.warning} />
      </View>

      <View style={styles.actions}>
        <Button
          title="Continue studying"
          onPress={() => router.push('/practice')}
          size="lg"
          icon={<Feather name="play" size={18} color="#FFF" />}
        />
        <Button
          title="Start a mock test"
          variant="outline"
          onPress={() => router.push('/(tabs)/mock')}
          size="lg"
          icon={<Feather name="clipboard" size={18} color={colors.primary} />}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Weakest topics</AppText>
        {(data?.weak_topics?.length ?? 0) > 0 ? (
          <View style={styles.topicList}>
            {data?.weak_topics?.slice(0, 3).map((t, i) => {
              const name = Array.isArray(t.topic) ? t.topic[0]?.name : t.topic?.name;
              return (
                <Card key={i} elevated={false} style={styles.topicRow}>
                  <AppText variant="bodyMedium" style={{ flex: 1 }}>{name ?? 'Topic'}</AppText>
                  <AppText variant="label" color="danger">{Math.round(t.last_accuracy ?? 0)}%</AppText>
                </Card>
              );
            })}
          </View>
        ) : (
          <AppText variant="body" color="muted">Answer a few questions to see your weak areas.</AppText>
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Strongest topics</AppText>
        {(data?.strong_topics?.length ?? 0) > 0 ? (
          <View style={styles.topicList}>
            {data?.strong_topics?.slice(0, 3).map((t, i) => {
              const name = Array.isArray(t.topic) ? t.topic[0]?.name : t.topic?.name;
              return (
                <Card key={i} elevated={false} style={styles.topicRow}>
                  <AppText variant="bodyMedium" style={{ flex: 1 }}>{name ?? 'Topic'}</AppText>
                  <AppText variant="label" color="success">{Math.round(t.last_accuracy ?? 0)}%</AppText>
                </Card>
              );
            })}
          </View>
        ) : (
          <AppText variant="body" color="muted">Keep practicing to build your strengths.</AppText>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countdownCard: { padding: 18, gap: 8 },
  countdownValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  actions: { gap: 12 },
  section: { gap: 12 },
  topicList: { gap: 8 },
  topicRow: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
