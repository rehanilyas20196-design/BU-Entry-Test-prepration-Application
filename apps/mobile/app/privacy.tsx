import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Feather } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h2">Privacy Policy</AppText>
      </View>

      <AppText variant="body" color="secondary">
        BUET Prep AI respects your privacy. This policy explains what we collect and why.
      </AppText>

      <AppText variant="h3">What we collect</AppText>
      <AppText variant="body" color="secondary">
        We collect only the information needed to provide preparation services: your name, email address, target program, test date, and study preferences. We do not collect unnecessary personal information.
      </AppText>

      <AppText variant="h3">How we use it</AppText>
      <AppText variant="body" color="secondary">
        Your data is used to personalize your study experience — progress tracking, study plans, mistake notebooks, and mock test scoring. We never sell your data.
      </AppText>

      <AppText variant="h3">AI processing</AppText>
      <AppText variant="body" color="secondary">
        When you use the AI tutor, only the content you provide (your question or message) is sent to the AI provider to generate a response. We send minimal personal information and never send passwords or account secrets.
      </AppText>

      <AppText variant="h3">Your rights</AppText>
      <AppText variant="body" color="secondary">
        You can delete your account and all associated data at any time from the Profile screen. You can also export or request deletion of your data by contacting support.
      </AppText>

      <AppText variant="h3">Contact</AppText>
      <AppText variant="body" color="secondary">
        For privacy questions, contact our support team through the app or website.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 },
  backBtn: { padding: 4 },
});
