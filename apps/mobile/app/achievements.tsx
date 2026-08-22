import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedProgressBar } from '@/components/ui/Animated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    xp: stats?.xp ?? 0,
  };

  const allAchievements: Achievement[] = ACHIEVEMENTS;
  const unlockedSet = new Set(
    allAchievements.filter((a) => a.current(data) >= a.target).map((a) => a.id),
  );

  const getCurrent = (a: Achievement) => a.current(data);
  const getTarget = (a: Achievement) => a.target;
  const isUnlocked = (a: Achievement) => getCurrent(a) >= getTarget(a);

  const unlockedCount = allAchievements.filter((a) => isUnlocked(a)).length;
  const totalCount = allAchievements.length;

  // 5 Badge Cluster icons arranged in an arc (foreground/background depth)
  const heroCluster = [
    { emoji: '👑', label: 'Crown', scale: 0.9, translateY: 4, isGlowing: false, isLocked: !unlockedSet.has('first_mock') },
    { emoji: '🔥', label: 'Streak', scale: 1.1, translateY: -6, isGlowing: true, isLocked: !unlockedSet.has('streak_7') },
    { emoji: '🏆', label: 'Trophy', scale: 1.35, translateY: -14, isGlowing: true, isLocked: !unlockedSet.has('questions_500') },
    { emoji: '⭐', label: 'Star', scale: 1.1, translateY: -6, isGlowing: false, isLocked: !unlockedSet.has('rising_star') },
    { emoji: '🎖️', label: 'Medal', scale: 0.9, translateY: 4, isGlowing: false, isLocked: !unlockedSet.has('accuracy_80') },
  ];

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
        {/* GAMIFIED HERO BANNER CARD — soft purple/blue gradient hero */}
        <LinearGradient
          colors={['#EDE9FE', '#DBEAFE', '#EFF6FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.primary + '30' }]}
        >
          {/* Badge Arc / Scatter Cluster */}
          <View style={styles.clusterContainer}>
            {heroCluster.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.badgeBubble,
                  {
                    transform: [{ scale: item.scale }, { translateY: item.translateY }],
                    backgroundColor: item.isGlowing ? colors.surface : (item.isLocked ? colors.surfaceAlt : colors.primaryLight),
                    borderColor: item.isGlowing ? colors.primary : (item.isLocked ? colors.border : colors.primaryLight),
                    shadowColor: item.isGlowing ? colors.primary : '#000',
                    shadowOpacity: item.isGlowing ? 0.25 : 0.08,
                    shadowRadius: item.isGlowing ? 10 : 4,
                    elevation: item.isGlowing ? 6 : 2,
                    opacity: item.isLocked && !item.isGlowing ? 0.55 : 1,
                  },
                ]}
              >
                <AppText style={[styles.badgeEmoji, { fontSize: item.scale > 1.2 ? 30 : 22 }]}>
                  {item.emoji}
                </AppText>
                {item.isLocked && (
                  <View style={[styles.miniLockBadge, { backgroundColor: colors.textMuted }]}>
                    <Feather name="lock" size={9} color="#FFF" />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Headline & Subtext */}
          <View style={styles.heroTextSection}>
            <AppText variant="h2" style={styles.heroHeadline}>
              {totalCount - unlockedCount > 0 ? `${totalCount - unlockedCount} Achievements Waiting` : 'All Achievements Unlocked!'}
            </AppText>
            <AppText variant="body" color="secondary" style={styles.heroSubtext}>
              Complete tests, build streaks, and earn XP to unlock badges.
            </AppText>
          </View>

          {/* Progress Indicator */}
          <View style={styles.heroProgressSection}>
            <View style={styles.progressTextRow}>
              <AppText variant="label" color="primary">
                {unlockedCount} / {totalCount} unlocked
              </AppText>
              <AppText variant="caption" color="secondary">
                {Math.round((unlockedCount / Math.max(totalCount, 1)) * 100)}%
              </AppText>
            </View>
            <AnimatedProgressBar
              progress={totalCount > 0 ? unlockedCount / totalCount : 0}
              height={8}
              color={colors.primary}
              trackColor={colors.border + '60'}
              delay={150}
            />
          </View>
        </LinearGradient>

        {/* INDIVIDUAL ACHIEVEMENTS LIST */}
        <View style={styles.list}>
          {allAchievements.map((a) => {
            const unlocked = isUnlocked(a);
            const currentVal = getCurrent(a);
            const targetVal = getTarget(a);
            const progressVal = targetVal > 0 ? Math.min(1, currentVal / targetVal) : 0;

            return (
              <GlassCard
                key={a.id}
                style={[
                  styles.achievementCard,
                  { opacity: unlocked ? 1 : 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.listEmojiWrap,
                    {
                      backgroundColor: unlocked ? colors.primaryLight : colors.surfaceAlt,
                      borderColor: unlocked ? colors.primary + '40' : colors.border,
                    },
                  ]}
                >
                  <AppText style={styles.listEmoji}>
                    {unlocked ? a.emoji : '🔒'}
                  </AppText>
                </View>

                <View style={styles.achievementContent}>
                  <AppText variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {a.title}
                  </AppText>
                  <AppText variant="small" color="muted">
                    {a.description}
                  </AppText>

                  <View style={styles.progressRow}>
                    <AnimatedProgressBar
                      progress={progressVal}
                      height={6}
                      color={unlocked ? colors.success : colors.primary}
                      trackColor={colors.surfaceAlt}
                      delay={0}
                      style={{ flex: 1 }}
                    />
                    <AppText variant="micro" color="muted">
                      {unlocked ? 'Done' : `${Math.min(currentVal, targetVal)} / ${targetVal} ${a.unit ?? ''}`}
                    </AppText>
                  </View>
                </View>

                {unlocked && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.successLight }]}>
                    <Feather name="check" size={14} color={colors.success} />
                  </View>
                )}
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  body: { padding: 18, gap: 20, paddingBottom: 40 },

  /* Hero Card Styles */
  heroCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    gap: 16,
    overflow: 'hidden',
  },
  clusterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
    height: 70,
  },
  badgeBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeEmoji: {
    textAlign: 'center',
  },
  miniLockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTextSection: {
    alignItems: 'center',
    gap: 6,
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },

  heroProgressSection: {
    gap: 8,
    marginTop: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* List Styles */
  list: { gap: 12 },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  listEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEmoji: {
    fontSize: 22,
  },
  achievementContent: {
    flex: 1,
    gap: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});