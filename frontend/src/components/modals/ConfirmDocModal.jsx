import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import Badge from '../Badge/Badge';
import ConfidenceBar from '../ConfidenceBar/ConfidenceBar';
import Input from '../FormControls/Input';
import FormGrid from '../FormControls/FormGrid';

function fieldBorderColor(confidence) {
  if (confidence == null) return undefined;
  const pct = Math.round(confidence * 100);
  if (pct >= 90) return '2px solid var(--green, #16a34a)';
  if (pct >= 70) return '2px solid var(--amber, #d97706)';
  return '2px solid var(--ink-lighter, #d1d5db)';
}

function ConfirmDocModal({ isOpen, onClose, onConfirm, onReject, document: doc }) {
  const [editedFields, setEditedFields] = useState({});

  useEffect(() => {
    if (isOpen && doc?.extractedFields) {
      const initial = {};
      doc.extractedFields.forEach((f) => {
        initial[f.key] = f.value || '';
      });
      setEditedFields(initial);
    }
  }, [isOpen, doc]);

  if (!doc) return null;

  const handleFieldChange = (key) => (e) => {
    setEditedFields((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleConfirm = () => {
    onConfirm?.({ ...doc, confirmedFields: editedFields });
  };

  const footer = (
    <>
      <Button variant="danger" onClick={onReject}>Reject (Reclassify)</Button>
      <div style={{ flex: 1 }} />
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleConfirm}>Confirm &amp; Lock</Button>
    </>
  );

  const overallConfidence = doc.confidence != null ? doc.confidence : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm AI-Extracted Fields"
      subtitle="Review and correct extracted data before locking"
      size="lg"
      footer={footer}
    >
      <Alert variant="amber" icon="!" title="Review Required">
        AI has extracted the following fields. Please review each value for accuracy before confirming.
        Fields with lower confidence scores may require manual correction.
      </Alert>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        background: 'var(--surface, #f9fafb)',
        borderRadius: '8px',
        marginTop: '12px',
        marginBottom: '16px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{doc.filename || 'Document'}</div>
          <div style={{ fontSize: '13px', color: 'var(--ink-light, #6b7280)' }}>
            {doc.type || 'Unknown type'}
          </div>
        </div>
        <div style={{ minWidth: '160px' }}>
          <ConfidenceBar confidence={overallConfidence} />
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(74,92,47,0.04) 0%, rgba(74,92,47,0.08) 100%)',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid var(--border, #e5e7eb)',
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--ink-light, #6b7280)',
          marginBottom: '12px',
        }}>
          AI Extraction Results
        </div>
        <FormGrid columns={2}>
          {(doc.extractedFields || []).map((field) => (
            <Input
              key={field.key}
              label={field.label || field.key}
              value={editedFields[field.key] || ''}
              onChange={handleFieldChange(field.key)}
              style={{ border: fieldBorderColor(field.confidence) }}
              hint={field.confidence != null ? `${Math.round(field.confidence * 100)}% confidence` : undefined}
            />
          ))}
        </FormGrid>
      </div>
    </Modal>
  );
}

export default ConfirmDocModal;
