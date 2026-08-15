import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  AdminPagination,
  AdminSearch,
  AdminSelect,
  adminColors,
  fmtDateShort,
} from '@/admin/components/ui';

interface QuestionRow {
  id: string;
  subject_id: string;
  topic_id: string | null;
  difficulty: string;
  question_text: string;
  correct_option: string;
  review_status: string;
  explanation: string | null;
  hint: string | null;
  created_at: string;
  subject: { name: string } | null;
  topic: { name: string } | null;
  options: { option_key: string; option_text: string; is_correct: boolean }[];
}

interface Catalog {
  subjects: { id: string; name: string }[];
  topics: { id: string; subject_id: string; name: string }[];
  programs: { id: string; name: string }[];
}

const PAGE_SIZE = 25;
const DIFFICULTY_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
  expert: 'info',
};
const STATUS_TONE: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary'> = {
  approved: 'success',
  draft: 'neutral',
  ai_generated: 'info',
  needs_review: 'warning',
  rejected: 'danger',
  archived: 'neutral',
};

export default function AdminQuestionsScreen() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const catalog = useQuery<Catalog>({
    queryKey: ['admin-catalog'],
    queryFn: () => adminApi.get<Catalog>('/admin-dash/catalog'),
  });

  const { data, isLoading } = useQuery<{ data: QuestionRow[]; total: number }>({
    queryKey: ['admin-questions', debouncedQ, subjectId, topicId, difficulty, reviewStatus, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      if (subjectId) params.set('subject_id', subjectId);
      if (topicId) params.set('topic_id', topicId);
      if (difficulty) params.set('difficulty', difficulty);
      if (reviewStatus) params.set('review_status', reviewStatus);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      return adminApi.get<{ data: QuestionRow[]; total: number }>(`/admin-dash/questions?${params.toString()}`);
    },
  });

  const subjects = catalog.data?.subjects ?? [];
  const topics = useMemo(
    () => (catalog.data?.topics ?? []).filter((t) => !subjectId || t.subject_id === subjectId),
    [catalog.data?.topics, subjectId],
  );

  // Reset topic when subject changes
  useEffect(() => {
    if (subjectId && topicId) {
      const stillValid = topics.some((t) => t.id === topicId);
      if (!stillValid) setTopicId('');
    }
  }, [topics, subjectId, topicId]);

  const del = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/admin-dash/questions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-questions'] }),
  });

  const columns: AdminColumn<QuestionRow>[] = [
    {
      key: 'question_text',
      title: 'Question',
      render: (r) => <Text style={styles.qText} numberOfLines={2}>{r.question_text}</Text>,
    },
    {
      key: 'subject',
      title: 'Subject',
      width: 130,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cell}>{r.subject?.name ?? '—'}</Text>,
    },
    {
      key: 'difficulty',
      title: 'Level',
      width: 90,
      render: (r) => <AdminBadge tone={DIFFICULTY_TONE[r.difficulty] ?? 'neutral'}>{r.difficulty}</AdminBadge>,
    },
    {
      key: 'correct_option',
      title: 'Answer',
      width: 80,
      render: (r) => <Text style={styles.cell}>{r.correct_option}</Text>,
    },
    {
      key: 'review_status',
      title: 'Status',
      width: 120,
      render: (r) => <AdminBadge tone={STATUS_TONE[r.review_status] ?? 'neutral'}>{r.review_status}</AdminBadge>,
    },
    {
      key: 'created_at',
      title: 'Created',
      width: 110,
      hideOnMobile: true,
      render: (r) => <Text style={styles.cell}>{fmtDateShort(r.created_at)}</Text>,
    },
    {
      key: 'actions',
      title: '',
      width: 120,
      render: (r) => (
        <View style={styles.rowActions}>
          <Pressable onPress={() => setEditing(r)} hitSlop={8} style={styles.iconBtn}>
            <Feather name="edit-2" size={15} color={adminColors.primary} />
          </Pressable>
          <Pressable
            onPress={() => {
              if (confirm(`Delete this question? This cannot be undone.`)) del.mutate(r.id);
            }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Feather name="trash-2" size={15} color={adminColors.danger} />
          </Pressable>
        </View>
      ),
    },
  ];

  return (
    <AdminShell title="Questions" active="questions">
      <View style={styles.filters}>
        <AdminSearch value={q} onChange={(v) => { setQ(v); setPage(1); setTimeout(() => setDebouncedQ(v), 400); }} placeholder="Search question text..." style={styles.search} />
        <View style={styles.filterCol}>
          <AdminSelect label="Subject" value={subjectId || null} onChange={(v) => { setSubjectId(v); setPage(1); }}
            options={[{ label: 'All subjects', value: '' }, ...subjects.map((s) => ({ label: s.name, value: s.id }))]} />
        </View>
        <View style={styles.filterCol}>
          <AdminSelect label="Topic" value={topicId || null} onChange={(v) => { setTopicId(v); setPage(1); }}
            options={[{ label: 'All topics', value: '' }, ...topics.map((t) => ({ label: t.name, value: t.id }))]} />
        </View>
        <View style={styles.filterCol}>
          <AdminSelect label="Difficulty" value={difficulty || null} onChange={(v) => { setDifficulty(v); setPage(1); }}
            options={[{ label: 'All', value: '' }, { label: 'Easy', value: 'easy' }, { label: 'Medium', value: 'medium' }, { label: 'Hard', value: 'hard' }, { label: 'Expert', value: 'expert' }]} />
        </View>
        <View style={styles.filterCol}>
          <AdminSelect label="Status" value={reviewStatus || null} onChange={(v) => { setReviewStatus(v); setPage(1); }}
            options={[{ label: 'All', value: '' }, { label: 'Approved', value: 'approved' }, { label: 'Needs review', value: 'needs_review' }, { label: 'AI generated', value: 'ai_generated' }, { label: 'Draft', value: 'draft' }, { label: 'Rejected', value: 'rejected' }]} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <AdminButton title="New question" icon="plus" onPress={() => setCreating(true)} />
        <AdminButton title="Import CSV" variant="secondary" icon="upload" onPress={() => setImporting(true)} />
        <Text style={styles.countText}>{data?.total ?? 0} questions</Text>
      </View>

      {isLoading ? (
        <AdminLoader />
      ) : (
        <>
          <AdminDataTable<QuestionRow>
            columns={columns}
            rows={data?.data ?? []}
            emptyText="No questions match the filters"
          />
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
        </>
      )}

      {(creating || editing) ? (
        <QuestionEditorModal
          catalog={catalog.data ?? { subjects: [], topics: [], programs: [] }}
          question={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
          }}
        />
      ) : null}

      {importing ? (
        <CsvImportModal
          onClose={() => setImporting(false)}
          onImported={() => {
            setImporting(false);
            queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
          }}
        />
      ) : null}
    </AdminShell>
  );
}

// ============================================================
// Question editor modal
// ============================================================

function QuestionEditorModal({
  catalog,
  question,
  onClose,
  onSaved,
}: {
  catalog: Catalog;
  question: QuestionRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState(question?.subject_id ?? catalog.subjects[0]?.id ?? '');
  const [topicId, setTopicId] = useState(question?.topic_id ?? '');
  const [difficulty, setDifficulty] = useState(question?.difficulty ?? 'medium');
  const [qText, setQText] = useState(question?.question_text ?? '');
  const [options, setOptions] = useState<Record<string, string>>({
    A: question?.options?.find((o) => o.option_key === 'A')?.option_text ?? '',
    B: question?.options?.find((o) => o.option_key === 'B')?.option_text ?? '',
    C: question?.options?.find((o) => o.option_key === 'C')?.option_text ?? '',
    D: question?.options?.find((o) => o.option_key === 'D')?.option_text ?? '',
  });
  const [correct, setCorrect] = useState(question?.correct_option ?? 'A');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [hint, setHint] = useState(question?.hint ?? '');
  const [reviewStatus, setReviewStatus] = useState(question?.review_status ?? 'approved');
  const [error, setError] = useState<string | null>(null);

  const subjects = catalog.subjects;
  const topics = catalog.topics.filter((t) => t.subject_id === subjectId);

  const save = useMutation({
    mutationFn: async () => {
      if (!qText.trim()) throw new Error('Question text is required');
      const filled = Object.values(options).filter((v) => v.trim());
      if (filled.length < 2) throw new Error('Provide at least 2 option texts');
      if (!options[correct]?.trim()) throw new Error('Correct option must have text');

      const body = {
        subject_id: subjectId,
        topic_id: topicId || null,
        difficulty,
        question_text: qText.trim(),
        correct_option: correct,
        explanation: explanation.trim() || null,
        hint: hint.trim() || null,
        review_status: reviewStatus,
        options: Object.keys(options).map((k) => ({ option_key: k, option_text: options[k].trim() })),
      };

      if (question) {
        await adminApi.patch(`/admin-dash/questions/${question.id}`, body);
      } else {
        await adminApi.post('/admin-dash/questions', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      onSaved();
    },
    onError: (e: any) => setError(e?.message ?? 'Save failed'),
  });

  return (
    <AdminModal visible title={question ? 'Edit question' : 'Create question'} onClose={onClose} width={720}>
      <ScrollView>
        <AdminSelect
          label="Subject"
          value={subjectId || null}
          onChange={(v) => {
            setSubjectId(v);
            setTopicId('');
          }}
          options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        />
        <AdminSelect
          label="Topic (optional)"
          value={topicId || null}
          onChange={setTopicId}
          options={[{ label: 'No topic', value: '' }, ...topics.map((t) => ({ label: t.name, value: t.id }))]}
        />
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <AdminSelect
              label="Difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { label: 'Easy', value: 'easy' },
                { label: 'Medium', value: 'medium' },
                { label: 'Hard', value: 'hard' },
                { label: 'Expert', value: 'expert' },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AdminSelect
              label="Status"
              value={reviewStatus}
              onChange={setReviewStatus}
              options={[
                { label: 'Approved', value: 'approved' },
                { label: 'Needs review', value: 'needs_review' },
                { label: 'Draft', value: 'draft' },
              ]}
            />
          </View>
        </View>

        <AdminInput label="Question text" value={qText} onChangeText={setQText} multiline placeholder="Enter the question..." />

        {(['A', 'B', 'C', 'D'] as const).map((k) => (
          <View key={k} style={styles.optionRow}>
            <View style={styles.optionKeyWrap}>
              <Text style={styles.optionKey}>{k}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <AdminInput
                value={options[k]}
                onChangeText={(v) => setOptions((prev) => ({ ...prev, [k]: v }))}
                placeholder={`Option ${k}`}
              />
            </View>
            <Pressable
              onPress={() => setCorrect(k)}
              style={[styles.radioBtn, correct === k && { borderColor: adminColors.primary, backgroundColor: adminColors.primaryLight }]}
              hitSlop={6}
            >
              <Feather name="check" size={14} color={correct === k ? adminColors.primary : adminColors.textMuted} />
            </Pressable>
          </View>
        ))}

        <AdminInput label="Explanation" value={explanation} onChangeText={setExplanation} multiline placeholder="Optional explanation shown after answering..." />
        <AdminInput label="Hint" value={hint} onChangeText={setHint} multiline placeholder="Optional hint..." />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.formFooter}>
          <AdminButton title="Cancel" variant="ghost" onPress={onClose} />
          <AdminButton
            title={question ? 'Save changes' : 'Create question'}
            onPress={() => save.mutate()}
            loading={save.isPending}
            icon="check"
          />
        </View>
      </ScrollView>
    </AdminModal>
  );
}

// ============================================================
// CSV import modal
// ============================================================

function CsvImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const queryClient = useQueryClient();
  const [csv, setCsv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; errors: string[]; total: number } | null>(null);

  const importCsv = useMutation({
    mutationFn: () => adminApi.post<{ created: number; errors: string[]; total: number }>('/admin-dash/questions/import', { csv }),
    onSuccess: (res) => {
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (e: any) => setError(e?.message ?? 'Import failed'),
  });

  const pickFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setCsv(await file.text());
    };
    input.click();
  };

  return (
    <AdminModal visible title="Import questions (CSV)" onClose={onClose} width={760}>
      <ScrollView>
        <View style={styles.importHint}>
          <Text style={styles.importHintTitle}>Required columns</Text>
          <Text style={styles.importHintText}>
            subject, topic (optional), difficulty, question_text, correct_option (A/B/C/D), option_a, option_b, option_c, option_d, explanation (optional), hint (optional), review_status (optional)
          </Text>
          <Text style={styles.importHintText}>
            Unknown subjects are skipped and reported. New topics are created automatically for known subjects. Example:
          </Text>
          <View style={styles.importExample}>
            <Text style={styles.importExampleText}>
              subject,difficulty,question_text,correct_option,option_a,option_b,option_c,option_d{'\n'}
              English,medium,"What does ""abdicate"" mean?",B,Renounce,Marry,Adopt,Invent{'\n'}
              Physics,easy,"Unit of force?",C,Volt,Watt,Newton,Joule
            </Text>
          </View>
        </View>

        {Platform.OS === 'web' ? (
          <AdminButton title="Choose .csv file" variant="secondary" icon="paperclip" onPress={pickFile} style={{ marginBottom: 12 }} />
        ) : null}

        <AdminInput label="CSV content" value={csv} onChangeText={setCsv} multiline placeholder="Paste CSV content here..." />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              Imported {result.created} of {result.total} rows.
            </Text>
            {result.errors.length > 0 ? (
              <>
                <Text style={styles.resultSub}>Issues ({result.errors.length}):</Text>
                {result.errors.slice(0, 10).map((e, i) => (
                  <Text key={i} style={styles.resultError}>• {e}</Text>
                ))}
              </>
            ) : null}
            <AdminButton title="Done" variant="success" icon="check" onPress={onImported} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
          </View>
        ) : null}

        {!result ? (
          <View style={styles.formFooter}>
            <AdminButton title="Cancel" variant="ghost" onPress={onClose} />
            <AdminButton title={importCsv.isPending ? 'Importing...' : 'Import CSV'} onPress={() => importCsv.mutate()} loading={importCsv.isPending} icon="upload" disabled={!csv.trim()} />
          </View>
        ) : null}
      </ScrollView>
    </AdminModal>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    flexWrap: 'wrap',
  },
  search: { flex: 1, minWidth: 220, marginBottom: 12 },
  filterCol: { width: 150, marginBottom: 12 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  countText: {
    fontSize: 13,
    color: adminColors.textMuted,
    marginLeft: 'auto',
  },
  qText: { fontSize: 13, color: adminColors.text },
  cell: { fontSize: 13, color: adminColors.text },
  rowActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.surfaceAlt,
  },
  formRow: { flexDirection: 'row', gap: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  optionKeyWrap: {
    width: 30,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.surfaceAlt,
  },
  optionKey: { fontSize: 13, fontWeight: '700', color: adminColors.textSecondary },
  radioBtn: {
    width: 30,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { fontSize: 13, color: adminColors.danger, marginBottom: 8 },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  importHint: {
    backgroundColor: adminColors.infoLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  importHintTitle: { fontSize: 14, fontWeight: '700', color: adminColors.info },
  importHintText: { fontSize: 12, color: adminColors.textSecondary, lineHeight: 18 },
  importExample: {
    backgroundColor: adminColors.surface,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  importExampleText: { fontSize: 11, fontFamily: Platform.select({ web: 'monospace', default: 'monospace' }), color: adminColors.text },
  resultBox: {
    backgroundColor: adminColors.successLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  resultTitle: { fontSize: 14, fontWeight: '700', color: adminColors.success },
  resultSub: { fontSize: 13, color: adminColors.textSecondary, marginTop: 4 },
  resultError: { fontSize: 12, color: adminColors.danger },
});
