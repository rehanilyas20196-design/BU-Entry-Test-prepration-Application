import React, { useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View, Image, useWindowDimensions } from 'react-native';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { DatePicker } from '@/components/ui/DatePicker';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';

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

const INTRO_SLIDES = [
  {
    key: 'practice',
    icon: 'edit-3' as const,
    title: 'Practice smarter',
    subtitle: 'Thousands of real BUET-style MCQs across every subject, with instant feedback and step-by-step solutions.',
  },
  {
    key: 'mock',
    icon: 'clipboard' as const,
    title: 'Face the real exam',
    subtitle: 'Full-length timed mock tests that mirror the actual paper — including a smart question palette and review.',
  },
  {
    key: 'insights',
    icon: 'trending-up' as const,
    title: 'Know your weak spots',
    subtitle: 'A live performance dashboard tracks accuracy per subject and topic, so you always know what to fix next.',
  },
  {
    key: 'ai',
    icon: 'message-circle' as const,
    title: 'Your AI study coach',
    subtitle: 'Get hints, explanations and a personalised study plan from your built-in AI tutor — whenever you are stuck.',
  },
];

function validateTestDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Use YYYY-MM-DD format';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today ? 'Test date cannot be in the past' : null;
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { isWeb, isDesktop } = useResponsive();
  const onboard = useOnboardingStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<'intro' | 'setup'>('intro');
  const [slideIndex, setSlideIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(onboard.fullName);
  const [campus, setCampus] = useState(onboard.campus);
  const [testDate, setTestDate] = useState(onboard.testDate ?? '');
  const [saving, setSaving] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { data: programs, isLoading, error, refetch } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get<ProgramOption[]>('/catalog/programs'),
  });

  const setupSteps = [
    { key: 'name', title: 'Welcome to BUET Prep AI', subtitle: "Let's personalize your preparation. What's your name?" },
    { key: 'program', title: 'Choose your target program', subtitle: 'Select the degree you are preparing for.' },
    { key: 'campus', title: 'Which campus?', subtitle: 'Select your preferred campus.' },
    { key: 'level', title: 'How prepared are you?', subtitle: 'Be honest — your plan adapts to your level.' },
    { key: 'time', title: 'Study time', subtitle: 'How much time can you study each day?' },
    { key: 'testDate', title: 'When is your test?', subtitle: 'We will build your countdown and study plan.' },
  ];

  const current = setupSteps[step];
  const isLast = step === setupSteps.length - 1;

  const testDateError = current?.key === 'testDate' && testDate ? validateTestDate(testDate) : null;

  const canContinue = (() => {
    if (!current) return true;
    switch (current.key) {
      case 'name': return fullName.trim().length > 0;
      case 'program': return !!onboard.programId;
      case 'campus': return campus.length > 0;
      case 'level': return !!onboard.preparationLevel;
      case 'time': return !!onboard.dailyStudyMinutes;
      case 'testDate': return !!testDate && !testDateError;
      default: return true;
    }
  })();

  const handleNext = () => {
    if (!current) return;
    if (current.key === 'name') onboard.setField('fullName', fullName);
    if (current.key === 'campus') onboard.setField('campus', campus);
    if (current.key === 'testDate') onboard.setField('testDate', testDate);
    if (!isLast) setStep(step + 1);
    else void handleFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
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
        await onboard.setField('onboarded', true);
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    } catch (err: any) {
      toast.show(err?.message ?? 'Could not save your profile. You can retry from the profile page.', 'error');
      return;
    }
    router.replace('/(tabs)');
  };

  const goToIntroSlide = (i: number) => {
    listRef.current?.scrollToOffset({ offset: i * width, animated: true });
    setSlideIndex(i);
  };

  const renderSetupContent = () => {
    switch (current.key) {
      case 'name':
        return (
          <View style={{ gap: 16 }}>
            <Image source={require('../assets/building2.jpg')} style={styles.heroImage} resizeMode="cover" />
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
            <DatePicker
              label="When is your test?"
              value={testDate || null}
              onChange={(d) => setTestDate(d ?? '')}
              error={testDateError}
            />
            {testDate && !testDateError && (
              <AppText variant="small" color="secondary">
                Countdown starts: {testDate} ({new Date(`${testDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
              </AppText>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (phase === 'intro') {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <FlatList
          ref={listRef}
          data={INTRO_SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s.key}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setSlideIndex(i);
          }}
          renderItem={({ item, index }) => (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.slideIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name={item.icon} size={40} color={colors.primary} />
              </View>
              <AppText variant="h1" style={[styles.slideTitle, { color: colors.text }]}>{item.title}</AppText>
              <AppText variant="body" color="secondary" style={styles.slideSubtitle}>{item.subtitle}</AppText>
              <View style={styles.slideDots}>
                {INTRO_SLIDES.map((s, i) => (
                  <View
                    key={s.key}
                    style={[
                      styles.dot,
                      { backgroundColor: i === index ? colors.primary : colors.surfaceAlt },
                      i === index && { width: 26 },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
          getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
        />
        <View style={styles.introFooter}>
          <Button title={slideIndex === INTRO_SLIDES.length - 1 ? 'Start Preparing' : 'Continue'} size="lg" onPress={() => (slideIndex === INTRO_SLIDES.length - 1 ? setPhase('setup') : goToIntroSlide(slideIndex + 1))} />
          <Button title="Skip intro" variant="ghost" onPress={() => setPhase('setup')} />
        </View>
      </View>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={[styles.setupCol, isWeb && isDesktop && styles.setupColWide]}>
      <View style={styles.progressTrack}>
        {setupSteps.map((s, i) => (
          <View
            key={s.key}
            style={[styles.progressDot, { backgroundColor: i <= step ? colors.primary : colors.surfaceAlt }]}
          />
        ))}
      </View>

      <View style={styles.header}>
        <AppText variant="h1" style={{ color: colors.text }}>{current.title}</AppText>
        <AppText variant="body" color="secondary">{current.subtitle}</AppText>
      </View>

      <View style={styles.content}>{renderSetupContent()}</View>

      <View style={styles.footer}>
        <Button title={isLast ? 'Start Preparing' : 'Continue'} onPress={handleNext} disabled={!canContinue} loading={saving} size="lg" />
        {!isLast && (
          <Button title="Skip for now" variant="ghost" onPress={() => setStep(step + 1)} />
        )}
      </View>

      <AppText variant="small" color="muted" style={styles.disclaimer}>
        This is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
      </AppText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, gap: 28 },
  setupCol: { flex: 1, gap: 28 },
  setupColWide: { maxWidth: 520, alignSelf: 'center', width: '100%' },
  progressTrack: { flexDirection: 'row', gap: 8, marginTop: 8 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  header: { gap: 8, marginTop: 16 },
  content: { flex: 1, justifyContent: 'center' },
  heroImage: { width: '100%', height: 170, borderRadius: 12, overflow: 'hidden' },
  optionsWrap: { gap: 12 },
  option: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 4 },
  errorWrap: { gap: 12, alignItems: 'center' },
  footer: { gap: 8, marginTop: 'auto' },
  disclaimer: { textAlign: 'center' },
  slide: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  slideIcon: {
    width: 96, height: 96, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  slideTitle: { textAlign: 'center' },
  slideSubtitle: { textAlign: 'center', maxWidth: 320 },
  slideDots: { flexDirection: 'row', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  introFooter: { padding: 24, paddingBottom: 40, gap: 4 },
});