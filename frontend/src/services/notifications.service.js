import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

let mockNotifications = [
  {
    id: 'n1',
    type: 'ESCALATION_NOTICE',
    title: 'SURGE case assigned',
    message: 'DOW-2025-00148 (Thompson K.) — T5 SURGE priority, 48-hr suspense',
    caseId: 'DOW-2025-00148',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'STATUS_UPDATE',
    title: 'QA review complete',
    message: 'DOW-2025-00141 (Rivera M.) passed QA review — ready for final review',
    caseId: 'DOW-2025-00141',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    read: false,
  },
];

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeNotification(n) {
  if (!n) return n;
  return {
    id: n.id,
    type: n.type || n.notification_type || '',
    title: n.title || '',
    message: n.message || n.body || '',
    caseId: n.caseId || n.case_id || null,
    timestamp: n.timestamp || n.created_at || n.createdAt || '',
    read: n.read ?? n.is_read ?? false,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getNotifications() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/notifications');
      const rows = data.data || data;
      return Array.isArray(rows) ? rows.map(normalizeNotification) : [];
    } catch {
      // fall through to mock
    }
  }
  return [...mockNotifications];
}

export async function clearNotifications() {
  if (!USE_MOCK) {
    try {
      await api.delete('/notifications/clear');
      return [];
    } catch {
      // fall through to mock
    }
  }
  mockNotifications = [];
  return [];
}
