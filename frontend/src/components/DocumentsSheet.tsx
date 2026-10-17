import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentItem } from '@/types';
import { Colors, Fonts } from '@/constants/theme';
import { DocumentRow } from './DocumentRow';

interface DocumentsSheetProps {
  visible: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  selectedDocument: DocumentItem | null;
  selectedDocuments?: DocumentItem[];
  onSelectDocument: (doc: DocumentItem | null) => void;
  onToggleSelectDocument?: (doc: DocumentItem) => void;
  onSelectAllDocuments?: () => void;
  onClearDocumentSelection?: () => void;
  onUploadPress: () => void;
  onUploadImagesPress?: () => void;
  onSnapCameraPress?: () => void;
  onImportSharePress?: () => void;
  onOpenInvoiceAudit?: (doc: DocumentItem) => void;
  isUploading: boolean;
  uploadProgress: number;
  uploadingDocName: string | null;
  onAnalyzeRelatedness?: (docIds?: string[]) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 660);

export function DocumentsSheet({
  visible,
  onClose,
  documents,
  selectedDocument,
  selectedDocuments = [],
  onSelectDocument,
  onToggleSelectDocument,
  onSelectAllDocuments,
  onClearDocumentSelection,
  onUploadPress,
  onUploadImagesPress,
  onSnapCameraPress,
  onImportSharePress,
  onOpenInvoiceAudit,
  isUploading,
  uploadProgress,
  uploadingDocName,
  onAnalyzeRelatedness,
}: DocumentsSheetProps) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const selectedCount = selectedDocuments.length;
  const isMultiSelection = selectedCount > 1;

  const handleDocumentTap = (doc: DocumentItem) => {
    if (onToggleSelectDocument) {
      onToggleSelectDocument(doc);
    } else {
      if (selectedDocument?.id === doc.id) {
        onSelectDocument(null);
      } else {
        onSelectDocument(doc);
      }
    }
  };

  const handleRelatednessClick = () => {
    if (!onAnalyzeRelatedness) return;
    onClose();
    if (selectedCount >= 2) {
      onAnalyzeRelatedness(selectedDocuments.map((d) => d.id));
    } else {
      onAnalyzeRelatedness();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.grabHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="receipt-outline" size={18} color={Colors.primaryCyan} />
              <Text style={styles.headerTitle}>Invoice Vault</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{documents.length}</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeButton}
              accessibilityLabel="Close documents drawer"
            >
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Upload Area: Dual multi-format actions */}
            {/* Camera Snap Hero & Dual Import Cards */}
            <View style={styles.uploadCardsContainer}>
              {/* Primary: Camera Snap for Physical Purchase Bills */}
              {onSnapCameraPress && (
                <Pressable
                  onPress={onSnapCameraPress}
                  disabled={isUploading}
                  style={({ pressed }) => [
                    styles.cameraHeroCard,
                    pressed && styles.uploadAreaPressed,
                    isUploading && styles.uploadAreaDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Snap purchase bill with camera"
                >
                  <View style={styles.cameraHeroIcon}>
                    <Ionicons name="camera" size={24} color="#080C08" />
                  </View>
                  <View style={styles.cameraHeroText}>
                    <View style={styles.cameraTitleRow}>
                      <Text style={styles.cameraHeroTitle}>Snap Bill with Camera</Text>
                      <View style={styles.instantBadge}>
                        <Text style={styles.instantBadgeText}>Instant RapidOCR</Text>
                      </View>
                    </View>
                    <Text style={styles.cameraHeroSubtitle}>
                      Snap physical shop purchase bill • Auto-detect profit leaks in ₹ INR
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* Secondary: Import WhatsApp / Gmail Bill */}
              <View style={styles.dualImportRow}>
                <Pressable
                  onPress={onImportSharePress || onUploadPress}
                  disabled={isUploading}
                  style={({ pressed }) => [
                    styles.shareImportCard,
                    pressed && styles.uploadAreaPressed,
                    isUploading && styles.uploadAreaDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Import from WhatsApp or Gmail"
                >
                  <View style={styles.shareIconCircle}>
                    <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareCardTitle}>WhatsApp / Gmail</Text>
                    <Text style={styles.shareCardSub}>Import shared PDF / photo</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={onUploadPress}
                  disabled={isUploading}
                  style={({ pressed }) => [
                    styles.fileImportCard,
                    pressed && styles.uploadAreaPressed,
                    isUploading && styles.uploadAreaDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Upload file from device"
                >
                  <View style={styles.fileIconCircle}>
                    <Ionicons name="document-attach" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileCardTitle}>Browse Files</Text>
                    <Text style={styles.fileCardSub}>PDF • Image • Excel</Text>
                  </View>
                </Pressable>
              </View>

              {onUploadImagesPress && (
                <Pressable
                  onPress={onUploadImagesPress}
                  disabled={isUploading}
                  style={({ pressed }) => [
                    styles.uploadAreaPhoto,
                    pressed && styles.uploadAreaPressed,
                    isUploading && styles.uploadAreaDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Upload photos with multi-select"
                >
                  <View style={styles.uploadIconContainerPhoto}>
                    <Ionicons name="images" size={18} color="#4ADE80" />
                  </View>
                  <View style={styles.uploadTextContainer}>
                    <Text style={styles.uploadTitlePhoto}>+ Multi-Select Scans from Gallery</Text>
                    <Text style={styles.uploadSubtitle}>Batch import bill photos</Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Check Document Relatedness Action Card */}
            {documents.length >= 2 && onAnalyzeRelatedness && (
              <Pressable
                onPress={handleRelatednessClick}
                style={({ pressed }) => [
                  styles.relatednessCard,
                  selectedCount >= 2 && styles.relatednessCardHighlight,
                  pressed && styles.relatednessCardPressed,
                ]}
              >
                <View style={styles.relatednessLeft}>
                  <View
                    style={[
                      styles.relatednessIconCircle,
                      selectedCount >= 2 && styles.relatednessIconCircleHighlight,
                    ]}
                  >
                    <Ionicons name="git-network-outline" size={17} color={Colors.primaryCyan} />
                  </View>
                  <View style={styles.relatednessTexts}>
                    <Text style={styles.relatednessTitle}>
                      {selectedCount >= 2
                        ? `Check Relatedness of ${selectedCount} Selected Docs`
                        : 'Check Document Relatedness'}
                    </Text>
                    <Text style={styles.relatednessSubtitle}>
                      {selectedCount >= 2
                        ? `Correlate specifically the ${selectedCount} chosen files`
                        : `Select 2+ files below or compare all ${documents.length} files`}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.primaryCyan} />
              </Pressable>
            )}

            {/* Active upload banner if uploading */}
            {isUploading && (
              <View style={styles.uploadingCard}>
                <View style={styles.uploadingHeader}>
                  <Text style={styles.uploadingName} numberOfLines={1}>
                    {uploadingDocName || 'document.pdf'}
                  </Text>
                  <Text style={styles.uploadingStatus}>
                    {uploadProgress < 40
                      ? 'Uploading...'
                      : uploadProgress < 75
                      ? 'OCR Extraction...'
                      : 'Indexing Chunks...'}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>

                <View style={styles.progressMeta}>
                  <Text style={styles.asciiProgress}>
                    {'█'.repeat(Math.round(uploadProgress / 10))}
                    {'░'.repeat(10 - Math.min(10, Math.round(uploadProgress / 10)))}
                  </Text>
                  <Text style={styles.percentText}>{uploadProgress}%</Text>
                </View>
              </View>
            )}

            {/* Active Context Banner */}
            {selectedCount > 0 && (
              <View style={styles.filterBanner}>
                <View style={styles.filterBannerLeft}>
                  <Ionicons name="layers-outline" size={15} color={Colors.primaryCyan} />
                  <Text style={styles.filterBannerText} numberOfLines={1}>
                    {selectedCount === 1
                      ? `Context: ${selectedDocuments[0]?.name}`
                      : `Active Context: ${selectedCount} Documents Selected`}
                  </Text>
                </View>
                <Pressable
                  onPress={onClearDocumentSelection || (() => onSelectDocument(null))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearFilterText}>Clear Selection</Text>
                </Pressable>
              </View>
            )}

            {/* Document List Header with Multi-Select Controls */}
            <View style={styles.listSection}>
              <View style={styles.corpusHeaderRow}>
                <Text style={styles.sectionHeader}>
                  INDEXED CORPUS ({documents.length})
                </Text>
                <View style={styles.selectionControls}>
                  {onSelectAllDocuments && (
                    <Pressable
                      onPress={onSelectAllDocuments}
                      hitSlop={6}
                      style={({ pressed }) => [styles.ctrlBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.ctrlText}>Select All</Text>
                    </Pressable>
                  )}
                  {selectedCount > 0 && onClearDocumentSelection && (
                    <>
                      <Text style={styles.ctrlDivider}>•</Text>
                      <Pressable
                        onPress={onClearDocumentSelection}
                        hitSlop={6}
                        style={({ pressed }) => [styles.ctrlBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.ctrlTextMuted}>Deselect</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>

              {/* Instructions Pill */}
              <View style={styles.multiSelectHint}>
                <Ionicons name="checkbox-outline" size={12} color={Colors.primaryCyan} />
                <Text style={styles.multiSelectHintText}>
                  Tap any document to select multiple files for correlation or chat
                </Text>
              </View>

              {/* Document Rows */}
              {documents.map((doc) => {
                const isSelected = selectedDocuments.length > 0
                  ? selectedDocuments.some((d) => d.id === doc.id)
                  : selectedDocument?.id === doc.id;

                return (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    isSelected={isSelected}
                    onSelect={handleDocumentTap}
                    onOpenAudit={onOpenInvoiceAudit}
                  />
                );
              })}
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions Bar when documents are selected */}
          {selectedCount >= 1 && (
            <View style={styles.bottomActionBar}>
              {selectedCount >= 2 && onAnalyzeRelatedness && (
                <Pressable
                  onPress={handleRelatednessClick}
                  style={({ pressed }) => [
                    styles.bottomRelatedBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="git-network" size={15} color="#0B101B" />
                  <Text style={styles.bottomRelatedBtnText}>
                    Relatedness ({selectedCount})
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  selectedCount >= 2 ? styles.bottomChatBtn : styles.bottomChatBtnFull,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={15}
                  color={selectedCount >= 2 ? Colors.primaryCyan : '#0B101B'}
                />
                <Text
                  style={
                    selectedCount >= 2
                      ? styles.bottomChatBtnText
                      : styles.bottomChatBtnTextFull
                  }
                >
                  {selectedCount >= 2
                    ? `Chat with ${selectedCount} Docs`
                    : `Chat with ${selectedDocuments[0]?.name.slice(0, 24)}...`}
                </Text>
              </Pressable>
            </View>
          )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    height: SHEET_HEIGHT,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    flex: 1,
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 12,
  },
  uploadCardsContainer: {
    gap: 8,
  },
  uploadArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(22, 163, 74, 0.4)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  uploadAreaPhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.04)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  uploadAreaPressed: {
    opacity: 0.75,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  uploadAreaDisabled: {
    opacity: 0.5,
  },
  uploadIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextContainer: {
    flex: 1,
    gap: 2,
  },
  uploadTitle: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadTitlePhoto: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  uploadSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  relatednessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    padding: 12,
  },
  relatednessCardHighlight: {
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    borderColor: Colors.secondary,
  },
  relatednessCardPressed: {
    backgroundColor: '#F1F5F9',
  },
  relatednessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  relatednessIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatednessIconCircleHighlight: {
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  relatednessTexts: {
    gap: 2,
    flex: 1,
  },
  relatednessTitle: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  relatednessSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  uploadingCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  uploadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadingName: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
  },
  uploadingStatus: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.primary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  asciiProgress: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  percentText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  filterBannerText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.primaryCyan,
    fontWeight: '600',
    flex: 1,
  },
  clearFilterText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  listSection: {
    gap: 8,
    marginTop: 4,
  },
  corpusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  selectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctrlBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  ctrlText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.primaryCyan,
    fontWeight: '600',
  },
  ctrlTextMuted: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
  },
  ctrlDivider: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  multiSelectHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  multiSelectHintText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0E1524',
  },
  bottomRelatedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryCyan,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bottomRelatedBtnText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: '#0B101B',
  },
  bottomChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  bottomChatBtnText: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.primaryCyan,
  },
  bottomChatBtnFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryCyan,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bottomChatBtnTextFull: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: '#0B101B',
  },
  pressed: {
    opacity: 0.7,
  },
  cameraHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  cameraHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraHeroText: {
    flex: 1,
  },
  cameraTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraHeroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instantBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  instantBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  cameraHeroSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  dualImportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  shareImportCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101A10',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  shareIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E0E7E0',
  },
  shareCardSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  fileImportCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101A10',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  fileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E0E7E0',
  },
  fileCardSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
