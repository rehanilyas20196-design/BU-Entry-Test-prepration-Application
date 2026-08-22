import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  Text,
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

interface HeroBadge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unlocked: boolean;
  isFeatured?: boolean;
  isAlmostUnlocked?: boolean;
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

  // Build hero badges: 4-6 badges showing mix of unlocked/locked/featured
  const heroBadges: HeroBadge[] = [];
  const featuredPositions = [0, 2];
  let featuredCount = 0;

  // Sort achievements by progress percentage to highlight almost-unlocked ones
  const sortedAchievements = [...allAchievements].sort(
    (a, b) =>
      (getTarget(b) - getCurrent(b)) / Math.max(getTarget(b), 1) -
      (getTarget(a) - getCurrent(a)) / Math.max(getTarget(a), 1),
  );

  // Take first 6 achievements for the hero carousel
  const heroCandidates = sortedAchievements.slice(0, 6);

  heroCandidates.forEach((a, index) => {
    const current = getCurrent(a);
    const target = getTarget(a);
    const progress = target > 0 ? Math.min(1, current / target) : 0;
    const isUnlocked = progress >= 1 && unlockedSet.has(a.id);
    const almostUnlocked = progress >= 0.8 && progress < 1 && !unlockedSet.has(a.id);
    const isFeatured = featuredPositions.includes(index) && featuredCount < 2;
    const isAlmost = almostUnlocked && !isFeatured;

    heroBadges.push({
      id: a.id,
      emoji: a.emoji,
      title: a.title,
      description: a.description,
      target,
      current,
      unlocked: isUnlocked,
      isFeatured: isFeatured || featuredCount < 2 ? true : false,
      isAlmostUnlocked: isAlmost,
    });

    if (isFeatured) featuredCount++;
  });

  // If we have fewer than 6, pad with already-unlocked ones
  while (heroBadges.length < 6) {
    const unlockedAchievement = allAchievements.find(
      (a) => unlockedSet.has(a.id) && !heroBadges.some((b) => b.id === a.id),
    );
    if (!unlockedAchievement) break;
    heroBadges.push({
      id: unlockedAchievement.id,
      emoji: unlockedAchievement.emoji,
      title: unlockedAchievement.title,
      description: unlockedAchievement.description,
      target: unlockedAchievement.target,
      current: unlockedAchievement.current(data),
      unlocked: true,
      isFeatured: false,
      isAlmostUnlocked: false,
    });
  }

  // If still less than 4, fill with first achievements
  while (heroBadges.length < 4) {
    const firstAchievement = allAchievements[heroBadges.length];
    heroBadges.push({
      id: firstAchievement.id,
      emoji: firstAchievement.emoji,
      title: firstAchievement.title,
      description: firstAchievement.description,
      target: firstAchievement.target,
      current: firstAchievement.current(data),
      unlocked: isUnlocked(firstAchievement),
      isFeatured: false,
      isAlmostUnlocked: false,
    });
  }

  const unlockedCount = allAchievements.filter((a) => isUnlocked(a)).length;

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

        {/* HERO BANNER - sits at top above individual rows */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContainer}>
            {/* Headline and subtext */}
            <View style={styles.heroText}>
              <AppText variant="display" style={styles.heroHeadline}>
                {unlockedCount} Achievements Waiting
              </AppText>
              <AppText variant="micro" style={styles.heroSubtext}>
                Complete tests, build streaks, and earn XP to unlock badges.
              </AppText>
            </View>

            {/* Progress indicator */}
            <View style={styles.progressWrapper}>
              <AppText variant="micro" style={styles.progressLabel}>
                {unlockedCount} / {allAchievements.length} unlocked
              </AppText>
              <AnimatedProgressBar
                progress={allAchievements.length > 0 ? unlockedCount / allAchievements.length : 0}
                height={4}
                color={colors.primary}
                trackColor={colors.surfaceAlt}
                delay={0}
                style={styles.progressBar}
              />
            </View>

            {/* Badge icons in horizontal scatter/arc */}
            <View style={styles.badgeContainer}>
              {heroBadges.map((badge) => (
                <Pressable
                  key={badge.id}
                  style={[
                    styles.badge,
                    {
                      transform: [
                        { scale: badge.isFeatured ? 1.3 : 1 },
                        { translateY: badge.isAlmostUnlocked || badge.isFeatured ? -4 : 0 },
                      ],
                      opacity: badge.unlocked ? 1 : 0.5,
                    },
                  ]}
                >
                  <View style={styles.emojiWrap}>
                    <AppText style={styles.emoji}>
                      {badge.unlocked
                        ? badge.emoji
                        : badge.isAlmostUnlocked
                          ? badge.emoji
                          : '🔒'}
                    </AppText>
                  </View>
                  {badge.unlocked && badge.isAlmostUnlocked && (
                    <AppText variant="micro" style={styles.lockOverlay}>
                      •
                    </AppText>
                  )}
                  {!badge.unlocked && badge.isAlmostUnlocked && (
                    <View style={styles.lockBadge}>
                      <Feather name="lock" size={10} color="muted" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Individual achievements list below */}
        <View style={styles.list}>
          {allAchievements.map((a) => (
            <GlassCard
              key={a.id}
              style={[
                styles.achievement,
                { opacity: isUnlocked(a) ? 1 : 0.82 },
              ]}
            >
              <View style={styles.emojiWrap}>
                <AppText style={styles.emoji}>
                  {isUnlocked(a) ? a.emoji : '🔒'}
                </AppText>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="bodyMedium">{a.title}</AppText>
                <AppText variant="small" color="muted">{a.description}</AppText>
                <View style={styles.progressRow}>
                  <AnimatedProgressBar
                    progress={
                      a.target > 0 ? Math.min(1, a.current(data) / a.target) : 0
                    }
                    height={6}
                    color={isUnlocked(a) ? colors.success : colors.primary}
                    trackColor={colors.surfaceAlt}
                    delay={0}
                    style={styles.progressBar}
                  />
                  <AppText variant="micro" color="muted">
                    {isUnlocked(a) ? 'Done' : `${Math.min(a.current(data), a.target)} / ${a.target} ${a.unit ?? ''}`}
                  </AppText>
                </View>
              </View>
              {isUnlocked(a) && <Feather name="check-circle" size={18} color={colors.success} />}
            </GlassCard>
          ))}
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

  /* ----- Hero Banner Styles ----- */
  heroBanner: {
    padding: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderRadius: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  heroContainer: { padding: 16 },
  heroText: { gap: 6 },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  heroSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressLabel: { fontSize: 11, color: '#6b7280' },
  progressBar: { height: 4, flex: 1, borderRadius: 2 },
  badgeContainer: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
    opacity: 0.82,
    padding: 4,
  },
  emojiWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 28 },
  lockOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  lockBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ----- Existing achievement list styles (kept consistent) ----- */
  achievement: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  locked: { opacity: 0.82 },
  emoji: { fontSize: 24 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressBar: { flex: 1 },
});