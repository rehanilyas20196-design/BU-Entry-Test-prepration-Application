import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { FadeInView, AnimatedNumber, AnimatedProgressBar } from '@/components/ui/Animated';
import { AnimatedCircularProgress } from '@/components/ui/AnimatedCircularProgress';
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
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
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
    <Card elevated={false} style={styles.topicRow}>
      <View style={[styles.topicDot, { backgroundColor: color }]} />
      <View style={styles.topicContent}>
        <View style={styles.topicHeader}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.topicName}>{name}</AppText>
          <AppText variant="label" style={{ color }}>{Math.round(accuracy)}%</AppText>
        </View>
        <AnimatedProgressBar progress={Math.min(1, accuracy / 100)} height={6} color={color} trackColor={colors.surfaceAlt} delay={150} />
      </View>
    </Card>
  );
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
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student';
  const accuracy =
    data?.accuracy ??
    (data?.stats && data.stats.total_questions_answered > 0
      ? Math.round((data.stats.total_questions_correct / data.stats.total_questions_answered) * 100)
      : 0);

  const todayTarget = 30;
  const todayDone = data?.daily_activity?.[0]?.questions_answered ?? 0;
  const targetProgress = Math.min(1, todayDone / todayTarget);

  const heroGradient: [string, string] = colors.isDark ? ['#312E81', '#6D28D9'] : ['#4F46E5', '#7C3AED'];
  const ctaGradient: [string, string] = colors.isDark ? ['#6366F1', '#818CF8'] : ['#4F46E5', '#6366F1'];
  const white70 = 'rgba(255,255,255,0.75)';
  const white80 = 'rgba(255,255,255,0.85)';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView>
        <View style={[styles.heroShadow, { shadowColor: colors.isDark ? '#000' : '#4F46E5' }]}>
          <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroTop}>
              <AppText variant="caption" style={{ color: white80 }}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </AppText>
              <View style={styles.levelBadge}>
                <Feather name="award" size={14} color="#FFF" />
                <AppText variant="label" style={styles.whiteText}>{`Lv ${data?.stats?.level ?? 1}`}</AppText>
              </View>
            </View>

            <View style={styles.greetingBlock}>
              <AppText variant="h1" style={styles.whiteText}>{`${greeting()}, ${firstName}`}</AppText>
              <AppText variant="body" style={{ color: white80 }}>Let's make today count — your goal awaits.</AppText>
            </View>

            <View style={styles.countdownValueRow}>
              {days !== null ? (
                <>
                  <AnimatedNumber value={Math.max(0, days)} delay={300} style={styles.countdownNum} />
                  <View>
                    <AppText variant="h3" style={styles.whiteText}>days</AppText>
                    <AppText variant="caption" style={{ color: white70 }}>until BUET test</AppText>
                  </View>
                </>
              ) : (
                <AppText variant="display" style={styles.whiteText}>—</AppText>
              )}
            </View>

            {days !== null && days <= 7 && (
              <View style={styles.urgentPill}>
                <Feather name="alert-circle" size={13} color="#FFF" />
                <AppText variant="small" style={styles.whiteText}>Test is near — stay focused!</AppText>
              </View>
            )}
          </LinearGradient>
        </View>
      </FadeInView>

      <FadeInView delay={120}>
        <View style={styles.summaryRow}>
          <Card style={styles.goalCard}>
            <AppText variant="caption" color="muted">Daily goal</AppText>
            <View style={styles.goalNumbers}>
              <AnimatedNumber value={todayDone} delay={150} style={styles.goalNumber} />
              <AppText variant="caption" color="secondary">{`/ ${todayTarget} questions`}</AppText>
            </View>
            <AnimatedProgressBar progress={targetProgress} height={10} delay={250} />
          </Card>
          <Card style={styles.accuracyCard}>
            <AnimatedCircularProgress progress={accuracy / 100} size={96} label={`${accuracy}%`} sublabel="Accuracy" />
          </Card>
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/practice')}
            accessibilityRole="button"
            accessibilityLabel="Continue studying"
            style={({ pressed }) => [styles.ctaPress, pressed && styles.pressed]}
          >
            <LinearGradient colors={ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
              <Feather name="play" size={18} color="#FFF" />
              <AppText variant="bodyMedium" style={{ color: '#FFF', fontSize: 17 }}>Continue studying</AppText>
            </LinearGradient>
          </Pressable>
          <Button
            title="Start a mock test"
            variant="outline"
            size="lg"
            onPress={() => router.push('/(tabs)/mock')}
            icon={<Feather name="clipboard" size={18} color={colors.primary} />}
          />
        </View>
      </FadeInView>

      <FadeInView delay={280}>
        <View style={styles.statsGrid}>
          <StatCard
            label="Questions solved"
            value={data?.stats?.total_questions_answered ?? 0}
            icon={<Feather name="edit-3" size={18} color={colors.primary} />}
            sub="Keep the momentum"
          />
          <StatCard
            label="Current streak"
            value={`${data?.current_streak ?? 0}d`}
            icon={<Feather name="zap" size={18} color={colors.warning} />}
            accent={colors.warning}
            sub="Days in a row"
          />
        </View>
      </FadeInView>

      <FadeInView delay={360}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-down" size={16} color={colors.danger} />
            <AppText variant="h3">Needs practice</AppText>
          </View>
          {(data?.weak_topics?.length ?? 0) > 0 ? (
            <View style={styles.topicList}>
              {data?.weak_topics?.slice(0, 3).map((t, i) => (
                <TopicRow key={i} name={topicName(t) ?? 'Topic'} accuracy={t.last_accuracy ?? 0} color={colors.danger} />
              ))}
            </View>
          ) : (
            <AppText variant="body" color="muted">Answer a few questions to see your weak areas.</AppText>
          )}
        </View>
      </FadeInView>

      <FadeInView delay={440}>
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
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  heroShadow: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  hero: { padding: 22, gap: 18, borderRadius: 24, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  whiteText: { color: '#FFF' },
  greetingBlock: { gap: 4 },
  countdownValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  countdownNum: { fontSize: 54, lineHeight: 58, fontWeight: '800', color: '#FFF' },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  summaryRow: { flexDirection: 'row', gap: 12 },
  goalCard: { flex: 1.6, padding: 18, gap: 8 },
  goalNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  goalNumber: { fontSize: 30, lineHeight: 34, fontWeight: '800' },
  accuracyCard: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 12 },
  ctaPress: { borderRadius: 16 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  statsGrid: { flexDirection: 'row', gap: 12 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topicList: { gap: 8 },
  topicRow: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicDot: { width: 10, height: 10, borderRadius: 5 },
  topicContent: { flex: 1, gap: 6 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topicName: { flex: 1 },
});