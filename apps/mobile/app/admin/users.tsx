import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { adminApi, downloadCsv } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminButton,
  AdminColumn,
  AdminDataTable,
  AdminLoader,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  adminColors,
  fmtDateShort,
} from '@/admin/components/ui';

interface UserRow {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  campus: string | null;
  test_date: string | null;
  is_premium: boolean;
  onboarded: boolean;
  created_at: string | null;
  tests_completed: number;
}

const PAGE_SIZE = 20;

export default function AdminUsersScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [premium, setPremium] = useState('');
  const [onboarded, setOnboarded] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState('');

  const { data, isLoading, isFetching } = useQuery<{ data: UserRow[]; total: number }>({
    queryKey: ['admin-users', debouncedQ, premium, onboarded, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      if (premium) params.set('premium', premium);
      if (onboarded) params.set('onboarded', onboarded);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      return adminApi.get<{ data: UserRow[]; total: number }>(`/admin-dash/users?${params.toString()}`);
    },
  });

  const onSearchChange = (v: string) => {
    setQ(v);
    setPage(1);
    setTimeout(() => setDebouncedQ(v), 400);
  };

  const columns: AdminColumn<UserRow>[] = [
    {
      key: 'email',
      title: 'Email',
      render: (r) => (
        <View>
          <Text style={styles.primaryCell}>{r.email || '—'}</Text>
          {r.full_name ? <Text style={styles.secondaryCell}>{r.full_name}</Text> : null}
        </View>
      ),
    },
    {
      key: 'premium',
      title: 'Premium',
      width: 100,
      render: (r) =>
        r.is_premium ? <AdminBadge tone="warning">Premium</AdminBadge> : <AdminBadge tone="neutral">Free</AdminBadge>,
    },
    {
      key: 'onboarded',
      title: 'Onboarded',
      width: 110,
      render: (r) =>
        r.onboarded ? <AdminBadge tone="success">Yes</AdminBadge> : <AdminBadge tone="danger">No</AdminBadge>,
    },
    {
      key: 'tests_completed',
      title: 'Tests',
      width: 90,
      render: (r) => <Text style={styles.cellText}>{r.tests_completed}</Text>,
    },
    {
      key: 'test_date',
      title: 'Test date',
      width: 120,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cellText}>{fmtDateShort(r.test_date)}</Text>,
    },
    {
      key: 'created_at',
      title: 'Joined',
      width: 130,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cellText}>{fmtDateShort(r.created_at)}</Text>,
    },
  ];

  return (
    <AdminShell title="Users" active="users">
      <View style={styles.filters}>
        <AdminSearch value={q} onChange={onSearchChange} placeholder="Search by email or name..." style={styles.search} />
        <View style={styles.filterCol}>
          <AdminSelect
            label="Premium"
            value={premium || null}
            onChange={(v) => {
              setPremium(v);
              setPage(1);
            }}
            options={[
              { label: 'All', value: '' },
              { label: 'Premium', value: 'true' },
              { label: 'Free', value: 'false' },
            ]}
          />
        </View>
        <View style={styles.filterCol}>
          <AdminSelect
            label="Onboarded"
            value={onboarded || null}
            onChange={(v) => {
              setOnboarded(v);
              setPage(1);
            }}
            options={[
              { label: 'All', value: '' },
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ]}
          />
        </View>
        <View style={styles.exportCol}>
          <AdminButton title="Export CSV" variant="secondary" icon="download" onPress={() => downloadCsv('/admin-dash/export/users', 'users.csv').catch((e: any) => alert(e?.message ?? 'Export failed'))} />
        </View>
      </View>

      {isLoading ? (
        <AdminLoader />
      ) : (
        <>
          <AdminDataTable<UserRow>
            columns={columns}
            rows={(data?.data ?? []).map((r) => ({ ...r, id: r.user_id }))}
            emptyText="No users found"
            onRowPress={(r) => router.push(`/admin/user-detail?id=${r.user_id}` as any)}
          />
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
          {isFetching ? <View style={styles.fetching} /> : null}
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
  search: {
    flex: 1,
    minWidth: 240,
    marginBottom: 12,
  },
  filterCol: {
    width: 150,
    marginBottom: 12,
  },
  exportCol: {
    marginBottom: 12,
  },
  primaryCell: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.text,
  },
  secondaryCell: {
    fontSize: 12,
    color: adminColors.textMuted,
    marginTop: 2,
  },
  cellText: {
    fontSize: 13,
    color: adminColors.text,
  },
  fetching: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: adminColors.primaryLight,
  },
});
