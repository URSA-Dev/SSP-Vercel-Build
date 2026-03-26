import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getCase } from '../../services/cases.service';
import { suspenseCalc } from '../../utils/suspense';
import { statusBadge } from '../../utils/format';
import { fmtDate } from '../../utils/dates';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import Tabs, { TabPanel } from '../../components/Tabs/Tabs';
import SlaRing from '../../components/SlaRing/SlaRing';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import Alert from '../../components/Alert/Alert';
import Overview from './tabs/Overview';
import Documents from './tabs/Documents';
import Issues from './tabs/Issues';
import Memo from './tabs/Memo';
import Communications from './tabs/Communications';
import History from './tabs/History';
import styles from './CaseDetail.module.css';

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadCase = useCallback(async () => {
    try {
      const data = await getCase(id);
      setCaseData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  if (loading) {
    return (
      <div>
        {/* Header skeleton */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Skeleton width="140px" height="24px" borderRadius="6px" />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Skeleton width="80px" height="22px" borderRadius="12px" />
              <Skeleton width="60px" height="22px" borderRadius="12px" />
            </div>
            <Skeleton width="320px" height="14px" borderRadius="4px" />
          </div>
        </div>
        {/* SLA cards skeleton */}
        <div className={styles.slaGrid}>
          <Skeleton width="100%" height="100px" borderRadius="var(--r-lg)" />
          <Skeleton width="100%" height="100px" borderRadius="var(--r-lg)" />
        </div>
        {/* Tab placeholder skeleton */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} width="80px" height="32px" borderRadius="6px" />
          ))}
        </div>
        <SkeletonTable rows={4} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load case">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={loadCase}>Try Again</Button>
        </div>
      </Alert>
    );
  }

  if (!caseData) return null;

  const sb = statusBadge(caseData.status);

  /* 48-hour clock: starts at receivedDate, 48h total */
  const fortyEightDeadline = new Date(
    new Date(caseData.receivedDate).getTime() + 48 * HOUR_MS
  ).toISOString();
  const sla48 = suspenseCalc(fortyEightDeadline, 48 * HOUR_MS);

  /* Has the 48-hr notification been logged? */
  const has48hrNotif = caseData.comms?.some(
    (c) => c.type === 'INITIAL_NOTIFICATION' || c.type === '48HR_NOTIFICATION'
  );

  /* 3-business-day clock: use suspenseDate from case */
  const sla3d = caseData.suspenseDate
    ? suspenseCalc(caseData.suspenseDate, 3 * DAY_MS)
    : null;

  /* Can submit for QA? */
  const canSubmitQA =
    caseData.memo &&
    caseData.status !== 'QA_REVIEW' &&
    caseData.status !== 'CLOSED_FAVORABLE' &&
    caseData.status !== 'CLOSED_UNFAVORABLE';

  const sla48Label = has48hrNotif ? 'Met' : sla48.text;
  const sla48Status = has48hrNotif ? 'ok' : sla48.cls;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'documents', label: 'Documents', count: caseData.docs?.length || 0 },
    { key: 'issues', label: 'Issues', count: caseData.issues?.length || 0 },
    { key: 'memo', label: 'Memo' },
    { key: 'comms', label: 'Communications', count: caseData.comms?.length || 0 },
    { key: 'history', label: 'History' },
  ];

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.caseNumber}>{caseData.id}</span>
          <div className={styles.badges}>
            <Badge variant={sb.variant}>{sb.label}</Badge>
            {caseData.surgeFlag && <Badge variant="red">SURGE</Badge>}
            {caseData.priority && caseData.priority !== 'NORMAL' && (
              <Badge variant={caseData.priority === 'CRITICAL' ? 'red' : 'amber'}>
                {caseData.priority}
              </Badge>
            )}
          </div>
          <div className={styles.subjectLine}>
            <strong>{caseData.subjectName}</strong> &middot; {caseData.caseType} &middot; Received {fmtDate(caseData.receivedDate)}
          </div>
        </div>
        <div className={styles.headerActions}>
          {!has48hrNotif && (
            <Button variant="amber" onClick={() => { setActiveTab('comms'); }}>
              Log 48-hr Notification
            </Button>
          )}
          {canSubmitQA && (
            <Button variant="primary" onClick={() => { setActiveTab('memo'); }}>
              Submit for QA
            </Button>
          )}
        </div>
      </div>

      {/* SLA Grid */}
      <div className={styles.slaGrid}>
        <SlaRing
          label="48-HOUR NOTIFICATION"
          timeDisplay={sla48Label}
          subtitle={has48hrNotif ? 'Notification sent' : 'Log 48-hr notification to stop the clock'}
          percentage={has48hrNotif ? 100 : sla48.pct}
          status={sla48Status}
        />
        {sla3d && (
          <SlaRing
            label="3-BUSINESS-DAY REVIEW"
            timeDisplay={sla3d.text}
            subtitle="Complete adjudication to stop the clock"
            percentage={sla3d.pct}
            status={sla3d.cls}
          />
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
      <div className={styles.tabBody}>
        <TabPanel id="overview" activeKey={activeTab}>
          <Overview caseData={caseData} onRefresh={loadCase} onTabChange={setActiveTab} />
        </TabPanel>
        <TabPanel id="documents" activeKey={activeTab}>
          <Documents caseData={caseData} onRefresh={loadCase} />
        </TabPanel>
        <TabPanel id="issues" activeKey={activeTab}>
          <Issues caseData={caseData} onRefresh={loadCase} />
        </TabPanel>
        <TabPanel id="memo" activeKey={activeTab}>
          <Memo caseData={caseData} onRefresh={loadCase} />
        </TabPanel>
        <TabPanel id="comms" activeKey={activeTab}>
          <Communications caseData={caseData} onRefresh={loadCase} />
        </TabPanel>
        <TabPanel id="history" activeKey={activeTab}>
          <History caseData={caseData} />
        </TabPanel>
      </div>
    </div>
  );
}

export default CaseDetail;
