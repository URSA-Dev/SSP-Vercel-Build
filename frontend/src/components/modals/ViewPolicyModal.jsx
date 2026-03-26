import React from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Badge from '../Badge/Badge';

const STATUS_VARIANT = {
  Active: 'green',
  Draft: 'amber',
  Archived: 'gray',
  'Under Review': 'blue',
};

const TYPE_VARIANT = {
  Regulation: 'blue',
  Directive: 'purple',
  Guidance: 'green',
  Policy: 'gray',
};

function ViewPolicyModal({ isOpen, onClose, onEdit, policy }) {
  if (!policy) return null;

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Close</Button>
      {onEdit && (
        <Button variant="primary" onClick={() => onEdit?.(policy)}>
          Edit in Policy Dev &rarr;
        </Button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={policy.title || 'Policy Document'}
      size="lg"
      footer={footer}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}>
        <Badge variant={STATUS_VARIANT[policy.status] || 'gray'}>{policy.status || 'Unknown'}</Badge>
        <Badge variant={TYPE_VARIANT[policy.type] || 'gray'}>{policy.type || 'Policy'}</Badge>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        padding: '12px 16px',
        background: 'var(--surface, #f9fafb)',
        borderRadius: '8px',
        fontSize: '13px',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ color: 'var(--ink-light, #6b7280)', marginBottom: '2px' }}>Version</div>
          <div style={{ fontWeight: 600 }}>{policy.version || '---'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--ink-light, #6b7280)', marginBottom: '2px' }}>Author</div>
          <div style={{ fontWeight: 600 }}>{policy.author || '---'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--ink-light, #6b7280)', marginBottom: '2px' }}>Last Revised</div>
          <div style={{ fontWeight: 600 }}>{policy.lastRevised || '---'}</div>
        </div>
      </div>

      <div style={{
        background: 'var(--surface, #f9fafb)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '8px',
        padding: '20px',
        maxHeight: '400px',
        overflow: 'auto',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: '13px',
        lineHeight: '1.7',
        whiteSpace: 'pre-wrap',
      }}>
        {policy.content || 'No policy content available.'}
      </div>
    </Modal>
  );
}

export default ViewPolicyModal;
