import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { AnimatedSwitch } from '@/components/ui/AnimatedSwitch';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useToast } from '@/components/ui/Toast';
import { Feather } from '@expo/vector-icons';

interface LeaderboardResponse {
  period: string;
  week_start: string;
  week_end: string;
  entries: { rank: number; user_id: string; full_name: string; xp: number; correct_count: number; incorrect_count: number; is_current_user: boolean }[];
  current_user: { rank: number; xp: number; correct: number; incorrect: number } | null;
  metric: 'xp' | 'questions';
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { leaderboardOptIn, setLeaderboardOptIn } = useSettingsStore();
  const { show } = useToast();
  const [metric] = React.useState<'xp' | 'questions'>('xp');
  const [showPosition] = React.useState<boolean>(true);

  const { data: optInStatus } = useQuery({
    queryKey: ['leaderboard-opt-in'],
    queryFn: () => api.get<{ opted_in: boolean }>('/leaderboard/opt-in'),
    enabled: !!session,
  });

  const effectivelyOptedIn = optInStatus?.opted_in ?? leaderboardOptIn;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard-weekly', metric, effectivelyOptedIn],
    queryFn: () => api.get<LeaderboardResponse>(`/leaderboard/weekly?metric=${metric}&optedInOnly=${effectivelyOptedIn}`),
    enabled: !!session && effectivelyOptedIn,
  });

  const handleToggle = async (value: boolean) => {
    setLeaderboardOptIn(value);
    try {
      await api.put('/leaderboard/opt-in', { opted_in: value });
      show(value ? "You're on the leaderboard" : 'You left the leaderboard', 'success');
      if (value) void refetch();
    } catch {
      setLeaderboardOptIn(!value);
      show('Could not update. Please try again.', 'error');
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">Weekly Leaderboard</AppText>
          <AppText variant="body" color="secondary">This week's top students</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.optInCard}>
          <View style={styles.optInHeader}>
            <View style={[styles.optInIcon, { backgroundColor: colors.primaryLight }]}>
              <Feather name="users" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyMedium">Show me on the leaderboard</AppText>
              <AppText variant="small" color="muted">
                Only your name and weekly XP/questions are visible to other students.
              </AppText>
            </View>
            <AnimatedSwitch
              value={effectivelyOptedIn}
              onValueChange={handleToggle}
            />
          </View>
        </Card>

        {!effectivelyOptedIn ? (
          <EmptyState
            icon="award"
            title="Leaderboard is off"
            message="Turn it on above to see where you rank among students this week."
          />
        ) : isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </View>
        ) : error ? (
          <ErrorState title="Couldn't load the leaderboard" message="Please check your connection." onRetry={() => refetch()} />
        ) : (data?.entries?.length ?? 0) === 0 ? (
          <EmptyState
            icon="award"
            title="No scores yet"
            message="Answer questions and take mock tests this week to earn XP and climb the board."
          />
        ) : (
          <>
            {data?.current_user && (
              <GlassCard gradient={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]} glow style={styles.myRank}>
                <AppText variant="label" style={styles.whiteText}>Your rank this week</AppText>
                <View style={styles.myRankRow}>
                  <AppText variant="display" style={styles.whiteText}>
                    {showPosition ? `#${data.current_user.rank}` : '—'}
                  </AppText>
                  <View style={styles.myRankXp}>
                    <Feather name="star" size={14} color="#FFF" />
                    <AppText variant="bodyMedium" style={styles.whiteText}>
                      {data.current_user.xp} XP
                    </AppText>
                  </View>
                </View>
                <AppText variant="small" style={styles.white80}>
                  Week of {data.week_start} – {data.week_end}
                </AppText>
                {showPosition && (
                  <AppText variant="small" style={styles.white80}>
                    Position shown: {'✓' }
                  </AppText>
                )}
              </GlassCard>
            )}

            <View style={styles.list}>
              {data?.entries.map((e) => (
                <Card
                  key={e.user_id}
                  padded={false}
                  style={[styles.row, e.is_current_user && { borderColor: colors.primary }]}
                >
                  <View style={styles.rowInner}>
                    <View style={styles.rankWrap}>
                      <AppText variant="bodyMedium" style={[styles.rank, e.rank <= 3 && { fontSize: 18 }]}>
                        {e.rank <= 3 ? MEDALS[e.rank - 1] : `#${e.rank}`}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyMedium" numberOfLines={1}>
                        {e.full_name}
                      </AppText>
                      {e.is_current_user && <Badge label="You" tone="primary" />}
                    </View>
                    <View style={styles.xpWrap}>
                      <Feather name="star" size={14} color={colors.warning} />
                      <AppText variant="bodyMedium">
                        {e.xp.toLocaleString()} XP
                      </AppText>
                    </View>
                    <View style={styles.statsWrap}>
                      <AppText variant="micro" color="muted">
                        {e.correct_count} correct · {e.incorrect_count} wrong
                      </AppText>
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            <AppText variant="small" color="muted" style={styles.note}>
              The leaderboard resets every Monday. XP from practice and mock tests counts toward your weekly score.
            </AppText>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  body: { padding: 20, paddingBottom: 40, gap: 16 },
  optInCard: { padding: 14 },
  optInHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optInIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  myRank: { padding: 18, gap: 6, borderRadius: 18 },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.82)' },
  myRankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  myRankXp: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  list: { gap: 8 },
  row: { padding: 0 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  rankWrap: { width: 40, alignItems: 'center' },
  rank: { fontSize: 15, fontVariant: ['tabular-nums'] },
  xpWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  note: { textAlign: 'center', marginTop: 4 },
});