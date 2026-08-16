import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { SubjectTile } from '@/components/dashboard/SubjectTile';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';

interface Subject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  question_count?: number;
  _count?: { questions: number };
}

export default function LearnScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { width } = useWindowDimensions();
  const tileWidth = Math.min(Math.floor((width - 40 - 10) / 2), 190);

  const { data: subjects, isLoading, error, refetch } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<Subject[]>('/catalog/subjects'),
    enabled: !!session,
  });

  return (
    <ScreenScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <AppText variant="h2">Learn</AppText>
        <AppText variant="body" color="secondary">Master the concept, then practice it</AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Subjects</AppText>
        {isLoading ? (
          <View style={styles.skeletonRow}>
            {[0, 1].map((_i) => (
              <View key={_i} style={{ width: tileWidth }}>
                <SkeletonCard lines={2} />
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorState
            title="Couldn't load subjects"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : (subjects?.length ?? 0) === 0 ? (
          <EmptyState
            icon="book-open"
            title="No subjects yet"
            message="Subjects will appear here once available."
          />
        ) : (
          <View style={styles.subjectGrid}>
            {(subjects ?? []).map((s) => (
              <SubjectTile
                key={s.id}
                name={s.name}
                questionCount={(s as any).question_count ?? s._count?.questions ?? 0}
                style={{ width: tileWidth }}
                onPress={() => router.push({ pathname: '/learn-topics', params: { subjectId: s.id, subjectName: s.name } })}
              />
            ))}
          </View>
        )}
      </View>

      <View style={[styles.note, { backgroundColor: colors.surfaceAlt }]}>
        <Feather name="book-open" size={16} color={colors.primary} />
        <AppText variant="small" color="secondary" style={{ flex: 1 }}>
          Each lesson explains the concept, shows the formula, walks through a solved example, and ends with guided examples. Topics without a lesson yet open practice directly.
        </AppText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  header: { gap: 4, marginTop: 8 },
  section: { gap: 12 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonRow: { flexDirection: 'row', gap: 10 },
  note: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, alignItems: 'flex-start' },
});
