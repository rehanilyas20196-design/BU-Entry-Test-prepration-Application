import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminColumn,
  AdminDataTable,
  AdminLoader,
  AdminPagination,
  AdminSearch,
  adminColors,
  fmtDate,
} from '@/admin/components/ui';

interface ActivityRow {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const PAGE_SIZE = 50;

export default function AdminActivityScreen() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState('');

  const { data, isLoading } = useQuery<{ data: ActivityRow[]; total: number }>({
    queryKey: ['admin-activity', debouncedQ, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      return adminApi.get<{ data: ActivityRow[]; total: number }>(`/admin-dash/activity?${params.toString()}`);
    },
  });

  const columns: AdminColumn<ActivityRow>[] = [
    {
      key: 'action',
      title: 'Action',
      width: 190,
      render: (r) => <Text style={styles.action}>{r.action}</Text>,
    },
    {
      key: 'admin_email',
      title: 'Admin',
      render: (r) => <Text style={styles.cell}>{r.admin_email}</Text>,
    },
    {
      key: 'entity',
      title: 'Entity',
      width: 200,
      hideOnMobile: true,
      render: (r) => (
        <Text style={styles.cell}>
          {r.entity_type ?? '—'}
          {r.entity_id ? ` · ${r.entity_id.slice(0, 12)}` : ''}
        </Text>
      ),
    },
    {
      key: 'details',
      title: 'Details',
      hideOnMobile: true,
      render: (r) => <Text style={styles.cell} numberOfLines={1}>{r.details ? JSON.stringify(r.details) : '—'}</Text>,
    },
    {
      key: 'created_at',
      title: 'Time',
      width: 160,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cell}>{fmtDate(r.created_at)}</Text>,
    },
  ];

  return (
    <AdminShell title="Admin activity log" active="activity">
      <AdminSearch
        value={q}
        onChange={(v) => { setQ(v); setPage(1); setTimeout(() => setDebouncedQ(v), 400); }}
        placeholder="Search by action (e.g. question.created)..."
        style={{ marginBottom: 12 }}
      />

      {isLoading ? (
        <AdminLoader />
      ) : (
        <>
          <AdminDataTable<ActivityRow>
            columns={columns}
            rows={data?.data ?? []}
            emptyText="No activity recorded"
          />
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  action: { fontSize: 13, fontWeight: '600', color: adminColors.primary },
  cell: { fontSize: 13, color: adminColors.text },
});
