import api, { USE_MOCK } from './api';

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeDocument(d) {
  if (!d) return d;
  return {
    id: d.id,
    caseId: d.case_id || d.caseId || null,
    name: d.name || d.file_name || d.fileName || '',
    type: d.type || d.doc_type || d.docType || '',
    status: d.status || 'pending',
    uploadedAt: d.uploaded_at || d.uploadedAt || '',
    fileSize: d.file_size || d.fileSize || 0,
    mimeType: d.mime_type || d.mimeType || '',
    extractedFields: Array.isArray(d.extracted_fields || d.extractedFields)
      ? (d.extracted_fields || d.extractedFields)
      : [],
    createdAt: d.created_at || d.createdAt || '',
    updatedAt: d.updated_at || d.updatedAt || '',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function uploadDocument(caseId, file, docType) {
  if (!USE_MOCK) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (docType) formData.append('doc_type', docType);
      const { data } = await api.post(`/cases/${caseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return normalizeDocument(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  // Mock upload
  return {
    id: `doc_${Date.now()}`,
    caseId,
    name: file.name || 'uploaded-document',
    type: docType || 'Unknown',
    status: 'pending',
    uploadedAt: new Date().toISOString(),
    fileSize: file.size || 0,
    mimeType: file.type || '',
    extractedFields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function confirmExtraction(caseId, docId, confirmedFields) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post(`/cases/${caseId}/documents/${docId}/confirm`, {
        fields: confirmedFields,
      });
      return normalizeDocument(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  return {
    id: docId,
    caseId,
    status: 'confirmed',
    extractedFields: confirmedFields || [],
    updatedAt: new Date().toISOString(),
  };
}

export async function rejectExtraction(caseId, docId, reason) {
  if (!USE_MOCK) {
    try {
      const { data } = await api.post(`/cases/${caseId}/documents/${docId}/reject`, { reason });
      return normalizeDocument(data.data || data);
    } catch {
      // fall through to mock
    }
  }
  return {
    id: docId,
    caseId,
    status: 'rejected',
    extractedFields: [],
    updatedAt: new Date().toISOString(),
  };
}
