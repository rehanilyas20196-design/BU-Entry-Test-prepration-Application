import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { confirmAction } from '@/lib/confirm';
import { PremiumCard } from '@/components/dashboard/PremiumCard';
import { AnimatedSwitch } from '@/components/ui/AnimatedSwitch';
import { ACHIEVEMENTS, AchievementData } from '@/content/achievements';

interface Profile {
  full_name: string | null;
  program: { name: string } | { name: string }[] | null;
  campus: string | null;
  target_university: string | null;
  test_date: string | null;
  preparation_level: string | null;
  daily_study_minutes: number | null;
}

interface Stats {
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

const STUDY_MENU = [
  { icon: 'book-open' as const, label: 'Lessons', route: '/(tabs)/learn' },
  { icon: 'award' as const, label: 'Achievements', route: '/achievements' },
  { icon: 'award' as const, label: 'Leaderboard', route: '/leaderboard' },
  { icon: 'map' as const, label: 'Admission Roadmap', route: '/(tabs)/guide' },
  { icon: 'bookmark' as const, label: 'My Bookmarks', route: '/bookmarks' },
  { icon: 'alert-circle' as const, label: 'My Mistakes', route: '/mistakes' },
  { icon: 'bar-chart-2' as const, label: 'Performance', route: '/performance' },
  { icon: 'trending-down' as const, label: 'Weak Areas', route: '/weak-areas' },
  { icon: 'calendar' as const, label: 'Study Plan', route: '/study-plan' },
] as const;

const LEGAL_MENU = [
  { icon: 'shield' as const, label: 'Privacy Policy', route: '/privacy' },
  { icon: 'file-text' as const, label: 'Terms of Service', route: '/terms' },
] as const;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signOut, session } = useAuthStore();
  const { notificationsEnabled, reducedMotion, setNotificationsEnabled, setReducedMotion } = useSettingsStore();
  const isPremium = usePremiumStore((s) => s.isPremium);
  const { show } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/users/me/profile'),
    enabled: !!session,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get<Stats>('/users/me/stats'),
    enabled: !!session,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics-profile'],
    queryFn: () => api.get<AnalyticsData>('/analytics/me'),
    enabled: !!session,
  });

  const completedTopics = (analytics?.topic_breakdown ?? []).filter(
    (t) => t.last_accuracy != null && t.last_accuracy >= 75 && t.attempted >= 5,
  ).length;
  const timedAttempts = (analytics?.mock_tests ?? []).filter(
    (t) => t.status === 'submitted' && t.mode === 'timed_practice',
  ).length;

  const badgeData: AchievementData = {
    totalQuestions: stats?.total_questions_answered ?? 0,
    totalMockTests: stats?.total_mock_tests ?? 0,
    currentStreak: stats?.current_streak ?? 0,
    bestAccuracy: stats?.best_accuracy ?? 0,
    overallAccuracy: analytics?.overall_accuracy ?? 0,
    timedAttempts,
    topicsCompleted: completedTopics,
    xp: stats?.xp ?? 0,
  };
  const earnedBadges = ACHIEVEMENTS.filter((a) => a.current(badgeData) >= a.target).length;

  const programName = profile?.program ? (Array.isArray(profile.program) ? profile.program[0]?.name : profile.program.name) : null;

  const handleSignOut = async () => {
    const ok = await confirmAction({
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
      destructive: true,
    });
    if (ok) await signOut();
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmAction({
      title: 'Delete account',
      message: 'This permanently deletes your account and all progress. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete('/users/me');
      show('Account deleted', 'success');
      await signOut();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to delete account. Please try again.', 'error');
    }
  };

  return (
    <ScreenScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {isLoading && !profile ? (
        <View style={styles.loading}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={1} />
        </View>
      ) : (
        <Card style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <AppText variant="h1" style={{ color: colors.primary }}>
              {(profile?.full_name?.trim()?.[0] ?? 'S').toUpperCase()}
            </AppText>
          </View>
          <AppText variant="h2">{profile?.full_name ?? 'Student'}</AppText>
          <AppText variant="body" color="secondary">{programName ?? 'Program not set'}</AppText>
          <View style={styles.infoGrid}>
            {profile?.campus && (
              <InfoTile icon="map-pin" label="Campus" value={profile.campus} />
            )}
            {profile?.target_university && (
              <InfoTile icon="book-open" label="University" value={profile.target_university} />
            )}
            {profile?.preparation_level && (
              <InfoTile icon="activity" label="Level" value={profile.preparation_level.charAt(0).toUpperCase() + profile.preparation_level.slice(1)} />
            )}
            {profile?.daily_study_minutes != null && (
              <InfoTile icon="clock" label="Daily study" value={`${profile.daily_study_minutes} min`} />
            )}
            {profile?.test_date && (
              <InfoTile icon="calendar" label="Test date" value={new Date(`${profile.test_date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
            )}
          </View>
          <View style={styles.badges}>
            <Badge label={`Level ${stats?.level ?? 1} · ${stats?.xp ?? 0} XP`} tone="primary" />
            <Pressable onPress={() => router.push('/achievements')} accessibilityRole="button">
              <Badge label={`${earnedBadges} badges earned`} tone="success" />
            </Pressable>
          </View>
        </Card>
      )}

      <View style={styles.statsRow}>
        <StatCard
          label="Streak"
          value={`${stats?.current_streak ?? 0}d`}
          icon={<Feather name="zap" size={16} color={colors.warning} />}
          accent={colors.warning}
        />
        <StatCard
          label="Questions"
          value={stats?.total_questions_answered ?? 0}
          icon={<Feather name="edit-3" size={16} color={colors.primary} />}
        />
        <StatCard
          label="Mock tests"
          value={stats?.total_mock_tests ?? 0}
          icon={<Feather name="clipboard" size={16} color={colors.success} />}
          accent={colors.success}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Study</AppText>
        <PremiumCard
          onPress={() => router.push('/premium')}
          title={isPremium ? 'Premium Active' : 'Go Premium'}
          subtitle={isPremium ? 'All premium features unlocked' : 'Unlock every feature and ace the BUET'}
        />
        <Card style={styles.menuCard}>
          {STUDY_MENU.map((item) => (
            <MenuRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() => router.push(item.route)}
            />
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Settings</AppText>
        <Card style={styles.menuCard}>
          <SettingRow
            icon="activity"
            label="Reduce motion"
            value={<AnimatedSwitch value={reducedMotion} onValueChange={setReducedMotion} />}
          />
          <SettingRow
            icon="bell"
            label="Notifications"
            value={<AnimatedSwitch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
          {LEGAL_MENU.map((item) => (
            <MenuRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() => router.push(item.route)}
            />
          ))}
        </Card>
      </View>

      <Card style={styles.menuCard}>
        <MenuRow icon="log-out" label="Sign out" danger onPress={handleSignOut} />
        <MenuRow icon="trash-2" label="Delete account" danger onPress={handleDeleteAccount} />
      </Card>

      <AppText variant="small" color="muted" style={styles.disclaimer}>
        BUET Prep AI is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
      </AppText>
    </ScreenScrollView>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.menuTile, { backgroundColor: danger ? colors.dangerLight : colors.surfaceAlt }]}>
        <Feather name={icon} size={15} color={danger ? colors.danger : colors.textSecondary} />
      </View>
      <AppText variant="bodyMedium" style={{ flex: 1, color: danger ? colors.danger : colors.text }}>
        {label}
      </AppText>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function SettingRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.menuItem, { alignItems: 'center' }]}>
      <View style={[styles.menuTile, { backgroundColor: colors.surfaceAlt }]}>
        <Feather name={icon} size={15} color={colors.textSecondary} />
      </View>
      <AppText variant="bodyMedium" style={{ flex: 1 }}>{label}</AppText>
      {value}
    </View>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoTile, { backgroundColor: colors.surfaceAlt }]}>
      <Feather name={icon} size={14} color={colors.textSecondary} />
      <AppText variant="small" color="muted">{label}</AppText>
      <AppText variant="bodyMedium" numberOfLines={1}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  loading: { gap: 14 },
  profileHeader: { alignItems: 'center', gap: 6, padding: 24 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, width: '100%', justifyContent: 'center' },
  infoTile: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  section: { gap: 10 },
  menuCard: { padding: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  menuTile: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  disclaimer: { textAlign: 'center', marginTop: 8 },
});
