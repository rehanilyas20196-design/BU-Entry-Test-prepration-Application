import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminButton,
  AdminColumn,
  AdminCard,
  AdminDataTable,
  AdminInput,
  AdminLoader,
  AdminSelect,
  AdminTitle,
  adminColors,
  fmtDateShort,
} from '@/admin/components/ui';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'full' | 'percent' | 'flat';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AdminCouponsScreen() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('full');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Coupon[]>({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.get<Coupon[]>('/admin-dash/coupons'),
  });

  const create = useMutation({
    mutationFn: () =>
      adminApi.post('/admin-dash/coupons', {
        code,
        discount_type: discountType,
        discount_value: discountType === 'full' ? 0 : Number(discountValue) || 0,
        max_uses: maxUses ? Number(maxUses) || null : null,
        expires_at: expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : null,
      }),
    onSuccess: () => {
      setCode('');
      setDiscountValue('');
      setMaxUses('');
      setExpiresAt('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (e: any) => setError(e?.message ?? 'Create failed'),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.post(`/admin-dash/coupons/${id}/toggle`, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const copy = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const describe = (c: Coupon) =>
    c.discount_type === 'full'
      ? 'Free premium'
      : c.discount_type === 'percent'
        ? `${c.discount_value}% off`
        : `${c.discount_value} BDT off`;

  const columns: AdminColumn<Coupon>[] = [
    {
      key: 'code',
      title: 'Code',
      width: 160,
      render: (r) => (
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{r.code}</Text>
          <Pressable onPress={() => copy(r.code)} hitSlop={8}>
            <Feather name={copied === r.code ? 'check' : 'copy'} size={14} color={adminColors.primary} />
          </Pressable>
        </View>
      ),
    },
    { key: 'value', title: 'Value', width: 130, render: (r) => <AdminBadge tone="primary">{describe(r)}</AdminBadge> },
    { key: 'usage', title: 'Uses', width: 110, render: (r) => <Text style={styles.cell}>{r.used_count}{r.max_uses ? ` / ${r.max_uses}` : ''}</Text> },
    { key: 'expires_at', title: 'Expires', width: 120, hideOnMobile: true, render: (r) => <Text style={styles.cell}>{r.expires_at ? fmtDateShort(r.expires_at) : 'Never'}</Text> },
    { key: 'status', title: 'Status', width: 100, render: (r) => r.is_active ? <AdminBadge tone="success">Active</AdminBadge> : <AdminBadge tone="danger">Off</AdminBadge> },
    {
      key: 'actions',
      title: '',
      width: 90,
      render: (r) => (
        <Pressable
          onPress={() => toggle.mutate({ id: r.id, active: !r.is_active })}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Feather name={r.is_active ? 'pause-circle' : 'play-circle'} size={16} color={r.is_active ? adminColors.warning : adminColors.success} />
        </Pressable>
      ),
    },
  ];

  return (
    <AdminShell title="Coupons" active="coupons">
      <AdminCard>
        <AdminTitle>Create coupon</AdminTitle>
        <Text style={styles.sub}>
          Users redeem codes on the premium page. Full = free premium; percent/flat are off the 5000 BDT price.
        </Text>
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <AdminInput label="Code" value={code} onChangeText={setCode} placeholder="e.g. RAMADAN25" autoCapitalize="characters" />
          </View>
          <AdminButton title="Generate" variant="secondary" icon="refresh-cw" onPress={() => setCode(randomCode())} style={{ alignSelf: 'flex-end', marginBottom: 12 }} />
        </View>
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <AdminSelect
              label="Discount type"
              value={discountType}
              onChange={setDiscountType}
              options={[
                { label: 'Free premium (full)', value: 'full' },
                { label: 'Percentage off', value: 'percent' },
                { label: 'Fixed amount off', value: 'flat' },
              ]}
            />
          </View>
          {discountType !== 'full' ? (
            <View style={{ flex: 1 }}>
              <AdminInput
                label={discountType === 'percent' ? 'Percent (%)' : 'Amount (BDT)'}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="number-pad"
              />
            </View>
          ) : null}
        </View>
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <AdminInput label="Max uses (blank = unlimited)" value={maxUses} onChangeText={setMaxUses} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <AdminInput label="Expiry (YYYY-MM-DD, optional)" value={expiresAt} onChangeText={setExpiresAt} placeholder="2026-12-31" />
          </View>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AdminButton title={create.isPending ? 'Creating...' : 'Create coupon'} icon="tag" onPress={() => create.mutate()} loading={create.isPending} disabled={!code.trim()} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
      </AdminCard>

      <AdminTitle>Coupons ({data?.length ?? 0})</AdminTitle>
      {isLoading ? (
        <AdminLoader />
      ) : (
        <AdminDataTable<Coupon>
          columns={columns}
          rows={data ?? []}
          emptyText="No coupons yet"
        />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  sub: { fontSize: 13, color: adminColors.textSecondary, marginBottom: 8 },
  formRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  errorText: { fontSize: 13, color: adminColors.danger, marginBottom: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeText: { fontSize: 14, fontWeight: '700', color: adminColors.text, letterSpacing: 0.5 },
  cell: { fontSize: 13, color: adminColors.text },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: adminColors.surfaceAlt },
});
