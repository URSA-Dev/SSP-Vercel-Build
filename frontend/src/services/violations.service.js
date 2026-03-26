import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockViolations = [
  {
    id: 'vio_001',
    caseId: null,
    subjectName: 'Johnson, T.',
    violationType: 'UNAUTHORIZED_DISCLOSURE',
    severity: 'HIGH',
    description: 'Classified document left unsecured in common area.',
    reportedDate: '2025-02-10',
    status: 'UNDER_INVESTIGATION',
    assignedTo: 'Smith, A.',
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const mockStats = {
  total: 1,
  open: 1,
  closed: 0,
  bySeverity: { HIGH: 1 },
  byType: { UNAUTHORIZED_DISCLOSURE: 1 },
};

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeViolation(v) {
  if (!v) return v;
  return {
    id: v.id,
    caseId: v.case_id || v.caseId || null,
    subjectName: v.subject_name || v.subjectName || '',
    violationType: v.violation_type || v.violationType || '',
    severity: v.severity || '',
    description: v.description || '',
    reportedDate: v.reported_date || v.reportedDate || '',
    status: v.status || '',
    assignedTo: v.assigned_to || v.assignedTo || '',
    resolution: v.resolution || null,
    createdAt: v.created_at || v.createdAt || '',
    updatedAt: v.updated_at || v.updatedAt || '',
  };
}

function normalizeStats(s) {
  if (!s) return s;
  return {
    total: s.total ?? 0,
    open: s.open ?? 0,
    closed: s.closed ?? 0,
    bySeverity: s.by_severity || s.bySeverity || {},
    byType: s.by_type || s.byType || {},
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getViolations() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/violations');
      const rows = data.data || data;
      return Array.isArray(rows) ? rows.map(normalizeViolation) : [];
    } catch {
      // fall through to mock
    }
  }
  return [...mockViolations];
}

export async function getStats() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/violations/stats');
      return normalizeStats(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  return { ...mockStats };
}

export async function createViolation(violationData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post('/violations', violationData);
      return normalizeViolation(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const newViolation = {
    id: `vio_${String(mockViolations.length + 1).padStart(3, '0')}`,
    status: 'REPORTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...violationData,
  };
  mockViolations.push(newViolation);
  return { ...newViolation };
}

export async function updateViolation(id, violationData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.put(`/violations/${id}`, violationData);
      return normalizeViolation(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const v = mockViolations.find((vio) => vio.id === id);
  if (!v) throw new Error(`Violation ${id} not found`);
  Object.assign(v, violationData, { updatedAt: new Date().toISOString() });
  return { ...v };
}
