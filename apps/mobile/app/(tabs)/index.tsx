import React from 'react';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { AppText } from '@/components/ui/AppText';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubjectCard } from '@/components/dashboard/SubjectCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import type { QuickActionAccent, QuickActionTone, QuickActionIcon } from '@/components/dashboard/QuickActionCard';
import { PremiumCard } from '@/components/dashboard/PremiumCard';
import { ApkDownloadCard } from '@/components/dashboard/ApkDownloadCard';

const ACCENTS: Record<string, QuickActionAccent> = {
  indigo: { main: '#2563EB', soft: '#60A5FA', ring: '#DBEAFE' },
  blue: { main: '#2563EB', soft: '#60A5FA', ring: '#DBEAFE' },
  amber: { main: '#D97706', soft: '#F59E0B', ring: '#FEF3C7' },
  rose: { main: '#DC2626', soft: '#F87171', ring: '#FEE2E2' },
  emerald: { main: '#059669', soft: '#34D399', ring: '#D1FAE5' },
  pink: { main: '#DB2777', soft: '#F472B6', ring: '#FCE7F3' },
  cyan: { main: '#0891B2', soft: '#22D3EE', ring: '#CFFAFE' },
  slate: { main: '#64748B', soft: '#94A3B8', ring: '#E2E8F0' },
};

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
  daily_activity?: { date: string; questions_answered: number }[];
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  question_count: number;
  attempted?: number;
  correct?: number;
  progress?: number;
}

interface PublicStats {
  visible: boolean;
  active_users: number;
  active_today: number;
  questions_answered_today: number;
}

const TODAY_TARGET = 30;

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - todayStart.getTime()) / 86400000);
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function topicName(t: { topic?: { name: string } }): string | null {
  return Array.isArray(t.topic) ? t.topic[0]?.name ?? null : t.topic?.name ?? null;
}

function TopicRow({
  name,
  accuracy,
  color,
  icon,
}: {
  name: string;
  accuracy: number;
  color: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <Card style={styles.topicRow}>
      <View style={[styles.topicIconWrap, { backgroundColor: `${color}14`, borderColor: `${color}40` }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <View style={styles.topicContent}>
        <View style={styles.topicHeader}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.topicName}>{name}</AppText>
          <AppText variant="label" style={{ color }}>{Math.round(accuracy)}%</AppText>
        </View>
        <ProgressBar progress={Math.min(1, accuracy / 100)} height={6} color={color} trackColor={colors.surfaceAlt} />
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { isWeb, isDesktop, isCompact } = useResponsive();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/analytics/me'),
    enabled: !!session,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ test_date: string | null; full_name: string | null }>('/users/me/profile'),
    enabled: !!session,
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<Subject[]>('/catalog/subjects'),
    enabled: !!session,
  });

  const { data: publicStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.get<PublicStats>('/public/stats'),
    enabled: true,
  });

  const days = daysUntil(profile?.test_date);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student';
  const accuracy =
    data?.accuracy ??
    (data?.stats && data.stats.total_questions_answered > 0
      ? Math.round((data.stats.total_questions_correct / data.stats.total_questions_answered) * 100)
      : 0);

  const todayDone = data?.daily_activity?.[0]?.questions_answered ?? 0;
  const targetProgress = Math.min(1, todayDone / TODAY_TARGET);
  const goalReached = todayDone >= TODAY_TARGET && todayDone > 0;
  const streak = data?.current_streak ?? data?.stats?.current_streak ?? 0;
  const xp = data?.stats?.xp ?? 0;
  const level = data?.stats?.level ?? 1;

  const quickActions: {
    label: string;
    subtitle: string;
    icon: QuickActionIcon;
    accent: QuickActionAccent;
    tone: QuickActionTone;
    badge?: QuickActionIcon;
    route: () => void;
  }[] = [
    { label: 'Practice', subtitle: 'All subjects', icon: 'lightning-bolt', accent: ACCENTS.indigo, tone: 'primary', route: () => router.push('/practice') },
    { label: 'Mock Test', subtitle: 'Full test', icon: 'clipboard-text-outline', accent: ACCENTS.blue, tone: 'primary', route: () => router.push('/(tabs)/mock') },
    { label: 'Weak Areas', subtitle: 'Fix gaps', icon: 'target', accent: ACCENTS.amber, tone: 'secondary', route: () => router.push('/weak-areas') },
    { label: 'Mistakes', subtitle: 'Revisit', icon: 'alert-octagon-outline', accent: ACCENTS.rose, tone: 'secondary', route: () => router.push('/mistakes') },
    { label: 'Learn', subtitle: 'Lessons', icon: 'book-open-variant', accent: ACCENTS.emerald, tone: 'secondary', route: () => router.push('/(tabs)/learn') },
    { label: 'Achievements', subtitle: 'Milestones', icon: 'trophy-outline', accent: ACCENTS.pink, tone: 'secondary', route: () => router.push('/achievements') },
    { label: 'Admission Guide', subtitle: 'Bahria info', icon: 'map-marker-path', accent: ACCENTS.cyan, tone: 'info', badge: 'open-in-new', route: () => router.push('/(tabs)/guide') },
    { label: 'More', subtitle: 'Settings', icon: 'dots-horizontal', accent: ACCENTS.slate, tone: 'utility', route: () => router.push('/(tabs)/profile') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="caption" color="muted">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </AppText>
            <AppText variant="h2">{`${greeting()}, ${firstName}`}</AppText>
          </View>
          <View style={styles.headerBadges}>
            {streak > 0 && (
              <Badge label={`${streak}d streak`} tone="warning" />
            )}
            <Badge label={`Level ${level}`} tone="primary" />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/sample-quiz')}
          accessibilityRole="button"
          accessibilityLabel="Try a free sample quiz"
          style={({ pressed }) => [styles.sampleQuizCard, pressed && { opacity: 0.92 }]}
        >
          <Card padded={false} style={styles.sampleQuizInner}>
            <View style={styles.sampleQuizIcon}>
              <Feather name="zap" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyMedium">Try a free sample quiz</AppText>
              <AppText variant="small" color="muted">5 questions, no sign-up needed</AppText>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>

        {/* Download the Android APK (web visitors only) */}
        <ApkDownloadCard />

        {publicStats?.visible && (
          <Card style={styles.socialProof}>
            <View style={styles.socialProofItem}>
              <AppText variant="display" style={{ color: colors.primary, fontSize: 22 }}>
                {(publicStats.active_users ?? 0).toLocaleString()}
              </AppText>
              <AppText variant="small" color="muted">students practicing</AppText>
            </View>
            <View style={[styles.socialProofDivider, { backgroundColor: colors.border }]} />
            <View style={styles.socialProofItem}>
              <AppText variant="display" style={{ color: colors.success, fontSize: 22 }}>
                {(publicStats.questions_answered_today ?? 0).toLocaleString()}
              </AppText>
              <AppText variant="small" color="muted">questions answered today</AppText>
            </View>
          </Card>
        )}

        {days === null && (
          <Card style={styles.countdownCard}>
            <View style={styles.countdownHeader}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyMedium">Set your exam date</AppText>
                <AppText variant="small" color="muted">
                  We'll count down to your BUET test and keep you on track.
                </AppText>
              </View>
              <Button
                title="Set date"
                variant="outline"
                size="sm"
                onPress={() => router.push('/study-plan')}
              />
            </View>
          </Card>
        )}

        {days !== null && (
          <Card style={styles.countdownCard}>
            <View style={styles.countdownHeader}>
              <AppText variant="bodyMedium">Days until BUET test</AppText>
              {days <= 7 && (
                <Badge label="Test is near" tone="danger" />
              )}
            </View>
            <View style={styles.countdownBody}>
              <AppText variant="display" style={{ color: colors.text, fontVariant: ['tabular-nums'] }}>
                {Math.max(0, days)}
              </AppText>
              <AppText variant="caption" color="muted" style={styles.countdownMeta}>
                {days < 0 ? 'Your test date has passed — update it in settings.' : 'Keep a steady pace — consistency matters.'}
              </AppText>
            </View>
          </Card>
        )}

        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <Card style={[styles.statCell, isCompact ? styles.statCellCompact : styles.statCellWide, styles.goalCard]}>
              <View style={styles.cardTitleRow}>
                <AppText variant="label">Today's goal</AppText>
                {goalReached && !isCompact && <Badge label="Goal reached" tone="success" />}
              </View>
              <View style={styles.goalNumbers}>
                <AppText variant="display" style={[styles.statValue, { color: goalReached ? colors.success : colors.text }]}>
                  {todayDone}
                </AppText>
                <AppText variant="caption" color="secondary" numberOfLines={1} style={styles.goalUnits}>
                  / {TODAY_TARGET} questions
                </AppText>
              </View>
              <ProgressBar progress={targetProgress} height={6} color={goalReached ? colors.success : colors.primary} />
              <AppText variant="small" color="muted" numberOfLines={2}>
                {goalReached ? 'Amazing work — keep the streak alive!' : `${TODAY_TARGET - todayDone} more to reach your goal`}
              </AppText>
            </Card>

            <Pressable
              onPress={() => router.push('/performance')}
              accessibilityRole="button"
              accessibilityLabel="View performance"
              style={({ pressed }) => [styles.statCell, isCompact ? styles.statCellCompact : styles.statCellWide, pressed && { opacity: 0.9 }]}
            >
              <Card style={styles.accuracyCardInner}>
                <AppText variant="label">Accuracy</AppText>
                <AppText variant="display" style={[styles.statValue, { color: colors.primary }]}>
                  {accuracy}%
                </AppText>
                <ProgressBar progress={Math.min(1, accuracy / 100)} height={6} color={colors.primary} />
                <AppText variant="small" color="muted">Performance</AppText>
              </Card>
            </Pressable>

            <StatCard
              style={[styles.statCell, isCompact ? styles.statCellCompact : styles.statCellWide]}
              label="Questions solved"
              value={data?.stats?.total_questions_answered ?? 0}
              icon={<Feather name="edit-3" size={16} color={colors.primary} />}
              sub={`${xp.toLocaleString()} XP earned`}
            />
            <StatCard
              style={[styles.statCell, isCompact ? styles.statCellCompact : styles.statCellWide]}
              label="Current streak"
              value={`${streak}d`}
              icon={<Feather name="zap" size={16} color={colors.warning} />}
              accent={colors.warning}
              sub="Days in a row"
            />
          </View>

          <Button
            title="Continue studying"
            icon={<Feather name="play" size={16} color="#FFFFFF" />}
            size="lg"
            onPress={() => router.push('/practice')}
          />
        </View>

        <Card style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <View style={styles.xpTitleRow}>
              <Feather name="star" size={16} color={colors.primary} />
              <AppText variant="bodyMedium">Level {level}</AppText>
            </View>
            <AppText variant="small" color="muted">{xp % 100} / 100 XP to next level</AppText>
          </View>
          <ProgressBar progress={(xp % 100) / 100} height={8} color={colors.primary} />
        </Card>

        <PremiumCard onPress={() => router.push('/premium')} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3">Quick actions</AppText>
          </View>
          <View style={styles.actionGrid}>
            {quickActions.map((a) => (
              <QuickActionCard
                key={a.label}
                label={a.label}
                subtitle={a.subtitle}
                icon={a.icon}
                accent={a.accent}
                tone={a.tone}
                badge={a.badge}
                index={0}
                onPress={a.route}
                style={isWeb && isDesktop ? { flexBasis: '48%' } : undefined}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3">Subjects</AppText>
            <Pressable onPress={() => router.push('/practice')} hitSlop={8}>
              <AppText variant="caption" color="primary">See all</AppText>
            </Pressable>
          </View>
          {subjectsLoading ? (
            <View style={styles.subjectRow}>
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} lines={2} />
              ))}
            </View>
          ) : (subjects?.length ?? 0) > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
              {subjects!.map((s) => (
                <SubjectCard
                  key={s.id}
                  name={s.name}
                  questionCount={s.question_count}
                  progress={s.progress}
                  onPress={() => router.push({ pathname: '/topics', params: { subjectId: s.id, subjectName: s.name } })}
                />
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              icon="book-open"
              title="No subjects yet"
              message="Subjects will appear here once available."
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-down" size={16} color={colors.danger} />
            <AppText variant="h3">Needs practice</AppText>
            {(data?.weak_topics?.length ?? 0) > 0 && (
              <Pressable onPress={() => router.push('/weak-areas')} hitSlop={8}>
                <AppText variant="caption" color="primary">View all</AppText>
              </Pressable>
            )}
          </View>
          {(data?.weak_topics?.length ?? 0) > 0 ? (
            <View style={styles.topicList}>
              {data?.weak_topics?.slice(0, 3).map((t, i) => (
                <TopicRow key={i} name={topicName(t) ?? 'Topic'} accuracy={t.last_accuracy ?? 0} color={colors.danger} icon="alert-triangle" />
              ))}
            </View>
          ) : isLoading ? (
            <SkeletonCard lines={2} />
          ) : (
            <AppText variant="body" color="muted">Answer a few questions to see your weak areas.</AppText>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-up" size={16} color={colors.success} />
            <AppText variant="h3">Strongest areas</AppText>
          </View>
          {(data?.strong_topics?.length ?? 0) > 0 ? (
            <View style={styles.topicList}>
              {data?.strong_topics?.slice(0, 3).map((t, i) => (
                <TopicRow key={i} name={topicName(t) ?? 'Topic'} accuracy={t.last_accuracy ?? 0} color={colors.success} icon="check-circle" />
              ))}
            </View>
          ) : (
            <AppText variant="body" color="muted">Keep practicing to build your strengths.</AppText>
          )}
        </View>
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 24 },
  sampleQuizCard: {},
  sampleQuizInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  sampleQuizIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  socialProof: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  socialProofItem: { flex: 1, alignItems: 'center', gap: 2 },
  socialProofDivider: { width: 1, height: 36 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, gap: 2 },
  headerBadges: { flexDirection: 'row', gap: 8, paddingTop: 2, flexWrap: 'wrap', justifyContent: 'flex-end' },
  countdownCard: { gap: 8 },
  countdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  countdownBody: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  countdownMeta: { flex: 1 },
  statsSection: { gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCell: { flexGrow: 1 },
  statCellCompact: { flexBasis: '47%' },
  statCellWide: { flexBasis: '23%' },
  goalCard: { gap: 8 },
  accuracyCardInner: { flex: 1, gap: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  goalNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  goalUnits: { flexShrink: 1 },
  statValue: { fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  xpCard: { gap: 8, padding: 16 },
  xpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  xpTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectRow: { gap: 10, paddingRight: 4 },
  topicList: { gap: 8 },
  topicRow: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  topicContent: { flex: 1, gap: 6 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topicName: { flex: 1 },
});
