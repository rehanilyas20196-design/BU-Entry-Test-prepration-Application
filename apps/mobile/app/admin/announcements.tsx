import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminInput,
  AdminSelect,
  AdminTitle,
  adminColors,
  fmtDate,
} from '@/admin/components/ui';

interface Broadcast {
  id: string;
  title: string;
  body: string | null;
  type: string;
  recipient_count: number;
  created_by: string;
  created_at: string;
}

export default function AdminAnnouncementsScreen() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [error, setError] = useState<string | null>(null);

  const { data: broadcasts, isLoading } = useQuery<Broadcast[]>({
    queryKey: ['admin-announcements'],
    queryFn: () => adminApi.get<Broadcast[]>('/admin-dash/announcements'),
  });

  const send = useMutation({
    mutationFn: () => adminApi.post('/admin-dash/announcements', { title, body: body || undefined, type }),
    onSuccess: () => {
      setTitle('');
      setBody('');
      setType('info');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (e: any) => setError(e?.message ?? 'Send failed'),
  });

  const typeTone = (t: string) =>
    t === 'success' ? 'success' : t === 'warning' ? 'warning' : t === 'promo' ? 'primary' : t === 'update' ? 'info' : 'neutral';

  return (
    <AdminShell title="Announcements" active="announcements">
      <AdminCard>
        <AdminTitle>Send announcement</AdminTitle>
        <Text style={styles.sub}>Every registered user receives a notification in-app (bell icon).</Text>
        <AdminInput label="Title" value={title} onChangeText={setTitle} placeholder="e.g. New Mock Tests released!" maxLength={200} />
        <AdminInput label="Message (optional)" value={body} onChangeText={setBody} multiline placeholder="Details of the announcement..." maxLength={2000} />
        <View style={{ width: 200 }}>
          <AdminSelect
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { label: 'Info', value: 'info' },
              { label: 'Success', value: 'success' },
              { label: 'Warning', value: 'warning' },
              { label: 'Promotion', value: 'promo' },
              { label: 'Update', value: 'update' },
            ]}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AdminButton
          title={send.isPending ? 'Sending...' : 'Send to all users'}
          icon="send"
          onPress={() => send.mutate()}
          loading={send.isPending}
          disabled={!title.trim()}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        />
      </AdminCard>

      <AdminTitle>History</AdminTitle>
      <AdminCard style={styles.listCard}>
        {isLoading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : !broadcasts?.length ? (
          <Text style={styles.muted}>No announcements sent yet.</Text>
        ) : (
          broadcasts.map((b) => (
            <View key={b.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{b.title}</Text>
                {b.body ? <Text style={styles.rowBody} numberOfLines={2}>{b.body}</Text> : null}
                <Text style={styles.rowMeta}>
                  {fmtDate(b.created_at)} · {b.created_by} · {b.recipient_count} recipients
                </Text>
              </View>
              <AdminBadge tone={typeTone(b.type)}>{b.type}</AdminBadge>
            </View>
          ))
        )}
      </AdminCard>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  sub: { fontSize: 13, color: adminColors.textSecondary, marginBottom: 8 },
  errorText: { fontSize: 13, color: adminColors.danger, marginBottom: 8 },
  listCard: { paddingHorizontal: 18, paddingVertical: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    gap: 10,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: adminColors.text },
  rowBody: { fontSize: 13, color: adminColors.textSecondary, marginTop: 2 },
  rowMeta: { fontSize: 11, color: adminColors.textMuted, marginTop: 4 },
  muted: { fontSize: 14, color: adminColors.textMuted },
});
