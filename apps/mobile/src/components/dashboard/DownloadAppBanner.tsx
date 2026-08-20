import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { radiusTokens } from '@/theme/tokens';

const APK_URL =
  process.env.EXPO_PUBLIC_APK_URL ??
  'https://github.com/rehanilyas20196-design/BU-APPLICATION-APK-FILES/releases/download/v1.0.0/BU-ENTRY-TEST.apk';

function resolveApkUrl(): string {
  if (/^https?:\/\//.test(APK_URL)) return APK_URL;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URL(APK_URL, window.location.origin).toString();
  }
  return APK_URL;
}

interface DownloadAppBannerProps {
  style?: ViewStyle;
}

export function DownloadAppBanner({ style }: DownloadAppBannerProps) {
  if (Platform.OS !== 'web') return null;

  const handleDownload = () => {
    const url = resolveApkUrl();
    if (typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'buet-prep-ai.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <GlassPanel
      accent={['#4ADE80', '#22C55E']}
      accentOpacity={0.08}
      radius={radiusTokens.card}
      style={style}
      contentStyle={styles.panel}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="android" size={22} color="#16A34A" />
        </View>
        <View style={styles.textWrap}>
          <AppText variant="label">Get the Android app</AppText>
          <AppText variant="small" color="muted">Install BUET Prep AI on your phone for the best experience</AppText>
        </View>
        <Pressable
          onPress={handleDownload}
          style={({ pressed }) => [styles.btn, pressed && { transform: [{ scale: 0.96 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Download Android APK"
        >
          <MaterialCommunityIcons name="download" size={16} color="#FFFFFF" />
          <AppText variant="label" style={styles.btnText}>Download APK</AppText>
        </Pressable>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34,197,94,0.4)',
  },
  textWrap: { flex: 1, gap: 2 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  btnText: { color: '#FFFFFF', fontWeight: '700' },
});
