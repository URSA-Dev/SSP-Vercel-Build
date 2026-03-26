import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQueue, submitReview } from '../../services/qa.service';
import { fmtDT } from '../../utils/dates';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import KpiCard from '../../components/KpiCard/KpiCard';
import Alert from '../../components/Alert/Alert';
import QaReviewModal from '../../components/modals/QaReviewModal';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './QaQueue.module.css';

const STATUS_MAP = {
  PENDING: { label: 'Pending', variant: 'amber' },
  APPROVED: { label: 'Approved', variant: 'green' },
  RETURNED: { label: 'Returned', variant: 'red' },
  IN_REVIEW: { label: 'In Review', variant: 'blue' },
};

function qaStatusBadge(status) {
  return STATUS_MAP[status] || { label: status || 'Unknown', variant: 'gray' };
}

function QaQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);

  function loadQueue() {
    setLoading(true);
    setError(null);
    getQueue()
      .then((data) => setQueue(data))
      .catch((err) => setError(err.message || 'Failed to load QA queue'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleReviewSubmit(reviewData) {
    try {
      await submitReview(reviewItem.id, reviewData);
      setReviewItem(null);
      loadQueue();
    } catch {
      // handled by modal
    }
  }

  const pendingCount = queue.filter((q) => q.status === 'PENDING').length;
  const approvedCount = queue.filter((q) => q.status === 'APPROVED').length;
  const returnedCount = queue.filter((q) => q.status === 'RETURNED').length;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Skeleton width="160px" height="28px" borderRadius="8px" />
          <Skeleton width="200px" height="14px" borderRadius="4px" />
        </div>
        <div className="kpi-row">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--r-lg)" />
          ))}
        </div>
        <SkeletonTable rows={4} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load QA queue">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={loadQueue}>Try Again</Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">QA Queue</div>
          <div className="page-sub">
            {queue.length} item{queue.length !== 1 ? 's' : ''} in queue
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={queue.length} label="Total in Queue" color="var(--uscg)" />
        <KpiCard value={pendingCount} label="Pending Review" color="var(--amber)" />
        <KpiCard value={approvedCount} label="Approved" color="var(--green)" />
        <KpiCard value={returnedCount} label="Returned" color="var(--red)" />
      </div>

      {/* Queue Table */}
      <Card className={styles.tableCard}>
        <CardHead>
          <CardTitle>Review Queue</CardTitle>
        </CardHead>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Subject</th>
                <th className={styles.hideOnMobile}>Type</th>
                <th className={styles.hideOnMobile}>Submitted By</th>
                <th>Status</th>
                <th className={styles.hideOnMobile}>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyRow}>
                    No items in the QA queue.
                  </td>
                </tr>
              ) : (
                queue.map((item) => {
                  const sb = qaStatusBadge(item.status);
                  return (
                    <tr key={item.id}>
                      <td className="font-mono text-sm">
                        <a
                          href={`/cases/${item.caseId}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/cases/${item.caseId}`);
                          }}
                          className={styles.caseLink}
                        >
                          {item.caseNumber}
                        </a>
                      </td>
                      <td className={styles.subjectCell}>{item.subjectName}</td>
                      <td className={`${styles.hideOnMobile}`}>
                        <Badge variant="navy">{item.caseType}</Badge>
                      </td>
                      <td className={`text-muted text-sm ${styles.hideOnMobile}`}>
                        {item.submittedBy}
                      </td>
                      <td><Badge variant={sb.variant}>{sb.label}</Badge></td>
                      <td className={`text-muted text-sm ${styles.hideOnMobile}`}>
                        {item.submittedAt ? fmtDT(item.submittedAt) : '\u2014'}
                      </td>
                      <td>
                        {item.status === 'PENDING' && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => setReviewItem(item)}
                          >
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal */}
      {reviewItem && (
        <QaReviewModal
          isOpen={!!reviewItem}
          onClose={() => setReviewItem(null)}
          onSubmit={handleReviewSubmit}
          caseNumber={reviewItem.caseNumber}
          subjectName={reviewItem.subjectName}
        />
      )}
    </div>
  );
}

export default QaQueue;
