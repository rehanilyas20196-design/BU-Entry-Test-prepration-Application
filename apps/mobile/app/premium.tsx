import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { radiusTokens } from '@/theme/tokens';
import { usePremiumStore } from '@/stores/premiumStore';

const GOLD = {
  base: '#F59E0B',
  soft: '#FDE68A',
  ring: '#FCD34D',
  deep: '#B45309',
};

const TILL_ID = '984180825';
const TILL_DIGITS = TILL_ID.split('');

const FEATURES = [
  { icon: 'school-outline', label: 'Explain any topic with the AI tutor' },
  { icon: 'shield-star-outline', label: 'Hard Mode practice — only difficult questions' },
  { icon: 'clipboard-text-outline', label: 'Hard Mock tests for full practice' },
  { icon: 'school-outline', label: 'All subjects and topics unlocked' },
  { icon: 'message-processing-outline', label: 'Unlimited AI tutor sessions' },
  { icon: 'chart-timeline-variant', label: 'Advanced analytics and weak-area insights' },
  { icon: 'infinity', label: 'Mistake notebook with smart retries' },
] as const;

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { show } = useToast();

  const isPremium = usePremiumStore((s) => s.isPremium);
  const latestPayment = usePremiumStore((s) => s.latestPayment);
  const verifyPayment = usePremiumStore((s) => s.verifyPayment);
  const checkStatus = usePremiumStore((s) => s.checkStatus);

  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkStatus().catch(() => {});
  }, [checkStatus]);

  const bgColors = colors.isDark
    ? ([colors.heroGradientStart, colors.gradientMid, colors.heroGradientEnd] as [string, string, string])
    : (['#FFFFFF', '#EEF2FF', '#F6F7FB'] as [string, string, string]);

  const handleCopyTillId = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(TILL_ID);
    }
    setCopied(true);
    show(`TILL ID ${TILL_ID} copied!`, 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleVerify = async () => {
    if (!trxId.trim()) {
      show('Please enter your Transaction ID (Trx ID / TID)', 'error');
      return;
    }

    setIsVerifying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const res = await verifyPayment(trxId.trim(), senderPhone.trim() || undefined);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        show(res.message || 'Payment verified! Premium features unlocked.', 'success');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        show(res.message || 'Payment verification failed', 'error');
      }
    } catch (err: any) {
      show(err.message || 'An error occurred during verification', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground colors={bgColors}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
            </Pressable>
            <AppText variant="h2">BUET Prep Premium</AppText>
          </View>

          {/* Hero Header */}
          <View style={styles.heroWrap}>
            <View style={styles.heroShadow} />
            <View style={styles.hero}>
              <LinearGradient
                colors={['#312E81', '#5B21B6', '#7C3AED'] as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.8 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.goldGlow} pointerEvents="none" />
              <FloatingParticles count={10} color={GOLD.soft} />

              <View style={styles.heroContent}>
                <View style={styles.crownWrap}>
                  <MaterialCommunityIcons name="crown" size={28} color={GOLD.soft} />
                </View>
                <AppText variant="h2" style={styles.whiteText}>
                  {isPremium ? 'Premium Active' : 'BUET Prep AI Premium'}
                </AppText>
                <AppText variant="body" style={styles.white80}>
                  {isPremium
                    ? 'You have unlocked full access to all practice modes, AI tutor & mock tests!'
                    : 'Everything you need to clear the BUET Entry Test with confidence.'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Active Premium Card */}
          {isPremium ? (
            <GlassPanel
              accent={[GOLD.soft, GOLD.base]}
              accentOpacity={0.25}
              radius={radiusTokens.card}
              shadowIntensity={0.3}
            >
              <View style={styles.activePlanBody}>
                <View style={styles.successHeader}>
                  <View style={styles.checkCircle}>
                    <MaterialCommunityIcons name="check-bold" size={24} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="h3" style={{ color: GOLD.deep }}>Premium Account Active</AppText>
                    <AppText variant="small" color="muted">Unlimited Access Granted</AppText>
                  </View>
                </View>

                {latestPayment && (
                  <View style={styles.receiptBox}>
                    <AppText variant="label" style={{ marginBottom: 6 }}>Payment Receipt</AppText>
                    <View style={styles.receiptRow}>
                      <AppText variant="small" color="muted">Shop Name:</AppText>
                      <AppText variant="small" style={{ fontWeight: '600' }}>{latestPayment.shop_name || 'REHAN Shop'}</AppText>
                    </View>
                    <View style={styles.receiptRow}>
                      <AppText variant="small" color="muted">TILL ID:</AppText>
                      <AppText variant="small" style={{ fontWeight: '600' }}>{latestPayment.till_id || '984180825'}</AppText>
                    </View>
                    <View style={styles.receiptRow}>
                      <AppText variant="small" color="muted">Transaction ID:</AppText>
                      <AppText variant="small" style={{ fontWeight: '700', color: '#16A34A' }}>
                        {latestPayment.trx_id}
                      </AppText>
                    </View>
                    <View style={styles.receiptRow}>
                      <AppText variant="small" color="muted">Payment Method:</AppText>
                      <AppText variant="small" style={{ fontWeight: '600' }}>JazzCash / Raast</AppText>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                <AppText variant="label" style={{ marginTop: 4 }}>Unlocked Features</AppText>
                <View style={styles.featureList}>
                  {FEATURES.map((f) => (
                    <View key={f.label} style={styles.feature}>
                      <View style={styles.featureIcon}>
                        <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                      </View>
                      <MaterialCommunityIcons name={f.icon} size={17} color={GOLD.deep} />
                      <AppText variant="small" color="secondary" style={{ flex: 1 }}>{f.label}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            </GlassPanel>
          ) : (
            <>
              {/* JazzCash / Raast Payment Card Poster */}
              <View style={styles.posterCard}>
                {/* Yellow Poster Background */}
                <LinearGradient
                  colors={['#FFDD00', '#FACC15', '#EAB308']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Top Logos & Branding Header */}
                <View style={styles.posterHeader}>
                  <View style={styles.logoBadgeContainer}>
                    <View style={styles.brandPillJazz}>
                      <AppText variant="small" style={styles.jazzText}>JazzCash</AppText>
                    </View>
                    <View style={styles.brandDivider} />
                    <View style={styles.brandPillRaast}>
                      <AppText variant="small" style={styles.raastText}>Raast</AppText>
                    </View>
                  </View>

                  <AppText variant="h2" style={styles.shopTitle}>REHAN Shop</AppText>
                </View>

                {/* Main QR Code Image Frame */}
                <View style={styles.qrFrame}>
                  <Image
                    source={require('../assets/payment_qr.png')}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>

                {/* TILL ID Section */}
                <View style={styles.tillSection}>
                  <AppText variant="h3" style={styles.tillLabel}>TILL ID</AppText>

                  {/* White Digit Boxes */}
                  <View style={styles.digitRow}>
                    {TILL_DIGITS.map((digit, idx) => (
                      <View key={idx} style={styles.digitBox}>
                        <AppText variant="h2" style={styles.digitText}>{digit}</AppText>
                      </View>
                    ))}
                  </View>

                  {/* Copy Till ID Button */}
                  <Pressable
                    onPress={handleCopyTillId}
                    style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.85 }]}
                  >
                    <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={16} color="#FFFFFF" />
                    <AppText variant="small" style={styles.copyBtnText}>
                      {copied ? 'TILL ID Copied!' : 'Copy TILL ID (984180825)'}
                    </AppText>
                  </Pressable>

                  {/* USSD Instruction */}
                  <AppText variant="small" style={styles.dialInstruction}>
                    Dial <AppText variant="small" style={{ fontWeight: '800', color: '#B91C1C' }}>*786*10#</AppText> and enter TILL ID to pay via JazzCash account.
                  </AppText>

                  <View style={styles.acceptedBanner}>
                    <AppText variant="label" style={styles.acceptedText}>
                      QR PAYMENTS ACCEPTED HERE
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Payment Instructions & Submission Form */}
              <GlassPanel
                accent={[GOLD.soft, GOLD.base]}
                accentOpacity={0.18}
                radius={radiusTokens.card}
                shadowIntensity={0.3}
              >
                <View style={styles.planBody}>
                  <View style={styles.planHeader}>
                    <AppText variant="h3" style={{ flex: 1 }}>Premium Access Plan</AppText>
                    <View style={styles.popularPill}>
                      <MaterialCommunityIcons name="star" size={11} color={GOLD.deep} />
                      <AppText variant="micro" style={styles.popularText}>One-Time Access</AppText>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <AppText variant="caption" color="secondary" style={styles.currency}>Rs</AppText>
                    <AppText variant="display" style={styles.price}>5,000</AppText>
                  </View>
                  <AppText variant="small" color="muted">Full lifetime access for BUET Prep</AppText>

                  <View style={styles.divider} />

                  {/* Steps */}
                  <AppText variant="label" style={{ marginTop: 2 }}>How to Pay:</AppText>
                  <View style={styles.stepsList}>
                    <View style={styles.stepRow}>
                      <View style={styles.stepBadge}><AppText variant="micro" style={styles.stepNum}>1</AppText></View>
                      <AppText variant="small" color="secondary" style={{ flex: 1 }}>
                        Open <AppText variant="small" style={{ fontWeight: '700' }}>JazzCash</AppText>, <AppText variant="small" style={{ fontWeight: '700' }}>Easypaisa</AppText>, or any Raast banking app.
                      </AppText>
                    </View>
                    <View style={styles.stepRow}>
                      <View style={styles.stepBadge}><AppText variant="micro" style={styles.stepNum}>2</AppText></View>
                      <AppText variant="small" color="secondary" style={{ flex: 1 }}>
                        Scan QR Code above OR Dial <AppText variant="small" style={{ fontWeight: '700' }}>*786*10#</AppText> & enter Till ID <AppText variant="small" style={{ fontWeight: '700' }}>984180825</AppText>.
                      </AppText>
                    </View>
                    <View style={styles.stepRow}>
                      <View style={styles.stepBadge}><AppText variant="micro" style={styles.stepNum}>3</AppText></View>
                      <AppText variant="small" color="secondary" style={{ flex: 1 }}>
                        Pay <AppText variant="small" style={{ fontWeight: '700', color: GOLD.deep }}>Rs. 5,000</AppText> to <AppText variant="small" style={{ fontWeight: '700' }}>REHAN Shop</AppText>.
                      </AppText>
                    </View>
                    <View style={styles.stepRow}>
                      <View style={styles.stepBadge}><AppText variant="micro" style={styles.stepNum}>4</AppText></View>
                      <AppText variant="small" color="secondary" style={{ flex: 1 }}>
                        Enter your payment Transaction ID (Trx ID / TID) below to confirm & unlock!
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Payment Submission Form */}
                  <View style={styles.formSection}>
                    <AppText variant="label" style={{ color: colors.text }}>
                      Transaction ID (Trx ID / TID) <AppText variant="label" style={{ color: '#EF4444' }}>*</AppText>
                    </AppText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                          color: colors.text,
                          borderColor: colors.isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB',
                        },
                      ]}
                      placeholder="e.g. 019283746501 or 12-digit Trx ID"
                      placeholderTextColor={colors.textMuted}
                      value={trxId}
                      onChangeText={setTrxId}
                      autoCapitalize="characters"
                      accessibilityLabel="Transaction ID"
                    />

                    <AppText variant="label" style={{ color: colors.text, marginTop: 4 }}>
                      Sender Phone Number (Optional)
                    </AppText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                          color: colors.text,
                          borderColor: colors.isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB',
                        },
                      ]}
                      placeholder="e.g. 03001234567"
                      placeholderTextColor={colors.textMuted}
                      value={senderPhone}
                      onChangeText={setSenderPhone}
                      keyboardType="phone-pad"
                      accessibilityLabel="Sender Phone Number"
                    />

                    {/* Submit Button */}
                    <Pressable
                      onPress={handleVerify}
                      disabled={isVerifying}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm Payment and Unlock Premium"
                      style={({ pressed }) => [
                        styles.buyButton,
                        pressed && styles.buyPressed,
                        isVerifying && { opacity: 0.7 },
                      ]}
                    >
                      <LinearGradient
                        colors={['#F59E0B', '#D97706', '#B45309'] as [string, string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      {isVerifying ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
                          <AppText variant="label" style={styles.buyText}>
                            Verify & Unlock Premium
                          </AppText>
                        </>
                      )}
                    </Pressable>
                  </View>

                  <AppText variant="micro" color="muted" style={styles.secureNote}>
                    <MaterialCommunityIcons name="lock-outline" size={12} color={colors.textMuted} />{' '}
                    Instant automatic verification upon entering valid transaction details.
                  </AppText>
                </View>
              </GlassPanel>

              {/* Unlocked Features Section */}
              <View style={styles.section}>
                <AppText variant="h3">What's Included in Premium</AppText>
                <GlassPanel radius={radiusTokens.card}>
                  <View style={{ padding: 18, gap: 12 }}>
                    {FEATURES.map((f) => (
                      <View key={f.label} style={styles.feature}>
                        <View style={styles.featureIcon}>
                          <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                        </View>
                        <MaterialCommunityIcons name={f.icon} size={18} color={GOLD.deep} />
                        <AppText variant="small" color="secondary" style={{ flex: 1 }}>{f.label}</AppText>
                      </View>
                    ))}
                  </View>
                </GlassPanel>
              </View>
            </>
          )}
        </ScrollView>
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { padding: 4 },
  heroWrap: { position: 'relative' },
  heroShadow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(76,29,149,0.02)',
    shadowColor: '#1E1B4B',
    shadowOpacity: 1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  goldGlow: {
    position: 'absolute',
    top: -50, right: -40,
    width: 190, height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(251,191,36,0.16)',
  },
  heroContent: { padding: 24, gap: 6, alignItems: 'center' },
  crownWrap: {
    width: 60, height: 60, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,191,36,0.5)',
    marginBottom: 6,
  },
  whiteText: { color: '#FFFFFF', fontWeight: '700' },
  white80: { color: 'rgba(255,255,255,0.85)', textAlign: 'center' },

  /* Poster Card */
  posterCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  posterHeader: { alignItems: 'center', width: '100%', marginBottom: 14 },
  logoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  brandPillJazz: { paddingHorizontal: 6 },
  jazzText: { color: '#D97706', fontWeight: '900', fontSize: 16 },
  brandDivider: { width: 1, height: 16, backgroundColor: '#D1D5DB', marginHorizontal: 8 },
  brandPillRaast: { paddingHorizontal: 6 },
  raastText: { color: '#047857', fontWeight: '900', fontSize: 16 },
  shopTitle: { color: '#111827', fontWeight: '900', fontSize: 26, letterSpacing: 0.5 },

  qrFrame: {
    width: 240,
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  qrImage: { width: '100%', height: '100%' },

  tillSection: { width: '100%', alignItems: 'center', gap: 8 },
  tillLabel: { color: '#DC2626', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  digitRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  digitBox: {
    width: 32,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  digitText: { color: '#111827', fontWeight: '900', fontSize: 22 },

  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  copyBtnText: { color: '#FFFFFF', fontWeight: '700' },

  dialInstruction: {
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  acceptedBanner: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.15)',
    width: '100%',
    alignItems: 'center',
  },
  acceptedText: { color: '#111827', fontWeight: '900', fontSize: 13, letterSpacing: 1.2 },

  /* Form & Plan Body */
  section: { gap: 14 },
  planBody: { padding: 20, gap: 12 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  popularPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.18)',
  },
  popularText: { color: GOLD.deep, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  currency: { fontWeight: '700' },
  price: { color: GOLD.deep, fontWeight: '800' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(120,120,140,0.25)',
    marginVertical: 6,
  },

  stepsList: { gap: 10, marginVertical: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: GOLD.deep,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#FFFFFF', fontWeight: '800' },

  formSection: { gap: 8, marginTop: 4 },
  input: {
    borderRadius: radiusTokens.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },

  featureList: { gap: 12, marginVertical: 4 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  buyButton: {
    marginTop: 10,
    borderRadius: radiusTokens.control,
    overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  buyPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  buyText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secureNote: { textAlign: 'center', marginTop: 4 },

  /* Active Premium View */
  activePlanBody: { padding: 20, gap: 14 },
  successHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center',
  },
  receiptBox: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    gap: 6,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});