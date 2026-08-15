import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminCard,
  AdminLoader,
  AdminStatCard,
  AdminTitle,
  adminColors,
  fmtDate,
} from '@/admin/components/ui';

interface Stats {
  total_users: number;
  total_premium: number;
  total_tests: number;
  total_questions: number;
  signups_today: number;
  signups_this_week: number;
  payments_today: number;
  tests_today: number;
}

interface ActivityItem {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();

  const stats = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.get<Stats>('/admin-dash/stats'),
  });

  const activity = useQuery<{ data: ActivityItem[] }>({
    queryKey: ['admin-activity-recent'],
    queryFn: () => adminApi.get<{ data: ActivityItem[] }>('/admin-dash/activity?page_size=8'),
  });

  const cards = [
    { label: 'Total Users', value: stats.data?.total_users ?? 0, icon: 'users' as const, tone: 'primary' as const, sub: `${stats.data?.signups_this_week ?? 0} this week` },
    { label: 'Premium Users', value: stats.data?.total_premium ?? 0, icon: 'star' as const, tone: 'warning' as const, sub: `${stats.data?.payments_today ?? 0} payments today` },
    { label: 'Tests Completed', value: stats.data?.total_tests ?? 0, icon: 'clipboard' as const, tone: 'success' as const, sub: `${stats.data?.tests_today ?? 0} today` },
    { label: 'Total Questions', value: stats.data?.total_questions ?? 0, icon: 'help-circle' as const, tone: 'info' as const },
  ];

  return (
    <AdminShell title="Dashboard" active="dashboard">
      {stats.isLoading ? (
        <AdminLoader />
      ) : (
        <View style={styles.statGrid}>
          {cards.map((c) => (
            <AdminStatCard key={c.label} {...c} />
          ))}
        </View>
      )}

      <View style={styles.quickRow}>
        <AdminTitle>Quick actions</AdminTitle>
      </View>
      <View style={styles.quickGrid}>
        <QuickLink label="Review users" icon="users" onPress={() => router.push('/admin/users' as any)} />
        <QuickLink label="Manage questions" icon="help-circle" onPress={() => router.push('/admin/questions' as any)} />
        <QuickLink label="Premium payments" icon="star" onPress={() => router.push('/admin/premium' as any)} />
        <QuickLink label="View analytics" icon="bar-chart-2" onPress={() => router.push('/admin/analytics' as any)} />
      </View>

      <AdminTitle>Recent admin activity</AdminTitle>
      <AdminCard>
        {activity.isLoading ? (
          <AdminLoader />
        ) : activity.data?.data.length ? (
          activity.data.data.map((a) => (
            <View key={a.id} style={styles.activityRow}>
              <View style={styles.activityTextWrap}>
                <Text style={styles.activityAction}>{a.action}</Text>
                <Text style={styles.activityMeta}>
                  {a.admin_email}
                  {a.entity_type ? ` · ${a.entity_type}${a.entity_id ? ` ${String(a.entity_id).slice(0, 8)}` : ''}` : ''}
                </Text>
              </View>
              <AdminBadge tone="neutral">{fmtDate(a.created_at)}</AdminBadge>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>No activity recorded yet.</Text>
        )}
      </AdminCard>
    </AdminShell>
  );
}

function QuickLink({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'users' | 'help-circle' | 'star' | 'bar-chart-2';
  onPress: () => void;
}) {
  return (
    <AdminCard style={styles.quickCard}>
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconGlyph}>{icon === 'users' ? '👥' : icon === 'help-circle' ? '❓' : icon === 'star' ? '⭐' : '📊'}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickGo} onPress={onPress}>Open →</Text>
    </AdminCard>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  quickRow: {
    marginTop: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  quickCard: {
    minWidth: 190,
    flex: 1,
    maxWidth: 260,
  },
  quickIcon: {
    marginBottom: 10,
  },
  quickIconGlyph: {
    fontSize: 24,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.text,
  },
  quickGo: {
    fontSize: 13,
    color: adminColors.primary,
    fontWeight: '600',
    marginTop: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    gap: 10,
  },
  activityTextWrap: {
    flex: 1,
    gap: 2,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.text,
  },
  activityMeta: {
    fontSize: 12,
    color: adminColors.textMuted,
  },
  muted: {
    fontSize: 14,
    color: adminColors.textMuted,
  },
});
