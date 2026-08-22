import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Switch,
  Text,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { useAdminAuthStore } from '@/admin/adminAuth';
import { Feather } from '@expo/vector-icons';

export default function AdminLeaderboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { session, login, logout, touchActivity } = useAdminAuthStore();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-leaderboard-stats'],
    queryFn: () => adminApi.get<{
      user_id: string;
      full_name: string | null;
      correct: number;
      incorrect: number;
      total: number;
    }[]>('/admin-dash/leaderboard/stats'),
    enabled: !!session,
  });

  const { data: optInStatus, isLoading: optInLoading } = useQuery({
    queryKey: ['admin-leaderboard-opt-in'],
    queryFn: () =>
      adminApi.get<{ user_id: string; opted_in: boolean }[]>(
        '/admin-dash/leaderboard/opt-in-status',
      ),
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
    return <Alert title="Error" message={error.message} />;
  }

  const metric = React.useState<'xp' | 'questions'>('xp')[0];
  const [showPosition, setShowPosition] = React.useState<boolean>(true);

  const sortedByXP = stats?.sort(
    (a, b) => b.total - a.total || b.correct - a.correct,
  ) ?? [];
  const sortedByQuestions = stats?.sort(
    (a, b) => b.incorrect - a.incorrect || b.correct - a.correct,
  ) ?? [];

  const displayed = metric === 'questions' ? sortedByQuestions : sortedByXP;

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
              onPress={() => setShowPosition(!showPosition)}
              style={[
                styles.metricButton,
                metric === 'xp' && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.metricButtonText}>XP</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowPosition(!showPosition)}
              style={[
                styles.metricButton,
                metric === 'questions' && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.metricButtonText}>Questions</Text>
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
            trackColor={['#ccc', colors.primary]}
          >
            <AppText style={styles.switchLabel}>Show position on leaderboard</AppText>
          </Switch>
        </View>

        {/* Leaderboard entries */}
        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </View>
        ) : error ? (
          <ErrorState title="Couldn't load leaderboard data" message="Please try again." onRetry={() => refetch()} />
        ) : (stats ?? []).length === 0 ? (
          <EmptyState
            icon="award"
            title="No leaderboard data"
            message="No students have attempted questions this week."
          />
        ) : (
          <View style={styles.list}>
            {displayed.map((s) => (
              <GlassCard
                key={s.user_id}
                style={styles.row}
                >
                <View style={styles.rowInner}>
                  <View style={styles.rankWrap}>
                    <AppText variant="bodyMedium" style={styles.rank}>
                      {s.rank ?? '—'}
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
            {optInStatus?.map((s) => (
              <View key={s.user_id} style={styles.optInRow}>
                <AppText variant="bodySmall" style={styles.optInName}>
                  {s.full_name ?? 'Unknown'}
                </AppText>
                <Switch
                  value={s.opted_in}
                  onValueChange={() => {}}
                  thumbColor={colors.primary}
                  trackColor={['#ccc', colors.primary]}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  body: { padding: 20, paddingBottom: 40, gap: 16 },
  metricSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 14, color: '#333', marginBottom: 8 },
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  metricButtonActive: {
    backgroundColor: colors.primary,
  },
  metricButtonText: { color: '#333', fontSize: 12 },
  metricSubtext: { fontSize: 10, color: '#666', marginTop: 4 },
  positionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  switchLabel: { color: '#333', fontSize: 13 },
  list: { gap: 8 },
  row: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankWrap: { width: 36, alignItems: 'center' },
  rank: { fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optInSummary: { marginTop: 24, padding: 16, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12 },
  sectionLabel: { fontSize: 13, color: '#555', marginBottom: 8 },
  optInList: { gap: 12 },
  optInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
  },
  optInName: { flex: 1, fontSize: 12 },
  optInStatus: { fontSize: 11, color: 'green' },
});