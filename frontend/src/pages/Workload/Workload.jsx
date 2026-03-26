import { useState, useEffect } from 'react';
import { getDashboardMetrics } from '../../services/metrics.service';
import Badge from '../../components/Badge/Badge';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import KpiCard from '../../components/KpiCard/KpiCard';
import BarChart from '../../components/BarChart/BarChart';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './Workload.module.css';

/* Mock workload data — represents analyst workload distribution */
const mockAnalysts = [
  { name: 'Smith, A.', totalCases: 8, overdue48hr: 1, overdue3day: 0, qaReviews: 2, status: 'Available' },
  { name: 'Johnson, B.', totalCases: 6, overdue48hr: 0, overdue3day: 1, qaReviews: 1, status: 'Available' },
  { name: 'Williams, C.', totalCases: 5, overdue48hr: 0, overdue3day: 0, qaReviews: 0, status: 'On Leave' },
  { name: 'Brown, D.', totalCases: 7, overdue48hr: 2, overdue3day: 1, qaReviews: 3, status: 'Available' },
  { name: 'Davis, E.', totalCases: 4, overdue48hr: 0, overdue3day: 0, qaReviews: 1, status: 'Available' },
];

function Workload() {
  const [analysts, setAnalysts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const metricsData = await getDashboardMetrics();
      setMetrics(metricsData);
      setAnalysts(mockAnalysts);
    } catch (err) {
      setError(err.message || 'Failed to load workload data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Skeleton width="200px" height="28px" borderRadius="8px" />
          <Skeleton width="240px" height="14px" borderRadius="4px" />
        </div>
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--r-lg)" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load workload">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={loadData}>Try Again</Button>
        </div>
      </Alert>
    );
  }

  const totalCases = analysts.reduce((s, a) => s + a.totalCases, 0);
  const totalOverdue = analysts.reduce((s, a) => s + a.overdue48hr, 0);
  const availableCount = analysts.filter((a) => a.status === 'Available').length;
  const avgLoad = analysts.length ? Math.round(totalCases / analysts.length) : 0;

  const chartData = analysts.map((a) => ({
    name: a.name,
    value: a.totalCases,
    maxValue: Math.max(...analysts.map((x) => x.totalCases)),
    color: a.overdue48hr > 0 ? 'var(--red)' : 'var(--uscg)',
  }));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">Workload Board</div>
          <div className="page-sub">
            Analyst case distribution and capacity overview
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={totalCases} label="Total Cases" color="var(--uscg)" />
        <KpiCard value={availableCount} label="Available Analysts" color="var(--green)" />
        <KpiCard value={avgLoad} label="Avg Cases/Analyst" color="var(--violet)" />
        <KpiCard value={totalOverdue} label="Overdue 48-hr" color={totalOverdue > 0 ? 'var(--red)' : 'var(--green)'} />
      </div>

      {/* Two-column layout */}
      <div className="gr2">
        {/* Analyst Table */}
        <Card className={styles.tableCard}>
          <CardHead>
            <CardTitle>Analyst Workload</CardTitle>
          </CardHead>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Analyst</th>
                  <th>Cases</th>
                  <th>Overdue 48hr</th>
                  <th className={styles.hideOnMobile}>Overdue 3-Day</th>
                  <th className={styles.hideOnMobile}>QA Reviews</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analysts.map((a, i) => (
                  <tr key={i}>
                    <td className={styles.analystName}>{a.name}</td>
                    <td className="fw-6">{a.totalCases}</td>
                    <td>
                      {a.overdue48hr > 0 ? (
                        <Badge variant="red">{a.overdue48hr}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className={styles.hideOnMobile}>
                      {a.overdue3day > 0 ? (
                        <Badge variant="amber">{a.overdue3day}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className={styles.hideOnMobile}>{a.qaReviews}</td>
                    <td>
                      <Badge variant={a.status === 'Available' ? 'green' : 'gray'}>
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHead>
            <CardTitle>Case Distribution</CardTitle>
          </CardHead>
          <CardBody>
            <BarChart data={chartData} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Workload;
