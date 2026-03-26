import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockMetrics = {
  activeCases: 3,
  atRisk: 1,
  aiExtractions: 2,
  qaPending: 1,
  avgProcessingDays: 12.4,
  casesThisMonth: 7,
  favorableRate: 0.82,
  byStatus: {
    RECEIVED: 1,
    IN_REVIEW: 1,
    QA_REVIEW: 1,
    CLOSED_FAVORABLE: 1,
  },
  byPriority: {
    CRITICAL: 1,
    HIGH: 1,
    NORMAL: 2,
  },
  byCaseType: {
    T3: 2,
    T5: 2,
  },
};

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeMetrics(m) {
  if (!m) return m;
  return {
    activeCases: m.active_cases ?? m.activeCases ?? 0,
    atRisk: m.at_risk ?? m.atRisk ?? 0,
    aiExtractions: m.ai_extractions ?? m.aiExtractions ?? 0,
    qaPending: m.qa_pending ?? m.qaPending ?? 0,
    avgProcessingDays: m.avg_processing_days ?? m.avgProcessingDays ?? 0,
    casesThisMonth: m.cases_this_month ?? m.casesThisMonth ?? 0,
    favorableRate: m.favorable_rate ?? m.favorableRate ?? 0,
    byStatus: m.by_status || m.byStatus || {},
    byPriority: m.by_priority || m.byPriority || {},
    byCaseType: m.by_case_type || m.byCaseType || {},
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getDashboardMetrics() {
  if (!USE_MOCK) {
    try {
      const { data } = await api.get('/metrics/dashboard');
      return normalizeMetrics(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  return { ...mockMetrics };
}
