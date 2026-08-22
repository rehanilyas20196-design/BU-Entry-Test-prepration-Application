import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Feather } from '@expo/vector-icons';

/** Where the APK is served from. Override with EXPO_PUBLIC_APK_URL to point
 *  at an external host (e.g. GitHub Releases) instead of the bundled /apk file. */
const APK_URL =
  process.env.EXPO_PUBLIC_APK_URL ??
  'https://github.com/rehanilyas20196-design/BU-APK-FILE/releases/download/v0.1.0/BUKC-PREP.apk';

function triggerDownload(url: string) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    import('expo-linking').then(({ openURL }) => void openURL(url));
  }
}

export function ApkDownloadCard() {
  const { colors } = useTheme();

  // The APK card only makes sense for visitors of the web app —
  // native app users already have it installed.
  if (Platform.OS !== 'web') return null;

  return (
    <Pressable
      onPress={() => triggerDownload(APK_URL)}
      accessibilityRole="button"
      accessibilityLabel="Download the Android app (APK)"
      style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
    >
      <Card padded={false} style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(37,99,235,0.12)' }]}>
          <Feather name="download" size={20} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <AppText variant="bodyMedium">Get the Android app</AppText>
          <AppText variant="small" color="muted" numberOfLines={1}>
            Download the APK and install it on your phone
          </AppText>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.primary }]}>
          <Feather name="download-cloud" size={14} color="#FFFFFF" />
          <AppText variant="label" style={{ color: '#FFFFFF' }}>APK</AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {},
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
