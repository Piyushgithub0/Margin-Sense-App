import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Animated, Dimensions,
  ScrollView, TouchableWithoutFeedback, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeakAlert } from '@/types';
import { Colors, Fonts } from '@/constants/theme';

interface LeakAlertsSheetProps {
  visible: boolean;
  onClose: () => void;
  alerts: LeakAlert[];
  onApprove: (alertId: string) => void;
  onReject: (alertId: string) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.88, 700);
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#22C55E',
};
const LEAK_TYPE_ICONS: Record<string, string> = {
  RATE_HIKE: 'trending-up', GST_MISMATCH: 'receipt', DUPLICATE_CHARGE: 'copy',
  FREIGHT_OVERCHARGE: 'car', EXCESS_QUANTITY: 'layers', DISCOUNT_MISSING: 'pricetag',
};

function AlertCard({ alert, onApprove, onReject }: { alert: LeakAlert; onApprove: () => void; onReject: () => void }) {
  const slideX = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideX, { toValue: 0, damping: 18, stiffness: 140, useNativeDriver: true }),
    ]).start();
  }, []);
  const severityColor = SEVERITY_COLORS[alert.severity] || '#22C55E';
  const iconName = (LEAK_TYPE_ICONS[alert.leakType] || 'alert-circle') as any;
  const isPending = alert.status === 'PENDING';
  const isApproved = alert.status === 'APPROVED';
  const isRejected = alert.status === 'REJECTED';
  const handleWhatsApp = () => {
    if (!alert.whatsappDraft) return;
    const encoded = encodeURIComponent(alert.whatsappDraft);
    Linking.openURL('https://wa.me/?text=' + encoded).catch(() => Linking.openURL('whatsapp://send?text=' + encoded));
  };
  return (
    <Animated.View style={[styles.alertCard, { opacity: fadeIn, transform: [{ translateX: slideX }] }, isApproved && styles.alertCardApproved, isRejected && styles.alertCardRejected]}>
      <View style={[styles.severityBar, { backgroundColor: severityColor }]} />
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <View style={[styles.leakIconCircle, { backgroundColor: severityColor + '22' }]}>
            <Ionicons name={iconName} size={15} color={severityColor} />
          </View>
          <View style={styles.alertTitleBlock}>
            <Text style={styles.alertTitle} numberOfLines={1}>{alert.supplierName}</Text>
            {alert.invoiceNumber && <Text style={styles.alertInvoiceNo}>#{alert.invoiceNumber}</Text>}
          </View>
          <View style={[styles.severityBadge, { borderColor: severityColor + '66', backgroundColor: severityColor + '18' }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>{alert.severity}</Text>
          </View>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.leakAmountLabel}>Profit Leak</Text>
          <Text style={[styles.leakAmount, { color: severityColor }]}>{String.fromCodePoint(8377)}{alert.leakAmount.toLocaleString('en-IN')}</Text>
        </View>
        <Text style={styles.rootCause} numberOfLines={2}>{alert.rootCause}</Text>
        {!isPending && (
          <View style={[styles.resolvedBadge, isApproved ? styles.resolvedApproved : styles.resolvedRejected]}>
            <Ionicons name={isApproved ? 'checkmark-circle' : 'close-circle'} size={13} color={isApproved ? Colors.primary : '#EF4444'} />
            <Text style={[styles.resolvedText, { color: isApproved ? Colors.primary : '#EF4444' }]}>{isApproved ? 'Dispute Approved' : 'Skipped'}</Text>
          </View>
        )}
        {isPending && (
          <View style={styles.actionRow}>
            <Pressable onPress={onReject} style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.7 }]} hitSlop={6}>
              <Ionicons name='close' size={14} color='#EF4444' />
              <Text style={styles.rejectText}>Skip</Text>
            </Pressable>
            {alert.whatsappDraft ? (
              <Pressable onPress={() => { onApprove(); handleWhatsApp(); }} style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8 }]}>
                <Ionicons name='logo-whatsapp' size={14} color='#080C08' />
                <Text style={styles.approveBtnText}>Approve and Send</Text>
              </Pressable>
            ) : (
              <Pressable onPress={onApprove} style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8 }]}>
                <Ionicons name='checkmark' size={14} color='#080C08' />
                <Text style={styles.approveBtnText}>Approve Dispute</Text>
              </Pressable>
            )}
          </View>
        )}
        {isApproved && alert.whatsappDraft && (
          <Pressable onPress={handleWhatsApp} style={({ pressed }) => [styles.resendBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name='logo-whatsapp' size={13} color='#22C55E' />
            <Text style={styles.resendText}>Resend WhatsApp Draft</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function LeakAlertsSheet({ visible, onClose, alerts, onApprove, onReject }: LeakAlertsSheetProps) {
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
  const pendingCount = alerts.filter((a) => a.status === 'PENDING').length;
  const totalLeak = alerts.reduce((sum, a) => sum + a.leakAmount, 0);
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
              <Ionicons name='notifications' size={18} color='#F97316' />
              <Text style={styles.headerTitle}>Leak Alerts</Text>
              {pendingCount > 0 && <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>{pendingCount} Pending</Text></View>}
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
              <Ionicons name='close' size={20} color={Colors.textMuted} />
            </Pressable>
          </View>
          {alerts.length > 0 && (
            <View style={styles.summaryBar}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{alerts.length}</Text>
                <Text style={styles.summaryLabel}>Total Leaks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{String.fromCodePoint(8377)}{totalLeak.toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>At Risk</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#F97316' }]}>{pendingCount}</Text>
                <Text style={styles.summaryLabel}>Pending Action</Text>
              </View>
            </View>
          )}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {alerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name='shield-checkmark' size={44} color={Colors.primary} />
                <Text style={styles.emptyTitle}>No Profit Leaks Detected</Text>
                <Text style={styles.emptySubtitle}>Upload or snap a supplier invoice to start the autonomous audit pipeline.</Text>
              </View>
            ) : (
              alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onApprove={() => onApprove(alert.id)} onReject={() => onReject(alert.id)} />)
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
  sheetContainer: { backgroundColor: '#0B1508', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(249,115,22,0.22)', height: SHEET_HEIGHT, paddingBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 24 },
  handleContainer: { alignItems: 'center', paddingVertical: 8 },
  grabHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: Fonts.sans, fontWeight: '700', fontSize: 17, color: Colors.textPrimary },
  pendingBadge: { backgroundColor: 'rgba(249,115,22,0.2)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.4)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  pendingBadgeText: { fontFamily: Fonts.mono, fontSize: 11, fontWeight: '700', color: '#F97316' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  summaryBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryValue: { fontFamily: Fonts.mono, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  alertCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  alertCardApproved: { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.04)' },
  alertCardRejected: { borderColor: 'rgba(255,255,255,0.05)', opacity: 0.65 },
  severityBar: { width: 4, minHeight: 100 },
  alertContent: { flex: 1, padding: 12, gap: 8 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leakIconCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  alertTitleBlock: { flex: 1 },
  alertTitle: { fontFamily: Fonts.sans, fontWeight: '700', fontSize: 14, color: Colors.textPrimary },
  alertInvoiceNo: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  severityBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  severityText: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leakAmountLabel: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted },
  leakAmount: { fontFamily: Fonts.mono, fontSize: 20, fontWeight: '800' },
  rootCause: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  rejectText: { fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700', color: '#EF4444' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 7 },
  approveBtnText: { fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700', color: '#080C08' },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  resolvedApproved: { borderColor: 'rgba(34,197,94,0.35)', backgroundColor: 'rgba(34,197,94,0.1)' },
  resolvedRejected: { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.05)' },
  resolvedText: { fontFamily: Fonts.mono, fontSize: 11, fontWeight: '700' },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  resendText: { fontFamily: Fonts.mono, fontSize: 11, color: '#22C55E', fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: Fonts.mono, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});
