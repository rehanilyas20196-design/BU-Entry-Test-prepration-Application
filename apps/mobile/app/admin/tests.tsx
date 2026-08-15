import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminColumn,
  AdminDataTable,
  AdminLoader,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  adminColors,
  fmtDate,
} from '@/admin/components/ui';

interface TestRow {
  id: string;
  user_id: string;
  email: string;
  mode: string;
  status: string;
  score: number | null;
  max_score: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  unanswered_count: number | null;
  total_questions: number | null;
  submitted_at: string | null;
  mock_test: { name: string } | null;
  test_config: { name: string } | null;
}

const PAGE_SIZE = 25;

export default function AdminTestsScreen() {
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState('');

  const { data, isLoading } = useQuery<{ data: TestRow[]; total: number }>({
    queryKey: ['admin-tests', debouncedQ, mode, status, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      if (mode) params.set('mode', mode);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      return adminApi.get<{ data: TestRow[]; total: number }>(`/admin-dash/tests?${params.toString()}`);
    },
  });

  const statusTone = (s: string) =>
    s === 'submitted' ? 'success' : s === 'expired' ? 'warning' : s === 'in_progress' ? 'info' : 'neutral';

  const columns: AdminColumn<TestRow>[] = [
    {
      key: 'email',
      title: 'User',
      render: (r) => (
        <View>
          <Text style={styles.primary}>{r.email || '—'}</Text>
          <Text style={styles.secondary}>{r.user_id.slice(0, 8)}</Text>
        </View>
      ),
    },
    {
      key: 'name',
      title: 'Test',
      render: (r) => <Text style={styles.cell}>{r.mock_test?.name ?? r.test_config?.name ?? r.mode}</Text>,
    },
    {
      key: 'mode',
      title: 'Mode',
      width: 110,
      render: (r) => <AdminBadge tone="neutral">{r.mode}</AdminBadge>,
    },
    {
      key: 'status',
      title: 'Status',
      width: 110,
      render: (r) => <AdminBadge tone={statusTone(r.status)}>{r.status}</AdminBadge>,
    },
    {
      key: 'score',
      title: 'Score',
      width: 90,
      render: (r) => (
        <Text style={styles.cell}>
          {r.score ?? 0}/{r.max_score ?? 0}
        </Text>
      ),
    },
    {
      key: 'correct_count',
      title: 'C/W/U',
      width: 110,
      hideOnMobile: true,
      render: (r) => (
        <Text style={styles.cell}>
          {r.correct_count ?? 0} / {r.incorrect_count ?? 0} / {r.unanswered_count ?? 0}
        </Text>
      ),
    },
    {
      key: 'submitted_at',
      title: 'Submitted',
      width: 150,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cell}>{fmtDate(r.submitted_at)}</Text>,
    },
  ];

  return (
    <AdminShell title="Tests" active="tests">
      <View style={styles.filters}>
        <AdminSearch value={q} onChange={(v) => { setQ(v); setPage(1); setTimeout(() => setDebouncedQ(v), 400); }} placeholder="Search by email..." style={styles.search} />
        <View style={styles.filterCol}>
          <AdminSelect
            label="Mode"
            value={mode || null}
            onChange={(v) => { setMode(v); setPage(1); }}
            options={[
              { label: 'All', value: '' },
              { label: 'mock', value: 'mock' },
              { label: 'practice', value: 'practice' },
              { label: 'timed', value: 'timed' },
            ]}
          />
        </View>
        <View style={styles.filterCol}>
          <AdminSelect
            label="Status"
            value={status || null}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'All', value: '' },
              { label: 'Submitted', value: 'submitted' },
              { label: 'Expired', value: 'expired' },
              { label: 'In progress', value: 'in_progress' },
            ]}
          />
        </View>
      </View>

      {isLoading ? (
        <AdminLoader />
      ) : (
        <>
          <AdminDataTable<TestRow>
            columns={columns}
            rows={data?.data ?? []}
            emptyText="No test attempts found"
          />
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    flexWrap: 'wrap',
  },
  search: { flex: 1, minWidth: 240, marginBottom: 12 },
  filterCol: { width: 150, marginBottom: 12 },
  primary: { fontSize: 13, fontWeight: '600', color: adminColors.text },
  secondary: { fontSize: 11, color: adminColors.textMuted, marginTop: 2 },
  cell: { fontSize: 13, color: adminColors.text },
});
