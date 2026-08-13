import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { SubjectTile } from '@/components/dashboard/SubjectTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { FadeInView } from '@/components/ui/Animated';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TextField } from '@/components/ui/TextField';
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

const QUICK_ACTIONS = [
  { key: 'bookmarks', label: 'Bookmarks', icon: 'bookmark' as const, gradient: ['#F59E0B', '#F97316'] as const, route: '/bookmarks' },
  { key: 'mistakes', label: 'My Mistakes', icon: 'alert-octagon' as const, gradient: ['#E11D48', '#F43F5E'] as const, route: '/mistakes' },
  { key: 'weak', label: 'Weak Areas', icon: 'target' as const, gradient: ['#0EA5E9', '#6366F1'] as const, route: '/weak-areas' },
  { key: 'perf', label: 'Performance', icon: 'bar-chart-2' as const, gradient: ['#6366F1', '#7C3AED', '#A855F7'] as const, route: '/performance' },
] as const;

export default function PracticeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const tileWidth = Math.min(Math.floor((width - 40 - 10) / 2), 190);

  const { data: subjects, isLoading, error, refetch } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<Subject[]>('/catalog/subjects'),
    enabled: !!session,
  });

  const filtered = useMemo(() => {
    const list = subjects ?? [];
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q) || (s.code ?? '').toLowerCase().includes(q));
  }, [subjects, query]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView>
        <View style={styles.header}>
          <AppText variant="h2">Practice</AppText>
          <AppText variant="body" color="secondary">Sharpen your skills, one question at a time</AppText>
        </View>
      </FadeInView>

      <FadeInView delay={80}>
        <TextField
          label=""
          value={query}
          onChangeText={setQuery}
          placeholder="Search subjects…"
          autoCapitalize="none"
          autoCorrect={false}
          icon={<Feather name="search" size={18} color={colors.textMuted} />}
        />
      </FadeInView>

      <FadeInView delay={140}>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => router.push(a.route)}
              style={({ pressed }) => [styles.quickPress, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <GlassCard gradient={a.gradient} style={styles.quickAction}>
                <Feather name={a.icon} size={18} color="#FFF" />
                <AppText variant="caption" style={styles.quickLabel}>{a.label}</AppText>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={200}>
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
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="No subjects found"
              message={query ? `Nothing matches "${query}"` : 'No subjects available yet.'}
            />
          ) : (
            <View style={styles.subjectGrid}>
              {filtered.map((s) => (
                <SubjectTile
                  key={s.id}
                  name={s.name}
                  questionCount={(s as any).question_count ?? s._count?.questions ?? 0}
                  style={{ width: tileWidth }}
                  onPress={() => router.push({ pathname: '/topics', params: { subjectId: s.id, subjectName: s.name } })}
                />
              ))}
            </View>
          )}
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  header: { gap: 4, marginTop: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickPress: { flexGrow: 1, flexBasis: '46%', borderRadius: 14 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.94 },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
  },
  quickLabel: { color: '#FFF', fontWeight: '600' },
  section: { gap: 12 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonRow: { flexDirection: 'row', gap: 10 },
});