import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Feather } from '@expo/vector-icons';

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h2">Terms of Service</AppText>
      </View>

      <AppText variant="body" color="secondary">
        Welcome to BUET Prep AI, an independent educational preparation platform.
      </AppText>

      <AppText variant="h3">Independent platform</AppText>
      <AppText variant="body" color="secondary">
        BUET Prep AI is an independent educational preparation platform and is not affiliated with, endorsed by, or operated by Bahria University. This app does not claim to guarantee admission to Bahria University or any institution.
      </AppText>

      <AppText variant="h3">Content</AppText>
      <AppText variant="body" color="secondary">
        Practice questions are original AI-generated content designed around the publicly published BUET test structure. No question is claimed to be an official or actual future exam question.
      </AppText>

      <AppText variant="h3">Acceptable use</AppText>
      <AppText variant="body" color="secondary">
        You agree not to misuse the app, attempt to manipulate test scores, access other users' data, or use automated tools to scrape content.
      </AppText>

      <AppText variant="h3">No warranty</AppText>
      <AppText variant="body" color="secondary">
        The app is provided "as is" without warranties of any kind. Your exam performance depends on your own study and preparation.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 },
  backBtn: { padding: 4 },
});
