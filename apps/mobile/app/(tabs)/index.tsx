import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Image, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
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

function TopicRow({ name, accuracy, color }: { name: string; accuracy: number; color: string }) {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.topicRow}>
      <View style={[styles.topicDot, { backgroundColor: color }]} />
      <View style={styles.topicContent}>
        <View style={styles.topicHeader}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.topicName}>{name}</AppText>
          <AppText variant="label" style={{ color }}>{Math.round(accuracy)}%</AppText>
        </View>
        <AnimatedProgressBar progress={Math.min(1, accuracy / 100)} height={6} color={color} trackColor={colors.surfaceAlt} delay={150} />
      </View>
    </GlassCard>
  );
}

function QuickAction({
  label,
  icon,
  gradient,
  onPress,
  delay = 0,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  gradient: readonly [string, string, ...string[]];
  onPress: () => void;
  delay?: number;
}) {
  return (
    <FadeInView delay={delay} distance={14}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.actionPress, pressed && styles.actionPressed]}
      >
        <GlassCard gradient={gradient} style={styles.action}>
          <Feather name={icon} size={20} color="#FFF" />
          <AppText variant="caption" style={styles.actionText}>{label}</AppText>
        </GlassCard>
      </Pressable>
    </FadeInView>
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
    const cardWidth = Math.min((width - 40 - 12) / 2, 220);

  const reduced = useReducedMotion();
  const scrollY = useSharedValue(0);
  const heroFloat = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  useEffect(() => {
    if (reduced) {
      heroFloat.value = 0;
      return;
    }
    heroFloat.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, heroFloat]);

  const heroMotion = useAnimatedStyle(() => ({
    opacity: reduced ? 1 : 1 - Math.min(scrollY.value * 0.0014, 0.45),
    transform: [
      { perspective: 900 },
      { rotateX: `${Math.min(scrollY.value * 0.02, 7)}deg` },
      { translateY: reduced ? 0 : -Math.sin(heroFloat.value * Math.PI) * 6 },
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
        <GlassCard
          gradient={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]}
          glow
          style={styles.hero}
        >
          <FloatingParticles count={10} color="#FFFFFF" />
          <View style={styles.heroTop}>
            <Image
              source={require('../../assets/building1.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroTopRight}>
              <AppText variant="caption" style={styles.white70}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </AppText>
              <View style={styles.heroBadges}>
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Feather name="zap" size={13} color="#FDE68A" />
                    <AppText variant="label" style={styles.whiteText}>{streak}d</AppText>
                  </View>
                )}
                <View style={styles.levelBadge}>
                  <Feather name="award" size={13} color="#FFF" />
                  <AppText variant="label" style={styles.whiteText}>Lv {level}</AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.greetingBlock}>
            <AppText variant="h1" style={styles.whiteText}>{`${greeting()}, ${firstName}`}</AppText>
            <AppText variant="body" style={styles.white80}>Let's make today count — your goal awaits.</AppText>
          </View>

          <View style={styles.countdownRow}>
            <View style={styles.countdownNumWrap}>
              {days !== null ? (
                <AnimatedNumber value={Math.max(0, days)} delay={300} style={styles.countdownNum} />
              ) : (
                <AppText variant="display" style={styles.whiteText}>—</AppText>
              )}
            </View>
            <View>
              <AppText variant="h3" style={styles.whiteText}>days</AppText>
              <AppText variant="caption" style={styles.white70}>until BUET test</AppText>
            </View>
          </View>

          {days !== null && days <= 7 && (
            <View style={styles.urgentPill}>
              <Feather name="alert-circle" size={13} color="#FFF" />
              <AppText variant="small" style={styles.whiteText}>Test is near — stay focused!</AppText>
            </View>
          )}
        </GlassCard>
        </Animated.View>
      </FadeInView>

      <FadeInView delay={110}>
        <Float3D style={styles.summaryRow} phase={0.1}>
          <GlassCard style={[styles.goalCard, { flex: 1.6 }]}>
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
            <AnimatedProgressBar progress={targetProgress} height={10} delay={250} color={goalReached ? colors.success : undefined} />
            <AppText variant="small" color="muted">
              {goalReached ? 'Amazing work — keep the streak alive!' : `${TODAY_TARGET - todayDone} more to reach your goal`}
            </AppText>
          </GlassCard>

          <Pressable
            onPress={() => router.push('/performance')}
            accessibilityRole="button"
            accessibilityLabel="View performance dashboard"
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <GlassCard style={styles.accuracyCard}>
              <ProgressRing progress={accuracy / 100} size={92} sublabel="Accuracy" />
              <AppText variant="micro" color="muted">Performance</AppText>
            </GlassCard>
          </Pressable>
        </Float3D>
      </FadeInView>

      <FadeInView delay={180}>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/practice')}
            accessibilityRole="button"
            accessibilityLabel="Continue studying"
            style={({ pressed }) => [styles.ctaPress, pressed && styles.actionPressed]}
          >
            <GlassCard gradient={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} glow style={styles.cta}>
              <Feather name="play" size={18} color="#FFF" />
              <AppText variant="bodyMedium" style={styles.whiteText}>Continue studying</AppText>
            </GlassCard>
          </Pressable>
        </View>
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

      <Reveal scrollY={scrollY} index={3}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3">Quick actions</AppText>
          </View>
          <View style={styles.actionGrid}>
            <QuickAction
              label="Practice"
              icon="edit-3"
              gradient={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
              onPress={() => router.push('/practice')}
            />
            <QuickAction
              label="Mock test"
              icon="clipboard"
              gradient={['#0EA5E9', '#6366F1']}
              onPress={() => router.push('/(tabs)/mock')}
              delay={40}
            />
            <QuickAction
              label="Weak areas"
              icon="target"
              gradient={['#F59E0B', '#F97316']}
              onPress={() => router.push('/weak-areas')}
              delay={80}
            />
            <QuickAction
              label="Mistakes"
              icon="alert-octagon"
              gradient={['#E11D48', '#F43F5E']}
              onPress={() => router.push('/mistakes')}
              delay={120}
            />
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
              {(subjects ?? []).map((s) => (
                <SubjectCard
                  key={s.id}
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
                <TopicRow key={i} name={topicName(t) ?? 'Topic'} accuracy={t.last_accuracy ?? 0} color={colors.danger} />
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
                <TopicRow key={i} name={topicName(t) ?? 'Topic'} accuracy={t.last_accuracy ?? 0} color={colors.success} />
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
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  hero: { padding: 22, gap: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroImage: {
    width: 104, height: 104, borderRadius: 18,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroTopRight: { flex: 1, alignItems: 'flex-end', gap: 8 },
  heroBadges: { flexDirection: 'row', gap: 8 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
  },
  whiteText: { color: '#FFF' },
  white70: { color: 'rgba(255,255,255,0.72)' },
  white80: { color: 'rgba(255,255,255,0.82)' },
  greetingBlock: { gap: 4, marginTop: 4 },
  countdownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 4 },
  countdownNumWrap: { minWidth: 76 },
  countdownNum: { fontSize: 54, lineHeight: 58, fontWeight: '800', color: '#FFF' },
  urgentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  summaryRow: { flexDirection: 'row', gap: 12 },
  goalCard: { padding: 18, gap: 10 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalDonePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(22,163,74,0.12)' },
  goalNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  accuracyCard: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actions: { gap: 12 },
  ctaPress: { borderRadius: 16 },
  actionPressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  statsGrid: { flexDirection: 'row', gap: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionPress: { flexGrow: 1, flexBasis: '46%', borderRadius: 14 },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
  },
  actionText: { color: '#FFF', fontWeight: '600' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectRow: { gap: 10, paddingRight: 4 },
  topicList: { gap: 8 },
  topicRow: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicDot: { width: 10, height: 10, borderRadius: 5 },
  topicContent: { flex: 1, gap: 6 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topicName: { flex: 1 },
});