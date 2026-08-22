import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Switch,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { useAdminAuthStore } from '@/admin/adminAuth';
import { Feather } from '@expo/vector-icons';

interface AdminStatsRow {
  user_id: string;
  full_name: string | null;
  correct: number;
  incorrect: number;
  total: number;
}

interface OptInRow {
  user_id: string;
  full_name: string | null;
  opted_in: boolean;
}

export default function AdminLeaderboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAdminAuthStore((s) => s.session);

  const [metric, setMetric] = React.useState<'xp' | 'questions'>('xp');
  const [showPosition, setShowPosition] = React.useState<boolean>(true);

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-leaderboard-stats'],
    queryFn: () => adminApi.get<AdminStatsRow[]>('/admin-dash/leaderboard/stats'),
    enabled: !!session,
  });

  const {
    data: optInStatus,
    isLoading: optInLoading,
  } = useQuery({
    queryKey: ['admin-leaderboard-opt-in'],
    queryFn: () => adminApi.get<OptInRow[]>('/admin-dash/leaderboard/opt-in-status'),
    enabled: !!session,
  });

  if (isLoading || optInLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Couldn't load leaderboard data"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  // "XP" ranks by correct answers (XP proxy); "Questions" ranks by attempts.
  const sortedByXp = [...(stats ?? [])].sort(
    (a, b) => b.correct - a.correct || b.total - a.total,
  );
  const sortedByQuestions = [...(stats ?? [])].sort((a, b) => b.total - a.total);
  const displayed = metric === 'questions' ? sortedByQuestions : sortedByXp;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">Admin Leaderboard</AppText>
          <AppText variant="body" color="secondary">Manage weekly leaderboard settings</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Metric selection */}
        <View style={styles.metricSection}>
          <AppText variant="bodyMedium" style={styles.sectionLabel}>
            Sort by
          </AppText>
          <View style={styles.metricToggle}>
            <Pressable
              onPress={() => setMetric('xp')}
              style={[
                styles.metricButton,
                metric === 'xp' && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.metricButtonText, metric === 'xp' && styles.metricButtonTextActive]}>XP</Text>
            </Pressable>
            <Pressable
              onPress={() => setMetric('questions')}
              style={[
                styles.metricButton,
                metric === 'questions' && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.metricButtonText, metric === 'questions' && styles.metricButtonTextActive]}>Questions</Text>
            </Pressable>
          </View>
          <AppText variant="small" style={styles.metricSubtext}>
            Tap to switch sorting metric
          </AppText>
        </View>

        {/* Position display toggle */}
        <View style={styles.positionToggle}>
          <Switch
            value={showPosition}
            onValueChange={setShowPosition}
            thumbColor={colors.primary}
            trackColor={{ false: '#ccc', true: colors.primary }}
          />
          <AppText variant="bodyMedium" style={styles.switchLabel}>
            Show position on leaderboard
          </AppText>
        </View>

        {/* Leaderboard entries */}
        {(stats ?? []).length === 0 ? (
          <EmptyState
            icon="award"
            title="No leaderboard data"
            message="No students have attempted questions this week."
          />
        ) : (
          <View style={styles.list}>
            {displayed.map((s, idx) => (
              <GlassCard key={s.user_id} style={styles.row}>
                <View style={styles.rowInner}>
                  <View style={styles.rankWrap}>
                    <AppText variant="bodyMedium" style={styles.rank}>
                      {showPosition ? `#${idx + 1}` : '—'}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" numberOfLines={1}>
                      {s.full_name ?? 'Unknown'}
                    </AppText>
                  </View>
                  <View style={styles.stats}>
                    <AppText variant="micro" color="muted">
                      {s.correct} correct · {s.incorrect} wrong
                    </AppText>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Admin opt-in status summary */}
        <View style={styles.optInSummary}>
          <AppText variant="bodyMedium" style={styles.sectionLabel}>
            Leaderboard Opt-In Status
          </AppText>
          <View style={styles.optInList}>
            {(optInStatus ?? []).map((s) => (
              <View key={s.user_id} style={styles.optInRow}>
                <AppText variant="small" style={styles.optInName}>
                  {s.full_name ?? 'Unknown'}
                </AppText>
                <Switch
                  value={s.opted_in}
                  onValueChange={() => {}}
                  thumbColor={colors.primary}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                />
                <AppText variant="micro" style={styles.optInStatus}>
                  {s.opted_in ? 'Visible' : 'Hidden'}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  body: { padding: 20, paddingBottom: 40, gap: 16 },
  metricSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 14, marginBottom: 8 },
  metricToggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 20,
  },
  metricButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  metricButtonText: { fontSize: 12 },
  metricButtonTextActive: { color: '#FFF' },
  metricSubtext: { fontSize: 10, marginTop: 4 },
  positionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  switchLabel: { flex: 1 },
  list: { gap: 8 },
  row: {
    padding: 12,
    borderRadius: 12,
  },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankWrap: { width: 36, alignItems: 'center' },
  rank: { fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optInSummary: { marginTop: 24, padding: 16, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12 },
  optInList: { gap: 12 },
  optInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
  },
  optInName: { flex: 1 },
  optInStatus: { fontSize: 11, color: 'green' },
});
