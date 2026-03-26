import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockQueue = [
  {
    id: 'qa_001',
    caseId: 'DOW-2025-00141',
    caseNumber: 'DOW-2025-00141',
    subjectName: 'Rivera, M.',
    caseType: 'T3',
    memoType: 'MEMO_INTENT_DENY',
    disposition: 'UNFAVORABLE',
    submittedBy: 'Smith, A.',
    submittedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    status: 'PENDING',
    issueCount: 2,
  },
];

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeQaItem(q) {
  if (!q) return q;
  return {
    id: q.id,
    caseId: q.case_id || q.caseId || '',
    caseNumber: q.case_number || q.caseNumber || '',
    subjectName: q.subject_name || q.subjectName || '',
    caseType: q.case_type || q.caseType || '',
    memoType: q.memo_type || q.memoType || '',
    disposition: q.disposition || null,
    submittedBy: q.submitted_by || q.submittedBy || '',
    submittedAt: q.submitted_at || q.submittedAt || '',
    status: q.status || 'PENDING',
    issueCount: q.issue_count ?? q.issueCount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getQueue() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/qa/queue');
      const rows = data.data || data;
      return Array.isArray(rows) ? rows.map(normalizeQaItem) : [];
    } catch {
      // fall through to mock
    }
  }
  return [...mockQueue];
}

export async function submitReview(qaId, reviewData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post(`/qa/${qaId}/review`, reviewData);
      return normalizeQaItem(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const item = mockQueue.find((q) => q.id === qaId);
  if (item) {
    item.status = reviewData.approved ? 'APPROVED' : 'RETURNED';
  }
  return item ? { ...item } : { id: qaId, status: reviewData.approved ? 'APPROVED' : 'RETURNED' };
}
