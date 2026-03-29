import api, { USE_MOCK } from './api';
import { genId } from '../utils/format';

// ---------------------------------------------------------------------------
// Normalizers — API (snake_case) → Frontend (camelCase)
// ---------------------------------------------------------------------------

function normalizeCase(c) {
  if (!c) return c;
  return {
    id: c.case_number || c.id,
    num: c.case_number || c.id,
    last: c.subject_last || c.subjectLastName || c.last || '',
    init: c.subject_init || c.subjectFirstInitial || c.init || '',
    subjectName: c.subject_last && c.subject_init
      ? `${c.subject_last}, ${c.subject_init}.`
      : c.subjectName || `${c.last || c.subject_last || ''}, ${c.init || c.subject_init || ''}.`,
    subjectLastName: c.subject_last || c.subjectLastName || c.last || '',
    subjectFirstInitial: c.subject_init || c.subjectFirstInitial || c.init || '',
    caseType: c.case_type || c.caseType || '',
    status: c.status || '',
    priority: c.priority || 'NORMAL',
    assignedTo: c.assigned_to_name || c.assignedTo || c.assigned_to || '',
    receivedDate: c.received_date || c.receivedDate || '',
    suspenseDate: c.suspense_48hr || c.suspenseDate || '',
    susp48: c.suspense_48hr || c.susp48 || null,
    susp3d: c.suspense_3day || c.susp3d || null,
    metSupp48: c.met_susp_48 || c.metSupp48 || null,
    metSupp3d: c.met_susp_3d || c.metSupp3d || null,
    surge: c.surge || c.surgeFlag || false,
    surgeFlag: c.surge || c.surgeFlag || false,
    disposition: c.disposition || null,
    recStatus: c.rec_status || c.recStatus || null,
    closedDate: c.closed_date || c.closedDate || null,
    createdAt: c.created_at || c.createdAt || '',
    updatedAt: c.updated_at || c.updatedAt || '',
    notes: c.notes || '',
    // Sub-resources — present on detail, absent on list
    issues: Array.isArray(c.issues) ? c.issues.map(normalizeIssue) : [],
    docs: Array.isArray(c.docs || c.documents) ? (c.docs || c.documents).map(normalizeDoc) : [],
    comms: Array.isArray(c.comms || c.communications) ? (c.comms || c.communications).map(normalizeComm) : [],
    memo: c.memo ? normalizeMemo(c.memo) : null,
    // List summary fields
    issueCount: c.issueCount ?? c.issue_count ?? undefined,
    docCount: c.docCount ?? c.doc_count ?? undefined,
    commCount: c.commCount ?? c.comm_count ?? undefined,
    hasMemo: c.hasMemo ?? c.has_memo ?? undefined,
  };
}

function normalizeCaseSummary(c) {
  const normalized = normalizeCase(c);
  // Strip sub-resource arrays for list view, keep counts
  const { issues, docs, comms, memo, ...summary } = normalized;
  return {
    ...summary,
    issueCount: summary.issueCount ?? (issues ? issues.length : 0),
    docCount: summary.docCount ?? (docs ? docs.length : 0),
    commCount: summary.commCount ?? (comms ? comms.length : 0),
    hasMemo: summary.hasMemo ?? !!memo,
  };
}

function normalizeIssue(i) {
  if (!i) return i;
  return {
    id: i.id,
    category: i.category || '',
    categoryName: i.category_name || i.categoryName || '',
    categoryLabel: i.category_label || i.categoryLabel || '',
    subcategory: i.subcategory || i.sub || '',
    guideline: i.guideline || i.guide || '',
    severity: i.severity || '',
    description: i.description || '',
    inMemo: i.in_memo ?? i.inMemo ?? true,
    mitigationType: i.mitigation_type || i.mitigationType || i.mitType || '',
    mitigations: Array.isArray(i.mitigations) ? i.mitigations.map(normalizeMitigation) : [],
    aiSuggested: i.ai_suggested ?? i.aiSuggested ?? false,
    createdAt: i.created_at || i.createdAt || '',
  };
}

function normalizeMitigation(m) {
  if (!m) return m;
  return {
    id: m.id,
    type: m.type || '',
    description: m.description || '',
    date: m.date || '',
  };
}

function normalizeDoc(d) {
  if (!d) return d;
  return {
    id: d.id,
    name: d.name || d.file_name || '',
    type: d.type || d.doc_type || '',
    status: d.status || '',
    confidence: d.confidence ?? d.conf ?? null,
    fileSize: d.file_size || d.fileSize || d.size || '',
    uploadedAt: d.uploaded_at || d.uploadedAt || '',
    extractedFields: Array.isArray(d.extracted_fields || d.extractedFields)
      ? (d.extracted_fields || d.extractedFields)
      : [],
  };
}

function normalizeComm(c) {
  if (!c) return c;
  return {
    id: c.id,
    type: c.type || c.comm_type || '',
    direction: c.direction || '',
    subject: c.subject || '',
    body: c.body || '',
    suspenseEffect: c.suspense_effect || c.suspenseEffect || c.suspFx || null,
    timestamp: c.timestamp || c.created_at || c.createdAt || '',
    author: c.author || c.author_name || '',
  };
}

function normalizeMemo(m) {
  if (!m) return m;
  return {
    id: m.id,
    type: m.type || m.memo_type || '',
    title: m.title || '',
    status: m.status || '',
    disposition: m.disposition || null,
    summary: m.summary || '',
    sections: Array.isArray(m.sections) ? m.sections : [],
    text: m.text || m.summary || '',
    v: m.v ?? m.version ?? 0,
    saved: m.saved || m.updated_at || m.updatedAt || null,
    qa: m.qa || m.qa_status || null,
    createdAt: m.created_at || m.createdAt || '',
    updatedAt: m.updated_at || m.updatedAt || '',
    author: m.author || m.author_name || '',
  };
}

// ---------------------------------------------------------------------------
// Denormalizers — Frontend (camelCase) → API (snake_case)
// ---------------------------------------------------------------------------

function denormalizeCase(data) {
  const out = {};
  if (data.subjectLastName !== undefined || data.last !== undefined)
    out.subject_last = data.subjectLastName || data.last;
  if (data.subjectFirstInitial !== undefined || data.init !== undefined)
    out.subject_init = data.subjectFirstInitial || data.init;
  if (data.caseType !== undefined) out.case_type = data.caseType;
  if (data.status !== undefined) out.status = data.status;
  if (data.priority !== undefined) out.priority = data.priority;
  if (data.assignedTo !== undefined) out.assigned_to = data.assignedTo;
  if (data.receivedDate !== undefined) out.received_date = data.receivedDate;
  if (data.suspenseDate !== undefined) out.suspense_48hr = data.suspenseDate;
  if (data.surge !== undefined || data.surgeFlag !== undefined)
    out.surge = data.surge ?? data.surgeFlag;
  if (data.disposition !== undefined) out.disposition = data.disposition;
  if (data.recStatus !== undefined) out.rec_status = data.recStatus;
  if (data.notes !== undefined) out.notes = data.notes;
  // Pass through any snake_case keys already present
  Object.keys(data).forEach((k) => {
    if (k.includes('_')) out[k] = data[k];
  });
  return out;
}

// ---------------------------------------------------------------------------
// Mock data — matches HTML template ST.cases
// ---------------------------------------------------------------------------

const now = Date.now();
const hourMs = 3600 * 1000;
const dayMs = 24 * hourMs;

let mockCases = [
  {
    id: 'DOW-2025-00147',
    subjectName: 'Anderson, R.',
    subjectLastName: 'Anderson',
    subjectFirstInitial: 'R',
    caseType: 'T3',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    assignedTo: 'Smith, A.',
    receivedDate: new Date(now - 5 * dayMs).toISOString(),
    suspenseDate: new Date(now + 19 * hourMs).toISOString(),
    susp3d: new Date(now + 43 * hourMs).toISOString(),
    metSupp48: null,
    metSupp3d: null,
    createdAt: new Date(now - 5 * dayMs).toISOString(),
    updatedAt: new Date(now - 2 * hourMs).toISOString(),
    issues: [
      {
        id: 'iss_a1',
        category: 'F',
        categoryName: 'FINANCIAL',
        categoryLabel: 'Financial Considerations',
        subcategory: 'Delinquent debt',
        guideline: 'Guideline F — Financial Considerations',
        severity: 'MODERATE',
        inMemo: true,
        mitigationType: 'FINANCIAL_REMEDIATION',
        description: 'Subject has $18,000 in delinquent student loan debt. Account placed in default in 2023.',
        mitigations: [
          {
            id: 'mit_a1a',
            type: 'FINANCIAL_REMEDIATION',
            description: 'Subject entered income-driven repayment plan in Jan 2025.',
            date: '2025-01-15',
          },
        ],
        aiSuggested: false,
        createdAt: new Date(now - 4 * dayMs).toISOString(),
      },
      {
        id: 'iss_a2',
        category: 'G',
        categoryName: 'ALCOHOL',
        categoryLabel: 'Alcohol Consumption',
        subcategory: 'DUI arrest',
        guideline: 'Guideline G — Alcohol Consumption',
        severity: 'LOW',
        inMemo: true,
        mitigationType: 'PASSAGE_OF_TIME',
        description: 'Single DUI arrest in 2022. No subsequent incidents. Completed diversion program.',
        mitigations: [
          {
            id: 'mit_a2a',
            type: 'PASSAGE_OF_TIME',
            description: 'Incident occurred over 2 years ago with no recurrence.',
            date: '2022-08-10',
          },
        ],
        aiSuggested: false,
        createdAt: new Date(now - 4 * dayMs).toISOString(),
      },
    ],
    docs: [
      {
        id: 'doc_a1',
        name: 'Investigation Report (ROI)',
        type: 'Investigation Report (ROI)',
        status: 'confirmed',
        uploadedAt: new Date(now - 4 * dayMs).toISOString(),
        extractedFields: [
          { field: 'Subject Full Name', value: 'Anderson, Robert J.', confidence: 0.97 },
          { field: 'SSN (last 4)', value: '••••6812', confidence: 0.99 },
          { field: 'Investigation Opened', value: '2025-01-10', confidence: 0.95 },
        ],
      },
    ],
    comms: [
      {
        id: 'comm_a1',
        type: 'INITIAL_NOTIFICATION',
        direction: 'Outbound',
        subject: 'Case assignment notification',
        body: 'T3 investigation received and assigned to adjudicator Smith, A.',
        suspenseEffect: 'Stops Suspense',
        timestamp: new Date(now - 5 * dayMs).toISOString(),
        author: 'System',
      },
    ],
    memo: null,
  },
  {
    id: 'DOW-2025-00148',
    subjectName: 'Thompson, K.',
    subjectLastName: 'Thompson',
    subjectFirstInitial: 'K',
    caseType: 'T5',
    status: 'RECEIVED',
    priority: 'CRITICAL',
    surgeFlag: true,
    assignedTo: 'Smith, A.',
    receivedDate: new Date(now - 2 * hourMs).toISOString(),
    suspenseDate: new Date(now + 46 * hourMs).toISOString(),
    susp3d: new Date(now + 70 * hourMs).toISOString(),
    metSupp48: null,
    metSupp3d: null,
    createdAt: new Date(now - 2 * hourMs).toISOString(),
    updatedAt: new Date(now - 1 * hourMs).toISOString(),
    issues: [],
    docs: [],
    comms: [
      {
        id: 'comm_t1',
        type: 'ESCALATION_NOTICE',
        direction: 'Inbound',
        subject: 'SURGE priority — 48-hr suspense',
        body: 'T5 SURGE case received. 48-hour suspense clock started.',
        timestamp: new Date(now - 2 * hourMs).toISOString(),
        author: 'System',
      },
    ],
    memo: null,
  },
  {
    id: 'DOW-2025-00141',
    subjectName: 'Rivera, M.',
    subjectLastName: 'Rivera',
    subjectFirstInitial: 'M',
    caseType: 'T3',
    status: 'QA_REVIEW',
    priority: 'NORMAL',
    assignedTo: 'Smith, A.',
    receivedDate: new Date(now - 14 * dayMs).toISOString(),
    suspenseDate: new Date(now + 3 * dayMs).toISOString(),
    susp3d: new Date(now + 3 * dayMs).toISOString(),
    metSupp48: true,
    metSupp3d: null,
    createdAt: new Date(now - 14 * dayMs).toISOString(),
    updatedAt: new Date(now - 6 * hourMs).toISOString(),
    issues: [
      {
        id: 'iss_r1',
        category: 'F',
        categoryName: 'FINANCIAL',
        categoryLabel: 'Financial Considerations',
        severity: 'MODERATE',
        description: 'Subject has $42,000 in delinquent credit card debt across three accounts. Two accounts in collections since 2023.',
        mitigations: [
          {
            id: 'mit_r1a',
            type: 'FINANCIAL_REMEDIATION',
            description: 'Subject entered debt consolidation program in Oct 2024. Provided documentation of payment plan and three on-time payments.',
            date: '2024-10-15',
          },
          {
            id: 'mit_r1b',
            type: 'VOLUNTARY_DISCLOSURE',
            description: 'Subject voluntarily disclosed financial difficulties during interview. Attributed to medical expenses from 2022.',
            date: '2024-09-20',
          },
        ],
        aiSuggested: false,
        createdAt: new Date(now - 10 * dayMs).toISOString(),
      },
      {
        id: 'iss_r2',
        category: 'G',
        categoryName: 'ALCOHOL',
        categoryLabel: 'Alcohol Consumption',
        severity: 'LOW',
        description: 'Single DUI arrest in 2021. No subsequent incidents. Subject completed court-ordered alcohol education program.',
        mitigations: [
          {
            id: 'mit_r2a',
            type: 'PASSAGE_OF_TIME',
            description: 'Incident occurred over 3 years ago with no recurrence.',
            date: '2021-06-10',
          },
          {
            id: 'mit_r2b',
            type: 'TREATMENT_REHABILITATION',
            description: 'Completed 12-week alcohol education course. Certificate on file.',
            date: '2021-11-30',
          },
        ],
        aiSuggested: false,
        createdAt: new Date(now - 10 * dayMs).toISOString(),
      },
    ],
    docs: [
      {
        id: 'doc_r1',
        name: 'Investigation Report (ROI)',
        type: 'Investigation Report (ROI)',
        status: 'confirmed',
        uploadedAt: new Date(now - 12 * dayMs).toISOString(),
        extractedFields: [
          { field: 'Subject Full Name', value: 'Rivera, Maria C.', confidence: 0.98 },
          { field: 'SSN (last 4)', value: '••••3291', confidence: 0.99 },
          { field: 'Investigation Opened', value: '2024-12-01', confidence: 0.96 },
          { field: 'Investigator', value: 'DCSA Field Office — Region IV', confidence: 0.91 },
        ],
      },
      {
        id: 'doc_r2',
        name: 'Credit Report Summary',
        type: 'Credit Report Summary',
        status: 'confirmed',
        uploadedAt: new Date(now - 11 * dayMs).toISOString(),
        extractedFields: [
          { field: 'Total Delinquent', value: '$42,000', confidence: 0.94 },
          { field: 'Accounts in Collections', value: '3', confidence: 0.97 },
          { field: 'Report Date', value: '2024-12-15', confidence: 0.99 },
        ],
      },
      {
        id: 'doc_r3',
        name: 'Interview Summary',
        type: 'Interview Summary',
        status: 'confirmed',
        uploadedAt: new Date(now - 9 * dayMs).toISOString(),
        extractedFields: [
          { field: 'Interview Date', value: '2025-01-05', confidence: 0.98 },
          { field: 'Interviewer', value: 'SA Williams, T.', confidence: 0.92 },
          { field: 'Duration', value: '2h 15m', confidence: 0.88 },
        ],
      },
    ],
    comms: [
      {
        id: 'comm_r1',
        type: 'INITIAL_NOTIFICATION',
        direction: 'Outbound',
        subject: 'Case assignment notification',
        body: 'T3 investigation received and assigned.',
        suspenseEffect: 'Stops Suspense',
        timestamp: new Date(now - 14 * dayMs).toISOString(),
        author: 'System',
      },
      {
        id: 'comm_r2',
        type: 'INFORMATION_REQUEST',
        direction: 'Outbound',
        subject: 'Additional financial documentation needed',
        body: 'Requesting debt consolidation agreement and payment history.',
        timestamp: new Date(now - 10 * dayMs).toISOString(),
        author: 'Smith, A.',
      },
      {
        id: 'comm_r3',
        type: 'INFORMATION_RESPONSE',
        direction: 'Inbound',
        subject: 'Financial docs provided',
        body: 'Debt consolidation agreement and 3 months of payment receipts received.',
        timestamp: new Date(now - 8 * dayMs).toISOString(),
        author: 'Rivera, M.',
      },
      {
        id: 'comm_r4',
        type: 'INTERNAL_NOTE',
        direction: 'Internal',
        subject: 'Memo submitted for QA',
        body: 'Memo of Intent to Deny drafted and submitted for QA review.',
        timestamp: new Date(now - 6 * hourMs).toISOString(),
        author: 'Smith, A.',
      },
    ],
    memo: {
      id: 'memo_r1',
      type: 'MEMO_INTENT_DENY',
      title: 'Memo of Intent to Deny — Rivera, M.',
      status: 'QA_REVIEW',
      disposition: 'UNFAVORABLE',
      summary:
        'Based on the investigation, subject Rivera, M. presents unresolved concerns under Guideline F (Financial Considerations) and mitigated concerns under Guideline G (Alcohol Consumption). The financial delinquencies, while partially addressed through a consolidation plan, remain substantially unresolved and represent a pattern of financial irresponsibility.',
      sections: [
        {
          heading: 'Guideline F — Financial Considerations',
          content:
            'The investigation revealed $42,000 in delinquent credit card debt across three accounts, two of which have been in collections since 2023. While the subject has entered a debt consolidation program and made three on-time payments, the total outstanding balance remains significant. The subject attributed the debt to medical expenses incurred in 2022; however, the credit report indicates spending patterns inconsistent with solely medical costs.',
        },
        {
          heading: 'Guideline G — Alcohol Consumption',
          content:
            'A single DUI arrest in June 2021 was identified. The subject completed a court-ordered 12-week alcohol education program in November 2021. No subsequent alcohol-related incidents have been reported in over three years. This concern is considered mitigated by passage of time and successful completion of rehabilitation.',
        },
        {
          heading: 'Whole-Person Analysis',
          content:
            'Considering the whole-person concept, the subject\'s voluntary disclosure and proactive steps toward financial remediation are noted favorably. However, the magnitude of unresolved debt and the relatively recent initiation of repayment efforts are insufficient to fully mitigate the financial concerns at this time.',
        },
      ],
      createdAt: new Date(now - 1 * dayMs).toISOString(),
      updatedAt: new Date(now - 6 * hourMs).toISOString(),
      author: 'Smith, A.',
    },
  },
  {
    id: 'DOW-2025-00135',
    subjectName: 'Patel, S.',
    subjectLastName: 'Patel',
    subjectFirstInitial: 'S',
    caseType: 'T5',
    status: 'CLOSED_FAVORABLE',
    priority: 'NORMAL',
    assignedTo: 'Smith, A.',
    receivedDate: new Date(now - 30 * dayMs).toISOString(),
    suspenseDate: new Date(now - 5 * dayMs).toISOString(),
    susp3d: new Date(now - 3 * dayMs).toISOString(),
    metSupp48: true,
    metSupp3d: true,
    closedDate: new Date(now - 5 * dayMs).toISOString(),
    createdAt: new Date(now - 30 * dayMs).toISOString(),
    updatedAt: new Date(now - 5 * dayMs).toISOString(),
    issues: [],
    docs: [
      {
        id: 'doc_p1',
        name: 'Investigation Report (ROI)',
        type: 'Investigation Report (ROI)',
        status: 'confirmed',
        uploadedAt: new Date(now - 28 * dayMs).toISOString(),
        extractedFields: [
          { field: 'Subject Full Name', value: 'Patel, Sunita R.', confidence: 0.98 },
          { field: 'SSN (last 4)', value: '••••7504', confidence: 0.99 },
        ],
      },
      {
        id: 'doc_p2',
        name: 'National Agency Check',
        type: 'National Agency Check',
        status: 'confirmed',
        uploadedAt: new Date(now - 27 * dayMs).toISOString(),
        extractedFields: [
          { field: 'NAC Result', value: 'No derogatory information', confidence: 0.96 },
        ],
      },
    ],
    comms: [
      {
        id: 'comm_p1',
        type: 'MEMO_TRANSMISSION',
        direction: 'Outbound',
        subject: 'Favorable determination transmitted',
        body: 'Memo of favorable determination transmitted to requesting agency.',
        timestamp: new Date(now - 5 * dayMs).toISOString(),
        author: 'Smith, A.',
      },
    ],
    memo: {
      id: 'memo_p1',
      type: 'MEMO_FAVORABLE',
      title: 'Memo of Favorable Determination — Patel, S.',
      status: 'SUBMITTED',
      disposition: 'FAVORABLE',
      summary:
        'Investigation revealed no derogatory information. Subject meets all requirements for Top Secret / SCI eligibility.',
      sections: [
        {
          heading: 'Summary of Investigation',
          content:
            'National Agency Check, credit review, employment verification, and reference checks returned no derogatory information. Subject has no financial concerns, no criminal history, and no foreign contacts of concern.',
        },
      ],
      createdAt: new Date(now - 7 * dayMs).toISOString(),
      updatedAt: new Date(now - 5 * dayMs).toISOString(),
      author: 'Smith, A.',
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findMockCase(id) {
  return mockCases.find((c) => c.id === id);
}

function cloneCase(c) {
  return JSON.parse(JSON.stringify(c));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCases() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/cases');
      const rows = data.data || data;
      return Array.isArray(rows) ? rows.map(normalizeCaseSummary) : [];
    } catch {
      // fall through to mock
    }
  }
  return mockCases.map((c) => {
    const { issues, docs, comms, memo, ...summary } = c;
    return {
      ...summary,
      issueCount: issues.length,
      docCount: docs.length,
      confirmedDocCount: docs.filter((d) => d.status === 'confirmed').length,
      commCount: comms.length,
      hasMemo: !!memo,
    };
  });
}

export async function getCase(id) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get(`/cases/${id}`);
      return normalizeCase(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const c = findMockCase(id);
  if (!c) throw new Error(`Case ${id} not found`);
  return cloneCase(c);
}

export async function createCase(data) {
  if (!USE_MOCK) {
    try {
      const body = denormalizeCase(data);
      const { data: resp } = await api.post('/cases', body);
      return normalizeCase(resp.data || resp);
    } catch {
      // fall through to mock
    }
  }
  const seq = String(mockCases.length + 149).padStart(5, '0');
  const newCase = {
    subjectName: data.subjectName || 'Unknown',
    subjectLastName: data.subjectLastName || 'Unknown',
    subjectFirstInitial: data.subjectFirstInitial || '?',
    caseType: data.caseType || 'T3',
    priority: data.priority || 'NORMAL',
    assignedTo: data.assignedTo || 'Smith, A.',
    receivedDate: new Date().toISOString(),
    suspenseDate: data.suspenseDate || new Date(Date.now() + 14 * dayMs).toISOString(),
    issues: [],
    docs: [],
    comms: [],
    memo: null,
    ...data,
    id: `DOW-2025-${seq}`,
    status: 'RECEIVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockCases.push(newCase);
  return cloneCase(newCase);
}

export async function updateCase(id, data) {
  if (!USE_MOCK) {
    try {
      const body = denormalizeCase(data);
      const { data: resp } = await api.put(`/cases/${id}`, body);
      return normalizeCase(resp.data || resp);
    } catch {
      // fall through to mock
    }
  }
  const c = findMockCase(id);
  if (!c) throw new Error(`Case ${id} not found`);
  Object.assign(c, data, { updatedAt: new Date().toISOString() });
  return cloneCase(c);
}

export async function addIssue(caseId, issue) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post(`/cases/${caseId}/issues`, issue);
      return normalizeIssue(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const c = findMockCase(caseId);
  if (!c) throw new Error(`Case ${caseId} not found`);
  const newIssue = {
    id: genId(),
    mitigations: [],
    aiSuggested: false,
    createdAt: new Date().toISOString(),
    ...issue,
  };
  c.issues.push(newIssue);
  c.updatedAt = new Date().toISOString();
  return cloneCase(newIssue);
}

export async function deleteIssue(caseId, issueId) {
  if (!USE_MOCK) {
    try {
      await api.delete(`/cases/${caseId}/issues/${issueId}`);
      return { success: true };
    } catch {
      // fall through to mock
    }
  }
  const c = findMockCase(caseId);
  if (!c) throw new Error(`Case ${caseId} not found`);
  const idx = c.issues.findIndex((i) => i.id === issueId);
  if (idx === -1) throw new Error(`Issue ${issueId} not found`);
  c.issues.splice(idx, 1);
  c.updatedAt = new Date().toISOString();
  return { success: true };
}

export async function addCommunication(caseId, comm) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post(`/cases/${caseId}/communications`, comm);
      return normalizeComm(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const c = findMockCase(caseId);
  if (!c) throw new Error(`Case ${caseId} not found`);
  const newComm = {
    id: genId(),
    timestamp: new Date().toISOString(),
    author: 'Smith, A.',
    ...comm,
  };
  c.comms.push(newComm);
  c.updatedAt = new Date().toISOString();
  return cloneCase(newComm);
}

export async function saveMemo(caseId, memoData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.put(`/cases/${caseId}/memo`, memoData);
      return normalizeMemo(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const c = findMockCase(caseId);
  if (!c) throw new Error(`Case ${caseId} not found`);
  if (c.memo) {
    Object.assign(c.memo, memoData, { updatedAt: new Date().toISOString() });
  } else {
    c.memo = {
      id: genId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Smith, A.',
      ...memoData,
    };
  }
  c.updatedAt = new Date().toISOString();
  return cloneCase(c.memo);
}
