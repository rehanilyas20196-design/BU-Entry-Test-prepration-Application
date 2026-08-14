import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedProgressBar } from '@/components/ui/Animated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';
import { ACHIEVEMENTS, Achievement, AchievementData } from '@/content/achievements';

interface UserStats {
  xp: number;
  level: number;
  current_streak: number;
  total_questions_answered: number;
  total_mock_tests: number;
  best_accuracy: number | null;
}

interface AnalyticsData {
  overall_accuracy: number;
  topic_breakdown?: { attempted: number; last_accuracy: number | null }[];
  mock_tests?: { mode: string; status: string }[];
}

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get<UserStats>('/users/me/stats'),
    enabled: !!session,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-achievements'],
    queryFn: () => api.get<AnalyticsData>('/analytics/me'),
    enabled: !!session,
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const completedTopics = (analytics?.topic_breakdown ?? []).filter(
    (t) => t.last_accuracy != null && t.last_accuracy >= 75 && t.attempted >= 5,
  ).length;
  const timedAttempts = (analytics?.mock_tests ?? []).filter(
    (t) => t.status === 'submitted' && t.mode === 'timed_practice',
  ).length;

  const data: AchievementData = {
    totalQuestions: stats?.total_questions_answered ?? 0,
    totalMockTests: stats?.total_mock_tests ?? 0,
    currentStreak: stats?.current_streak ?? 0,
    bestAccuracy: stats?.best_accuracy ?? 0,
    overallAccuracy: analytics?.overall_accuracy ?? 0,
    timedAttempts,
    topicsCompleted: completedTopics,
  };

  const unlocked = ACHIEVEMENTS.filter((a) => a.current(data) >= a.target);

  const render = (a: Achievement) => {
    const value = a.current(data);
    const done = value >= a.target;
    const progress = Math.min(1, value / a.target);
    return (
      <GlassCard key={a.id} style={!done ? [styles.achievement, styles.locked] : styles.achievement}>
        <View style={styles.emojiWrap}>
          <AppText style={styles.emoji}>{done ? a.emoji : '🔒'}</AppText>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="bodyMedium">{a.title}</AppText>
          <AppText variant="small" color="muted">{a.description}</AppText>
          <View style={styles.progressRow}>
            <AnimatedProgressBar
              progress={progress}
              height={6}
              color={done ? colors.success : colors.primary}
              trackColor={colors.surfaceAlt}
              delay={0}
              style={styles.progressBar}
            />
            <AppText variant="micro" color="muted">
              {done ? 'Done' : `${Math.min(value, a.target)} / ${a.target} ${a.unit ?? ''}`}
            </AppText>
          </View>
        </View>
        {done && <Feather name="check-circle" size={18} color={colors.success} />}
      </GlassCard>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">Achievements</AppText>
          <AppText variant="body" color="secondary">Milestones on your BUET journey</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <GlassCard gradient={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]} glow style={styles.hero}>
          <AppText variant="display" style={styles.whiteText}>{unlocked.length}</AppText>
          <AppText variant="h3" style={styles.whiteText}>{unlocked.length} of {ACHIEVEMENTS.length} unlocked</AppText>
          <AppText variant="small" style={styles.white80}>Unlock all achievements to earn the 👑 BUET Master crown.</AppText>
        </GlassCard>

        <View style={styles.list}>
          {ACHIEVEMENTS.map(render)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  hero: { padding: 20, alignItems: 'center', gap: 4, borderRadius: 18 },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)' },
  list: { gap: 10 },
  achievement: {
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14,
  },
  locked: { opacity: 0.82 },
  emojiWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(99,102,241,0.1)' },
  emoji: { fontSize: 24 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressBar: { flex: 1 },
});