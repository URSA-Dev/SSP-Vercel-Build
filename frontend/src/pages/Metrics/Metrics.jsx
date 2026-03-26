import { useState, useEffect } from 'react';
import { getDashboardMetrics } from '../../services/metrics.service';
import KpiCard from '../../components/KpiCard/KpiCard';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import BarChart from '../../components/BarChart/BarChart';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import styles from './Metrics.module.css';

function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Failed to load metrics');
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
          <Skeleton width="160px" height="28px" borderRadius="8px" />
          <Skeleton width="200px" height="14px" borderRadius="4px" />
        </div>
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--r-lg)" />
          ))}
        </div>
        <div className="gr2">
          <Skeleton width="100%" height="200px" borderRadius="var(--r-lg)" />
          <Skeleton width="100%" height="200px" borderRadius="var(--r-lg)" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load metrics">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={loadData}>Try Again</Button>
        </div>
      </Alert>
    );
  }

  const statusData = Object.entries(metrics?.byStatus || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
    color: 'var(--uscg)',
  }));

  const priorityData = Object.entries(metrics?.byPriority || {}).map(([name, value]) => ({
    name,
    value,
    color: name === 'CRITICAL' ? 'var(--red)' : name === 'HIGH' ? 'var(--amber)' : 'var(--uscg)',
  }));

  const typeData = Object.entries(metrics?.byCaseType || {}).map(([name, value]) => ({
    name,
    value,
    color: 'var(--violet)',
  }));

  const favorablePct = Math.round((metrics?.favorableRate ?? 0) * 100);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">Metrics</div>
          <div className="page-sub">
            Case processing analytics and performance indicators
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={metrics?.activeCases ?? 0} label="Active Cases" color="var(--uscg)" />
        <KpiCard value={metrics?.casesThisMonth ?? 0} label="Cases This Month" color="var(--violet)" />
        <KpiCard
          value={`${metrics?.avgProcessingDays ?? 0}d`}
          label="Avg Processing"
          color="var(--amber)"
        />
        <KpiCard
          value={`${favorablePct}%`}
          label="Favorable Rate"
          color={favorablePct >= 80 ? 'var(--green)' : 'var(--amber)'}
        />
      </div>

      {/* Charts - two-column */}
      <div className="gr2">
        <Card>
          <CardHead><CardTitle>Cases by Status</CardTitle></CardHead>
          <CardBody>
            {statusData.length > 0 ? (
              <BarChart data={statusData} />
            ) : (
              <p className={styles.emptyMsg}>No status data available</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHead><CardTitle>Cases by Priority</CardTitle></CardHead>
          <CardBody>
            {priorityData.length > 0 ? (
              <BarChart data={priorityData} />
            ) : (
              <p className={styles.emptyMsg}>No priority data available</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="gr2">
        <Card>
          <CardHead><CardTitle>Cases by Type</CardTitle></CardHead>
          <CardBody>
            {typeData.length > 0 ? (
              <BarChart data={typeData} />
            ) : (
              <p className={styles.emptyMsg}>No type data available</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHead><CardTitle>Key Indicators</CardTitle></CardHead>
          <CardBody>
            <div className={styles.indicatorGrid}>
              <div className={styles.indicator}>
                <div className={styles.indicatorValue}>{metrics?.atRisk ?? 0}</div>
                <div className={styles.indicatorLabel}>At Risk</div>
              </div>
              <div className={styles.indicator}>
                <div className={styles.indicatorValue}>{metrics?.aiExtractions ?? 0}</div>
                <div className={styles.indicatorLabel}>AI Extractions</div>
              </div>
              <div className={styles.indicator}>
                <div className={styles.indicatorValue}>{metrics?.qaPending ?? 0}</div>
                <div className={styles.indicatorLabel}>QA Pending</div>
              </div>
              <div className={styles.indicator}>
                <div className={styles.indicatorValue} style={{ color: favorablePct >= 80 ? 'var(--green)' : 'var(--amber)' }}>
                  {favorablePct}%
                </div>
                <div className={styles.indicatorLabel}>Favorable</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Metrics;
