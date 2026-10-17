import { DocumentItem, ChatMessage, CitationSource, StructuredInvoice, InvoiceAuditResult } from '@/types';

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-inv-metro',
    name: 'invoice_metro_foods.pdf',
    pages: 1,
    size: '1.2 MB',
    status: 'INDEXED',
    uploadedAt: 'Today, 10:15 AM',
    structuredInvoice: {
      supplier_name: 'Metro Foods Pvt Ltd',
      gstin: '27AABCM9842F1Z8',
      invoice_number: 'INV-2026-9041',
      invoice_date: '17/10/2026',
      line_items: [
        { description: 'Amul Butter 500g', quantity: 20, unit: 'pcs', unit_rate: 265, tax_rate: 12, amount: 5300 },
        { description: 'Amul Taaza Milk 1L', quantity: 50, unit: 'pcs', unit_rate: 58, tax_rate: 0, amount: 2900 },
      ],
      subtotal: 8200,
      cgst: 410,
      sgst: 410,
      total_amount: 9020,
    },
    auditResult: {
      status: 'LEAKS_DETECTED',
      total_leak_amount: 500,
      leak_count: 2,
      confidence_score: 96,
      audited_at: new Date().toISOString(),
      leaks: [
        {
          type: 'RATE_HIKE',
          severity: 'HIGH',
          title: 'Rate Hike on Amul Butter 500g',
          leak_amount: 300,
          agreed_rate: 250,
          billed_rate: 265,
          quantity: 20,
          root_cause: 'Billed @ ₹265/pc vs agreed ₹250/pc (+6.0% unauthorized markup across 20 pcs).'
        },
        {
          type: 'RATE_HIKE',
          severity: 'MEDIUM',
          title: 'Rate Hike on Amul Taaza Milk 1L',
          leak_amount: 200,
          agreed_rate: 54,
          billed_rate: 58,
          quantity: 50,
          root_cause: 'Billed @ ₹58/L vs agreed ₹54/L (+₹4/L markup across 50 units).'
        }
      ]
    },
    whatsappDraft: 'नमस्ते Metro Foods Pvt Ltd जी,\n\nआपके बिल संख्या *#INV-2026-9041* (दिनांक: 17/10/2026) में हमारे एकाउंट्स ऑडिट (MarginSense AI) द्वारा निम्नलिखित अंतर पाया गया है:\n\n1. *Amul Butter 500g*: बिल में रेट ₹265 लगाया गया है, जबकि हमारा तय रेट ₹250 था। (अंतर: ₹300.00)\n2. *Amul Taaza Milk 1L*: बिल में रेट ₹58 लगाया गया है, जबकि तय रेट ₹54 था। (अंतर: ₹200.00)\n\n*कुल अंतर / ओवरचार्ज: ₹500.00*\nकृपया इस अंतर की जांच करके अगले बिल में ₹500.00 का क्रेडिट नोट एडजस्ट करने का कष्ट करें।\n\nधन्यवाद!\n- किराना स्टोर ओनर'
  },
  {
    id: 'doc-inv-shree',
    name: 'invoice_shree_dairy.pdf',
    pages: 1,
    size: '890 KB',
    status: 'INDEXED',
    uploadedAt: 'Yesterday, 04:30 PM',
    structuredInvoice: {
      supplier_name: 'Shree Ganesh Dairy',
      gstin: '27AAYCS4120L1Z2',
      invoice_number: 'B-7412',
      invoice_date: '16/10/2026',
      line_items: [
        { description: 'Fresh Paneer 1kg', quantity: 25, unit: 'kg', unit_rate: 340, tax_rate: 5, amount: 8500 },
        { description: 'Cow Ghee 1L Tin', quantity: 10, unit: 'tins', unit_rate: 580, tax_rate: 12, amount: 5800 },
      ],
      subtotal: 14300,
      cgst: 357.5,
      sgst: 357.5,
      total_amount: 15015,
    },
    auditResult: {
      status: 'VERIFIED_CLEAN',
      total_leak_amount: 0,
      leak_count: 0,
      confidence_score: 98,
      audited_at: new Date().toISOString(),
      leaks: []
    },
    whatsappDraft: 'नमस्ते Shree Ganesh Dairy जी,\n\nआपके बिल #B-7412 का ऑडिट MarginSense AI द्वारा पूरा हो गया है। सभी रेट्स और टैक्स सही पाए गए हैं। पेमेंट रिलीज कर दिया गया है। धन्यवाद!'
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Metro Foods ke bill me kitna leak pinpoint hua?',
    timestamp: '10:16 AM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Metro Foods Pvt Ltd के बिल #INV-2026-9041 में कुल **₹500 का प्रॉफिट लीक** डिटेक्ट हुआ है [1]:\n\n1. **Amul Butter 500g**: बिल में ₹265/pc लगाया गया है जबकि आपका तय रेट ₹250 था (+₹300 अधिक)\n2. **Amul Taaza Milk 1L**: बिल में ₹58/L चार्ज किया गया जबकि एग्रीड रेट ₹54 था (+₹200 अधिक)\n\nमैंने आपके लिए WhatsApp क्रेडिट नोट डिस्प्यूट मैसेज भी ड्राफ्ट कर दिया है। क्या आप इसे सप्लायर को भेजना चाहते हैं?',
    timestamp: '10:16 AM',
    citations: [
      {
        id: 'cite-1',
        index: 1,
        documentId: 'doc-inv-metro',
        documentName: 'invoice_metro_foods.pdf',
        page: 1,
        snippet: 'Rate Hike on Amul Butter 500g (₹265 vs ₹250 agreed) and Amul Taaza Milk 1L (₹58 vs ₹54 agreed). Total leak: ₹500.',
        relevance: 98,
      },
    ],
  },
];

export interface MockAnswer {
  keywords: string[];
  answer: string;
  citations?: CitationSource[];
  isInsufficientInfo?: boolean;
}

export const MOCK_KNOWLEDGE_BASE: MockAnswer[] = [
  {
    keywords: ['refund', 'return', 'money back'],
    answer: 'The refund period is 30 days from the purchase date [1]. Certain exceptions apply for custom enterprise deployments and consulting services [2].',
    citations: [
      {
        id: 'cite-refund-1',
        index: 1,
        documentId: 'doc-2',
        documentName: 'company_policy.pdf',
        page: 12,
        snippet: 'Refund requests must be submitted within 30 days of initial purchase. All requests require proof of payment and are issued to the original payment method within 5-7 business days.',
        relevance: 94,
      },
      {
        id: 'cite-refund-2',
        index: 2,
        documentId: 'doc-2',
        documentName: 'company_policy.pdf',
        page: 14,
        snippet: 'Enterprise software configurations, dedicated instance provisioning fees, and custom development packages are strictly non-refundable once the onboarding period commences.',
        relevance: 87,
      },
    ],
  },
  {
    keywords: ['leave', 'vacation', 'holiday', 'pto', 'days of leave'],
    answer: 'Employees are entitled to 24 days of annual leave [1]. Leave requests must be submitted through the internal portal at least 2 weeks in advance [2].',
    citations: [
      {
        id: 'cite-leave-1',
        index: 1,
        documentId: 'doc-1',
        documentName: 'employee_handbook.pdf',
        page: 8,
        snippet: 'Full-time team members accrue standard annual paid leave at a rate of 2.0 days per calendar month, totaling 24 days per fiscal year.',
        relevance: 96,
      },
      {
        id: 'cite-leave-2',
        index: 2,
        documentId: 'doc-1',
        documentName: 'employee_handbook.pdf',
        page: 9,
        snippet: 'Planned vacation time exceeding 3 consecutive business days must be logged via the MarginSense Portal at least 14 days prior to commencement.',
        relevance: 89,
      },
    ],
  },
  {
    keywords: ['requirement', 'requirements', 'compliance', 'security', 'audit'],
    answer: 'Key compliance requirements include mandatory multi-factor authentication [1], bi-annual SOC2 audit participation [2], and adhering to secure credential rotation policies [3].',
    citations: [
      {
        id: 'cite-req-1',
        index: 1,
        documentId: 'doc-1',
        documentName: 'employee_handbook.pdf',
        page: 22,
        snippet: 'All workstation endpoints and cloud services require hardware-backed or authenticator app multi-factor verification. SMS verification is explicitly prohibited.',
        relevance: 92,
      },
      {
        id: 'cite-req-2',
        index: 2,
        documentId: 'doc-1',
        documentName: 'employee_handbook.pdf',
        page: 25,
        snippet: 'Engineering and operations personnel must preserve deployment logs and participate in bi-annual SOC2 Type II compliance audits without exception.',
        relevance: 88,
      },
      {
        id: 'cite-req-3',
        index: 3,
        documentId: 'doc-2',
        documentName: 'company_policy.pdf',
        page: 7,
        snippet: 'API keys, service account credentials, and master database connection strings must be rotated every 90 days or immediately following staff role alterations.',
        relevance: 81,
      },
    ],
  },
  {
    keywords: ['overtime', 'working hours', 'schedule'],
    answer: 'Standard working hours are 40 hours per week [1]. Overtime must be pre-approved by department leads and is compensated at 1.5x regular pay [2].',
    citations: [
      {
        id: 'cite-work-1',
        index: 1,
        documentId: 'doc-1',
        documentName: 'employee_handbook.pdf',
        page: 4,
        snippet: 'Core working hours operate between 09:00 and 17:00 local time Monday through Friday, with flexible asynchronous overlap encouraged.',
        relevance: 93,
      },
      {
        id: 'cite-work-2',
        index: 2,
        documentId: 'doc-1',
        documentName: 'employee_handbook.pdf',
        page: 6,
        snippet: 'Non-exempt overtime hours must receive written pre-authorization from the direct engineering manager and are remunerated at standard statutory premium rates.',
        relevance: 85,
      },
    ],
  },
];
