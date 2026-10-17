import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  DocumentItem,
  ChatMessage,
  CitationSource,
  AuthUser,
  ChatSession,
  StructuredInvoice,
  InvoiceAuditResult,
  LeakAlert,
  DashboardKPI,
} from '@/types';
import { INITIAL_DOCUMENTS, INITIAL_MESSAGES, MOCK_KNOWLEDGE_BASE } from '@/data/mockData';
import {
  checkBackendHealth,
  fetchBackendDocuments,
  uploadDocumentToBackend,
  processInvoiceWithOCR,
  sendQueryToBackend,
  performFheSearch,
  checkDocumentsRelatedness,
  DocumentRelatednessResult,
} from '@/services/api';
import {
  getLocalChatSessions,
  saveLocalChatSessions,
  getActiveSessionId,
  saveActiveSessionId,
  getSessionMessages,
  saveSessionMessages,
  deleteLocalChatSession,
  clearAllLocalChats,
} from '@/services/storage';

interface AppContextType {
  // Auth
  user: AuthUser | null;
  login: (email: string) => Promise<boolean>;
  signup: (email: string) => Promise<boolean>;
  logout: () => void;

  // Backend connection
  isBackendConnected: boolean;

  // Documents & Multi-Selection
  documents: DocumentItem[];
  selectedDocument: DocumentItem | null;
  selectedDocuments: DocumentItem[];
  selectedDocumentIds: string[];
  setSelectedDocument: (doc: DocumentItem | null) => void;
  toggleDocumentSelection: (doc: string | DocumentItem) => void;
  selectAllDocuments: () => void;
  clearDocumentSelection: () => void;
  isUploading: boolean;
  uploadProgress: number;
  uploadingDocName: string | null;
  pickAndUploadDocument: () => Promise<void>;
  pickAndUploadImages: () => Promise<void>;
  snapInvoiceWithCamera: () => Promise<void>;
  openInvoiceAudit: (doc: DocumentItem) => void;
  importInvoiceFromUri: (uri: string, name?: string) => Promise<void>;

  // Invoice Audit Modal
  isInvoiceAuditModalOpen: boolean;
  setIsInvoiceAuditModalOpen: (open: boolean) => void;
  activeStructuredInvoice: StructuredInvoice | null;
  setActiveStructuredInvoice: (inv: StructuredInvoice | null) => void;
  activeInvoiceAudit: InvoiceAuditResult | null;
  setActiveInvoiceAudit: (audit: InvoiceAuditResult | null) => void;
  activeWhatsappDraft?: string;
  setActiveWhatsappDraft: (draft?: string) => void;
  activeInvoiceFileName?: string;

  // Leak Alerts Feed
  leakAlerts: LeakAlert[];
  isLeakAlertsSheetOpen: boolean;
  setIsLeakAlertsSheetOpen: (open: boolean) => void;
  approveLeakAlert: (alertId: string) => void;
  rejectLeakAlert: (alertId: string) => void;

  // Dashboard KPI
  dashboardKPI: DashboardKPI;
  isDashboardSheetOpen: boolean;
  setIsDashboardSheetOpen: (open: boolean) => void;

  // Cross-Document Correlation & Relatedness
  relatednessResult: DocumentRelatednessResult | null;
  isAnalyzingRelatedness: boolean;
  isRelatednessSheetOpen: boolean;
  setIsRelatednessSheetOpen: (open: boolean) => void;
  analyzeRelatedness: (docIds?: string[]) => Promise<DocumentRelatednessResult | null>;

  // Chat & Local Persistence
  sessions: ChatSession[];
  activeSessionId: string;
  activeSession: ChatSession | null;
  messages: ChatMessage[];
  isGenerating: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => Promise<void>;
  createNewChat: (title?: string) => Promise<string>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteChat: (sessionId: string) => Promise<void>;
  renameChat: (sessionId: string, newTitle: string) => Promise<void>;
  clearAllChats: () => Promise<void>;

  // Sheets
  isDocumentsSheetOpen: boolean;
  setIsDocumentsSheetOpen: (open: boolean) => void;
  isChatHistorySheetOpen: boolean;
  setIsChatHistorySheetOpen: (open: boolean) => void;
  activeCitationSource: CitationSource | null;
  activeCitationList: CitationSource[];
  isSourceSheetOpen: boolean;
  openSourceSheet: (source: CitationSource, allCitationsInMessage?: CitationSource[]) => void;
  closeSourceSheet: () => void;
  runFheSearch: (query: string) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>({
    email: 'owner@marginsense.ai',
    token: 'mock-jwt-token-123',
  });

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  
  // Multi-document selection state
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingDocName, setUploadingDocName] = useState<string | null>(null);

  // Cross-Document Correlation state (only triggered after uploading or explicit manual request)
  const [relatednessResult, setRelatednessResult] = useState<DocumentRelatednessResult | null>(null);
  const [isAnalyzingRelatedness, setIsAnalyzingRelatedness] = useState(false);
  const [isRelatednessSheetOpen, setIsRelatednessSheetOpen] = useState(false);

  // Chat local persistence states
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sheets
  const [isDocumentsSheetOpen, setIsDocumentsSheetOpen] = useState(false);
  const [isChatHistorySheetOpen, setIsChatHistorySheetOpen] = useState(false);
  const [isSourceSheetOpen, setIsSourceSheetOpen] = useState(false);
  const [activeCitationSource, setActiveCitationSource] = useState<CitationSource | null>(null);
  const [activeCitationList, setActiveCitationList] = useState<CitationSource[]>([]);

  // Invoice Audit Modal state
  const [isInvoiceAuditModalOpen, setIsInvoiceAuditModalOpen] = useState(false);
  const [activeStructuredInvoice, setActiveStructuredInvoice] = useState<StructuredInvoice | null>(null);
  const [activeInvoiceAudit, setActiveInvoiceAudit] = useState<InvoiceAuditResult | null>(null);
  const [activeWhatsappDraft, setActiveWhatsappDraft] = useState<string | undefined>(undefined);
  const [activeInvoiceFileName, setActiveInvoiceFileName] = useState<string | undefined>(undefined);

  // Leak Alerts Feed
  const [leakAlerts, setLeakAlerts] = useState<LeakAlert[]>([]);
  const [isLeakAlertsSheetOpen, setIsLeakAlertsSheetOpen] = useState(false);

  // Dashboard
  const [isDashboardSheetOpen, setIsDashboardSheetOpen] = useState(false);
  const [amountRecovered, setAmountRecovered] = useState(0);

  // Computed multi-selected documents
  const selectedDocuments = documents.filter((d) => selectedDocumentIds.includes(d.id));
  const selectedDocument = selectedDocuments[0] || null;

  const setSelectedDocument = (doc: DocumentItem | null) => {
    if (doc) {
      setSelectedDocumentIds([doc.id]);
    } else {
      setSelectedDocumentIds([]);
    }
  };

  const toggleDocumentSelection = (docOrId: string | DocumentItem) => {
    const docId = typeof docOrId === 'string' ? docOrId : docOrId.id;
    setSelectedDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocumentIds(documents.map((d) => d.id));
  };

  const clearDocumentSelection = () => {
    setSelectedDocumentIds([]);
  };

  // 1. Initialize local chat sessions and load stored messages on boot
  useEffect(() => {
    let isMounted = true;
    async function loadSessionsFromStorage() {
      try {
        const storedSessions = await getLocalChatSessions();
        if (!isMounted) return;
        setSessions(storedSessions);

        const storedActiveId = await getActiveSessionId();
        const targetId =
          storedActiveId && storedSessions.some((s) => s.id === storedActiveId)
            ? storedActiveId
            : storedSessions[0]?.id || 'session-default';

        setActiveSessionId(targetId);
        const storedMsgs = await getSessionMessages(targetId);
        if (isMounted) {
          setMessages(storedMsgs.length > 0 ? storedMsgs : INITIAL_MESSAGES);
        }
      } catch (err) {
        console.warn('[AppContext] Failed to load local chats from storage:', err);
      }
    }
    loadSessionsFromStorage();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Check backend health & sync initial documents on mount
  useEffect(() => {
    let isMounted = true;
    async function syncWithBackend() {
      const isHealthy = await checkBackendHealth();
      if (!isMounted) return;
      setIsBackendConnected(isHealthy);

      if (isHealthy) {
        const backendDocs = await fetchBackendDocuments();
        if (backendDocs && backendDocs.length > 0 && isMounted) {
          setDocuments((prev) => {
            const existingIds = new Set(backendDocs.map((d) => d.id));
            const uniqueInitial = prev.filter((d) => !existingIds.has(d.id));
            return [...backendDocs, ...uniqueInitial];
          });
        }
      }
    }

    syncWithBackend();
    const interval = setInterval(syncWithBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 3. Listen for WhatsApp & Gmail Share-Sheet imports (PDF / Images)
  useEffect(() => {
    let isMounted = true;

    // Check if app was opened with a shared document/image
    Linking.getInitialURL().then((url) => {
      if (url && isMounted) {
        handleIncomingSharedUri(url);
      }
    });

    const sub = Linking.addEventListener('url', (event) => {
      handleIncomingSharedUri(event.url);
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);

  const handleIncomingSharedUri = (url: string) => {
    if (!url) return;
    console.log('[MarginSense Share-Sheet] Received URL/Intent:', url);
    // Parse marginsense://import?file=... or direct file/content URL
    let targetUri = url;
    if (url.includes('file=')) {
      try {
        targetUri = decodeURIComponent(url.split('file=')[1].split('&')[0]);
      } catch (e) {}
    } else if (url.startsWith('marginsense://') && !url.includes('://import')) {
      return;
    }

    if (
      targetUri.startsWith('file://') ||
      targetUri.startsWith('content://') ||
      targetUri.toLowerCase().endsWith('.pdf') ||
      targetUri.toLowerCase().endsWith('.jpg') ||
      targetUri.toLowerCase().endsWith('.png') ||
      targetUri.toLowerCase().endsWith('.jpeg')
    ) {
      const ext = targetUri.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg';
      importInvoiceFromUri(targetUri, `whatsapp_share_${Date.now()}${ext}`);
    }
  };

  const login = async (email: string) => {
    setUser({ email, token: 'mock-jwt-token-' + Date.now() });
    return true;
  };

  const signup = async (email: string) => {
    setUser({ email, token: 'mock-jwt-token-' + Date.now() });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  // Helper: build leak alerts from document audit results
  const buildLeakAlertsFromDocs = (docs: DocumentItem[]): LeakAlert[] => {
    const alerts: LeakAlert[] = [];
    for (const doc of docs) {
      if (!doc.auditResult || doc.auditResult.leak_count === 0) continue;
      for (const leak of doc.auditResult.leaks) {
        const existing = leakAlerts.find((a) => a.id === `${doc.id}-${leak.type}-${leak.title}`);
        alerts.push({
          id: `${doc.id}-${leak.type}-${leak.title}`,
          documentId: doc.id,
          documentName: doc.name,
          supplierName: doc.structuredInvoice?.supplier_name || doc.name,
          invoiceNumber: doc.structuredInvoice?.invoice_number || undefined,
          leakType: leak.type,
          severity: leak.severity,
          leakAmount: leak.leak_amount,
          rootCause: leak.root_cause,
          whatsappDraft: doc.whatsappDraft,
          status: existing?.status || 'PENDING',
          detectedAt: doc.auditResult.audited_at,
        });
      }
    }
    return alerts;
  };

  const approveLeakAlert = (alertId: string) => {
    setLeakAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, status: 'APPROVED' } : a));
    setAmountRecovered((prev) => {
      const alert = leakAlerts.find((a) => a.id === alertId);
      return prev + (alert?.leakAmount || 0);
    });
  };

  const rejectLeakAlert = (alertId: string) => {
    setLeakAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, status: 'REJECTED' } : a));
  };

  // Computed Dashboard KPI from real documents
  const dashboardKPI: DashboardKPI = React.useMemo(() => {
    const audited = documents.filter((d) => d.auditResult);
    const totalLeakAmount = audited.reduce((sum, d) => sum + (d.auditResult?.total_leak_amount || 0), 0);
    const totalLeaksDetected = audited.reduce((sum, d) => sum + (d.auditResult?.leak_count || 0), 0);
    const pendingAlerts = leakAlerts.filter((a) => a.status === 'PENDING').length;

    // Top leaking supplier
    const supplierLeaks: Record<string, number> = {};
    for (const doc of audited) {
      if (doc.auditResult && doc.auditResult.total_leak_amount > 0) {
        const name = doc.structuredInvoice?.supplier_name || doc.name;
        supplierLeaks[name] = (supplierLeaks[name] || 0) + doc.auditResult.total_leak_amount;
      }
    }
    const topLeakingSupplier = Object.keys(supplierLeaks).sort((a, b) => supplierLeaks[b] - supplierLeaks[a])[0];

    return {
      totalLeaksDetected,
      totalLeakAmount,
      amountRecovered,
      pendingAlerts,
      invoicesAudited: audited.length,
      topLeakingSupplier,
    };
  }, [documents, leakAlerts, amountRecovered]);

  const analyzeRelatedness = async (docIds?: string[]): Promise<DocumentRelatednessResult | null> => {
    setIsAnalyzingRelatedness(true);
    try {
      const targetIds = docIds && docIds.length > 0 ? docIds : (selectedDocumentIds.length > 1 ? selectedDocumentIds : undefined);
      const res = await checkDocumentsRelatedness(targetIds);
      if (res) {
        setRelatednessResult(res);
      }
      setIsAnalyzingRelatedness(false);
      return res;
    } catch (err) {
      console.log('[AppContext] Error analyzing relatedness:', err);
      setIsAnalyzingRelatedness(false);
      return null;
    }
  };

  // Helper to upload any batch of assets (from documents or images)
  const uploadAssetList = async (
    assets: Array<{ uri: string; name?: string; mimeType?: string; size?: number }>
  ) => {
    const totalFiles = assets.length;
    setIsUploading(true);
    setUploadingDocName(totalFiles > 1 ? `${totalFiles} documents` : (assets[0].name || 'document'));
    setUploadProgress(15);

    const uploadedDocs: DocumentItem[] = [];

    for (let i = 0; i < totalFiles; i++) {
      const asset = assets[i];
      setUploadingDocName(asset.name || `file_${i + 1}`);
      setUploadProgress(Math.round(((i + 0.3) / totalFiles) * 85));

      const backendDoc = await uploadDocumentToBackend(
        asset.uri,
        asset.name || `upload_${Date.now()}_${i}`,
        asset.mimeType || 'application/octet-stream'
      );

      if (backendDoc) {
        uploadedDocs.push(backendDoc);
      } else {
        const fallbackDoc: DocumentItem = {
          id: `doc-${Date.now()}-${i}`,
          name: asset.name || `document_${i + 1}`,
          uri: asset.uri,
          size: asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
          pages: 1,
          status: 'INDEXED',
          uploadedAt: 'Just now',
        };
        uploadedDocs.push(fallbackDoc);
      }

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 95));
    }

    setUploadProgress(100);
    setDocuments((prev) => [...uploadedDocs, ...prev]);

    // Automatically select the newly uploaded documents
    const newDocIds = uploadedDocs.map((d) => d.id);
    setSelectedDocumentIds(newDocIds);

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingDocName(null);
    }, 600);

    // AUTOMATIC CORRELATION: Triggered ONLY after uploading multiple documents (totalFiles > 1)
    if (totalFiles > 1 && uploadedDocs.length > 1) {
      setTimeout(async () => {
        await analyzeRelatedness(uploadedDocs.map((d) => d.id));
        setIsRelatednessSheetOpen(true);
      }, 1200);
    }
  };

  // 1. Pick and upload files (PDF, DOCX, XLSX, TXT, CSV, etc.)
  const pickAndUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/*',
          'image/*',
          '*/*'
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      await uploadAssetList(result.assets);
    } catch (err) {
      console.error('Error selecting documents:', err);
      setIsUploading(false);
      setUploadingDocName(null);
    }
  };

  // 2. Pick and upload images/photos (Guaranteed multi-select with checkmarks on Android/iOS)
  const pickAndUploadImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const mappedAssets = result.assets.map((asset, idx) => ({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}_${idx + 1}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || undefined,
      }));

      await uploadAssetList(mappedAssets);
    } catch (err) {
      console.error('Error selecting images:', err);
      setIsUploading(false);
      setUploadingDocName(null);
    }
  };

  // 3. Invoice capture by Camera: Snap purchase bill, run instant RapidOCR & audit leaks
  const snapInvoiceWithCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        alert('Camera permission is required to snap purchase bills.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || `camera_bill_${Date.now()}.jpg`;

      setIsUploading(true);
      setUploadingDocName(fileName);
      setUploadProgress(25);

      // Call high-speed backend OCR & structuring
      setUploadProgress(60);
      const invoiceRes = await processInvoiceWithOCR(
        asset.uri,
        fileName,
        asset.mimeType || 'image/jpeg'
      );
      setUploadProgress(90);

      if (
        invoiceRes &&
        invoiceRes.success &&
        invoiceRes.is_invoice &&
        invoiceRes.structured_invoice &&
        invoiceRes.audit
      ) {
        const newDoc: DocumentItem = {
          id: invoiceRes.doc_id || `doc-${Date.now()}`,
          name: invoiceRes.file_name || fileName,
          uri: asset.uri,
          size: invoiceRes.size || '1.0 MB',
          pages: 1,
          status: 'INDEXED',
          uploadedAt: 'Just now',
          structuredInvoice: invoiceRes.structured_invoice,
          auditResult: invoiceRes.audit,
          whatsappDraft: invoiceRes.whatsapp_draft,
        };

        setDocuments((prev) => [newDoc, ...prev]);
        setSelectedDocumentIds([newDoc.id]);

        // Auto-populate leak alerts feed from real audit results
        const audit = invoiceRes.audit;
        if (audit && audit.leak_count > 0) {
          const newAlerts = audit.leaks.map((leak) => ({
            id: `${newDoc.id}-${leak.type}-${leak.title}`,
            documentId: newDoc.id,
            documentName: newDoc.name,
            supplierName: invoiceRes.structured_invoice?.supplier_name || newDoc.name,
            invoiceNumber: invoiceRes.structured_invoice?.invoice_number || undefined,
            leakType: leak.type,
            severity: leak.severity,
            leakAmount: leak.leak_amount,
            rootCause: leak.root_cause,
            whatsappDraft: invoiceRes.whatsapp_draft,
            status: 'PENDING' as const,
            detectedAt: audit.audited_at,
          }));
          setLeakAlerts((prev) => [...newAlerts, ...prev.filter((a) => a.documentId !== newDoc.id)]);
          // Show alerts feed automatically
          setIsLeakAlertsSheetOpen(true);
        }

        // Launch Structured Bill & Autonomous Leak Audit Modal immediately
        setActiveStructuredInvoice(invoiceRes.structured_invoice);
        setActiveInvoiceAudit(invoiceRes.audit);
        setActiveWhatsappDraft(invoiceRes.whatsapp_draft);
        setActiveInvoiceFileName(invoiceRes.file_name || fileName);
        setIsInvoiceAuditModalOpen(true);
      } else if (invoiceRes && invoiceRes.is_invoice === false) {
        // Explicitly rejected as NOT an invoice
        Alert.alert(
          'Not an Invoice',
          invoiceRes.rejection_reason ||
            'The photo taken does not appear to be an invoice or purchase bill. Please capture a clear photo of a supplier bill, cash memo, or invoice.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Scan Failed',
          'Could not analyze the photo. Please check your network connection and try again.',
          [{ text: 'OK' }]
        );
      }

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingDocName(null);
      }, 500);
    } catch (err) {
      console.error('Error snapping bill with camera:', err);
      setIsUploading(false);
      setUploadingDocName(null);
    }
  };

  // 4. Import from WhatsApp / Gmail Share-Sheet or File
  const importInvoiceFromUri = async (uri: string, name?: string) => {
    try {
      const fileName = name || `shared_invoice_${Date.now()}.pdf`;
      setIsUploading(true);
      setUploadingDocName(fileName);
      setUploadProgress(30);

      const invoiceRes = await processInvoiceWithOCR(uri, fileName);
      setUploadProgress(90);

      if (
        invoiceRes &&
        invoiceRes.success &&
        invoiceRes.is_invoice &&
        invoiceRes.structured_invoice &&
        invoiceRes.audit
      ) {
        const newDoc: DocumentItem = {
          id: invoiceRes.doc_id || `doc-${Date.now()}`,
          name: invoiceRes.file_name || fileName,
          uri: uri,
          size: invoiceRes.size || '1.0 MB',
          pages: 1,
          status: 'INDEXED',
          uploadedAt: 'Just now',
          structuredInvoice: invoiceRes.structured_invoice,
          auditResult: invoiceRes.audit,
          whatsappDraft: invoiceRes.whatsapp_draft,
        };

        setDocuments((prev) => [newDoc, ...prev]);
        setSelectedDocumentIds([newDoc.id]);

        // Auto-populate leak alerts feed
        const audit = invoiceRes.audit;
        if (audit && audit.leak_count > 0) {
          const newAlerts = audit.leaks.map((leak) => ({
            id: `${newDoc.id}-${leak.type}-${leak.title}`,
            documentId: newDoc.id,
            documentName: newDoc.name,
            supplierName: invoiceRes.structured_invoice?.supplier_name || newDoc.name,
            invoiceNumber: invoiceRes.structured_invoice?.invoice_number || undefined,
            leakType: leak.type,
            severity: leak.severity,
            leakAmount: leak.leak_amount,
            rootCause: leak.root_cause,
            whatsappDraft: invoiceRes.whatsapp_draft,
            status: 'PENDING' as const,
            detectedAt: audit.audited_at,
          }));
          setLeakAlerts((prev) => [...newAlerts, ...prev.filter((a) => a.documentId !== newDoc.id)]);
        }

        setActiveStructuredInvoice(invoiceRes.structured_invoice);
        setActiveInvoiceAudit(invoiceRes.audit);
        setActiveWhatsappDraft(invoiceRes.whatsapp_draft);
        setActiveInvoiceFileName(invoiceRes.file_name || fileName);
        setIsInvoiceAuditModalOpen(true);
      } else if (invoiceRes && invoiceRes.is_invoice === false) {
        Alert.alert(
          'Not an Invoice',
          invoiceRes.rejection_reason || 'The imported file does not contain a recognizable purchase invoice.',
          [{ text: 'OK' }]
        );
      } else {
        await uploadAssetList([{ uri, name: fileName }]);
      }

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingDocName(null);
      }, 500);
    } catch (err) {
      console.warn('Share sheet import error:', err);
      setIsUploading(false);
      setUploadingDocName(null);
    }
  };

  // 5. Open Structured Audit Modal for any document
  const openInvoiceAudit = async (doc: DocumentItem) => {
    if (doc.structuredInvoice) {
      // Already audited — show existing data
      setActiveStructuredInvoice(doc.structuredInvoice);
      setActiveInvoiceAudit(doc.auditResult || null);
      setActiveWhatsappDraft(doc.whatsappDraft);
      setActiveInvoiceFileName(doc.name);
      setIsInvoiceAuditModalOpen(true);
    } else if (doc.uri) {
      // Not yet audited — run dynamic backend OCR pipeline on the actual file
      setIsUploading(true);
      setUploadingDocName(doc.name);
      setUploadProgress(30);
      try {
        const invoiceRes = await processInvoiceWithOCR(doc.uri, doc.name);
        setUploadProgress(95);
        if (
          invoiceRes &&
          invoiceRes.success &&
          invoiceRes.is_invoice &&
          invoiceRes.structured_invoice &&
          invoiceRes.audit
        ) {
          // Patch document with real audit data
          const updatedDoc: DocumentItem = {
            ...doc,
            structuredInvoice: invoiceRes.structured_invoice,
            auditResult: invoiceRes.audit,
            whatsappDraft: invoiceRes.whatsapp_draft,
          };
          setDocuments((prev) => prev.map((d) => d.id === doc.id ? updatedDoc : d));

          // Populate leak alerts
          const audit = invoiceRes.audit;
          if (audit && audit.leak_count > 0) {
            const newAlerts = audit.leaks.map((leak) => ({
              id: `${doc.id}-${leak.type}-${leak.title}`,
              documentId: doc.id,
              documentName: doc.name,
              supplierName: invoiceRes.structured_invoice?.supplier_name || doc.name,
              invoiceNumber: invoiceRes.structured_invoice?.invoice_number || undefined,
              leakType: leak.type,
              severity: leak.severity,
              leakAmount: leak.leak_amount,
              rootCause: leak.root_cause,
              whatsappDraft: invoiceRes.whatsapp_draft,
              status: 'PENDING' as const,
              detectedAt: audit.audited_at,
            }));
            setLeakAlerts((prev) => [...newAlerts, ...prev.filter((a) => a.documentId !== doc.id)]);
          }

          setActiveStructuredInvoice(invoiceRes.structured_invoice);
          setActiveInvoiceAudit(invoiceRes.audit);
          setActiveWhatsappDraft(invoiceRes.whatsapp_draft);
          setActiveInvoiceFileName(invoiceRes.file_name || doc.name);
          setIsInvoiceAuditModalOpen(true);
        } else if (invoiceRes && invoiceRes.is_invoice === false) {
          Alert.alert(
            'Not an Invoice',
            invoiceRes.rejection_reason || 'This document does not contain valid invoice or billing data to audit.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Audit Error',
            'Could not extract invoice details from this document.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('[openInvoiceAudit] Backend OCR failed:', err);
      } finally {
        setUploadProgress(100);
        setTimeout(() => { setIsUploading(false); setUploadProgress(0); setUploadingDocName(null); }, 500);
      }
    }
  };



  // Helper to persist current session's messages and metadata locally
  const persistMessagesLocally = async (
    targetSessionId: string,
    updatedMessages: ChatMessage[],
    userQueryPrompt?: string
  ) => {
    try {
      await saveSessionMessages(targetSessionId, updatedMessages);
      const lastMsg = updatedMessages[updatedMessages.length - 1];

      setSessions((prevSessions) => {
        let matched = false;
        const nextSessions = prevSessions.map((s) => {
          if (s.id === targetSessionId) {
            matched = true;
            let title = s.title;
            if (
              (!title || title === 'New Conversation' || title === 'New Chat') &&
              userQueryPrompt
            ) {
              title =
                userQueryPrompt.length > 30
                  ? userQueryPrompt.slice(0, 30) + '...'
                  : userQueryPrompt;
            }
            return {
              ...s,
              title,
              messageCount: updatedMessages.length,
              lastMessageSnippet: lastMsg ? lastMsg.content.slice(0, 60) : 'No messages',
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });

        if (!matched) {
          const newSession: ChatSession = {
            id: targetSessionId,
            title: userQueryPrompt ? (userQueryPrompt.length > 30 ? userQueryPrompt.slice(0, 30) + '...' : userQueryPrompt) : 'New Consultation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            documentFilter: selectedDocument ? selectedDocument.name : null,
            messageCount: updatedMessages.length,
            lastMessageSnippet: lastMsg ? lastMsg.content.slice(0, 60) : 'No messages',
          };
          nextSessions.unshift(newSession);
        }

        saveLocalChatSessions(nextSessions);
        return nextSessions;
      });
    } catch (e) {
      console.warn('[AppContext] Failed to persist messages locally:', e);
    }
  };

  // Chat Actions
  const createNewChat = async (title?: string): Promise<string> => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentFilter: selectedDocument ? selectedDocument.name : null,
      messageCount: 0,
      lastMessageSnippet: 'Fresh consultation',
    };

    const nextSessions = [newSession, ...sessions];
    setSessions(nextSessions);
    setActiveSessionId(newId);
    setMessages([]);

    await saveLocalChatSessions(nextSessions);
    await saveActiveSessionId(newId);
    await saveSessionMessages(newId, []);

    return newId;
  };

  const switchSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    await saveActiveSessionId(sessionId);
    const stored = await getSessionMessages(sessionId);
    setMessages(stored);
  };

  const deleteChat = async (sessionId: string) => {
    await deleteLocalChatSession(sessionId);
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);

    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        const nextId = updated[0].id;
        setActiveSessionId(nextId);
        await saveActiveSessionId(nextId);
        const msgs = await getSessionMessages(nextId);
        setMessages(msgs);
      } else {
        await createNewChat('New Conversation');
      }
    }
  };

  const renameChat = async (sessionId: string, newTitle: string) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, title: newTitle.trim(), updatedAt: new Date().toISOString() } : s
    );
    setSessions(updated);
    await saveLocalChatSessions(updated);
  };

  const clearChat = async () => {
    setMessages([]);
    if (activeSessionId) {
      await saveSessionMessages(activeSessionId, []);
      const updated = sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, messageCount: 0, lastMessageSnippet: 'Chat cleared', updatedAt: new Date().toISOString() }
          : s
      );
      setSessions(updated);
      await saveLocalChatSessions(updated);
    }
  };

  const clearAllChats = async () => {
    await clearAllLocalChats();
    const freshId = `session-${Date.now()}`;
    const freshSession: ChatSession = {
      id: freshId,
      title: 'New Consultation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentFilter: null,
      messageCount: 0,
      lastMessageSnippet: 'Started new chat',
    };
    setSessions([freshSession]);
    setActiveSessionId(freshId);
    setMessages([]);
    await saveLocalChatSessions([freshSession]);
    await saveActiveSessionId(freshId);
    await saveSessionMessages(freshId, []);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const currentSessionId = activeSessionId;
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setIsGenerating(true);
    await persistMessagesLocally(currentSessionId, messagesWithUser, text.trim());

    // Context filter: single or multi-doc filter
    const docContext = selectedDocuments.length > 0
      ? selectedDocuments.map((d) => d.name).join(', ')
      : null;

    try {
      // 1. Real RAG execution via FastAPI Gateway
      const backendResult = await sendQueryToBackend(
        text.trim(),
        docContext,
        currentSessionId
      );

      if (backendResult) {
        const assistantMessage: ChatMessage = {
          id: backendResult.id || `msg-resp-${Date.now()}`,
          role: 'assistant',
          content: backendResult.answer,
          citations: backendResult.citations,
          isInsufficientInfo: backendResult.isInsufficientInfo,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const messagesWithAssistant = [...messagesWithUser, assistantMessage];
        setMessages(messagesWithAssistant);
        setIsGenerating(false);
        await persistMessagesLocally(currentSessionId, messagesWithAssistant);
        return;
      }
    } catch (apiErr) {
      console.log('FastAPI Gateway offline or request error, switching to local offline model:', apiErr);
    }

    // 2. Offline Fallback Simulation
    setTimeout(async () => {
      const lower = text.toLowerCase();

      const isInsufficient =
        lower.includes('recipe') ||
        lower.includes('cake') ||
        lower.includes('weather') ||
        lower.includes('stock price') ||
        lower.includes('alien') ||
        lower.includes('mars');

      let assistantMessage: ChatMessage;

      if (isInsufficient) {
        assistantMessage = {
          id: `msg-resp-${Date.now()}`,
          role: 'assistant',
          content: "I couldn't find enough information in the uploaded documents to answer this.",
          isInsufficientInfo: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        // Check against mock knowledge base
        const matched = MOCK_KNOWLEDGE_BASE.find((entry) =>
          entry.keywords.some((kw) => lower.includes(kw))
        );

        if (matched) {
          assistantMessage = {
            id: `msg-resp-${Date.now()}`,
            role: 'assistant',
            content: matched.answer,
            citations: matched.citations,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        } else {
          const isDescQuery =
            lower.includes('what is') ||
            lower.includes('about') ||
            lower.includes('describe') ||
            lower.includes('description') ||
            lower.includes('summarize') ||
            lower.includes('summary') ||
            lower.includes('overview') ||
            lower.includes('explain') ||
            lower.includes('compare') ||
            lower.includes('difference');

          if (selectedDocuments.length > 1) {
            // Multi-document offline fallback synthesis
            const docNames = selectedDocuments.map((d) => d.name);
            const docListStr = docNames.join(', ');
            const primaryDoc = selectedDocuments[0];
            const secondaryDoc = selectedDocuments[1];

            assistantMessage = {
              id: `msg-resp-${Date.now()}`,
              role: 'assistant',
              content: `Cross-referencing ${selectedDocuments.length} selected documents (${docListStr}):\n\n1. **${primaryDoc.name}** outlines core foundational standards, operational procedures, and compliance criteria [1].\n2. **${secondaryDoc.name}** details implementation guidelines, review protocols, and execution workflows [2].\n\nBoth documents emphasize verified auditing and strict operational adherence across system environments.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              citations: [
                {
                  id: `cite-${Date.now()}-1`,
                  index: 1,
                  documentId: primaryDoc.id,
                  documentName: primaryDoc.name,
                  page: 1,
                  snippet: `Foundational standards and policy criteria established in ${primaryDoc.name}.`,
                  relevance: 95,
                },
                {
                  id: `cite-${Date.now()}-2`,
                  index: 2,
                  documentId: secondaryDoc.id,
                  documentName: secondaryDoc.name,
                  page: 1,
                  snippet: `Implementation workflows, verification rules, and governance specifications from ${secondaryDoc.name}.`,
                  relevance: 91,
                },
              ],
            };
          } else {
            const targetDocName = selectedDocument ? selectedDocument.name : 'company_policy.pdf';

            if (isDescQuery) {
              assistantMessage = {
                id: `msg-resp-${Date.now()}`,
                role: 'assistant',
                content: `This document, "${targetDocName}," serves as an authoritative guide covering key policies, procedures, and architectural standards [1]. It details implementation specifications, compliance obligations, and operational workflows designed to ensure seamless system execution [2].\n\nKey areas include core procedural requirements, security governance, and operational auditing protocols.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                citations: [
                  {
                    id: `cite-${Date.now()}-1`,
                    index: 1,
                    documentId: selectedDocument?.id || 'doc-1',
                    documentName: targetDocName,
                    page: 1,
                    snippet: `Overview and general purpose of ${targetDocName}: Outlines the foundational architecture and guidelines.`,
                    relevance: 95,
                  },
                  {
                    id: `cite-${Date.now()}-2`,
                    index: 2,
                    documentId: selectedDocument?.id || 'doc-1',
                    documentName: targetDocName,
                    page: 3,
                    snippet: `Procedural guidelines require authenticated logging across all integrated services with automated discrepancy flagging.`,
                    relevance: 90,
                  },
                ],
              };
            } else {
              assistantMessage = {
                id: `msg-resp-${Date.now()}`,
                role: 'assistant',
                content: `According to section 4 of ${targetDocName}, all procedures must adhere to verifiable audit protocols [1]. Additional verification parameters are detailed in the appendix [2].`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                citations: [
                  {
                    id: `cite-${Date.now()}-1`,
                    index: 1,
                    documentId: selectedDocument?.id || 'doc-2',
                    documentName: targetDocName,
                    page: 15,
                    snippet: `Procedural guidelines require authenticated logging across all integrated services with automated discrepancy flagging.`,
                    relevance: 91,
                  },
                  {
                    id: `cite-${Date.now()}-2`,
                    index: 2,
                    documentId: selectedDocument?.id || 'doc-2',
                    documentName: targetDocName,
                    page: 19,
                    snippet: `Verification parameters must be submitted to the document governance team for quarterly review.`,
                    relevance: 84,
                  },
                ],
              };
            }
          }
        }
      }

      const finalMessages = [...messagesWithUser, assistantMessage];
      setMessages(finalMessages);
      setIsGenerating(false);
      await persistMessagesLocally(currentSessionId, finalMessages);
    }, 900);
  };

  const openSourceSheet = (source: CitationSource, allCitationsInMessage?: CitationSource[]) => {
    setActiveCitationSource(source);
    if (allCitationsInMessage && allCitationsInMessage.length > 0) {
      setActiveCitationList(allCitationsInMessage);
    } else {
      setActiveCitationList([source]);
    }
    setIsSourceSheetOpen(true);
  };

  const closeSourceSheet = () => {
    setIsSourceSheetOpen(false);
  };

  const runFheSearch = async (query: string) => {
    return await performFheSearch(query, selectedDocument?.id);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isBackendConnected,
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
        snapInvoiceWithCamera,
        openInvoiceAudit,
        importInvoiceFromUri,
        isInvoiceAuditModalOpen,
        setIsInvoiceAuditModalOpen,
        activeStructuredInvoice,
        setActiveStructuredInvoice,
        activeInvoiceAudit,
        setActiveInvoiceAudit,
        activeWhatsappDraft,
        setActiveWhatsappDraft,
        activeInvoiceFileName,
        leakAlerts,
        isLeakAlertsSheetOpen,
        setIsLeakAlertsSheetOpen,
        approveLeakAlert,
        rejectLeakAlert,
        dashboardKPI,
        isDashboardSheetOpen,
        setIsDashboardSheetOpen,
        relatednessResult,
        isAnalyzingRelatedness,
        isRelatednessSheetOpen,
        setIsRelatednessSheetOpen,
        analyzeRelatedness,
        sessions,
        activeSessionId,
        activeSession,
        messages,
        isGenerating,
        sendMessage,
        clearChat,
        createNewChat,
        switchSession,
        deleteChat,
        renameChat,
        clearAllChats,
        isDocumentsSheetOpen,
        setIsDocumentsSheetOpen,
        isChatHistorySheetOpen,
        setIsChatHistorySheetOpen,
        activeCitationSource,
        activeCitationList,
        isSourceSheetOpen,
        openSourceSheet,
        closeSourceSheet,
        runFheSearch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
