import { useState } from 'react';
import { updateCaseStatus } from '../../../services/cases.service';
import { statusBadge, priorityBadge } from '../../../utils/format';
import { fmtDate } from '../../../utils/dates';
import { STATUS_TRANSITIONS } from '../../../utils/constants';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../../components/Card/Card';
import DetailTable from '../../../components/DetailTable/DetailTable';
import Timeline from '../../../components/Timeline/Timeline';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import { useToast } from '../../../components/Toast/toast-context';

const PROGRESS_STEPS = [
  'Received',
  'Docs Uploaded',
  'Extractions Confirmed',
  'Issues Identified',
  '48-hr Notification',
  'Memo Drafted',
  'QA Review',
  'Closed',
];

function progressStatus(caseData) {
  const s = caseData.status;
  const has48 = caseData.comms?.some(
    (c) => c.type === 'INITIAL_NOTIFICATION' || c.type === '48HR_NOTIFICATION'
  );
  const hasDocs = caseData.docs?.length > 0;
  const allConfirmed = hasDocs && caseData.docs.every((d) => d.status === 'confirmed');
  const hasIssues = caseData.issues?.length > 0;
  const hasMemo = !!caseData.memo;
  const inQA = s === 'QA_REVIEW' || s === 'QA_REVISION' || s === 'FINAL_REVIEW';
  const closed = s === 'CLOSED_FAVORABLE' || s === 'CLOSED_UNFAVORABLE' || s === 'SUBMITTED' || s === 'CANCELLED';

  return [
    { title: 'Received', status: 'complete', meta: fmtDate(caseData.receivedDate) },
    { title: 'Docs Uploaded', status: hasDocs ? 'complete' : 'pending' },
    { title: 'Extractions Confirmed', status: allConfirmed ? 'complete' : hasDocs ? 'active' : 'pending' },
    { title: 'Issues Identified', status: hasIssues ? 'complete' : 'pending' },
    { title: '48-hr Notification', status: has48 ? 'complete' : 'warning' },
    { title: 'Memo Drafted', status: hasMemo ? 'complete' : 'pending' },
    { title: 'QA Review', status: closed ? 'complete' : inQA ? 'active' : 'pending' },
    { title: 'Closed', status: closed ? 'complete' : 'pending' },
  ];
}

function Overview({ caseData, onRefresh, onTabChange }) {
  const validTransitions = STATUS_TRANSITIONS[caseData.status] || [];
  const [newStatus, setNewStatus] = useState(validTransitions[0] || '');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();

  const sb = statusBadge(caseData.status);
  const pb = priorityBadge(caseData.priority);
  const isTerminal = validTransitions.length === 0;

  const disp = caseData.disposition || caseData.memo?.disposition;

  const infoRows = [
    { label: 'Case #', value: <span className="font-mono fw-6">{caseData.id}</span> },
    { label: 'Subject', value: caseData.subjectName },
    { label: 'Type', value: caseData.caseType },
    { label: 'Status', value: <Badge variant={sb.variant}>{sb.label}</Badge> },
    { label: 'Priority', value: <Badge variant={pb.variant}>{pb.label}</Badge> },
    { label: 'Received', value: fmtDate(caseData.receivedDate) },
    { label: 'Assigned To', value: caseData.assignedTo || '\u2014' },
    { label: 'Disposition', value: disp
      ? <Badge variant={disp === 'FAVORABLE' || disp === 'FAVORABLE_WITH_COMMENT' ? 'green' : disp === 'UNFAVORABLE' ? 'red' : 'amber'}>{disp.replace(/_/g, ' ')}</Badge>
      : '\u2014'
    },
    { label: 'Notes', value: caseData.notes || '\u2014' },
  ];

  const timeline = progressStatus(caseData);

  function handleUpdateClick() {
    if (newStatus === caseData.status) return;
    setConfirmOpen(true);
  }

  async function executeStatusUpdate() {
    setConfirmOpen(false);
    setSaving(true);
    try {
      await updateCaseStatus(caseData.id, newStatus);
      await onRefresh();
      toast(`Status updated to ${statusBadge(newStatus).label}`, 'success');
    } catch (err) {
      const detail = err?.response?.data?.error;
      if (detail?.code === 'INVALID_TRANSITION' && detail?.details?.allowed) {
        const allowed = detail.details.allowed.map((s) => statusBadge(s).label).join(', ');
        toast(`Invalid transition. Allowed: ${allowed}`, 'error');
      } else {
        toast(detail?.message || 'Failed to update status', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gr2">
      {/* Left column */}
      <div>
        <Card>
          <CardHead>
            <CardTitle>Case Information</CardTitle>
          </CardHead>
          <CardBody>
            <DetailTable rows={infoRows} />
            <div className="flex aic gap-2 mt-4">
              {isTerminal ? (
                <Badge variant={sb.variant}>{sb.label} — No further transitions</Badge>
              ) : (
                <>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--bdr)',
                      fontSize: '13px',
                      fontFamily: 'var(--sans)',
                    }}
                  >
                    {validTransitions.map((s) => (
                      <option key={s} value={s}>
                        {statusBadge(s).label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={saving || !newStatus}
                    onClick={handleUpdateClick}
                  >
                    {saving ? 'Updating...' : 'Update Status'}
                  </Button>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Right column */}
      <div>
        <Card>
          <CardHead>
            <CardTitle>Case Progress</CardTitle>
          </CardHead>
          <CardBody>
            <Timeline items={timeline} />
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-4">
          <CardHead>
            <CardTitle>Quick Actions</CardTitle>
          </CardHead>
          <CardBody>
            <div className="flex fcol gap-2">
              <Button variant="outline" size="sm" onClick={() => onTabChange?.('comms')}>
                Log 48-hr Notification
              </Button>
              <Button variant="outline" size="sm" onClick={() => onTabChange?.('documents')}>
                Upload Documents
              </Button>
              <Button variant="outline" size="sm" onClick={() => onTabChange?.('issues')}>
                Add Issue
              </Button>
              <Button variant="outline" size="sm" onClick={() => onTabChange?.('memo')}>
                Open Memo Builder
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeStatusUpdate}
        title="Change Case Status"
        message={`Change status to ${statusBadge(newStatus).label}? This will be recorded in the audit trail.`}
        confirmLabel="Change Status"
        confirmVariant="primary"
        loading={saving}
      />
    </div>
  );
}

export default Overview;
