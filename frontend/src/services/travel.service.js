import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockRecords = [
  {
    id: 'trv_001',
    subjectName: 'Anderson, R.',
    caseId: 'DOW-2025-00147',
    destination: 'Germany',
    purpose: 'Conference',
    departureDate: '2025-04-10',
    returnDate: '2025-04-17',
    status: 'APPROVED',
    briefingComplete: true,
    debriefComplete: false,
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const mockStats = {
  total: 1,
  pending: 0,
  approved: 1,
  awaitingDebrief: 1,
  byCountry: { Germany: 1 },
};

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeRecord(r) {
  if (!r) return r;
  return {
    id: r.id,
    subjectName: r.subject_name || r.subjectName || '',
    caseId: r.case_id || r.caseId || null,
    destination: r.destination || r.country || '',
    purpose: r.purpose || '',
    departureDate: r.departure_date || r.departureDate || '',
    returnDate: r.return_date || r.returnDate || '',
    status: r.status || '',
    briefingComplete: r.briefing_complete ?? r.briefingComplete ?? false,
    debriefComplete: r.debrief_complete ?? r.debriefComplete ?? false,
    createdAt: r.created_at || r.createdAt || '',
    updatedAt: r.updated_at || r.updatedAt || '',
  };
}

function normalizeStats(s) {
  if (!s) return s;
  return {
    total: s.total ?? 0,
    pending: s.pending ?? 0,
    approved: s.approved ?? 0,
    awaitingDebrief: s.awaiting_debrief ?? s.awaitingDebrief ?? 0,
    byCountry: s.by_country || s.byCountry || {},
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getRecords() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/travel');
      const rows = data.data || data;
      return Array.isArray(rows) ? rows.map(normalizeRecord) : [];
    } catch {
      // fall through to mock
    }
  }
  return [...mockRecords];
}

export async function getStats() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/travel/stats');
      return normalizeStats(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  return { ...mockStats };
}

export async function createRecord(recordData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post('/travel', recordData);
      return normalizeRecord(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const newRecord = {
    id: `trv_${String(mockRecords.length + 1).padStart(3, '0')}`,
    status: 'PENDING',
    briefingComplete: false,
    debriefComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...recordData,
  };
  mockRecords.push(newRecord);
  return { ...newRecord };
}

export async function updateRecord(id, recordData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.put(`/travel/${id}`, recordData);
      return normalizeRecord(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const r = mockRecords.find((rec) => rec.id === id);
  if (!r) throw new Error(`Travel record ${id} not found`);
  Object.assign(r, recordData, { updatedAt: new Date().toISOString() });
  return { ...r };
}
