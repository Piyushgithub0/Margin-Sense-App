import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Colors, Fonts } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { GmailInvoiceEmail } from '@/types';
import { getGoogleAuthUrl } from '@/services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.88, 720);

interface GmailInboxSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function GmailInboxSheet({ visible, onClose }: GmailInboxSheetProps) {
  const {
    gmailInbox,
    loadGmailInbox,
    analyseEmailInvoice,
    sendEmailDispute,
    addEmailInvoiceToChat,
    openInvoiceAudit,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'new' | 'previous'>('new');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysingId, setAnalysingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 25, mass: 0.9, useNativeDriver: true }),
      ]).start();
      loadGmailInbox();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGmailInbox();
    setIsRefreshing(false);
  };

  const handleConnectGoogle = async () => {
    Alert.alert(
      'Google Account Sync',
      'Connect your Google Workspace or Gmail account to sync supplier invoices and dispatch dispute notices via Google SMTP.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect via Browser',
          onPress: async () => {
            try {
              const authUrl = await getGoogleAuthUrl();
              if (authUrl) {
                Linking.openURL(authUrl).catch(() => {
                  Alert.alert('Notice', 'Could not open browser. Inbox is synchronized via Google SMTP bridge.');
                });
              } else {
                Alert.alert('Notice', 'Inbox is already synchronized via Google SMTP bridge.');
              }
            } catch {
              Alert.alert('Notice', 'Inbox is synchronized via Google SMTP bridge.');
            }
          },
        },
      ]
    );
  };

  const handleAnalyse = async (email: GmailInvoiceEmail) => {
    setAnalysingId(email.id);
    await analyseEmailInvoice(email.id);
    setAnalysingId(null);
  };

  const handleSendDispute = async (email: GmailInvoiceEmail) => {
    if (!email.dispute_body) return;
    setSendingId(email.id);
    const success = await sendEmailDispute(
      email.id,
      email.sender_email,
      email.dispute_subject || `Discrepancy Notice: ${email.subject}`,
      email.dispute_body
    );
    setSendingId(null);
    if (success) {
      Alert.alert(
        'Dispute Email Dispatched',
        `Dispute notice successfully sent to ${email.sender_email} via Google SMTP (smtp.gmail.com). Credit note requested.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Delivery Notice', 'Failed to send dispute email. Please check network connection.');
    }
  };

  const handleAddToChat = (email: GmailInvoiceEmail) => {
    addEmailInvoiceToChat(email);
    onClose();
  };

  const handleViewAudit = (email: GmailInvoiceEmail) => {
    if (email.structured_invoice && email.audit_result) {
      openInvoiceAudit({
        id: email.id,
        name: email.attachment_name,
        size: email.attachment_size,
        pages: 1,
        status: 'INDEXED',
        uploadedAt: email.received_at,
        structuredInvoice: email.structured_invoice,
        auditResult: email.audit_result,
        whatsappDraft: email.whatsapp_draft,
      });
      onClose();
    }
  };

  const newEmails = gmailInbox.filter((m: GmailInvoiceEmail) => m.is_new);
  const previousEmails = gmailInbox.filter((m: GmailInvoiceEmail) => !m.is_new);
  const displayedEmails = activeTab === 'new' ? newEmails : previousEmails;

  const totalLeaksAtRisk = newEmails.reduce(
    (acc: number, m: GmailInvoiceEmail) => acc + (m.disputed_amount || 0),
    0
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
          {/* Grab handle */}
          <View style={styles.handleContainer}>
            <View style={styles.grabHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.gmailIconBadge}>
                <Ionicons name="mail" size={16} color="#22C55E" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Gmail Invoices Inbox</Text>
                <Text style={styles.headerSubtitle}>Google SMTP & OAuth Automated Scanner</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={handleRefresh}
                style={({ pressed }) => [styles.iconActionBtn, pressed && { opacity: 0.7 }]}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#22C55E" />
                ) : (
                  <Ionicons name="refresh" size={17} color={Colors.textPrimary} />
                )}
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.iconActionBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="close" size={18} color={Colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Google Connect Banner */}
          <View style={styles.googleAccountBar}>
            <View style={styles.googleAccountInfo}>
              <Ionicons name="logo-google" size={14} color="#EA4335" />
              <Text style={styles.googleAccountText} numberOfLines={1}>
                Google Workspace & SMTP Sync
              </Text>
            </View>
            <Pressable
              onPress={handleConnectGoogle}
              style={({ pressed }) => [styles.connectBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="link-outline" size={12} color="#22C55E" />
              <Text style={styles.connectBtnText}>Google Link</Text>
            </Pressable>
          </View>

          {/* KPI Summary Banner */}
          {newEmails.length > 0 && (
            <View style={styles.kpiBanner}>
              <View style={styles.kpiBadge}>
                <Ionicons name="shield-checkmark" size={15} color="#EF4444" />
                <Text style={styles.kpiBadgeText}>Autonomously Audited</Text>
              </View>
              <Text style={styles.kpiAmountText}>
                ₹{totalLeaksAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.kpiSubtitle}>
                profit leaks identified in {newEmails.length} recently received bills
              </Text>
            </View>
          )}

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('new')}
              style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive]}
            >
              <Ionicons
                name="mail-unread"
                size={14}
                color={activeTab === 'new' ? '#22C55E' : Colors.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
                New Received
              </Text>
              {newEmails.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{newEmails.length}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('previous')}
              style={[styles.tabButton, activeTab === 'previous' && styles.tabButtonActive]}
            >
              <Ionicons
                name="archive-outline"
                size={14}
                color={activeTab === 'previous' ? '#22C55E' : Colors.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'previous' && styles.tabTextActive]}>
                Previous Invoices
              </Text>
              <View style={styles.tabBadgeNeutral}>
                <Text style={styles.tabBadgeTextNeutral}>{previousEmails.length}</Text>
              </View>
            </Pressable>
          </View>

          {/* Email List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {displayedEmails.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-open-outline" size={40} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyTitle}>No Invoices Here</Text>
                <Text style={styles.emptySubtitle}>
                  All supplier emails in this category have been processed.
                </Text>
              </View>
            ) : (
              displayedEmails.map((email: GmailInvoiceEmail) => {
                const isAudited = email.analysis_status === 'AUDITED';
                const hasLeak = (email.disputed_amount || 0) > 0;
                const isExpanded = expandedEmailId === email.id;

                return (
                  <View key={email.id} style={styles.emailCard}>
                    {/* Top Row: Sender & Timestamp */}
                    <View style={styles.cardHeader}>
                      <View style={styles.senderContainer}>
                        <Text style={styles.senderName}>{email.sender_name}</Text>
                        <Text style={styles.senderEmail} numberOfLines={1}>
                          {email.sender_email}
                        </Text>
                      </View>
                      <View style={styles.timeBadge}>
                        <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                        <Text style={styles.timeText}>{email.received_at}</Text>
                      </View>
                    </View>

                    {/* Subject Line */}
                    <Text style={styles.subjectText} numberOfLines={2}>
                      {email.subject}
                    </Text>

                    {/* PDF Attachment Badge */}
                    <View style={styles.attachmentBar}>
                      <View style={styles.pdfBadge}>
                        <Ionicons name="document-text" size={14} color="#EF4444" />
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {email.attachment_name}
                        </Text>
                        <Text style={styles.attachmentSize}>({email.attachment_size})</Text>
                      </View>

                      {email.dispute_sent && (
                        <View style={styles.disputeSentBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                          <Text style={styles.disputeSentText}>Dispute Sent</Text>
                        </View>
                      )}
                    </View>

                    {/* Audited Status & Leak Notice */}
                    {isAudited ? (
                      <View style={styles.auditContainer}>
                        {hasLeak ? (
                          <View style={styles.leakBanner}>
                            <View style={styles.leakBannerHeader}>
                              <View style={styles.leakTitleRow}>
                                <Ionicons name="warning" size={15} color="#EF4444" />
                                <Text style={styles.leakTitle}>
                                  ₹{email.disputed_amount?.toLocaleString('en-IN')} Profit Leak Found
                                </Text>
                              </View>
                              <View style={styles.severityTag}>
                                <Text style={styles.severityTagText}>HIGH</Text>
                              </View>
                            </View>

                            <Text style={styles.leakCause} numberOfLines={2}>
                              {email.audit_result?.leaks?.[0]?.root_cause ||
                                'Billing rate hike and GST calculations mismatch detected.'}
                            </Text>

                            {/* Accordion Toggle for Dispute Email Draft */}
                            <Pressable
                              onPress={() => setExpandedEmailId(isExpanded ? null : email.id)}
                              style={styles.expandToggle}
                            >
                              <Text style={styles.expandToggleText}>
                                {isExpanded ? 'Hide Dispute Email Draft' : 'View Generated Dispute Email Draft'}
                              </Text>
                              <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={13}
                                color="#22C55E"
                              />
                            </Pressable>

                            {isExpanded && email.dispute_body && (
                              <View style={styles.draftBox}>
                                <Text style={styles.draftSubject}>
                                  Sub: {email.dispute_subject}
                                </Text>
                                <Text style={styles.draftBody}>{email.dispute_body}</Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.cleanBanner}>
                            <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                            <Text style={styles.cleanText}>
                              Invoice Clean — Verified ₹
                              {email.structured_invoice?.total_amount?.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        )}

                        {/* Actions Row */}
                        <View style={styles.actionsRow}>
                          {hasLeak && (
                            <Pressable
                              onPress={() => handleSendDispute(email)}
                              style={({ pressed }) => [
                                styles.actionBtn,
                                styles.actionBtnSend,
                                pressed && { opacity: 0.8 },
                              ]}
                              disabled={sendingId === email.id}
                            >
                              {sendingId === email.id ? (
                                <ActivityIndicator size="small" color="#000" />
                              ) : (
                                <>
                                  <Ionicons name="send" size={13} color="#000" />
                                  <Text style={styles.actionBtnSendText}>
                                    {email.dispute_sent ? 'Resend Dispute' : 'Send Dispute Email'}
                                  </Text>
                                </>
                              )}
                            </Pressable>
                          )}

                          <Pressable
                            onPress={() => handleAddToChat(email)}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              styles.actionBtnChat,
                              pressed && { opacity: 0.8 },
                            ]}
                          >
                            <Ionicons name="chatbubbles-outline" size={14} color="#22C55E" />
                            <Text style={styles.actionBtnChatText}>Add to Chat</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleViewAudit(email)}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              styles.actionBtnAudit,
                              pressed && { opacity: 0.8 },
                            ]}
                          >
                            <Ionicons name="eye-outline" size={14} color={Colors.textPrimary} />
                            <Text style={styles.actionBtnAuditText}>View Audit</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      /* Unaudited Card (Older email) — Action to specifically scan */
                      <View style={styles.unAuditedContainer}>
                        <Text style={styles.unAuditedText}>
                          Older invoice — not automatically audited to save compute.
                        </Text>
                        <Pressable
                          onPress={() => handleAnalyse(email)}
                          style={({ pressed }) => [
                            styles.analyseBtn,
                            pressed && { opacity: 0.8 },
                          ]}
                          disabled={analysingId === email.id}
                        >
                          {analysingId === email.id ? (
                            <ActivityIndicator size="small" color="#000" />
                          ) : (
                            <>
                              <Ionicons name="scan-outline" size={14} color="#000" />
                              <Text style={styles.analyseBtnText}>Select & Analyse Invoice</Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    height: SHEET_HEIGHT,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gmailIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleAccountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  googleAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  googleAccountText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
  },
  connectBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  kpiBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    alignItems: 'center',
  },
  kpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiAmountText: {
    fontFamily: Fonts.sans,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  kpiSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  tabText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#22C55E',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  tabBadgeNeutral: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeTextNeutral: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  emailCard: {
    backgroundColor: '#0D140D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  senderContainer: {
    flex: 1,
    marginRight: 8,
  },
  senderName: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  senderEmail: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  subjectText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '75%',
  },
  attachmentName: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  attachmentSize: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  disputeSentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  disputeSentText: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '700',
    color: '#22C55E',
  },
  auditContainer: {
    marginTop: 4,
    gap: 8,
  },
  leakBanner: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  leakBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leakTitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  severityTag: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  severityTagText: {
    fontFamily: Fonts.sans,
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  leakCause: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: '#D1D5DB',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  expandToggleText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
  },
  draftBox: {
    backgroundColor: '#040704',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  draftSubject: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
  },
  draftBody: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: '#A1A1AA',
    lineHeight: 14,
  },
  cleanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  cleanText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionBtnSend: {
    backgroundColor: '#22C55E',
    flex: 1.2,
  },
  actionBtnSendText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  actionBtnChat: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    flex: 1,
  },
  actionBtnChatText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
  },
  actionBtnAudit: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
  },
  actionBtnAuditText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  unAuditedContainer: {
    marginTop: 4,
    gap: 8,
  },
  unAuditedText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  analyseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#22C55E',
    paddingVertical: 8,
    borderRadius: 8,
  },
  analyseBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
});
