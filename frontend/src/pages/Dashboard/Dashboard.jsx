import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases } from '../../services/cases.service';
import { getDashboardMetrics } from '../../services/metrics.service';
import { fmtDate, fmtDT } from '../../utils/dates';
import { suspenseCalc } from '../../utils/suspense';
import { statusBadge, priorityBadge } from '../../utils/format';
import Badge from '../../components/Badge/Badge';
import KpiCard from '../../components/KpiCard/KpiCard';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import Timeline from '../../components/Timeline/Timeline';
import { Skeleton, SkeletonKpiRow, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './Dashboard.module.css';

const CLOSED_STATUSES = ['CLOSED_FAVORABLE', 'CLOSED_UNFAVORABLE', 'CANCELLED'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const RECENT_ACTIVITY = [
  { title: 'Rivera, M. memo submitted for QA review', meta: '6 hours ago', status: 'complete' },
  { title: 'Thompson, K. — SURGE case received', meta: '2 hours ago', status: 'warning' },
  { title: 'Anderson, R. — ROI extraction confirmed', meta: '1 day ago', status: 'complete' },
  { title: 'Patel, S. — Favorable determination transmitted', meta: '5 days ago', status: 'complete' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [casesData, metricsData] = await Promise.all([
        getCases(),
        getDashboardMetrics(),
      ]);
      setCases(casesData);
      setMetrics(metricsData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className="page-hdr">
          <Skeleton width="300px" height="28px" borderRadius="8px" />
          <Skeleton width="200px" height="14px" borderRadius="4px" />
        </div>
        <SkeletonKpiRow />
        <div className="gr2" style={{ gap: '20px', alignItems: 'start' }}>
          <SkeletonTable rows={4} cols={4} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton width="100%" height="120px" borderRadius="var(--r-lg)" />
            <Skeleton width="100%" height="180px" borderRadius="var(--r-lg)" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load dashboard">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={loadData}>Try Again</Button>
        </div>
      </Alert>
    );
  }

  const activeCases = cases.filter((c) => !CLOSED_STATUSES.includes(c.status));

  const overdueCases = activeCases.filter((c) => {
    if (!c.suspenseDate) return false;
    const s = suspenseCalc(c.suspenseDate);
    return s.over;
  });

  const atRiskCases = activeCases.filter((c) => {
    if (!c.suspenseDate) return false;
    const s = suspenseCalc(c.suspenseDate);
    return s.pct >= 75 && !s.over;
  });

  const aiExtractions = cases.filter(
    (c) => !CLOSED_STATUSES.includes(c.status) && c.docCount > 0
  );

  const qaCases = activeCases.filter(
    (c) => c.status === 'QA_REVIEW' || c.status === 'QA_REVISION'
  );

  const activeCount = metrics?.activeCases ?? activeCases.length;
  const atRiskCount = metrics?.atRisk ?? atRiskCases.length;
  const aiCount = metrics?.aiExtractions ?? aiExtractions.length;
  const qaCount = metrics?.qaPending ?? qaCases.length;

  return (
    <div className={styles.dashboard}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.greeting}>
            {getGreeting()}, Smith
          </h1>
          <p className={styles.dateStr}>{todayString()}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => navigate('/extraction')}>
            AI Extraction
          </Button>
          <Button variant="primary" onClick={() => navigate('/cases/new')}>
            + New Case
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCases.length > 0 && (
        <Alert variant="red" icon="&#9888;" title="Overdue Suspense">
          {overdueCases.length} case{overdueCases.length > 1 ? 's have' : ' has'} exceeded the 48-hour suspense deadline. Immediate action required.
        </Alert>
      )}

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard
          value={activeCount}
          label="Active Cases"
          color={activeCount === 0 ? 'var(--color-green-500, #22c55e)' : 'var(--color-blue-500, #3b82f6)'}
        />
        <KpiCard
          value={atRiskCount}
          label="Suspenses At Risk"
          color={atRiskCount === 0 ? 'var(--color-green-500, #22c55e)' : 'var(--color-amber-500, #f59e0b)'}
        />
        <KpiCard
          value={aiCount}
          label="AI Extractions"
          color={aiCount === 0 ? 'var(--color-green-500, #22c55e)' : 'var(--color-violet-500, #8b5cf6)'}
        />
        <KpiCard
          value={qaCount}
          label="QA Queue"
          color={qaCount === 0 ? 'var(--color-green-500, #22c55e)' : 'var(--color-red-500, #ef4444)'}
        />
      </div>

      {/* Two-column grid */}
      <div className="gr2">
        {/* Left column — wider */}
        <div className={styles.leftCol}>
          {/* Active Cases table */}
          <Card>
            <CardHead>
              <CardTitle>Active Cases</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
                View All
              </Button>
            </CardHead>
            <CardBody>
              {activeCases.length === 0 ? (
                <p className={styles.emptyMsg}>No active cases</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Case #</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>48-hr Suspense</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCases.map((c) => {
                        const sb = statusBadge(c.status);
                        const susp = c.suspenseDate
                          ? suspenseCalc(c.suspenseDate)
                          : null;

                        return (
                          <tr
                            key={c.id}
                            className={styles.clickRow}
                            onClick={() => navigate(`/cases/${c.id}`)}
                          >
                            <td>
                              <span className={styles.caseNum}>{c.id}</span>
                              {c.surgeFlag && (
                                <>
                                  {' '}
                                  <Badge variant="red">SURGE</Badge>
                                </>
                              )}
                            </td>
                            <td>{c.caseType}</td>
                            <td>
                              <Badge variant={sb.variant}>{sb.label}</Badge>
                            </td>
                            <td>
                              {susp ? (
                                <span className={styles[susp.cls]}>
                                  {susp.text}
                                </span>
                              ) : (
                                '\u2014'
                              )}
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/cases/${c.id}`);
                                }}
                              >
                                Open
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* AI Extractions awaiting */}
          {aiCount > 0 && (
            <Card>
              <CardHead>
                <CardTitle>AI Extractions Awaiting Review</CardTitle>
              </CardHead>
              <CardBody>
                <p className={styles.aiNote}>
                  <strong>{aiCount}</strong> extraction{aiCount !== 1 ? 's' : ''} awaiting
                  analyst confirmation.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/extraction')}
                >
                  Review Extractions
                </Button>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Suspense Compliance */}
          <Card>
            <CardHead>
              <CardTitle>Suspense Compliance</CardTitle>
            </CardHead>
            <CardBody>
              <div className={styles.gaugeRow}>
                <div className={styles.gauge}>
                  <div className={styles.gaugeRing}>
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border, #e5e7eb)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="var(--color-green-500, #22c55e)"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - 0.96)}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <span className={styles.gaugeText}>96%</span>
                  </div>
                  <div className={styles.gaugeLabel}>48-Hour</div>
                </div>
                <div className={styles.gauge}>
                  <div className={styles.gaugeRing}>
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border, #e5e7eb)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="var(--color-amber-500, #f59e0b)"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - 0.89)}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <span className={styles.gaugeText}>89%</span>
                  </div>
                  <div className={styles.gaugeLabel}>3-Day</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHead>
              <CardTitle>Recent Activity</CardTitle>
            </CardHead>
            <CardBody>
              <Timeline items={RECENT_ACTIVITY} />
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHead>
              <CardTitle>Quick Actions</CardTitle>
            </CardHead>
            <CardBody>
              <div className={styles.quickActions}>
                <Button variant="outline" onClick={() => navigate('/cases/new')}>
                  Create New Case
                </Button>
                <Button variant="outline" onClick={() => navigate('/extraction')}>
                  AI Document Extraction
                </Button>
                <Button variant="outline" onClick={() => navigate('/qa')}>
                  QA Review Queue
                </Button>
                <Button variant="outline" onClick={() => navigate('/metrics')}>
                  View Reports
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
