export const queryKeys = {
  cases: {
    all: ['cases'],
    list: (filters) => ['cases', 'list', filters],
    detail: (id) => ['cases', 'detail', id],
  },
  documents: {
    all: ['documents'],
    byCase: (caseId) => ['documents', 'case', caseId],
  },
  policies: {
    all: ['policies'],
    detail: (id) => ['policies', 'detail', id],
  },
  metrics: {
    dashboard: ['metrics', 'dashboard'],
    workload: ['metrics', 'workload'],
  },
  notifications: {
    all: ['notifications'],
  },
  fcl: {
    all: ['fcl'],
  },
  travel: {
    all: ['travel'],
  },
  violations: {
    all: ['violations'],
  },
  audit: {
    all: ['audit'],
  },
  qa: {
    queue: ['qa', 'queue'],
  },
};
