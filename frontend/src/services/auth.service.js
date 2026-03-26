import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const DEMO_USER = {
  id: 'usr_001',
  last_name: 'Smith',
  first_initial: 'A',
  email: 'a.smith@ursamobile.com',
  role: 'ADJUDICATOR',
  unit: 'URSA Mobile',
};

const DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-ssp-token';

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeUser(u) {
  if (!u) return u;
  return {
    id: u.id,
    lastName: u.last_name || u.lastName || '',
    firstInitial: u.first_initial || u.firstInitial || '',
    email: u.email || '',
    role: u.role || '',
    unit: u.unit || '',
    // Keep legacy flat fields for backward compat
    last_name: u.last_name || u.lastName || '',
    first_initial: u.first_initial || u.firstInitial || '',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function login(email, password) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const result = data.data || data;
      const token = result.token;
      if (token) {
        localStorage.setItem('ssp_token', token);
      }
      return { token, user: normalizeUser(result.user) };
    } catch {
      // fall through to mock
    }
  }
  localStorage.setItem('ssp_token', DEMO_TOKEN);
  return { token: DEMO_TOKEN, user: normalizeUser({ ...DEMO_USER, email }) };
}

export async function logout() {
  if (!USE_MOCK) {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear token regardless
    }
  }
  localStorage.removeItem('ssp_token');
}

export async function getCurrentUser() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/auth/me');
      const user = data.data || data;
      return normalizeUser(user);
    } catch {
      // fall through to mock
    }
  }
  const token = localStorage.getItem('ssp_token');
  if (!token) return null;
  return normalizeUser({ ...DEMO_USER });
}
