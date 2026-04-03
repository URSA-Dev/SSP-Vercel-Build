import { useState } from 'react';
import Alert from '../../../components/Alert/Alert';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import DetailTable from '../../../components/DetailTable/DetailTable';
import { CASE_TYPES } from '../../../utils/constants';
import { fmtDate } from '../../../utils/dates';
import { priorityBadge } from '../../../utils/format';
import { useToast } from '../../../components/Toast/toast-context';
import styles from '../NewCase.module.css';

function ReviewCreate({ data, onBack, onCreate }) {
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const typeInfo = CASE_TYPES.find((t) => t.code === data.caseType);
  const pb = priorityBadge(data.priority);

  async function handleCreate() {
    setCreating(true);
    try {
      await onCreate();
      toast('Case created successfully', 'success');
    } catch {
      toast('Failed to create case', 'error');
      setCreating(false);
    }
  }

  const rows = [
    {
      label: 'Subject',
      value: `${data.subjectLastName || '\u2014'}, ${data.subjectFirstInitial?.toUpperCase() || '\u2014'}.`,
    },
    {
      label: 'Case Type',
      value: typeInfo ? (
        <Badge variant="blue">{typeInfo.code} — {typeInfo.name}</Badge>
      ) : (
        <span style={{ color: 'var(--ink-5)' }}>&mdash;</span>
      ),
    },
    {
      label: 'Date Received',
      value: fmtDate(data.receivedDate) || '\u2014',
    },
    {
      label: 'Priority',
      value: pb ? <Badge variant={pb.variant}>{pb.label}</Badge> : '\u2014',
    },
    {
      label: 'Surge',
      value: data.surgeFlag ? <Badge variant="violet">Flagged as Surge</Badge> : 'No',
    },
    {
      label: 'Assigned To',
      value: data.assignedTo || 'Smith, A.',
    },
    {
      label: 'Notes',
      value: data.notes || 'None',
    },
  ];

  return (
    <div className={styles.stepCard}>
      <div className={styles.sectionTitle}>Step 4 — Review &amp; Create</div>

      <Alert variant="green" icon="&#10003;" title="Ready to create">
        Review details below, then click Create Case to start both Suspense clocks.
      </Alert>

      <DetailTable rows={rows} />

      <div className={styles.divider} />

      <div className={styles.navRow}>
        <Button variant="secondary" onClick={onBack} disabled={creating}>
          &larr; Back
        </Button>
        <Button variant="primary" size="lg" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating...' : 'Create Case & Set Suspense Dates'}
        </Button>
      </div>
    </div>
  );
}

export default ReviewCreate;
