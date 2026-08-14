import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Feather } from '@expo/vector-icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePremiumStore } from '@/stores/premiumStore';
import { PremiumGate } from '@/components/premium/PremiumGate';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Explain a concept',
  'Help me with a practice question',
  'Create a mini study plan',
  'Tips for the BUET',
];

function TypingDot({ phase, reduced }: { phase: number; reduced: boolean }) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduced, p]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + Math.abs(Math.sin((p.value + phase) * Math.PI)) * 0.7,
    transform: [{ translateY: reduced ? 0 : -Math.abs(Math.sin((p.value + phase) * Math.PI)) * 4 }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: '#A5AECB' }, style]} />;
}

function TypingDots() {
  const reduced = useReducedMotion();
  return (
    <View style={styles.dots}>
      {[0, 0.33, 0.66].map((phase, i) => (
        <TypingDot key={i} phase={phase} reduced={reduced} />
      ))}
    </View>
  );
}

export default function AITutorScreen() {
  const { colors } = useTheme();
  const { questionId } = useLocalSearchParams<{ questionId?: string }>();
  const { show } = useToast();
  const isPremium = usePremiumStore((s) => s.isPremium);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const res = await api.post<{ reply: string }>('/ai/tutor', {
        message: trimmed,
        question_id: questionId ?? null,
      });
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', content: res.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: 'assistant', content: 'I could not reach the AI tutor. Please check your connection and try again.' },
      ]);
      show(e instanceof Error ? e.message : 'Tutor request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tutorAvatar}
          >
            <Feather name="message-circle" size={20} color="#FFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <AppText variant="label">AI Tutor</AppText>
            <AppText variant="small" color="muted">Your personal BUET study assistant</AppText>
          </View>
        </View>
        <PremiumGate
          feature="Ask the AI Tutor to explain any topic"
          description="Get step-by-step explanations of any concept, hints, and guided help — exclusive to Premium."
          icon="school-outline"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tutorAvatar}
        >
          <Feather name="message-circle" size={20} color="#FFF" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <AppText variant="label">AI Tutor</AppText>
          <AppText variant="small" color="muted">Your personal BUET study assistant</AppText>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <Feather name="zap" size={22} color={colors.primary} />
            </View>
            <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
              Ask me anything about your BUET preparation. I explain concepts step-by-step, help with questions, and give hints — without just handing you answers.
            </AppText>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  accessibilityRole="button"
                >
                  <AppText variant="small" color="primary">{s}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              {
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: m.role === 'user' ? colors.primary : colors.surface,
                borderColor: m.role === 'user' ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText variant="body" style={{ color: m.role === 'user' ? '#FFF' : colors.text }}>
              {m.content}
            </AppText>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TypingDots />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask the AI tutor…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
          multiline
          maxLength={2000}
          accessibilityLabel="Message the AI tutor"
        />
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
          style={[styles.sendBtn, { opacity: !input.trim() || loading ? 0.4 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            style={StyleSheet.absoluteFill}
          />
          <Feather name="send" size={18} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  tutorAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  messages: { padding: 20, gap: 12, flexGrow: 1 },
  welcome: { gap: 16, paddingVertical: 24, alignItems: 'center' },
  welcomeIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});