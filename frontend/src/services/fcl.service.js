import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockRecords = [
  {
    id: 'fcl_001',
    facilityName: 'Northrop Grumman — Falls Church',
    cageCode: '80209',
    clearanceLevel: 'TOP SECRET',
    status: 'ACTIVE',
    expirationDate: '2026-09-15',
    sponsoringAgency: 'DoD',
    updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'fcl_002',
    facilityName: 'Raytheon Technologies — El Segundo',
    cageCode: '14839',
    clearanceLevel: 'SECRET',
    status: 'ACTIVE',
    expirationDate: '2027-03-01',
    sponsoringAgency: 'DoD',
    updatedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

const mockStats = {
  total: 2,
  active: 2,
  expiringSoon: 0,
  byLevel: { 'TOP SECRET': 1, SECRET: 1 },
};

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeRecord(r) {
  if (!r) return r;
  return {
    id: r.id,
    facilityName: r.facility_name || r.facilityName || '',
    cageCode: r.cage_code || r.cageCode || '',
    clearanceLevel: r.clearance_level || r.clearanceLevel || '',
    status: r.status || '',
    expirationDate: r.expiration_date || r.expirationDate || '',
    sponsoringAgency: r.sponsoring_agency || r.sponsoringAgency || '',
    createdAt: r.created_at || r.createdAt || '',
    updatedAt: r.updated_at || r.updatedAt || '',
  };
}

function normalizeStats(s) {
  if (!s) return s;
  return {
    total: s.total ?? 0,
    active: s.active ?? 0,
    expiringSoon: s.expiring_soon ?? s.expiringSoon ?? 0,
    byLevel: s.by_level || s.byLevel || {},
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getRecords() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/fcl');
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
      const { data } = await api.get('/fcl/stats');
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
      const { data } = await api.post('/fcl', recordData);
      return normalizeRecord(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const newRecord = {
    id: `fcl_${String(mockRecords.length + 1).padStart(3, '0')}`,
    status: 'PENDING',
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
      const { data } = await api.put(`/fcl/${id}`, recordData);
      return normalizeRecord(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const r = mockRecords.find((rec) => rec.id === id);
  if (!r) throw new Error(`FCL record ${id} not found`);
  Object.assign(r, recordData, { updatedAt: new Date().toISOString() });
  return { ...r };
}
