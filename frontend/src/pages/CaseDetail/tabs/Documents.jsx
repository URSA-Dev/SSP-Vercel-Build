import { useState } from 'react';
import {
  uploadDocument,
  confirmExtraction,
  rejectExtraction,
} from '../../../services/documents.service';
import { docStatusBadge } from '../../../utils/format';
import { fmtDate } from '../../../utils/dates';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../../components/Card/Card';
import ConfidenceBar from '../../../components/ConfidenceBar/ConfidenceBar';
import EmptyState from '../../../components/EmptyState/EmptyState';
import UploadDocModal from '../../../components/modals/UploadDocModal';
import ConfirmDocModal from '../../../components/modals/ConfirmDocModal';
import { useToast } from '../../../components/Toast/toast-context';

function formatSize(bytes) {
  if (!bytes) return '\u2014';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function Documents({ caseData, onRefresh }) {
  const [confirming, setConfirming] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDoc, setConfirmDoc] = useState(null);
  const docs = caseData.docs || [];
  const toast = useToast();

  async function handleUpload(files, docType) {
    try {
      for (const file of files) {
        await uploadDocument(caseData.id, file, docType);
      }
      await onRefresh();
      setUploadOpen(false);
      toast('Document uploaded — AI extraction started', 'success');
    } catch {
      toast('Failed to upload document', 'error');
    }
  }

  async function handleConfirm(docId, fields) {
    setConfirming(docId);
    try {
      await confirmExtraction(caseData.id, docId, fields);
      await onRefresh();
      setConfirmDoc(null);
      toast('Document extraction confirmed', 'success');
    } catch {
      toast('Failed to confirm extraction', 'error');
    } finally {
      setConfirming(null);
    }
  }

  async function handleReject(docId) {
    try {
      await rejectExtraction(caseData.id, docId, 'Re-extraction requested');
      await onRefresh();
      setConfirmDoc(null);
      toast('Document sent for re-extraction', 'info');
    } catch {
      toast('Failed to reject extraction', 'error');
    }
  }

  return (
    <div>
      <UploadDocModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
      />

      <ConfirmDocModal
        isOpen={!!confirmDoc}
        onClose={() => setConfirmDoc(null)}
        onConfirm={(fields) => handleConfirm(confirmDoc?.id, fields)}
        onReject={() => handleReject(confirmDoc?.id)}
        document={confirmDoc}
      />

      <div className="flex jb aic mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-2)' }}>
          Documents ({docs.length})
        </h3>
        <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
          Upload Document
        </Button>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          icon="\uD83D\uDCC4"
          title="No documents uploaded"
          subtitle="Upload investigation documents to begin AI extraction."
        />
      ) : (
        <div className="flex fcol gap-3">
          {docs.map((doc) => {
            const ds = docStatusBadge(doc.status);
            const avgConfidence =
              doc.extractedFields?.length > 0
                ? doc.extractedFields.reduce((sum, f) => sum + f.confidence, 0) /
                  doc.extractedFields.length
                : null;

            return (
              <Card key={doc.id}>
                <CardBody>
                  {/* Doc row */}
                  <div className="flex jb aic" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                        {doc.name}
                      </div>
                      <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                        {doc.type} &middot; {formatSize(doc.size)} &middot; Uploaded {fmtDate(doc.uploadedAt)}
                      </div>
                    </div>
                    <div className="flex aic gap-3">
                      {avgConfidence != null && (
                        <div style={{ width: 120 }}>
                          <ConfidenceBar confidence={avgConfidence} />
                        </div>
                      )}
                      <Badge variant={ds.variant}>{ds.label}</Badge>
                      {doc.status === 'awaiting' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={confirming === doc.id}
                          onClick={() => setConfirmDoc(doc)}
                        >
                          {confirming === doc.id ? 'Confirming...' : 'Review & Confirm'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Extracted fields */}
                  {doc.status === 'confirmed' && doc.extractedFields?.length > 0 && (
                    <div
                      className="gr3 mt-3"
                      style={{
                        padding: '12px',
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--r-sm)',
                        fontSize: '13px',
                      }}
                    >
                      {doc.extractedFields.map((ef, i) => (
                        <div key={i}>
                          <div className="text-xs text-muted">{ef.field}</div>
                          <div className="fw-6" style={{ marginTop: 2 }}>
                            {ef.value}
                          </div>
                          <div style={{ marginTop: 4, width: 80 }}>
                            <ConfidenceBar confidence={ef.confidence} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Documents;
