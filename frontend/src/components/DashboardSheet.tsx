import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Animated,
  Dimensions, ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardKPI } from '@/types';
import { Colors, Fonts } from '@/constants/theme';

interface DashboardSheetProps {
  visible: boolean;
  onClose: () => void;
  kpi: DashboardKPI;
  invoicesAudited: number;
  onOpenAlerts: () => void;
  onOpenVault: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.82, 640);

function KPITile({ label, value, sublabel, accent, icon }: { label: string; value: string; sublabel?: string; accent: string; icon: string }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.kpiTile, { opacity: fadeAnim, transform: [{ scale: scaleAnim }], borderColor: accent + '33' }]}>
      <View style={[styles.kpiIconCircle, { backgroundColor: accent + '20' }]}>
        <Ionicons name={icon as any} size={20} color={accent} />
      </View>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sublabel && <Text style={styles.kpiSublabel}>{sublabel}</Text>}
    </Animated.View>
  );
}

export function DashboardSheet({ visible, onClose, kpi, invoicesAudited, onOpenAlerts, onOpenVault }: DashboardSheetProps) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const recoveryRate = kpi.totalLeakAmount > 0 ? Math.round((kpi.amountRecovered / kpi.totalLeakAmount) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType='none' onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handleContainer}><View style={styles.grabHandle} /></View>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name='speedometer' size={18} color={Colors.primary} />
              <Text style={styles.headerTitle}>Dashboard</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
              <Ionicons name='close' size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>THIS MONTH</Text>

            <View style={styles.kpiGrid}>
              <KPITile
                label='Total Leaks'
                value={String(kpi.totalLeaksDetected)}
                accent='#F97316'
                icon='warning'
              />
              <KPITile
                label='At Risk'
                value={kpi.totalLeakAmount > 0 ? String.fromCodePoint(8377) + kpi.totalLeakAmount.toLocaleString('en-IN') : String.fromCodePoint(8377) + '0'}
                accent='#EF4444'
                icon='trending-down'
              />
              <KPITile
                label='Recovered'
                value={kpi.amountRecovered > 0 ? String.fromCodePoint(8377) + kpi.amountRecovered.toLocaleString('en-IN') : String.fromCodePoint(8377) + '0'}
                sublabel={kpi.totalLeakAmount > 0 ? recoveryRate + '% of at-risk' : 'Upload invoices'}
                accent='#22C55E'
                icon='shield-checkmark'
              />
              <KPITile
                label='Invoices Audited'
                value={String(invoicesAudited)}
                accent={Colors.primaryCyan}
                icon='receipt'
              />
            </View>

            {kpi.pendingAlerts > 0 && (
              <Pressable onPress={() => { onClose(); onOpenAlerts(); }} style={({ pressed }) => [styles.alertBanner, pressed && { opacity: 0.8 }]}>
                <View style={styles.alertBannerLeft}>
                  <Ionicons name='notifications' size={18} color='#F97316' />
                  <View>
                    <Text style={styles.alertBannerTitle}>{kpi.pendingAlerts} Leak Alert{kpi.pendingAlerts > 1 ? 's' : 's'} Need Action</Text>
                    <Text style={styles.alertBannerSub}>Tap to review and approve/reject disputes</Text>
                  </View>
                </View>
                <Ionicons name='chevron-forward' size={16} color='#F97316' />
              </Pressable>
            )}

            {kpi.topLeakingSupplier && (
              <View style={styles.insightCard}>
                <Ionicons name='analytics' size={16} color='#EAB308' />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Top Leaking Supplier</Text>
                  <Text style={styles.insightValue}>{kpi.topLeakingSupplier}</Text>
                </View>
              </View>
            )}

            {kpi.totalLeaksDetected === 0 && (
              <View style={styles.cleanState}>
                <Ionicons name='checkmark-circle' size={40} color={Colors.primary} />
                <Text style={styles.cleanTitle}>All Clear</Text>
                <Text style={styles.cleanSub}>No profit leaks found yet. Upload your first supplier invoice to start the audit pipeline.</Text>
                <Pressable onPress={() => { onClose(); onOpenVault(); }} style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}>
                  <Ionicons name='cloud-upload-outline' size={15} color='#080C08' />
                  <Text style={styles.uploadBtnText}>Open Invoice Vault</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheetContainer: {
    backgroundColor: '#080C08', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', height: SHEET_HEIGHT, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 24,
  },
  handleContainer: { alignItems: 'center', paddingVertical: 8 },
  grabHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: Fonts.sans, fontWeight: '700', fontSize: 17, color: Colors.textPrimary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  liveText: { fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700', color: Colors.primary },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  sectionLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiTile: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, alignItems: 'flex-start',
  },
  kpiIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontFamily: Fonts.mono, fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted },
  kpiSublabel: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(249,115,22,0.1)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.35)',
    borderRadius: 14, padding: 14,
  },
  alertBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertBannerTitle: { fontFamily: Fonts.sans, fontWeight: '700', fontSize: 13, color: '#F97316' },
  alertBannerSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  insightCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(234,179,8,0.08)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.25)',
    borderRadius: 12, padding: 12,
  },
  insightTitle: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted },
  insightValue: { fontFamily: Fonts.sans, fontWeight: '700', fontSize: 14, color: '#EAB308', marginTop: 2 },
  cleanState: { alignItems: 'center', gap: 10, paddingTop: 20 },
  cleanTitle: { fontFamily: Fonts.mono, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  cleanSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 },
  uploadBtnText: { fontFamily: Fonts.mono, fontSize: 13, fontWeight: '700', color: '#080C08' },
});
