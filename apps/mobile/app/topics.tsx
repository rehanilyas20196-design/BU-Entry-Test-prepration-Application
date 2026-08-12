import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Feather } from '@expo/vector-icons';

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

export default function TopicsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId: string; subjectName: string }>();

  const { data: topics, isLoading } = useQuery({
    queryKey: ['topics', params.subjectId],
    queryFn: () => api.get<Topic[]>(`/catalog/topics?subject_id=${params.subjectId}`),
  });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{params.subjectName ?? 'Topics'}</AppText>
          <AppText variant="body" color="secondary">Practice by topic</AppText>
        </View>
      </View>

      <Button
        title="Practice Mixed Questions"
        onPress={() => router.push({ pathname: '/practice-session', params: { subjectId: params.subjectId, subjectName: params.subjectName } })}
      />

      <View style={styles.section}>
        <AppText variant="h3">Topics</AppText>
        {isLoading ? (
          <AppText variant="body" color="muted">Loading topics…</AppText>
        ) : (
          <View style={styles.topicList}>
            {(topics ?? []).map((t) => (
              <Card key={t.id} elevated={false} style={styles.topicCard}>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/practice-session', params: { subjectId: params.subjectId, topicId: t.id, topicName: t.name } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={t.name}
                >
                  <View style={styles.topicRow}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <AppText variant="label">{t.name}</AppText>
                      {t.description && (
                        <AppText variant="small" color="muted">{t.description}</AppText>
                      )}
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.textMuted} />
                  </View>
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { padding: 4 },
  section: { gap: 12 },
  topicList: { gap: 8 },
  topicCard: { padding: 0 },
  topicRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
});
