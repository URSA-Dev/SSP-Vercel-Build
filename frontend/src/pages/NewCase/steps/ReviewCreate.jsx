import { useState } from 'react';
import Alert from '../../../components/Alert/Alert';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import DetailTable from '../../../components/DetailTable/DetailTable';
import { CASE_TYPES } from '../../../utils/constants';
import { fmtDate } from '../../../utils/dates';
import { priorityBadge } from '../../../utils/format';
import { useToast } from '../../../components/Toast/toast-context';

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
      value: `${data.subjectLastName}, ${data.subjectFirstInitial.toUpperCase()}.`,
    },
    {
      label: 'Investigation Type',
      value: typeInfo ? (
        <Badge variant="blue">{typeInfo.code} — {typeInfo.name}</Badge>
      ) : (
        '—'
      ),
    },
    {
      label: 'Date Received',
      value: fmtDate(data.receivedDate),
    },
    {
      label: 'Priority',
      value: <Badge variant={pb.variant}>{pb.label}</Badge>,
    },
    {
      label: 'Surge',
      value: data.surgeFlag ? <Badge variant="red">SURGE</Badge> : 'No',
    },
    {
      label: 'Assigned To',
      value: data.assignedTo,
    },
    {
      label: 'Notes',
      value: data.notes || 'None',
    },
  ];

  return (
    <div>
      <Alert variant="green" icon="&#10003;" title="Ready to Create">
        Review the information below. Once created, the case will be assigned and suspense
        dates will be automatically calculated.
      </Alert>

      <DetailTable rows={rows} />

      <hr style={{ border: 'none', borderTop: '1px solid var(--border, #e5e7eb)', margin: '24px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" onClick={onBack} disabled={creating}>
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
