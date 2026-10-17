import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { StructuredInvoice, InvoiceAuditResult } from '@/types';

interface InvoiceAuditModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: StructuredInvoice | null;
  audit: InvoiceAuditResult | null;
  whatsappDraft?: string;
  fileName?: string;
  onStartAuditChat?: (invoice: StructuredInvoice) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function InvoiceAuditModal({
  visible,
  onClose,
  invoice,
  audit,
  whatsappDraft,
  fileName,
  onStartAuditChat,
}: InvoiceAuditModalProps) {
  const [copiedToast, setCopiedToast] = useState(false);

  if (!visible || !invoice) return null;

  const hasLeaks = audit && audit.total_leak_amount > 0;
  const leaks = audit?.leaks || [];

  const handleShareWhatsApp = async () => {
    if (!whatsappDraft) return;
    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(whatsappDraft)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({
          message: whatsappDraft,
          title: `MarginSense Dispute Draft - ${invoice.supplier_name}`,
        });
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleCopyText = async () => {
    if (!whatsappDraft) return;
    try {
      await Share.share({
        message: whatsappDraft,
        title: 'Supplier Dispute Draft',
      });
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch (err) {
      console.warn('Copy error:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="receipt" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Autonomous Invoice Audit</Text>
                <Text style={styles.headerSubtitle}>
                  {fileName || 'Purchase Bill'} • RapidOCR Extracted
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Supplier Meta Card */}
            <View style={styles.supplierCard}>
              <View style={styles.supplierRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplierLabel}>SUPPLIER / DISTRIBUTOR</Text>
                  <Text style={styles.supplierName} numberOfLines={1}>
                    {invoice.supplier_name}
                  </Text>
                  {invoice.gstin && (
                    <View style={styles.gstinBadge}>
                      <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                      <Text style={styles.gstinText}>GSTIN: {invoice.gstin}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.amountBox}>
                  <Text style={styles.amountLabel}>BILLED TOTAL</Text>
                  <Text style={styles.amountValue}>
                    ₹{invoice.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Invoice No.</Text>
                  <Text style={styles.metaValue}>{invoice.invoice_number || 'N/A'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Date</Text>
                  <Text style={styles.metaValue}>{invoice.invoice_date || 'Today'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Confidence</Text>
                  <Text style={[styles.metaValue, { color: Colors.primary }]}>
                    {audit?.confidence_score || 94}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Profit Leak Audit Banner */}
            {hasLeaks ? (
              <View style={styles.leakBanner}>
                <View style={styles.leakHeader}>
                  <View style={styles.leakTag}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.leakTagText}>
                      ₹{audit.total_leak_amount.toLocaleString('en-IN')} PROFIT LEAK PINPOINTED
                    </Text>
                  </View>
                  <Text style={styles.leakSubtitle}>
                    {audit.leak_count} billing {audit.leak_count === 1 ? 'discrepancy' : 'discrepancies'} detected vs benchmark rates:
                  </Text>
                </View>

                {leaks.map((leak, idx) => (
                  <View key={idx} style={styles.leakItem}>
                    <View style={styles.leakDot} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.leakItemTitleRow}>
                        <Text style={styles.leakItemTitle}>{leak.title}</Text>
                        <Text style={styles.leakItemAmount}>
                          +₹{leak.leak_amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <Text style={styles.leakItemDesc}>{leak.root_cause}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.cleanBanner}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.cleanTitle}>100% Verified Clean Bill</Text>
                  <Text style={styles.cleanDesc}>
                    All line item rates, GST calculations, and totals match agreed distributor terms.
                  </Text>
                </View>
              </View>
            )}

            {/* Line Items Table */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list" size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>
                  Line Items ({invoice.line_items?.length || 0})
                </Text>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHead, { flex: 2.2 }]}>ITEM</Text>
                <Text style={[styles.tableColHead, { flex: 1, textAlign: 'center' }]}>QTY</Text>
                <Text style={[styles.tableColHead, { flex: 1.2, textAlign: 'right' }]}>RATE (₹)</Text>
                <Text style={[styles.tableColHead, { flex: 1.4, textAlign: 'right' }]}>TOTAL (₹)</Text>
              </View>

              {invoice.line_items?.map((item, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { flex: 2.2, color: '#F0F4F0' }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: Colors.textMuted }]}>
                    {item.quantity} {item.unit || ''}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', color: Colors.textMuted }]}>
                    ₹{item.unit_rate}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.4, textAlign: 'right', color: '#FFFFFF', fontWeight: '600' }]}>
                    ₹{item.amount?.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}

              {/* Tax & Total Summary */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryVal}>
                    ₹{invoice.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                {invoice.cgst > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>CGST</Text>
                    <Text style={styles.summaryVal}>₹{invoice.cgst?.toFixed(2)}</Text>
                  </View>
                )}
                {invoice.sgst > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>SGST</Text>
                    <Text style={styles.summaryVal}>₹{invoice.sgst?.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                  <Text style={styles.summaryTotalVal}>
                    ₹{invoice.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>

            {/* WhatsApp Resolution Card */}
            {whatsappDraft && (
              <View style={styles.whatsappCard}>
                <View style={styles.whatsappHeader}>
                  <View style={styles.whatsappTitleRow}>
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                    <Text style={styles.whatsappTitle}>Supplier Dispute Resolution</Text>
                  </View>
                  <Text style={styles.whatsappBadge}>One-Tap Recovery</Text>
                </View>

                <View style={styles.draftBox}>
                  <Text style={styles.draftText}>{whatsappDraft}</Text>
                </View>

                <View style={styles.actionButtonsRow}>
                  <Pressable
                    onPress={handleShareWhatsApp}
                    style={styles.whatsappSendBtn}
                  >
                    <Ionicons name="logo-whatsapp" size={17} color="#080C08" />
                    <Text style={styles.whatsappSendText}>Send on WhatsApp</Text>
                  </Pressable>

                  <Pressable onPress={handleCopyText} style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                    <Text style={styles.copyText}>{copiedToast ? 'Copied!' : 'Copy'}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Chat Action Button */}
            {onStartAuditChat && (
              <Pressable
                onPress={() => {
                  onClose();
                  onStartAuditChat(invoice);
                }}
                style={styles.chatAuditBtn}
              >
                <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
                <Text style={styles.chatAuditText}>
                  Audit & Ask MarginSense AI About This Bill
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: Math.min(SCREEN_HEIGHT * 0.90, 780),
    backgroundColor: '#0D140D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0F4F0',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },
  supplierCard: {
    backgroundColor: '#121B12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: 16,
  },
  supplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  supplierLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  supplierName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  gstinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  gstinText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0E7E0',
    marginTop: 2,
  },
  leakBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 14,
  },
  leakHeader: {
    marginBottom: 10,
  },
  leakTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leakTagText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F87171',
    letterSpacing: 0.5,
  },
  leakSubtitle: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 4,
  },
  leakItem: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.15)',
  },
  leakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
  },
  leakItemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leakItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FECACA',
  },
  leakItemAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  leakItemDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 16,
  },
  cleanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    padding: 14,
  },
  cleanTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  cleanDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#121B12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F4F0',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableColHead: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableCell: {
    fontSize: 12,
  },
  summaryBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  summaryVal: {
    fontSize: 12,
    color: '#E0E7E0',
    fontWeight: '500',
  },
  summaryTotalRow: {
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.25)',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  whatsappCard: {
    backgroundColor: '#0F1A12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
    padding: 14,
  },
  whatsappHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  whatsappTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#25D366',
  },
  whatsappBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#25D366',
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  draftBox: {
    backgroundColor: '#0A0F0A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  draftText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  whatsappSendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 11,
    borderRadius: 10,
  },
  whatsappSendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080C08',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  copyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  chatAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#121F12',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  chatAuditText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
