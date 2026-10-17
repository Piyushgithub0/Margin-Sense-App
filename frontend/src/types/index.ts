export type DocumentStatus = 'QUEUED' | 'OCR' | 'PROCESSING' | 'INDEXED';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_rate: number;
  tax_rate: number;
  amount: number;
}

export interface ProfitLeakItem {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  leak_amount: number;
  agreed_rate?: number;
  billed_rate?: number;
  expected_total?: number;
  billed_total?: number;
  quantity?: number;
  root_cause: string;
}

export interface InvoiceAuditResult {
  status: 'LEAKS_DETECTED' | 'VERIFIED_CLEAN';
  total_leak_amount: number;
  leak_count: number;
  leaks: ProfitLeakItem[];
  confidence_score: number;
  audited_at: string;
}

export interface StructuredInvoice {
  supplier_name: string;
  gstin?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  line_items: InvoiceLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst?: number;
  total_amount: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  uri?: string;
  size?: string;
  pages: number;
  status: DocumentStatus;
  progress?: number; // 0 to 100
  uploadedAt: string;
  structuredInvoice?: StructuredInvoice;
  auditResult?: InvoiceAuditResult;
  whatsappDraft?: string;
}

export type CitationSourceType = 'document' | 'web' | 'live_api' | 'search';

export interface CitationSource {
  id: string;
  index: number;
  sourceType?: CitationSourceType;
  documentId: string;
  documentName: string;
  page: number;
  snippet: string;
  relevance: number; // e.g. 87 for 87%
  url?: string | null;
  retrievedAt?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationSource[];
  isInsufficientInfo?: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  documentFilter?: string | null;
  messageCount: number;
  lastMessageSnippet?: string;
}

export interface AuthUser {
  email: string;
  token: string;
}
