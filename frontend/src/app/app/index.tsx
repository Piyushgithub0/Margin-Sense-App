import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';

const formatDocName = (name?: string) => {
  if (!name) return '';
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { DocuMindLogo } from '@/components/DocuMindLogo';
import { IconButton } from '@/components/IconButton';
import { ChatMessageItem } from '@/components/ChatMessage';
import { LoadingDots } from '@/components/LoadingDots';
import { ChatInput } from '@/components/ChatInput';
import { SourceSheet } from '@/components/SourceSheet';
import { DocumentsSheet } from '@/components/DocumentsSheet';
import { ChatsSheet } from '@/components/ChatsSheet';
import { RelatednessSheet } from '@/components/RelatednessSheet';
import { InvoiceAuditModal } from '@/components/InvoiceAuditModal';
import { LeakAlertsSheet } from '@/components/LeakAlertsSheet';
import { DashboardSheet } from '@/components/DashboardSheet';
import { CitationSource } from '@/types';

export default function MainAppScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const {
    user,
    logout,
    documents,
    selectedDocument,
    selectedDocuments,
    selectedDocumentIds,
    setSelectedDocument,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
    isUploading,
    uploadProgress,
    uploadingDocName,
    pickAndUploadDocument,
    pickAndUploadImages,
    sessions,
    activeSessionId,
    activeSession,
    messages,
    isGenerating,
    sendMessage,
    createNewChat,
    switchSession,
    deleteChat,
    renameChat,
    clearAllChats,
    isDocumentsSheetOpen,
    setIsDocumentsSheetOpen,
    isChatHistorySheetOpen,
    setIsChatHistorySheetOpen,
    relatednessResult,
    isAnalyzingRelatedness,
    isRelatednessSheetOpen,
    setIsRelatednessSheetOpen,
    analyzeRelatedness,
    activeCitationSource,
    activeCitationList,
    isSourceSheetOpen,
    openSourceSheet,
    closeSourceSheet,
    snapInvoiceWithCamera,
    openInvoiceAudit,
    importInvoiceFromUri,
    isInvoiceAuditModalOpen,
    setIsInvoiceAuditModalOpen,
    activeStructuredInvoice,
    activeInvoiceAudit,
    activeWhatsappDraft,
    activeInvoiceFileName,
    leakAlerts,
    isLeakAlertsSheetOpen,
    setIsLeakAlertsSheetOpen,
    approveLeakAlert,
    rejectLeakAlert,
    dashboardKPI,
    isDashboardSheetOpen,
    setIsDashboardSheetOpen,
  } = useApp();

  // Scroll to bottom when messages update or generating
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isGenerating]);

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  const handleCitationPress = (
    citation: CitationSource,
    allCitations?: CitationSource[]
  ) => {
    openSourceSheet(citation, allCitations);
  };

  const currentPrompts =
    selectedDocuments.length > 1
      ? [
          `Compare supplier invoices: ${selectedDocuments[0]?.name.slice(0, 16)} vs ${selectedDocuments[1]?.name.slice(0, 16)}`,
          'What profit leaks were detected across these bills?',
          `Summarize total overcharges across all ${selectedDocuments.length} documents in ₹`,
        ]
      : selectedDocument
      ? [
          `What price creep or overcharges are in ${selectedDocument.name}?`,
          'Identify any GST mismatches or freight overcharges.',
          'Draft a supplier resolution message in Hindi.',
        ]
      : [
          'Where did my margins drop this month?',
          'Show me all unresolved price creep leaks.',
          'Which supplier is causing the most profit loss?',
        ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Main App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <DocuMindLogo size="compact" />
        </View>

        <View style={styles.headerRight}>
          {/* Leak Alerts Bell Button */}
          <IconButton
            onPress={() => setIsLeakAlertsSheetOpen(true)}
            active={isLeakAlertsSheetOpen}
            badgeCount={leakAlerts.filter((a) => a.status === 'PENDING').length || undefined}
            icon={
              <Ionicons
                name="notifications-outline"
                size={17}
                color={
                  isLeakAlertsSheetOpen
                    ? '#F97316'
                    : leakAlerts.some((a) => a.status === 'PENDING')
                    ? '#F97316'
                    : Colors.textPrimary
                }
              />
            }
            accessibilityLabel="Open leak alerts feed"
          />

          {/* Dashboard Button */}
          <IconButton
            onPress={() => setIsDashboardSheetOpen(true)}
            active={isDashboardSheetOpen}
            icon={
              <Ionicons
                name="speedometer-outline"
                size={17}
                color={isDashboardSheetOpen ? Colors.primary : Colors.textPrimary}
              />
            }
            accessibilityLabel="Open dashboard KPI"
          />

          {/* Local Chat History Drawer Button */}
          <IconButton
            onPress={() => setIsChatHistorySheetOpen(true)}
            active={isChatHistorySheetOpen}
            badgeCount={sessions.length > 1 ? sessions.length : undefined}
            icon={
              <Ionicons
                name="chatbubbles-outline"
                size={17}
                color={
                  isChatHistorySheetOpen
                    ? Colors.primaryCyan
                    : Colors.textPrimary
                }
              />
            }
            accessibilityLabel="Open local chat history"
          />

          {/* Cross-Document Correlation / Relatedness Button */}
          <IconButton
            onPress={() => {
              setIsRelatednessSheetOpen(true);
            }}
            active={isRelatednessSheetOpen || (relatednessResult?.is_related ?? false)}
            badgeCount={documents.length >= 2 ? documents.length : undefined}
            icon={
              <Ionicons
                name="git-network-outline"
                size={17}
                color={
                  isRelatednessSheetOpen
                    ? Colors.primaryCyan
                    : documents.length >= 2
                    ? '#4ADE80'
                    : Colors.textPrimary
                }
              />
            }
            accessibilityLabel="Check cross-document relatedness"
          />

          {/* Quick Camera Snap Bill Button */}
          <IconButton
            onPress={snapInvoiceWithCamera}
            icon={
              <Ionicons
                name="camera-outline"
                size={18}
                color={Colors.primary}
              />
            }
            accessibilityLabel="Snap purchase bill with camera"
          />

          {/* Documents Drawer Button */}
          <IconButton
            onPress={() => setIsDocumentsSheetOpen(true)}
            active={isDocumentsSheetOpen || selectedDocuments.length > 0}
            badgeCount={selectedDocuments.length > 0 ? selectedDocuments.length : documents.length}
            icon={
              <Ionicons
                name={selectedDocuments.length > 1 ? "layers-outline" : "folder-outline"}
                size={17}
                color={
                  isDocumentsSheetOpen || selectedDocuments.length > 0
                    ? Colors.primaryCyan
                    : Colors.textPrimary
                }
              />
            }
            accessibilityLabel="Open documents drawer"
          />

          {/* Sources Sheet Button */}
          <IconButton
            onPress={() => {
              if (activeCitationSource) {
                openSourceSheet(activeCitationSource, activeCitationList);
              } else {
                // Find most recent citation if available
                const lastMsgWithCitations = [...messages]
                  .reverse()
                  .find((m) => m.citations && m.citations.length > 0);
                if (lastMsgWithCitations?.citations?.[0]) {
                  openSourceSheet(
                    lastMsgWithCitations.citations[0],
                    lastMsgWithCitations.citations
                  );
                } else {
                  // Fallback demo citation
                  openSourceSheet({
                    id: 'cite-default',
                    index: 1,
                    documentId: 'doc-2',
                    documentName: 'company_policy.pdf',
                    page: 12,
                    snippet:
                      'Refund requests must be submitted within 30 days of initial purchase. All requests require proof of payment and are issued to the original payment method.',
                    relevance: 94,
                  });
                }
              }
            }}
            active={isSourceSheetOpen}
            icon={
              <Ionicons
                name="bookmark-outline"
                size={17}
                color={isSourceSheetOpen ? Colors.primaryCyan : Colors.textPrimary}
              />
            }
            accessibilityLabel="Open sources viewer"
          />

          {/* Logout Button */}
          <IconButton
            onPress={handleLogout}
            icon={
              <Ionicons
                name="log-out-outline"
                size={17}
                color={Colors.textMuted}
              />
            }
            accessibilityLabel="Log out"
          />
        </View>
      </View>

      {/* 2. Active Conversation Subheader Bar */}
      <View style={styles.subHeaderBar}>
        <Pressable
          onPress={() => setIsChatHistorySheetOpen(true)}
          style={({ pressed }) => [
            styles.sessionPill,
            pressed && styles.sessionPillPressed,
          ]}
        >
          <Ionicons name="chatbubble-ellipses" size={13} color={Colors.primaryCyan} />
          <Text style={styles.sessionPillText} numberOfLines={1}>
            {activeSession?.title || 'Current Conversation'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
        </Pressable>

        {/* Multi-document Active Context Pill */}
        {selectedDocuments.length > 0 && (
          <Pressable
            onPress={() => setIsDocumentsSheetOpen(true)}
            style={({ pressed }) => [
              styles.contextIndicatorPill,
              selectedDocuments.length > 1 && styles.contextIndicatorPillMulti,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name={selectedDocuments.length > 1 ? 'layers-outline' : 'document-text-outline'}
              size={12}
              color={Colors.primaryCyan}
            />
            <Text style={styles.contextIndicatorText} numberOfLines={1}>
              {selectedDocuments.length > 1
                ? `${selectedDocuments.length} Docs`
                : formatDocName(selectedDocuments[0].name)}
            </Text>
            <Pressable
              onPress={(e: any) => {
                e.stopPropagation?.();
                clearDocumentSelection();
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close-circle" size={13} color={Colors.textMuted} />
            </Pressable>
          </Pressable>
        )}

        <Pressable
          onPress={() => createNewChat('New Conversation')}
          style={({ pressed }) => [
            styles.newChatPill,
            pressed && styles.newChatPillPressed,
          ]}
        >
          <Ionicons name="add" size={12} color={Colors.primaryCyan} />
          <Text style={styles.newChatPillText}>New</Text>
        </Pressable>
      </View>

      {/* 3. Main Chat Screen with Keyboard Avoidance */}
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.chatContainer}>
          {messages.length === 0 ? (
            /* Empty Chat State with Scrollable Viewport */
            <ScrollView
              style={styles.emptyScrollView}
              contentContainerStyle={styles.emptyContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.emptyIconOutline,
                  selectedDocuments.length > 1 && styles.emptyIconOutlineMulti,
                ]}
              >
                <Ionicons
                  name={
                    selectedDocuments.length > 1
                      ? 'layers-outline'
                      : 'document-text-outline'
                  }
                  size={32}
                  color={
                    selectedDocuments.length > 0
                      ? Colors.primaryCyan
                      : Colors.textMuted
                  }
                />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedDocuments.length > 1
                  ? `Audit Ready\n${selectedDocuments.length} Invoices Selected`
                  : selectedDocument
                  ? `Auditing\n${formatDocName(selectedDocument.name)}`
                  : 'Upload an invoice\nto detect profit leaks'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedDocuments.length > 1
                  ? `Cross-auditing ${selectedDocuments.length} bills • Detects price creep, duplicates, GST mismatches & overcharges.`
                  : selectedDocument
                  ? 'Ask about overcharges, tax mismatches, or draft a supplier message.'
                  : 'Upload a PDF bill or WhatsApp screenshot.\nAll data is stored securely on device.'}
              </Text>

              {/* Multi-document chip preview */}
              {selectedDocuments.length > 1 && (
                <View style={styles.emptyChipsRow}>
                  {selectedDocuments.map((doc) => (
                    <View key={doc.id} style={styles.emptyDocChip}>
                      <Ionicons
                        name="document-text-outline"
                        size={11}
                        color={Colors.primaryCyan}
                      />
                      <Text style={styles.emptyDocChipText} numberOfLines={1}>
                        {formatDocName(doc.name)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.emptyActionRow}>
                <Pressable
                  onPress={snapInvoiceWithCamera}
                  style={styles.emptySnapButton}
                >
                  <Ionicons name="camera" size={17} color="#080C08" />
                  <Text style={styles.emptySnapText}>Snap Bill with Camera</Text>
                </Pressable>

                <Pressable
                  onPress={() => setIsDocumentsSheetOpen(true)}
                  style={styles.emptyUploadButton}
                >
                  <Text style={styles.emptyUploadText}>
                    {selectedDocuments.length > 1
                      ? `Invoices (${selectedDocuments.length})`
                      : selectedDocument
                      ? 'Switch Bill'
                      : '+ Invoice Vault'}
                  </Text>
                </Pressable>
              </View>

              {/* Suggested Prompts */}
              <View style={styles.suggestedPromptsContainer}>
                <Text style={styles.suggestedHeader}>
                  {selectedDocuments.length > 1
                    ? 'SUGGESTED AUDIT QUERIES'
                    : 'SUGGESTED QUERIES'}
                </Text>
                {currentPrompts.map((prompt, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => sendMessage(prompt)}
                    style={({ pressed }) => [
                      styles.promptChip,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.promptChipText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            /* Message Feed */
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatMessageItem
                  message={item}
                  onCitationPress={handleCitationPress}
                />
              )}
              contentContainerStyle={styles.messageList}
              ListFooterComponent={
                isGenerating ? (
                  <View style={styles.loadingContainer}>
                    <LoadingDots />
                  </View>
                ) : null
              }
            />
          )}

          {/* 11 & 12. Floating Chat Input Bar */}
          <ChatInput
            onSend={sendMessage}
            disabled={isGenerating}
            selectedDocument={selectedDocument}
            selectedDocuments={selectedDocuments}
            onClearContext={clearDocumentSelection}
            onRemoveDocument={toggleDocumentSelection}
            onOpenDocumentsSheet={() => setIsDocumentsSheetOpen(true)}
            onSnapCameraPress={snapInvoiceWithCamera}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Local Chat History Bottom Sheet */}
      <ChatsSheet
        visible={isChatHistorySheetOpen}
        onClose={() => setIsChatHistorySheetOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={switchSession}
        onNewChat={() => createNewChat('New Conversation')}
        onDeleteSession={deleteChat}
        onRenameSession={renameChat}
        onClearAllChats={clearAllChats}
      />

      {/* Sources Bottom Sheet */}
      <SourceSheet
        visible={isSourceSheetOpen}
        onClose={closeSourceSheet}
        activeSource={activeCitationSource}
        sourcesList={activeCitationList}
        onSelectSource={(src) => openSourceSheet(src, activeCitationList)}
      />

      {/* Documents Bottom Sheet */}
      <DocumentsSheet
        visible={isDocumentsSheetOpen}
        onClose={() => setIsDocumentsSheetOpen(false)}
        documents={documents}
        selectedDocument={selectedDocument}
        selectedDocuments={selectedDocuments}
        onSelectDocument={setSelectedDocument}
        onToggleSelectDocument={toggleDocumentSelection}
        onSelectAllDocuments={selectAllDocuments}
        onClearDocumentSelection={clearDocumentSelection}
        onUploadPress={pickAndUploadDocument}
        onUploadImagesPress={pickAndUploadImages}
        onSnapCameraPress={snapInvoiceWithCamera}
        onImportSharePress={pickAndUploadDocument}
        onOpenInvoiceAudit={openInvoiceAudit}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadingDocName={uploadingDocName}
        onAnalyzeRelatedness={(docIds) => {
          analyzeRelatedness(docIds);
          setIsRelatednessSheetOpen(true);
        }}
      />

      {/* Cross-Document Correlation & Relatedness Sheet */}
      <RelatednessSheet
        visible={isRelatednessSheetOpen}
        onClose={() => setIsRelatednessSheetOpen(false)}
        result={relatednessResult}
        loading={isAnalyzingRelatedness}
        onRefresh={() => analyzeRelatedness()}
        onSelectQueryContext={(prompt) => sendMessage(prompt)}
      />

      {/* Structured Invoice & Leak Audit Modal */}
      <InvoiceAuditModal
        visible={isInvoiceAuditModalOpen}
        onClose={() => setIsInvoiceAuditModalOpen(false)}
        invoice={activeStructuredInvoice}
        audit={activeInvoiceAudit}
        whatsappDraft={activeWhatsappDraft}
        fileName={activeInvoiceFileName}
        onStartAuditChat={(inv) => {
          sendMessage(`Audit summary for ${inv.supplier_name}: What are the exact leaks and root causes identified in bill #${inv.invoice_number}?`);
        }}
      />

      {/* Leak Alerts Feed Sheet */}
      <LeakAlertsSheet
        visible={isLeakAlertsSheetOpen}
        onClose={() => setIsLeakAlertsSheetOpen(false)}
        alerts={leakAlerts}
        onApprove={approveLeakAlert}
        onReject={rejectLeakAlert}
      />

      {/* Dashboard KPI Sheet */}
      <DashboardSheet
        visible={isDashboardSheetOpen}
        onClose={() => setIsDashboardSheetOpen(false)}
        kpi={dashboardKPI}
        invoicesAudited={documents.filter((d) => d.auditResult).length}
        onOpenAlerts={() => setIsLeakAlertsSheetOpen(true)}
        onOpenVault={() => setIsDocumentsSheetOpen(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    height: 56,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    shadowColor: Colors.primaryCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  subHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(8, 20, 8, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.08)',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '80%',
  },
  sessionPillPressed: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  sessionPillText: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  newChatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newChatPillPressed: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  newChatPillText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryCyan,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexGrow: 1,
  },
  loadingContainer: {
    marginVertical: 4,
  },
  emptyScrollView: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  emptyIconOutline: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  emptySnapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptySnapText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    color: '#080C08',
  },
  emptyUploadButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyUploadText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryCyan,
  },
  suggestedPromptsContainer: {
    width: '100%',
    maxWidth: 380,
    gap: 8,
  },
  suggestedHeader: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: 4,
  },
  promptChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptChipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  contextIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 160,
  },
  contextIndicatorPillMulti: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: Colors.borderCyan,
  },
  contextIndicatorText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryCyan,
    flexShrink: 1,
  },
  emptyIconOutlineMulti: {
    borderColor: Colors.borderCyan,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
  },
  emptyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    maxWidth: '92%',
  },
  emptyDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 180,
  },
  emptyDocChipText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
});
