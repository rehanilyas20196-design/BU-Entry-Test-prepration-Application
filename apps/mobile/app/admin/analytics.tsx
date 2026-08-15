import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import { AdminCard, AdminLoader, AdminSelect, AdminTitle, adminColors } from '@/admin/components/ui';

interface AnalyticsData {
  period: 'day' | 'week' | 'month';
  labels: string[];
  signups: number[];
  tests_completed: number[];
  premium_conversions: number[];
}

export default function AdminAnalyticsScreen() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', period],
    queryFn: () => adminApi.get<AnalyticsData>(`/admin-dash/analytics?period=${period}`),
  });

  const total = (arr: number[] | undefined) => (arr ?? []).reduce((a, b) => a + b, 0);

  return (
    <AdminShell title="Analytics" active="analytics">
      <View style={styles.header}>
        <View style={{ width: 180 }}>
          <AdminSelect
            label="Period"
            value={period}
            onChange={(v) => setPeriod(v as 'day' | 'week' | 'month')}
            options={[
              { label: 'Daily (30 days)', value: 'day' },
              { label: 'Weekly (12 weeks)', value: 'week' },
              { label: 'Monthly (12 months)', value: 'month' },
            ]}
          />
        </View>
        <View style={styles.summaryRow}>
          <Summary label="Signups" value={total(data?.signups)} color={adminColors.primary} />
          <Summary label="Tests completed" value={total(data?.tests_completed)} color={adminColors.success} />
          <Summary label="Premium conversions" value={total(data?.premium_conversions)} color={adminColors.warning} />
        </View>
      </View>

      {isLoading || !data ? (
        <AdminLoader />
      ) : (
        <>
          <AdminTitle>New signups</AdminTitle>
          <AdminCard>
            <BarChart labels={data.labels} values={data.signups} color={adminColors.primary} />
          </AdminCard>

          <AdminTitle>Tests completed</AdminTitle>
          <AdminCard>
            <BarChart labels={data.labels} values={data.tests_completed} color={adminColors.success} />
          </AdminCard>

          <AdminTitle>Premium conversions</AdminTitle>
          <AdminCard>
            <BarChart labels={data.labels} values={data.premium_conversions} color={adminColors.warning} />
          </AdminCard>
        </>
      )}
    </AdminShell>
  );
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function BarChart({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  // Thin labels on wide charts
  const step = labels.length > 15 ? Math.ceil(labels.length / 10) : 1;
  return (
    <View style={styles.chartWrap}>
      <View style={styles.bars}>
        {values.map((v, i) => (
          <View key={i} style={styles.barCol}>
            <Text style={styles.barValue}>{v > 0 ? v : ''}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(4, (v / max) * 160),
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.labelsRow}>
        {labels.map((l, i) =>
          i % step === 0 ? (
            <Text key={i} style={styles.barLabel}>
              {l}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    flexWrap: 'wrap',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
  },
  summaryTile: {
    minWidth: 120,
    backgroundColor: adminColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
  },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, color: adminColors.textSecondary, marginTop: 2 },
  chartWrap: { gap: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 180 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' },
  barValue: { fontSize: 10, color: adminColors.textMuted },
  bar: { width: '70%', maxWidth: 26, borderRadius: 4, backgroundColor: adminColors.primary },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  barLabel: { fontSize: 9, color: adminColors.textMuted },
});
