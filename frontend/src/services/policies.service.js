import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockPolicies = [
  {
    id: 'pol_001',
    title: 'Guideline F — Financial Considerations',
    category: 'F',
    version: '2.1',
    status: 'ACTIVE',
    effectiveDate: '2024-06-01',
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    summary: 'Conditions that could raise a security concern and may be disqualifying include failure to meet financial obligations and unwillingness to satisfy debts.',
  },
  {
    id: 'pol_002',
    title: 'Guideline G — Alcohol Consumption',
    category: 'G',
    version: '1.3',
    status: 'ACTIVE',
    effectiveDate: '2024-06-01',
    updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    summary: 'Excessive alcohol consumption often leads to the exercise of questionable judgment or the failure to control impulses.',
  },
];

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizePolicy(p) {
  if (!p) return p;
  return {
    id: p.id,
    title: p.title || '',
    category: p.category || '',
    version: p.version || '1.0',
    status: p.status || 'DRAFT',
    effectiveDate: p.effective_date || p.effectiveDate || '',
    createdAt: p.created_at || p.createdAt || '',
    updatedAt: p.updated_at || p.updatedAt || '',
    summary: p.summary || p.description || '',
    content: p.content || '',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getPolicies() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/policies');
      const rows = data.data || data;
      return Array.isArray(rows) ? rows.map(normalizePolicy) : [];
    } catch {
      // fall through to mock
    }
  }
  return [...mockPolicies];
}

export async function getPolicy(id) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get(`/policies/${id}`);
      return normalizePolicy(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const p = mockPolicies.find((pol) => pol.id === id);
  if (!p) throw new Error(`Policy ${id} not found`);
  return { ...p };
}

export async function createPolicy(policyData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post('/policies', policyData);
      return normalizePolicy(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const newPolicy = {
    id: `pol_${String(mockPolicies.length + 1).padStart(3, '0')}`,
    status: 'DRAFT',
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...policyData,
  };
  mockPolicies.push(newPolicy);
  return { ...newPolicy };
}

export async function updatePolicy(id, policyData) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.put(`/policies/${id}`, policyData);
      return normalizePolicy(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  const p = mockPolicies.find((pol) => pol.id === id);
  if (!p) throw new Error(`Policy ${id} not found`);
  Object.assign(p, policyData, { updatedAt: new Date().toISOString() });
  return { ...p };
}

export async function deletePolicy(id) {
  if (!USE_MOCK) {
    try {
      await api.delete(`/policies/${id}`);
      return { success: true };
    } catch {
      // fall through to mock
    }
  }
  const idx = mockPolicies.findIndex((p) => p.id === id);
  if (idx !== -1) mockPolicies.splice(idx, 1);
  return { success: true };
}
