import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedProgressBar } from '@/components/ui/Animated';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { FadeInView, AnimatedNumber } from '@/components/ui/Animated';
import { Reveal } from '@/components/ui/Reveal';
import { Float3D } from '@/components/ui/Float3D';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StatCard } from '@/components/dashboard/StatCard';
import { SubjectCard } from '@/components/dashboard/SubjectCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientCTA } from '@/components/ui/GradientCTA';
import { accents } from '@/theme/tokens';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import type { QuickActionAccent, QuickActionTone, QuickActionIcon } from '@/components/dashboard/QuickActionCard';
import { PremiumCard } from '@/components/dashboard/PremiumCard';

const ACCENTS: Record<string, QuickActionAccent> = {
  indigo: { main: '#6366F1', soft: '#818CF8', ring: '#C7D2FE' },
  blue: { main: '#0EA5E9', soft: '#38BDF8', ring: '#BAE6FD' },
  amber: { main: '#D97706', soft: '#F59E0B', ring: '#FDE68A' },
  rose: { main: '#E11D48', soft: '#F43F5E', ring: '#FECDD3' },
  emerald: { main: '#059669', soft: '#10B981', ring: '#A7F3D0' },
  pink: { main: '#DB2777', soft: '#EC4899', ring: '#FBCFE8' },
  cyan: { main: '#0891B2', soft: '#06B6D4', ring: '#A5F3FC' },
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
    <GlassCard style={[styles.topicRow, { borderColor: `${color}40` }]}>
      <View style={[styles.topicIconWrap, { backgroundColor: `${color}1F`, borderColor: `${color}45` }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <View style={styles.topicContent}>
        <View style={styles.topicHeader}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.topicName}>{name}</AppText>
          <View style={[styles.topicPill, { backgroundColor: `${color}1F` }]}>
            <AppText variant="label" style={{ color }}>{Math.round(accuracy)}%</AppText>
          </View>
        </View>
        <AnimatedProgressBar progress={Math.min(1, accuracy / 100)} height={6} color={color} trackColor={colors.surfaceAlt} delay={150} />
      </View>
    </GlassCard>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { width } = useWindowDimensions();

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
    const cardWidth = Math.min((width - 40 - 12) / 2, 220);

  const reduced = useReducedMotion();
  const scrollY = useSharedValue(0);
  const heroFloat = useSharedValue(0);
  const heroBg = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  useEffect(() => {
    if (reduced) {
      heroFloat.value = 0;
      heroBg.value = 0;
      return;
    }
    heroFloat.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
    heroBg.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, heroFloat, heroBg]);

  const heroMotion = useAnimatedStyle(() => ({
    opacity: reduced ? 1 : 1 - Math.min(scrollY.value * 0.0014, 0.45),
    transform: [
      { perspective: 900 },
      { rotateX: `${Math.min(scrollY.value * 0.02, 7)}deg` },
      { translateY: reduced ? 0 : -Math.sin(heroFloat.value * Math.PI) * 6 },
    ],
  }));

  const heroBgMotion = useAnimatedStyle(() => ({
    transform: [
      { scale: reduced ? 1.16 : 1.2 + heroBg.value * 0.06 },
      { translateX: reduced ? -52 : -52 - heroBg.value * 6 },
      { translateY: reduced ? -6 : -6 },
    ],
  }));

  const bgColors = colors.isDark
    ? ([colors.heroGradientStart, colors.gradientMid, colors.heroGradientEnd] as [string, string, string])
    : (['#FFFFFF', '#EEF2FF', '#F6F7FB'] as [string, string, string]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground colors={bgColors} animated>
        <Animated.ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
      <FadeInView>
        <Animated.View style={heroMotion}>
          <View style={styles.heroWrap}>
            <View style={styles.heroShadow} />
            <Animated.View style={styles.hero}>
              <Animated.Image
                source={require('../../assets/home-hero.jpg')}
                blurRadius={1}
                style={[StyleSheet.absoluteFill, heroBgMotion]}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(16,14,44,0.05)', 'rgba(24,17,58,0.22)', 'rgba(14,10,38,0.68)'] as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <FloatingParticles count={8} color="#FFFFFF" />

              <View style={styles.heroGlass}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] as [string, string]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroTop}>
                  <AppText variant="caption" style={[styles.white70, styles.heroTextShadow]}>
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </AppText>
                  <View style={styles.heroBadges}>
                    {streak > 0 && (
                      <View style={styles.streakBadge}>
                        <Feather name="zap" size={12} color="#FDE68A" />
                        <AppText variant="label" style={styles.whiteText}>{streak}d</AppText>
                      </View>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Level ${level}`}
                      style={({ pressed }) => [styles.levelBadge, pressed && styles.levelBadgePressed]}
                    >
                      <Feather name="award" size={12} color="#FFFFFF" />
                      <AppText variant="label" style={styles.whiteText}>Lv {level}</AppText>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.greetingBlock}>
                  <AppText variant="h1" style={[styles.whiteText, styles.heroTextShadow]}>{`${greeting()}, ${firstName}`}</AppText>
                  <AppText variant="body" style={[styles.white80, styles.heroTextShadow]}>Let's make today count — your goal awaits.</AppText>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.countdownRow}>
                  <View style={styles.countdownNumWrap}>
                    {days !== null ? (
                      <AnimatedNumber value={Math.max(0, days)} delay={300} style={[styles.countdownNum, styles.heroTextShadow]} />
                    ) : (
                      <AppText variant="display" style={[styles.whiteText, styles.heroTextShadow]}>—</AppText>
                    )}
                  </View>
                  <View style={styles.countdownMeta}>
                    <AppText variant="h3" style={[styles.whiteText, styles.heroTextShadow]}>days</AppText>
                    <AppText variant="caption" style={[styles.white70, styles.heroTextShadow, styles.countdownLabel]}>until BUET test</AppText>
                  </View>
                </View>

                {days !== null && days <= 7 && (
                  <View style={styles.urgentPill}>
                    <Feather name="alert-circle" size={13} color="#FFF" />
                    <AppText variant="small" style={styles.whiteText}>Test is near — stay focused!</AppText>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </FadeInView>

      <FadeInView delay={110}>
        <Float3D style={styles.summaryRow} phase={0.1}>
          <GlassPanel
            accent={[accents.indigo.soft, accents.indigo.main]}
            accentOpacity={0.07}
            radius={20}
            contentStyle={styles.goalCardContent}
            style={styles.goalCard}
          >
            <View style={styles.goalHeader}>
              <AppText variant="caption" color="muted">Today's goal</AppText>
              {goalReached && (
                <View style={styles.goalDonePill}>
                  <Feather name="check-circle" size={12} color={colors.success} />
                  <AppText variant="micro" color="success">Goal reached</AppText>
                </View>
              )}
            </View>
            <View style={styles.goalNumbers}>
              <AppText variant="display" style={{ color: goalReached ? colors.success : colors.text }}>
                {todayDone}
              </AppText>
              <AppText variant="caption" color="secondary">/ {TODAY_TARGET} questions</AppText>
            </View>
            <AnimatedProgressBar
              progress={targetProgress}
              height={10}
              delay={250}
              gradient={goalReached ? [colors.success, '#22C55E'] : [accents.indigo.soft, accents.indigo.main, accents.violet.soft]}
            />
            <AppText variant="small" color="muted">
              {goalReached ? 'Amazing work — keep the streak alive!' : `${TODAY_TARGET - todayDone} more to reach your goal`}
            </AppText>
          </GlassPanel>

          <Pressable
            onPress={() => router.push('/performance')}
            accessibilityRole="button"
            accessibilityLabel="View performance dashboard"
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <GlassPanel radius={20} contentStyle={styles.accuracyCardContent} style={styles.accuracyCard}>
              <ProgressRing
                progress={accuracy / 100}
                size={88}
                strokeWidth={8}
                gradient={[accents.indigo.main, accents.violet.main]}
                glow
                sublabel="Accuracy"
              />
              <AppText variant="micro" color="muted">Performance</AppText>
            </GlassPanel>
          </Pressable>
        </Float3D>
      </FadeInView>

      <FadeInView delay={180}>
        <GradientCTA
          title="Continue studying"
          icon="play"
          onPress={() => router.push('/practice')}
        />
      </FadeInView>

      <FadeInView delay={240}>
        <Float3D style={styles.statsGrid} phase={0.45}>
          <StatCard
            label="Questions solved"
            value={data?.stats?.total_questions_answered ?? 0}
            icon={<Feather name="edit-3" size={16} color={colors.primary} />}
            sub={`${xp.toLocaleString()} XP earned`}
          />
          <StatCard
            label="Current streak"
            value={`${streak}d`}
            icon={<Feather name="zap" size={16} color={colors.warning} />}
            accent={colors.warning}
            sub="Days in a row"
          />
        </Float3D>
      </FadeInView>

      <FadeInView delay={300}>
        <PremiumCard onPress={() => router.push('/premium')} />
      </FadeInView>

      <Reveal scrollY={scrollY} index={3}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3">Quick actions</AppText>
          </View>
          <View style={styles.actionGrid}>
            {quickActions.map((a, i) => (
              <QuickActionCard
                key={a.label}
                label={a.label}
                subtitle={a.subtitle}
                icon={a.icon}
                accent={a.accent}
                tone={a.tone}
                badge={a.badge}
                index={i}
                onPress={a.route}
              />
            ))}
          </View>
        </View>
      </Reveal>

      <Reveal scrollY={scrollY} index={4}>
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
                <View key={i} style={{ width: cardWidth }}>
                  <SkeletonCard lines={2} />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
              {(subjects ?? []).map((s, i) => (
                <SubjectCard
                  key={s.id}
                  index={i}
                  name={s.name}
                  questionCount={s.question_count}
                  onPress={() => router.push({ pathname: '/topics', params: { subjectId: s.id, subjectName: s.name } })}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </Reveal>

      <Reveal scrollY={scrollY} index={5}>
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
      </Reveal>

      <Reveal scrollY={scrollY} index={6}>
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
      </Reveal>
    </Animated.ScrollView>
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 26 },
  heroWrap: { position: 'relative' },
  heroShadow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.02)',
    shadowColor: '#2E2A63',
    shadowOpacity: 1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroGlass: {
    margin: 12,
    padding: 18,
    gap: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(12,10,34,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroBadges: { flexDirection: 'row', gap: 8 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.26)',
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.26)',
  },
  levelBadgePressed: { transform: [{ scale: 0.94 }] },
  whiteText: { color: '#FFF' },
  white70: { color: 'rgba(255,255,255,0.72)' },
  white80: { color: 'rgba(255,255,255,0.82)' },
  heroTextShadow: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  greetingBlock: { gap: 4, marginTop: 2 },
  heroDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.22)' },
  countdownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  countdownNumWrap: { minWidth: 84 },
  countdownNum: { fontSize: 54, lineHeight: 58, fontWeight: '800', color: '#FFF', fontVariant: ['tabular-nums'] },
  countdownLabel: { letterSpacing: 0.4 },
  countdownMeta: { paddingBottom: 4, gap: 2 },
  urgentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  summaryRow: { flexDirection: 'row', gap: 12 },
  goalCard: { flex: 1.6 },
  goalCardContent: { padding: 18, gap: 10 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalDonePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(22,163,74,0.12)' },
  goalNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  accuracyCard: { flex: 1 },
  accuracyCardContent: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectRow: { gap: 10, paddingRight: 4 },
  topicList: { gap: 8 },
  topicRow: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, minHeight: 62 },
  topicIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  topicContent: { flex: 1, gap: 6 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topicName: { flex: 1 },
  topicPill: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999,
    minWidth: 44, alignItems: 'center',
  },
});