import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { SubjectTile } from '@/components/dashboard/SubjectTile';
import { PracticeModeCard } from '@/components/dashboard/PracticeModeCard';
import type { PracticeAccent, PracticeEffect, PracticeModeIcon } from '@/components/dashboard/PracticeModeCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TextField } from '@/components/ui/TextField';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { useToast } from '@/components/ui/Toast';
import { Feather } from '@expo/vector-icons';

interface Subject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  question_count?: number;
  _count?: { questions: number };
}

interface PracticeMode {
  key: string;
  label: string;
  subtitle: string;
  icon: PracticeModeIcon;
  accent: PracticeAccent;
  effect: PracticeEffect;
  wide?: boolean;
  premium?: boolean;
  route?: '/mistakes';
  params?: Record<string, string>;
  scrollToSubjects?: boolean;
}

const ACCENTS: Record<string, PracticeAccent> = {
  amber: { main: '#D97706', soft: '#F59E0B', ring: '#FEF3C7' },
  violet: { main: '#7C3AED', soft: '#A78BFA', ring: '#EDE9FE' },
  blue: { main: '#2563EB', soft: '#60A5FA', ring: '#DBEAFE' },
  teal: { main: '#0D9488', soft: '#2DD4BF', ring: '#CCFBF1' },
  coral: { main: '#EA580C', soft: '#FB923C', ring: '#FFEDD5' },
  magenta: { main: '#DB2777', soft: '#F472B6', ring: '#FCE7F3' },
  slate: { main: '#64748B', soft: '#94A3B8', ring: '#E2E8F0' },
};

const PRACTICE_MODES: PracticeMode[] = [
  { key: 'quick', label: 'Quick Practice', subtitle: '10 questions', icon: 'lightning-bolt-outline', accent: ACCENTS.amber, effect: 'zap', params: { limit: '10', mode: 'quick' } },
  { key: 'topic', label: 'Topic Practice', subtitle: 'Choose a topic', icon: 'target', accent: ACCENTS.violet, effect: 'target', scrollToSubjects: true },
  { key: 'weak', label: 'Weak Area Practice', subtitle: 'Auto from weak topics', icon: 'heart-pulse', accent: ACCENTS.blue, effect: 'activity', params: { smartRetry: '1' } },
  { key: 'daily', label: 'Daily Challenge', subtitle: '10 questions every day', icon: 'calendar-month-outline', accent: ACCENTS.teal, effect: 'calendar', params: { limit: '10', mode: 'daily', excludeAnswered: '1' } },
  { key: 'speed', label: 'Speed Test', subtitle: 'Under time pressure', icon: 'timer-outline', accent: ACCENTS.coral, effect: 'clock', params: { limit: '10', mode: 'speed' } },
  { key: 'hard', label: 'Hard Mode', subtitle: 'Only difficult questions', icon: 'shield-check-outline', accent: ACCENTS.magenta, effect: 'shield', premium: true, params: { limit: '10', difficulty: 'hard' } },
  { key: 'mistakes', label: 'Mistake Practice', subtitle: 'Previously incorrect questions', icon: 'undo-variant', accent: ACCENTS.slate, effect: 'undo', route: '/mistakes', wide: true },
];

export default function PracticeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const tileWidth = Math.min(Math.floor((width - 40 - 10) / 2), 190);
  const scrollRef = useRef<ScrollView>(null);
  const subjectsRef = useRef<View>(null);

  const openMode = (mode: PracticeMode) => {
    if (mode.key === 'hard' && !isPremium) {
      show('Hard Mode is a Premium feature', 'info');
      router.push('/premium');
      return;
    }
    if (mode.scrollToSubjects) {
      const scrollView = scrollRef.current as unknown as {
        measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void;
      };
      subjectsRef.current?.measureInWindow((_x, subjectsY, _w, _h) => {
        scrollView.measureInWindow((_sx, scrollY, _sw, _sh) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, subjectsY - scrollY - 8), animated: true });
        });
      });
      return;
    }
    if (mode.route) {
      router.push(mode.route);
      return;
    }
    router.push({ pathname: '/practice-session', params: { ...(mode.params ?? {}), title: mode.label } });
  };

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
    <ScreenScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <AppText variant="h2">Practice</AppText>
        <AppText variant="body" color="secondary">Sharpen your skills, one question at a time</AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Practice Modes</AppText>
        <View style={styles.modeGrid}>
          {PRACTICE_MODES.map((m) => (
            <PracticeModeCard
              key={m.key}
              label={m.label}
              subtitle={m.subtitle}
              icon={m.icon}
              accent={m.accent}
              effect={m.effect}
              wide={m.wide}
              premium={m.premium}
              index={0}
              onPress={() => openMode(m)}
            />
          ))}
        </View>
      </View>

      <TextField
        label=""
        value={query}
        onChangeText={setQuery}
        placeholder="Search subjects…"
        autoCapitalize="none"
        autoCorrect={false}
        icon={<Feather name="search" size={18} color={colors.textMuted} />}
      />

      <View ref={subjectsRef} style={styles.section}>
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
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  header: { gap: 4, marginTop: 8 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { gap: 12 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonRow: { flexDirection: 'row', gap: 10 },
});
