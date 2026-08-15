import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminCard,
  AdminColumn,
  AdminDataTable,
  AdminLoader,
  AdminPagination,
  AdminSearch,
  adminColors,
  fmtDate,
} from '@/admin/components/ui';

interface PaymentRow {
  id: string;
  user_id: string;
  email: string;
  method: string;
  amount: number;
  status: string;
  trx_id: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;

export default function AdminPremiumScreen() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState('');

  const { data, isLoading } = useQuery<{ data: PaymentRow[]; total: number }>({
    queryKey: ['admin-premium', debouncedQ, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      return adminApi.get<{ data: PaymentRow[]; total: number }>(`/admin-dash/premium?${params.toString()}`);
    },
  });

  const columns: AdminColumn<PaymentRow>[] = [
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
      key: 'method',
      title: 'Method',
      width: 120,
      render: (r) => <AdminBadge tone="neutral">{r.method}</AdminBadge>,
    },
    {
      key: 'amount',
      title: 'Amount',
      width: 100,
      render: (r) => <Text style={styles.cell}>{r.amount} BDT</Text>,
    },
    {
      key: 'status',
      title: 'Status',
      width: 110,
      render: (r) => <AdminBadge tone={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</AdminBadge>,
    },
    {
      key: 'trx_id',
      title: 'Trx ID',
      width: 160,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cell}>{r.trx_id ?? '—'}</Text>,
    },
    {
      key: 'created_at',
      title: 'Paid at',
      width: 150,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cell}>{fmtDate(r.created_at)}</Text>,
    },
  ];

  return (
    <AdminShell title="Premium" active="premium">
      <AdminCard style={styles.infoCard}>
        <Text style={styles.infoText}>
          View all JazzCash payment records. To grant or revoke premium for a specific user, open the user from the{' '}
          <Text style={styles.infoLink} onPress={() => {}}>Users</Text> tab and use Grant / Revoke.
        </Text>
      </AdminCard>

      <AdminSearch
        value={q}
        onChange={(v) => { setQ(v); setPage(1); setTimeout(() => setDebouncedQ(v), 400); }}
        placeholder="Search by email or transaction ID..."
        style={{ marginBottom: 12 }}
      />

      {isLoading ? (
        <AdminLoader />
      ) : (
        <>
          <AdminDataTable<PaymentRow>
            columns={columns}
            rows={data?.data ?? []}
            emptyText="No payments found"
          />
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  infoCard: { backgroundColor: adminColors.infoLight, borderColor: adminColors.infoLight },
  infoText: { fontSize: 13, color: adminColors.textSecondary, lineHeight: 19 },
  infoLink: { color: adminColors.primary, fontWeight: '700' },
  primary: { fontSize: 13, fontWeight: '600', color: adminColors.text },
  secondary: { fontSize: 11, color: adminColors.textMuted, marginTop: 2 },
  cell: { fontSize: 13, color: adminColors.text },
});
