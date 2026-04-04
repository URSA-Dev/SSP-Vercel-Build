import api, { USE_MOCK } from './api';

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
  return [];
}

/**
 * Get a single subject by ID.
 */
export async function getSubject(id) {
  if (!USE_MOCK) {
    const { data } = await api.get(`/subjects/${id}`);
    return data.data || data;
  }
  return null;
}
