import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Select from '../FormControls/Select';
import Input from '../FormControls/Input';
import Textarea from '../FormControls/Textarea';

const QA_CHECKLIST = [
  'All required sections present',
  'Each issue linked to Guideline A-M',
  'WHOLE-PERSON addresses aggravating & mitigating',
  'Recommendation consistent with severity',
  'No unsupported conclusions',
  'No [ADJUDICATOR INPUT REQUIRED] placeholders',
  'Free of subject PII',
  'Professional language',
];

const OUTCOME_OPTIONS = [
  { value: 'PASSED', label: 'Passed' },
  { value: 'MINOR_REVISIONS', label: 'Minor Revisions' },
  { value: 'MAJOR_REVISIONS', label: 'Major Revisions' },
  { value: 'REJECTED', label: 'Rejected' },
];

function QaReviewModal({ isOpen, onClose, onSubmit, memoText, reviewer }) {
  const [checklist, setChecklist] = useState([]);
  const [outcome, setOutcome] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (isOpen) {
      setChecklist(QA_CHECKLIST.map(() => true));
      setOutcome('');
      setComments('');
    }
  }, [isOpen]);

  const toggleItem = (index) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const isValid = outcome !== '';

  const handleSubmit = () => {
    if (!isValid) return;
    const failedItems = QA_CHECKLIST.filter((_, i) => !checklist[i]);
    onSubmit?.({
      outcome,
      comments,
      checklist: QA_CHECKLIST.map((label, i) => ({ label, passed: checklist[i] })),
      failedItems,
      reviewer,
    });
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" disabled={!isValid} onClick={handleSubmit}>Submit QA Decision</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QA Review"
      subtitle="Review the adjudicative memo for quality and compliance"
      size="lg"
      footer={footer}
    >
      <div style={{
        background: 'var(--surface, #f9fafb)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '8px',
        padding: '16px',
        maxHeight: '280px',
        overflow: 'auto',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: '13px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        marginBottom: '16px',
      }}>
        {memoText || 'No memo text available.'}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontWeight: 600,
          fontSize: '14px',
          marginBottom: '8px',
        }}>
          QA Checklist
        </div>
        {QA_CHECKLIST.map((item, index) => (
          <label
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={checklist[index] ?? true}
              onChange={() => toggleItem(index)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--uscg, #4a5c2f)' }}
            />
            {item}
          </label>
        ))}
      </div>

      <Select
        label="Review Outcome"
        required
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        options={OUTCOME_OPTIONS}
      />

      <Input
        label="Reviewer"
        value={reviewer || ''}
        disabled
      />

      <Textarea
        label="Comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Optional reviewer comments..."
        rows={3}
      />
    </Modal>
  );
}

export default QaReviewModal;
