import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface ProgramOption {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

const LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'Just getting started with entry test prep' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Comfortable with basics, need practice' },
  { key: 'advanced', label: 'Advanced', desc: 'Strong foundation, focusing on weak spots' },
];

const TIME_OPTIONS = [
  { minutes: 15, label: '15 minutes' },
  { minutes: 30, label: '30 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3+ hours' },
];

const CAMPUSES = ['Islamabad', 'Karachi', 'Lahore', 'Other'];
export default function OnboardingScreen() {
  const { colors } = useTheme();
  const onboard = useOnboardingStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(onboard.fullName);
  const [campus, setCampus] = useState(onboard.campus);
  const [testDate, setTestDate] = useState(onboard.testDate ?? '');
  const [saving, setSaving] = useState(false);

  const { data: programs, isLoading, error, refetch } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get<ProgramOption[]>('/catalog/programs'),
  });

  const steps = [
    { key: 'name', title: 'Welcome to BUET Prep AI', subtitle: "Let's personalize your preparation. What's your name?" },
    { key: 'program', title: 'Choose your target program', subtitle: 'Select the degree you are preparing for.' },
    { key: 'campus', title: 'Which campus?', subtitle: 'Select your preferred campus.' },
    { key: 'level', title: 'How prepared are you?', subtitle: 'Be honest — your plan adapts to your level.' },
    { key: 'time', title: 'Study time', subtitle: 'How much time can you study each day?' },
    { key: 'testDate', title: 'When is your test?', subtitle: 'We will build your countdown and study plan.' },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const canContinue = (() => {
    switch (current.key) {
      case 'name': return fullName.trim().length > 0;
      case 'program': return !!onboard.programId;
      case 'campus': return campus.length > 0;
      case 'level': return !!onboard.preparationLevel;
      case 'time': return !!onboard.dailyStudyMinutes;
      case 'testDate': return !!testDate;
      default: return true;
    }
  })();

  const handleNext = () => {
    if (current.key === 'name') onboard.setField('fullName', fullName);
    if (current.key === 'campus') onboard.setField('campus', campus);
    if (current.key === 'testDate') onboard.setField('testDate', testDate);
    if (!isLast) setStep(step + 1);
    else void handleFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
    onboard.setField('onboarded', true);
    try {
      const token = useAuthStore.getState().session?.access_token;
      if (token) {
        await api.patch('/users/me/profile', {
          full_name: onboard.fullName,
          campus: onboard.campus,
          program_id: onboard.programId,
          test_date: onboard.testDate,
          preparation_level: onboard.preparationLevel,
          daily_study_minutes: onboard.dailyStudyMinutes,
          onboarded: true,
        });
      }
    } catch {
      // non-blocking — profile sync can retry later
    }
    router.replace('/(tabs)');
  };

  const renderContent = () => {
    switch (current.key) {
      case 'name':
        return (
          <View style={{ gap: 16 }}>
            <Image source={require('../assets/campus.png')} style={styles.heroImage} resizeMode="cover" />
            <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Ali Khan" autoComplete="name" />
          </View>
        );
      case 'program':
        return (
          <View style={styles.optionsWrap}>
            {isLoading ? (
              <AppText variant="body" color="muted">Loading programs…</AppText>
            ) : error ? (
              <View style={styles.errorWrap}>
                <AppText variant="body" color="danger">
                  {error instanceof Error ? error.message : 'Unable to load programs. Please check your connection and try again.'}
                </AppText>
                <Button title="Retry" variant="outline" onPress={() => refetch()} />
              </View>
            ) : (
              (programs ?? []).map((p) => {
                const selected = onboard.programId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      onboard.setField('programId', p.id);
                      onboard.setField('programName', p.name);
                    }}
                    style={[styles.option, { backgroundColor: selected ? colors.primaryLight : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
                  >
                    <AppText variant="label">{p.name}</AppText>
                    <AppText variant="small" color="secondary">{p.description ?? p.code}</AppText>
                  </Pressable>
                );
              })
            )}
          </View>
        );
      case 'campus':
        return (
          <View style={styles.optionsWrap}>
            {CAMPUSES.map((c) => {
              const selected = campus === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCampus(c)}
                  style={[styles.option, { backgroundColor: selected ? colors.primaryLight : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
                >
                  <AppText variant="label">{c}</AppText>
                </Pressable>
              );
            })}
          </View>
        );
      case 'level':
        return (
          <View style={styles.optionsWrap}>
            {LEVELS.map((lvl) => {
              const selected = onboard.preparationLevel === lvl.key;
              return (
                <Pressable
                  key={lvl.key}
                  onPress={() => onboard.setField('preparationLevel', lvl.key as 'beginner' | 'intermediate' | 'advanced')}
                  style={[styles.option, { backgroundColor: selected ? colors.primaryLight : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
                >
                  <AppText variant="label">{lvl.label}</AppText>
                  <AppText variant="small" color="secondary">{lvl.desc}</AppText>
                </Pressable>
              );
            })}
          </View>
        );
      case 'time':
        return (
          <View style={styles.optionsWrap}>
            {TIME_OPTIONS.map((t) => {
              const selected = onboard.dailyStudyMinutes === t.minutes;
              return (
                <Pressable
                  key={t.minutes}
                  onPress={() => onboard.setField('dailyStudyMinutes', t.minutes)}
                  style={[styles.option, { backgroundColor: selected ? colors.primaryLight : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
                >
                  <AppText variant="label">{t.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        );
      case 'testDate':
        return (
          <View style={styles.optionsWrap}>
            <TextField
              label="Test date (YYYY-MM-DD)"
              value={testDate}
              onChangeText={setTestDate}
              placeholder="2026-09-15"
              autoCapitalize="none"
            />
          </View>
        );
      default:
        return null;
    }
  };
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.progressTrack}>
        {steps.map((s, i) => (
          <View
            key={s.key}
            style={[styles.progressDot, { backgroundColor: i <= step ? colors.primary : colors.surfaceAlt }]}
          />
        ))}
      </View>

      <View style={styles.header}>
        <AppText variant="h1">{current.title}</AppText>
        <AppText variant="body" color="secondary">{current.subtitle}</AppText>
      </View>

      <View style={styles.content}>{renderContent()}</View>

      <View style={styles.footer}>
        <Button title={isLast ? 'Start Preparing' : 'Continue'} onPress={handleNext} disabled={!canContinue} loading={saving} size="lg" />
        {!isLast && (
          <Button title="Skip for now" variant="ghost" onPress={() => setStep(step + 1)} />
        )}
      </View>

      <AppText variant="small" color="muted" style={styles.disclaimer}>
        This is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 28 },
  progressTrack: { flexDirection: 'row', gap: 8, marginTop: 8 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  header: { gap: 8, marginTop: 16 },
  content: { flex: 1, justifyContent: 'center' },
  heroImage: { width: '100%', height: 140, borderRadius: 16, overflow: 'hidden' },
  optionsWrap: { gap: 12 },
  option: { padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 4 },
  errorWrap: { gap: 12, alignItems: 'center' },
  footer: { gap: 8, marginTop: 'auto' },
  disclaimer: { textAlign: 'center' },
});
