import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';
import { BUET_CONFIG } from '@/config/buet';

interface MockTest {
  id: string;
  name: string;
  description: string | null;
  question_count: number;
  duration_minutes: number;
}

export default function MockTestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data: tests, isLoading } = useQuery({
    queryKey: ['mock-tests'],
    queryFn: () => api.get<MockTest[]>('/tests'),
    enabled: !!session,
  });

  const start = (test: MockTest, mode: 'practice' | 'timed_practice' | 'full_mock') => {
    router.push({ pathname: '/mock-test', params: { testId: test.id, mode } });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppText variant="h2">Mock Tests</AppText>
        <AppText variant="body" color="secondary">
          Realistic BUET simulations — {BUET_CONFIG.TOTAL_QUESTIONS} MCQs · {BUET_CONFIG.DURATION_MINUTES} minutes · no negative marking
        </AppText>
      </View>

      {isLoading ? (
        <AppText variant="body" color="muted">Loading mock tests…</AppText>
      ) : (
        <View style={styles.list}>
          {(tests ?? []).map((t) => (
            <Card key={t.id} style={styles.testCard}>
              <View style={styles.testHeader}>
                <View style={[styles.testIcon, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="clipboard" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="label">{t.name}</AppText>
                  <AppText variant="small" color="muted">
                    {t.question_count} questions · {t.duration_minutes} minutes
                  </AppText>
                </View>
              </View>
              <View style={styles.testActions}>
                <Button
                  title="Practice"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onPress={() => start(t, 'practice')}
                />
                <Button
                  title="Timed"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onPress={() => start(t, 'timed_practice')}
                />
                <Button
                  title="Full Mock"
                  size="sm"
                  fullWidth={false}
                  onPress={() => start(t, 'full_mock')}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  header: { gap: 6, marginTop: 8 },
  list: { gap: 12 },
  testCard: { padding: 18, gap: 14 },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  testActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
