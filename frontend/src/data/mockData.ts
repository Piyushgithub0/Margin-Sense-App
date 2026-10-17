import { DocumentItem, ChatMessage, CitationSource } from '@/types';

// Initial documents: clean — no hardcoded audit data.
// Audit data is ONLY populated after real backend OCR processing.
export const INITIAL_DOCUMENTS: DocumentItem[] = [];

// No pre-loaded messages — each session starts fresh.
export const INITIAL_MESSAGES: ChatMessage[] = [];

export interface MockAnswer {
  keywords: string[];
  answer: string;
  citations?: CitationSource[];
  isInsufficientInfo?: boolean;
}

export const MOCK_KNOWLEDGE_BASE: MockAnswer[] = [
  {
    keywords: ['leak', 'profit', 'overcharge', 'loss', 'margin', 'rate hike', 'price creep'],
    answer:
      'Upload an invoice (PDF or photo) to let MarginSense AI detect profit leaks automatically. The 6-agent pipeline audits every line item for rate hikes, GST mismatches, duplicate charges, and freight overcharges — then drafts a supplier dispute message in ₹ INR.',
  },
  {
    keywords: ['supplier', 'vendor', 'bill', 'invoice'],
    answer:
      'Snap a supplier bill with your camera or import it from WhatsApp/Gmail. MarginSense runs instant RapidOCR extraction and pinpoints every rupee lost to overcharging, wrong tax, or hidden fees.',
  },
  {
    keywords: ['gst', 'tax', 'cgst', 'sgst', 'igst', 'mismatch'],
    answer:
      'GST mismatch detection checks whether the tax rate applied matches the HSN code of each line item. Discrepancies are flagged with exact rupee impact and a supplier correction draft.',
  },
  {
    keywords: ['whatsapp', 'message', 'draft', 'dispute', 'send'],
    answer:
      'After auditing your invoice, MarginSense drafts a professional Hindi/English WhatsApp message requesting a credit note from your supplier for the exact overcharge amount.',
  },
  {
    keywords: ['dashboard', 'kpi', 'total', 'recovered', 'summary'],
    answer:
      'The Dashboard shows total profit leaks detected this month, ₹ recovered through disputes, and the number of active unresolved alerts across all uploaded invoices.',
  },
];
