import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { SubjectCard } from '@/components/dashboard/SubjectCard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

interface Subject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  _count?: { questions: number };
}

export default function PracticeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { show } = useToast();

  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<Subject[]>('/catalog/subjects'),
    enabled: !!session,
  });

  React.useEffect(() => {
    if (error) {
      show(error instanceof Error ? error.message : 'Failed to load subjects', 'error');
    }
  }, [error, show]);

  const quickActions = [
    { key: 'bookmarks', label: 'Bookmarks', icon: 'bookmark' as const, route: '/bookmarks' },
    { key: 'mistakes', label: 'My Mistakes', icon: 'alert-circle' as const, route: '/mistakes' },
    { key: 'weak', label: 'Weak Areas', icon: 'trending-down' as const, route: '/weak-areas' },
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppText variant="h2">Practice</AppText>
        <AppText variant="body" color="secondary">Choose a subject to start practicing</AppText>
      </View>

      <View style={styles.quickActions}>
        {quickActions.map((a) => (
          <Card
            key={a.key}
            elevated={false}
            style={[styles.quickAction, { borderColor: colors.border }]}
          >
            <View style={{ gap: 8, alignItems: 'center' }}>
              <View style={[styles.quickIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name={a.icon} size={18} color={colors.primary} />
              </View>
              <AppText variant="small">{a.label}</AppText>
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Subjects</AppText>
        {isLoading ? (
          <AppText variant="body" color="muted">Loading subjects…</AppText>
        ) : error ? (
          <AppText variant="body" color="danger">Unable to load subjects. Pull down to retry.</AppText>
        ) : (
          <View style={styles.subjectList}>
            {(subjects ?? []).map((s) => (
              <SubjectCard
                key={s.id}
                name={s.name}
                questionCount={(s as any).question_count ?? s._count?.questions ?? 0}
                onPress={() => router.push({ pathname: '/topics', params: { subjectId: s.id, subjectName: s.name } })}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  header: { gap: 6, marginTop: 8 },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: { flex: 1, padding: 14, borderWidth: 1, borderRadius: 14, alignItems: 'center' },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 12 },
  subjectList: { gap: 10 },
});
