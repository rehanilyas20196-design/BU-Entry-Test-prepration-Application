import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Feather } from '@expo/vector-icons';

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

export default function AITutorScreen() {
  const { colors } = useTheme();
  const { questionId } = useLocalSearchParams<{ questionId?: string }>();
  const { show } = useToast();
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

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.tutorAvatar}>
          <Feather name="message-circle" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="label">AI Tutor</AppText>
          <AppText variant="small" color="muted">Your personal BUET study assistant</AppText>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.welcome}>
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
            <ActivityIndicator size="small" color={colors.primary} />
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
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: !input.trim() || loading ? 0.4 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
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
  tutorAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 20, gap: 12, flexGrow: 1 },
  welcome: { gap: 16, paddingVertical: 24 },
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
  sendBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
