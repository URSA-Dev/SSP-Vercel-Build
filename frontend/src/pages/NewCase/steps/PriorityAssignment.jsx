import Alert from '../../../components/Alert/Alert';
import Button from '../../../components/Button/Button';
import Select from '../../../components/FormControls/Select';
import Textarea from '../../../components/FormControls/Textarea';
import FormGrid from '../../../components/FormControls/FormGrid';
import { PRIORITIES } from '../../../utils/constants';

const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: p }));

const SURGE_OPTIONS = [
  { value: 'false', label: 'No' },
  { value: 'true', label: 'Yes' },
];

const ANALYST_OPTIONS = [
  { value: 'Smith, A.', label: 'Smith, A.' },
  { value: 'Williams, K.', label: 'Williams, K.' },
  { value: 'Chen, D.', label: 'Chen, D.' },
  { value: 'Johnson, T.', label: 'Johnson, T.' },
];

function PriorityAssignment({ data, onChange, onNext, onBack }) {
  return (
    <div>
      <FormGrid columns={2}>
        <Select
          label="Priority"
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

      <FormGrid columns={2}>
        <Select
          label="Assign To"
          required
          value={data.assignedTo}
          onChange={(e) => onChange('assignedTo', e.target.value)}
          options={ANALYST_OPTIONS}
        />
        <Textarea
          label="Assignment Notes"
          value={data.assignmentNotes}
          onChange={(e) => onChange('assignmentNotes', e.target.value)}
          placeholder="Optional assignment notes..."
          rows={3}
        />
      </FormGrid>

      <Alert variant="blue" icon="&#9432;" title="Suspense Date Auto-Calculation">
        Suspense dates are automatically set based on priority. <strong>48-hour suspense</strong> applies
        to CRITICAL and SURGE cases requiring immediate action. <strong>3-day suspense</strong> applies
        to all other priority levels for standard processing timelines.
      </Alert>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border, #e5e7eb)' }}>
        <Button variant="ghost" onClick={onBack}>&larr; Back</Button>
        <Button variant="primary" onClick={onNext}>Continue &rarr;</Button>
      </div>
    </div>
  );
}

export default PriorityAssignment;
