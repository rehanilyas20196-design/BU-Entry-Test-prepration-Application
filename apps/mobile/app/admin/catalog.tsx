import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/admin/adminApi';
import { AdminShell } from '@/admin/components/AdminShell';
import {
  AdminBadge,
  AdminButton,
  AdminColumn,
  AdminDataTable,
  AdminInput,
  AdminLoader,
  AdminModal,
  AdminSelect,
  adminColors,
} from '@/admin/components/ui';

interface ManageCatalog {
  subjects: { id: string; code: string; name: string; category: string; description: string | null; sort_order: number; is_active: boolean; question_count: number }[];
  topics: { id: string; subject_id: string; name: string; description: string | null; is_active: boolean; question_count: number }[];
  programs: { id: string; university_id: string; code: string; name: string; description: string | null; campus: string | null; is_active: boolean; university: { name: string } | null }[];
  universities: { id: string; name: string; code: string }[];
}

type Tab = 'subjects' | 'topics' | 'programs';

export default function AdminCatalogScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('subjects');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modal, setModal] = useState<{ kind: Tab; editing?: any } | null>(null);

  const { data, isLoading } = useQuery<ManageCatalog>({
    queryKey: ['admin-catalog-manage'],
    queryFn: () => adminApi.get<ManageCatalog>('/admin-dash/catalog/manage'),
  });

  const toggle = useMutation({
    mutationFn: ({ kind, id, active }: { kind: Tab; id: string; active: boolean }) =>
      adminApi.post(`/admin-dash/catalog/${kind}/${id}/toggle`, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-catalog-manage'] }),
  });

  const subjects = data?.subjects ?? [];
  const topics = data?.topics ?? [];
  const programs = data?.programs ?? [];
  const filteredTopics = subjectFilter ? topics.filter((t) => t.subject_id === subjectFilter) : topics;

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? '—';

  const subjectColumns: AdminColumn<(typeof subjects)[0]>[] = [
    { key: 'name', title: 'Subject', render: (r) => (
      <View>
        <Text style={styles.primary}>{r.name}</Text>
        <Text style={styles.secondary}>{r.code}</Text>
      </View>
    ) },
    { key: 'category', title: 'Category', width: 130, render: (r) => <AdminBadge tone="neutral">{r.category}</AdminBadge> },
    { key: 'question_count', title: 'Questions', width: 100, render: (r) => <Text style={styles.cell}>{r.question_count}</Text> },
    { key: 'status', title: 'Status', width: 100, render: (r) => r.is_active ? <AdminBadge tone="success">Active</AdminBadge> : <AdminBadge tone="danger">Inactive</AdminBadge> },
    { key: 'actions', title: '', width: 120, render: (r) => <RowActions onEdit={() => setModal({ kind: 'subjects', editing: r })} onToggle={() => toggle.mutate({ kind: 'subjects', id: r.id, active: !r.is_active })} isActive={r.is_active} /> },
  ];

  const topicColumns: AdminColumn<(typeof topics)[0]>[] = [
    { key: 'name', title: 'Topic', render: (r) => (
      <View>
        <Text style={styles.primary}>{r.name}</Text>
        <Text style={styles.secondary}>{subjectName(r.subject_id)}</Text>
      </View>
    ) },
    { key: 'question_count', title: 'Questions', width: 100, render: (r) => <Text style={styles.cell}>{r.question_count}</Text> },
    { key: 'status', title: 'Status', width: 100, render: (r) => r.is_active ? <AdminBadge tone="success">Active</AdminBadge> : <AdminBadge tone="danger">Inactive</AdminBadge> },
    { key: 'actions', title: '', width: 120, render: (r) => <RowActions onEdit={() => setModal({ kind: 'topics', editing: r })} onToggle={() => toggle.mutate({ kind: 'topics', id: r.id, active: !r.is_active })} isActive={r.is_active} /> },
  ];

  const programColumns: AdminColumn<(typeof programs)[0]>[] = [
    { key: 'name', title: 'Program', render: (r) => (
      <View>
        <Text style={styles.primary}>{r.name}</Text>
        <Text style={styles.secondary}>{r.code}{r.campus ? ` · ${r.campus}` : ''}</Text>
      </View>
    ) },
    { key: 'university', title: 'University', width: 180, hideOnMobile: true, render: (r) => <Text style={styles.cell}>{r.university?.name ?? '—'}</Text> },
    { key: 'status', title: 'Status', width: 100, render: (r) => r.is_active ? <AdminBadge tone="success">Active</AdminBadge> : <AdminBadge tone="danger">Inactive</AdminBadge> },
    { key: 'actions', title: '', width: 120, render: (r) => <RowActions onEdit={() => setModal({ kind: 'programs', editing: r })} onToggle={() => toggle.mutate({ kind: 'programs', id: r.id, active: !r.is_active })} isActive={r.is_active} /> },
  ];

  return (
    <AdminShell title="Catalog" active="catalog">
      <View style={styles.tabs}>
        <TabButton label={`Subjects (${subjects.length})`} active={tab === 'subjects'} onPress={() => setTab('subjects')} />
        <TabButton label={`Topics (${topics.length})`} active={tab === 'topics'} onPress={() => setTab('topics')} />
        <TabButton label={`Programs (${programs.length})`} active={tab === 'programs'} onPress={() => setTab('programs')} />
      </View>

      {tab === 'topics' ? (
        <View style={styles.filterRow}>
          <View style={{ width: 220 }}>
            <AdminSelect
              label="Filter by subject"
              value={subjectFilter || null}
              onChange={setSubjectFilter}
              options={[{ label: 'All subjects', value: '' }, ...subjects.map((s) => ({ label: s.name, value: s.id }))]}
            />
          </View>
          <AdminButton title={`New topic`} icon="plus" onPress={() => setModal({ kind: 'topics' })} style={{ alignSelf: 'flex-end', marginBottom: 12 }} />
        </View>
      ) : (
        <View style={styles.filterRow}>
          <Text style={styles.hint}>
            {tab === 'subjects'
              ? `Manage subjects. Deactivated subjects are hidden from users.`
              : `Manage programs and their universities.`}
          </Text>
          <AdminButton
            title={tab === 'subjects' ? 'New subject' : 'New program'}
            icon="plus"
            onPress={() => setModal({ kind: tab })}
          />
        </View>
      )}

      {isLoading ? (
        <AdminLoader />
        ) : tab === 'subjects' ? (
        <AdminDataTable columns={subjectColumns} rows={subjects} emptyText="No subjects" />
        ) : tab === 'topics' ? (
        <AdminDataTable columns={topicColumns} rows={filteredTopics} emptyText="No topics" />
        ) : (
        <AdminDataTable columns={programColumns} rows={programs} emptyText="No programs" />
      )}

      {modal ? (
        <CatalogEditorModal
          kind={modal.kind}
          editing={modal.editing}
          data={data ?? { subjects: [], topics: [], programs: [], universities: [] }}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            queryClient.invalidateQueries({ queryKey: ['admin-catalog-manage'] });
          }}
        />
      ) : null}
    </AdminShell>
  );
}

function RowActions({ onEdit, onToggle, isActive }: { onEdit: () => void; onToggle: () => void; isActive: boolean }) {
  return (
    <View style={styles.rowActions}>
      <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn}>
        <Feather name="edit-2" size={15} color={adminColors.primary} />
      </Pressable>
      <Pressable onPress={onToggle} hitSlop={8} style={styles.iconBtn}>
        <Feather name={isActive ? 'pause-circle' : 'play-circle'} size={15} color={isActive ? adminColors.warning : adminColors.success} />
      </Pressable>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.tabText, active && { color: '#FFFFFF', fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

function CatalogEditorModal({
  kind,
  editing,
  data,
  onClose,
  onSaved,
}: {
  kind: Tab;
  editing?: any;
  data: ManageCatalog;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editing?.name ?? '');
  const [code, setCode] = useState(editing?.code ?? '');
  const [category, setCategory] = useState(editing?.category ?? 'verbal');
  const [sortOrder, setSortOrder] = useState(String(editing?.sort_order ?? 0));
  const [subjectId, setSubjectId] = useState(editing?.subject_id ?? data.subjects[0]?.id ?? '');
  const [universityId, setUniversityId] = useState(editing?.university_id ?? data.universities[0]?.id ?? '');
  const [campus, setCampus] = useState(editing?.campus ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [editing, kind]);

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required');
      if (kind === 'subjects') {
        if (!code.trim()) throw new Error('Code is required');
        const body = {
          name: name.trim(),
          code: code.trim(),
          category,
          sort_order: Number(sortOrder) || 0,
          description: description.trim() || null,
        };
        if (editing) await adminApi.patch(`/admin-dash/catalog/subjects/${editing.id}`, body);
        else await adminApi.post('/admin-dash/catalog/subjects', body);
      } else if (kind === 'topics') {
        if (!subjectId) throw new Error('Select a subject');
        const body = { name: name.trim(), subject_id: subjectId, description: description.trim() || null };
        if (editing) await adminApi.patch(`/admin-dash/catalog/topics/${editing.id}`, body);
        else await adminApi.post('/admin-dash/catalog/topics', body);
      } else {
        if (!code.trim()) throw new Error('Code is required');
        if (!universityId) throw new Error('Select a university');
        const body = {
          name: name.trim(),
          code: code.trim(),
          university_id: universityId,
          campus: campus.trim() || null,
          description: description.trim() || null,
        };
        if (editing) await adminApi.patch(`/admin-dash/catalog/programs/${editing.id}`, body);
        else await adminApi.post('/admin-dash/catalog/programs', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog-manage'] });
      onSaved();
    },
    onError: (e: any) => setError(e?.message ?? 'Save failed'),
  });

  return (
    <AdminModal visible title={`${editing ? 'Edit' : 'New'} ${kind.slice(0, -1)}`} onClose={onClose} width={560}>
      {kind === 'topics' && (
        <AdminSelect
          label="Subject"
          value={subjectId || null}
          onChange={setSubjectId}
          options={data.subjects.map((s) => ({ label: s.name, value: s.id }))}
        />
      )}
      {kind === 'programs' && (
        <AdminSelect
          label="University"
          value={universityId || null}
          onChange={setUniversityId}
          options={data.universities.map((u) => ({ label: u.name, value: u.id }))}
        />
      )}
      <AdminInput label="Name" value={name} onChangeText={setName} placeholder="Name" />
      {kind !== 'topics' ? (
        <AdminInput label="Code" value={code} onChangeText={setCode} placeholder="e.g. QUANT, BBA" autoCapitalize="characters" />
      ) : null}
      {kind === 'subjects' && (
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <AdminSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { label: 'Verbal', value: 'verbal' },
                { label: 'Quantitative', value: 'quantitative' },
                { label: 'Analytical', value: 'analytical' },
                { label: 'General knowledge', value: 'gk' },
                { label: 'Science', value: 'science' },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AdminInput label="Sort order" value={sortOrder} onChangeText={setSortOrder} keyboardType="number-pad" />
          </View>
        </View>
      )}
      {kind === 'programs' && <AdminInput label="Campus (optional)" value={campus} onChangeText={setCampus} />}
      <AdminInput label="Description (optional)" value={description} onChangeText={setDescription} multiline />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.formFooter}>
        <AdminButton title="Cancel" variant="ghost" onPress={onClose} />
        <AdminButton title={editing ? 'Save changes' : 'Create'} onPress={() => save.mutate()} loading={save.isPending} icon="check" />
      </View>
    </AdminModal>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: adminColors.textSecondary },
  filterRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  hint: { fontSize: 13, color: adminColors.textMuted, flex: 1 },
  primary: { fontSize: 13, fontWeight: '600', color: adminColors.text },
  secondary: { fontSize: 12, color: adminColors.textMuted, marginTop: 2 },
  cell: { fontSize: 13, color: adminColors.text },
  rowActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: adminColors.surfaceAlt },
  formRow: { flexDirection: 'row', gap: 12 },
  errorText: { fontSize: 13, color: adminColors.danger, marginBottom: 8 },
  formFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
});
