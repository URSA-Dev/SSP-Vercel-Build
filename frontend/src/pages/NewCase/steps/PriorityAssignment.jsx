import Button from '../../../components/Button/Button';
import Select from '../../../components/FormControls/Select';
import Input from '../../../components/FormControls/Input';
import FormGrid from '../../../components/FormControls/FormGrid';
import { PRIORITIES } from '../../../utils/constants';
import styles from '../NewCase.module.css';

const PRIORITY_OPTIONS = [
  { value: '', label: '— Select Priority —' },
  { value: 'CRITICAL', label: 'CRITICAL' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'LOW', label: 'LOW' },
  { value: 'SURGE', label: 'SURGE' },
];

const SURGE_OPTIONS = [
  { value: 'false', label: 'No — Standard intake' },
  { value: 'true', label: 'Yes — Flag as surge workload' },
];

const ANALYST_OPTIONS = [
  { value: '', label: '— Select Adjudicator —' },
  { value: 'Smith, A.', label: 'Smith, A.' },
  { value: 'Williams, K.', label: 'Williams, K.' },
  { value: 'Chen, D.', label: 'Chen, D.' },
  { value: 'Johnson, T.', label: 'Johnson, T.' },
];

function PriorityAssignment({ data, onChange, onNext, onBack }) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.sectionTitle}>Step 3 — Priority &amp; Assignment</div>

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
            label="Surge Flag"
            value={String(data.surgeFlag)}
            onChange={(e) => onChange('surgeFlag', e.target.value === 'true')}
            options={SURGE_OPTIONS}
          />
        </FormGrid>
      </div>

      <div className={styles.formSection}>
        <FormGrid columns={2}>
          <Select
            label="Assign To"
            required
            value={data.assignedTo}
            onChange={(e) => onChange('assignedTo', e.target.value)}
            options={ANALYST_OPTIONS}
          />
          <Input
            label="Routing / Handling Notes"
            value={data.assignmentNotes}
            onChange={(e) => onChange('assignmentNotes', e.target.value)}
            placeholder="Routing or handling notes…"
          />
        </FormGrid>
      </div>

      {/* Suspense info panel — matches template */}
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
        <Button variant="primary" onClick={onNext}>Continue &rarr; Review &amp; Create</Button>
      </div>
    </div>
  );
}

export default PriorityAssignment;
