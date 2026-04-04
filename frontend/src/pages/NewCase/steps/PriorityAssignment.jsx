import { useState } from 'react';
import Button from '../../../components/Button/Button';
import Select from '../../../components/FormControls/Select';
import Input from '../../../components/FormControls/Input';
import CheckboxGroup from '../../../components/FormControls/CheckboxGroup';
import FormGrid from '../../../components/FormControls/FormGrid';
import Alert from '../../../components/Alert/Alert';
import { CASE_SUBTYPE_MAP } from '../../../utils/constants';
import styles from '../NewCase.module.css';

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'CRITICAL' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'LOW', label: 'LOW' },
];

const ANALYST_OPTIONS = [
  { value: '', label: '— Select Adjudicator —' },
  { value: 'Smith, A.', label: 'Smith, A.' },
  { value: 'Williams, K.', label: 'Williams, K.' },
  { value: 'Chen, D.', label: 'Chen, D.' },
  { value: 'Johnson, T.', label: 'Johnson, T.' },
];

function PriorityAssignment({ data, onChange, onNext, onBack }) {
  const [error, setError] = useState('');

  const subtypeOptions = CASE_SUBTYPE_MAP[data.caseType] || [];
  const hasSubtypes = subtypeOptions.length > 0;

  function handleNext() {
    if (hasSubtypes && (!data.caseSubtypes || data.caseSubtypes.length === 0)) {
      setError('Please select at least one case subtype.');
      return;
    }
    setError('');
    onNext();
  }

  return (
    <div className={styles.stepCard}>
      <div className={styles.sectionTitle}>Step 3 — Priority &amp; Assignment</div>

      {error && (
        <Alert variant="red" title="Selection Required">
          {error}
        </Alert>
      )}

      <div className={styles.formSection}>
        <FormGrid columns={2}>
          <Select
            label="Priority Level"
            required
            value={data.priority}
            onChange={(e) => onChange('priority', e.target.value)}
            options={PRIORITY_OPTIONS}
          />
          <Select
            label="Assign To"
            required
            value={data.assignedTo}
            onChange={(e) => onChange('assignedTo', e.target.value)}
            options={ANALYST_OPTIONS}
          />
        </FormGrid>
      </div>

      {hasSubtypes && (
        <div className={styles.formSection}>
          <CheckboxGroup
            label="Case Subtype"
            required
            value={data.caseSubtypes || []}
            options={subtypeOptions}
            onChange={(selected) => {
              onChange('caseSubtypes', selected);
              if (selected.length > 0) setError('');
            }}
            hint="Select one or more subtypes"
            error={error && (!data.caseSubtypes || data.caseSubtypes.length === 0) ? error : undefined}
          />
        </div>
      )}

      {!hasSubtypes && data.caseType === 'INTHR' && (
        <Alert variant="blue" icon="&#8505;" title="No Subtypes">
          Insider Threat cases do not require a subtype selection.
        </Alert>
      )}

      <div className={styles.formSection}>
        <Input
          label="Routing / Handling Notes"
          value={data.assignmentNotes}
          onChange={(e) => onChange('assignmentNotes', e.target.value)}
          placeholder="Routing or handling notes…"
        />
      </div>

      {/* Suspense info panel */}
      <div className={styles.suspensePanel}>
        <div className={styles.suspensePanelTitle}>
          Suspense Dates — Auto-set on case creation
        </div>
        <div className={styles.suspenseGrid}>
          <div className={styles.suspenseItem}>
            <h4>48-Hour Notification</h4>
            <p>
              Send initial notification within <strong>48 calendar hours</strong>.
              Log it in Communications to stop the clock.
            </p>
          </div>
          <div className={styles.suspenseItem}>
            <h4>3-Business-Day Review</h4>
            <p>
              Complete and submit recommendation within <strong>3 business days</strong>.
              Submitting for QA stops this clock.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.navRow}>
        <Button variant="secondary" onClick={onBack}>&larr; Back</Button>
        <Button variant="primary" onClick={handleNext}>Continue &rarr; Review &amp; Create</Button>
      </div>
    </div>
  );
}

export default PriorityAssignment;
