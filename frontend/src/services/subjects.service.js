import api, { USE_MOCK } from './api';

// Mock subjects store — matches mock cases
const mockSubjects = [
  {
    id: 'subj-001',
    subject_last: 'Anderson',
    subject_init: 'R',
    middle_init: null,
    dob_year: 1988,
    case_id: 'CID-00001',
    case_count: 1,
  },
  {
    id: 'subj-002',
    subject_last: 'Thompson',
    subject_init: 'K',
    middle_init: null,
    dob_year: 1992,
    case_id: 'CID-00002',
    case_count: 1,
  },
  {
    id: 'subj-003',
    subject_last: 'Rivera',
    subject_init: 'M',
    middle_init: 'C',
    dob_year: 1985,
    case_id: 'CID-00003',
    case_count: 1,
  },
  {
    id: 'subj-004',
    subject_last: 'Patel',
    subject_init: 'S',
    middle_init: 'R',
    dob_year: 1990,
    case_id: 'CID-00004',
    case_count: 1,
  },
];

/**
 * Search for an existing subject by name identifiers.
 * Returns array of matches (0 or 1) with case_count.
 */
export async function searchSubjects({ lastName, init, middleInit, dobYear }) {
  if (!USE_MOCK) {
    try {
      const params = {};
      if (lastName) params.q = lastName;
      if (init) params.init = init;
      if (middleInit) params.middleInit = middleInit;
      if (dobYear) params.dobYear = dobYear;

      const { data } = await api.get('/subjects/search', { params });
      return data.data || [];
    } catch {
      return [];
    }
  }

  // Mock: search by last name + init (case-insensitive)
  if (!lastName || !init) return [];
  const match = mockSubjects.find(
    (s) =>
      s.subject_last.toLowerCase() === lastName.toLowerCase() &&
      s.subject_init.toUpperCase() === init.toUpperCase(),
  );
  return match ? [match] : [];
}

/**
 * Get a single subject by ID.
 */
export async function getSubject(id) {
  if (!USE_MOCK) {
    const { data } = await api.get(`/subjects/${id}`);
    return data.data || data;
  }
  return mockSubjects.find((s) => s.id === id) || null;
}
