import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLoader,
  AdminTitle,
  adminColors,
  fmtDate,
  fmtDateShort,
} from '@/admin/components/ui';

interface UserDetail {
  user: {
    user_id: string;
    email: string;
    created_at: string | null;
    last_sign_in_at: string | null;
  };
  profile: {
    full_name: string | null;
    campus: string | null;
    test_date: string | null;
    is_premium: boolean;
    onboarded: boolean;
    preparation_level: string | null;
  } | null;
  mistakes_count: number;
  attempts: {
    id: string;
    mode: string;
    status: string;
    submitted_at: string | null;
    score: number | null;
    max_score: number | null;
    correct_count: number | null;
    incorrect_count: number | null;
    total_questions: number | null;
    mock_test: { name: string } | null;
  }[];
  payments: {
    id: string;
    method: string;
    amount: number;
    status: string;
    trx_id: string | null;
    created_at: string;
  }[];
  activity: { date: string; count: number }[];
  questions_answered: number;
  questions_correct: number;
}

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<UserDetail>({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.get<UserDetail>(`/admin-dash/users/${id}`),
    enabled: !!id,
  });

  const togglePremium = useMutation({
    mutationFn: () =>
      data?.profile?.is_premium
        ? adminApi.post(`/admin-dash/premium/${id}/revoke`)
        : adminApi.post(`/admin-dash/premium/${id}/grant`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user', id] }),
  });

  if (isLoading || !data) return <AdminShell title="User detail" active="users"><AdminLoader /></AdminShell>;

  const { user, profile } = data;
  const accuracy =
    data.questions_answered > 0 ? Math.round((data.questions_correct / data.questions_answered) * 100) : null;

  return (
    <AdminShell title="User detail" active="users">
      <View style={styles.topRow}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile?.full_name || user.email || 'Unknown user'}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        <AdminButton
          title={profile?.is_premium ? 'Revoke premium' : 'Grant premium'}
          variant={profile?.is_premium ? 'danger' : 'success'}
          icon={profile?.is_premium ? 'x-circle' : 'star'}
          onPress={() => togglePremium.mutate()}
          loading={togglePremium.isPending}
        />
      </View>

      <View style={styles.statGrid}>
        <InfoTile label="Status" value={profile?.is_premium ? 'Premium' : 'Free'} tone={profile?.is_premium ? 'warning' : 'neutral'} />
        <InfoTile label="Onboarded" value={profile?.onboarded ? 'Yes' : 'No'} tone={profile?.onboarded ? 'success' : 'danger'} />
        <InfoTile label="Campus" value={profile?.campus ?? '—'} />
        <InfoTile label="Test date" value={profile?.test_date ? fmtDateShort(profile.test_date) : '—'} />
        <InfoTile label="Level" value={profile?.preparation_level ?? '—'} />
        <InfoTile label="Mistakes" value={String(data.mistakes_count)} />
        <InfoTile label="Accuracy" value={accuracy !== null ? `${accuracy}%` : '—'} />
        <InfoTile label="Questions" value={`${data.questions_correct}/${data.questions_answered}`} />
      </View>

      <AdminCard>
        <Text style={styles.detailMeta}>
          Joined: {fmtDate(user.created_at)} · Last sign-in: {fmtDate(user.last_sign_in_at)} · ID: {user.user_id}
        </Text>
      </AdminCard>

      <AdminTitle>Test attempts ({data.attempts.length})</AdminTitle>
      <AdminCard style={styles.listCard}>
        {data.attempts.length === 0 ? (
          <Text style={styles.muted}>No completed tests.</Text>
        ) : (
          data.attempts.map((a) => (
            <View key={a.id} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{a.mock_test?.name ?? a.mode ?? 'Test'}</Text>
                <Text style={styles.listSub}>
                  {a.mode} · score {a.score ?? 0}/{a.max_score ?? 0} · {a.correct_count ?? 0} correct · {a.incorrect_count ?? 0} wrong
                </Text>
              </View>
              <AdminBadge tone={a.status === 'submitted' ? 'success' : a.status === 'expired' ? 'warning' : 'neutral'}>
                {a.status}
              </AdminBadge>
            </View>
          ))
        )}
      </AdminCard>

      <AdminTitle>Payments ({data.payments.length})</AdminTitle>
      <AdminCard style={styles.listCard}>
        {data.payments.length === 0 ? (
          <Text style={styles.muted}>No payments.</Text>
        ) : (
          data.payments.map((p) => (
            <View key={p.id} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>
                  {p.method} · {p.amount} BDT
                </Text>
                <Text style={styles.listSub}>{p.trx_id ?? 'no trx id'} · {fmtDate(p.created_at)}</Text>
              </View>
              <AdminBadge tone={p.status === 'completed' ? 'success' : 'warning'}>{p.status}</AdminBadge>
            </View>
          ))
        )}
      </AdminCard>

      {data.activity.length > 0 ? (
        <>
          <AdminTitle>Study activity (daily)</AdminTitle>
          <AdminCard>
            <ScrollView horizontal>
              <View style={styles.barRow}>
                {data.activity.map((a) => (
                  <View key={a.date} style={styles.barCol}>
                    <Text style={styles.barCount}>{a.count}</Text>
                    <View style={[styles.bar, { height: Math.max(6, Math.min(90, a.count * 3)) }]} />
                    <Text style={styles.barLabel}>{a.date.slice(5)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </AdminCard>
        </>
      ) : null}
    </AdminShell>
  );
}

function InfoTile({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' | 'warning' | 'neutral' }) {
  return (
    <AdminCard style={styles.infoTile}>
      <Text style={styles.infoLabel}>{label}</Text>
      {tone ? (
        <AdminBadge tone={tone}>{value}</AdminBadge>
      ) : (
        <Text style={styles.infoValue}>{value}</Text>
      )}
    </AdminCard>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerText: { flex: 1 },
  name: { fontSize: 22, fontWeight: '800', color: adminColors.text },
  email: { fontSize: 14, color: adminColors.textSecondary, marginTop: 2 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoTile: { minWidth: 150, flex: 1, maxWidth: 220 },
  infoLabel: { fontSize: 12, color: adminColors.textMuted, marginBottom: 6 },
  infoValue: { fontSize: 16, fontWeight: '700', color: adminColors.text },
  detailMeta: { fontSize: 12, color: adminColors.textMuted },
  listCard: { paddingHorizontal: 18, paddingVertical: 6 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    gap: 10,
  },
  listTitle: { fontSize: 14, fontWeight: '600', color: adminColors.text },
  listSub: { fontSize: 12, color: adminColors.textMuted, marginTop: 2 },
  muted: { fontSize: 14, color: adminColors.textMuted },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  barCol: { alignItems: 'center', gap: 4 },
  barCount: { fontSize: 11, color: adminColors.textSecondary },
  bar: { width: 22, backgroundColor: adminColors.primary, borderRadius: 4 },
  barLabel: { fontSize: 10, color: adminColors.textMuted },
});
