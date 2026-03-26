import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases } from '../../services/cases.service';
import { fmtDT } from '../../utils/dates';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import KpiCard from '../../components/KpiCard/KpiCard';
import Alert from '../../components/Alert/Alert';
import ConfidenceBar from '../../components/ConfidenceBar/ConfidenceBar';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './AiExtract.module.css';

const DOC_STATUS_MAP = {
  pending: { label: 'Pending', variant: 'amber' },
  processing: { label: 'Processing', variant: 'blue' },
  awaiting_review: { label: 'Awaiting Review', variant: 'violet' },
  confirmed: { label: 'Confirmed', variant: 'green' },
  rejected: { label: 'Rejected', variant: 'red' },
};

function docStatusBadge(status) {
  return DOC_STATUS_MAP[status] || { label: status || 'Unknown', variant: 'gray' };
}

/* Mock extraction queue — represents documents awaiting AI review */
const mockExtractions = [
  {
    id: 'ext_001',
    caseId: 'DOW-2025-00148',
    documentName: 'SF-86_Thompson_K.pdf',
    docType: 'SF-86',
    status: 'awaiting_review',
    confidence: 0.92,
    extractedFields: 14,
    totalFields: 16,
    uploadedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ext_002',
    caseId: 'DOW-2025-00141',
    documentName: 'ROI_Rivera_M.pdf',
    docType: 'ROI',
    status: 'awaiting_review',
    confidence: 0.87,
    extractedFields: 8,
    totalFields: 10,
    uploadedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ext_003',
    caseId: 'DOW-2025-00147',
    documentName: 'SF-312_Anderson_R.pdf',
    docType: 'SF-312',
    status: 'processing',
    confidence: null,
    extractedFields: 0,
    totalFields: 6,
    uploadedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ext_004',
    caseId: 'DOW-2025-00145',
    documentName: 'SOR_Patel_S.pdf',
    docType: 'SOR',
    status: 'confirmed',
    confidence: 0.96,
    extractedFields: 12,
    totalFields: 12,
    uploadedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

function AiExtract() {
  const navigate = useNavigate();
  const [extractions, setExtractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    // Simulate loading extraction queue
    setTimeout(() => {
      setExtractions(mockExtractions);
      setLoading(false);
    }, 400);
  }, []);

  const filtered = filterStatus
    ? extractions.filter((e) => e.status === filterStatus)
    : extractions;

  const awaitingCount = extractions.filter((e) => e.status === 'awaiting_review').length;
  const processingCount = extractions.filter((e) => e.status === 'processing').length;
  const confirmedCount = extractions.filter((e) => e.status === 'confirmed').length;
  const avgConfidence = extractions
    .filter((e) => e.confidence != null)
    .reduce((sum, e, _, arr) => sum + e.confidence / arr.length, 0);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Skeleton width="240px" height="28px" borderRadius="8px" />
          <Skeleton width="280px" height="14px" borderRadius="4px" />
        </div>
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--r-lg)" />
          ))}
        </div>
        <SkeletonTable rows={4} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load extractions">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">AI Document Extraction</div>
          <div className="page-sub">
            Automated extraction and review of security documents
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={extractions.length} label="Total Extractions" color="var(--uscg)" />
        <KpiCard value={awaitingCount} label="Awaiting Review" color="var(--violet)" />
        <KpiCard value={processingCount} label="Processing" color="var(--amber)" />
        <KpiCard
          value={`${Math.round(avgConfidence * 100)}%`}
          label="Avg Confidence"
          color={avgConfidence >= 0.9 ? 'var(--green)' : 'var(--amber)'}
        />
      </div>

      {/* Filter */}
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="processing">Processing</option>
          <option value="awaiting_review">Awaiting Review</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Extraction Queue */}
      <Card className={styles.tableCard}>
        <CardHead>
          <CardTitle>Extraction Queue</CardTitle>
        </CardHead>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Case</th>
                <th className={styles.hideOnMobile}>Type</th>
                <th>Status</th>
                <th className={styles.hideOnMobile}>Confidence</th>
                <th className={styles.hideOnMobile}>Fields</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyRow}>
                    No extractions match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((ext) => {
                  const sb = docStatusBadge(ext.status);
                  return (
                    <tr key={ext.id}>
                      <td className={styles.docName}>{ext.documentName}</td>
                      <td>
                        <a
                          href={`/cases/${ext.caseId}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/cases/${ext.caseId}`);
                          }}
                          className={styles.caseLink}
                        >
                          {ext.caseId}
                        </a>
                      </td>
                      <td className={styles.hideOnMobile}>
                        <Badge variant="navy">{ext.docType}</Badge>
                      </td>
                      <td><Badge variant={sb.variant}>{sb.label}</Badge></td>
                      <td className={styles.hideOnMobile}>
                        {ext.confidence != null ? (
                          <ConfidenceBar value={ext.confidence} />
                        ) : (
                          <span className="text-muted">\u2014</span>
                        )}
                      </td>
                      <td className={`text-sm ${styles.hideOnMobile}`}>
                        {ext.confidence != null
                          ? `${ext.extractedFields}/${ext.totalFields}`
                          : '\u2014'}
                      </td>
                      <td>
                        {ext.status === 'awaiting_review' && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => navigate(`/cases/${ext.caseId}`)}
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
    </div>
  );
}

export default AiExtract;
