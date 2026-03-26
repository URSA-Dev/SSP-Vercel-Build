import { useState, useEffect, useMemo } from 'react';
import { getViolations, getStats } from '../../services/violations.service';
import { fmtDate } from '../../utils/dates';
import { sevBadge } from '../../utils/format';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import KpiCard from '../../components/KpiCard/KpiCard';
import Alert from '../../components/Alert/Alert';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './Violations.module.css';

const STATUS_MAP = {
  REPORTED: { label: 'Reported', variant: 'amber' },
  UNDER_INVESTIGATION: { label: 'Under Investigation', variant: 'blue' },
  ADJUDICATED: { label: 'Adjudicated', variant: 'violet' },
  CLOSED: { label: 'Closed', variant: 'gray' },
  REFERRED: { label: 'Referred', variant: 'red' },
};

const TYPE_LABELS = {
  UNAUTHORIZED_DISCLOSURE: 'Unauthorized Disclosure',
  FAILURE_TO_REPORT: 'Failure to Report',
  IMPROPER_STORAGE: 'Improper Storage',
  FOREIGN_CONTACT: 'Foreign Contact',
  PERSONAL_CONDUCT: 'Personal Conduct',
};

function violationStatusBadge(status) {
  return STATUS_MAP[status] || { label: status || 'Unknown', variant: 'gray' };
}

function Violations() {
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [vios, st] = await Promise.all([getViolations(), getStats()]);
      setViolations(vios);
      setStats(st);
    } catch (err) {
      setError(err.message || 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = violations;
    if (filterStatus) list = list.filter((v) => v.status === filterStatus);
    if (filterSeverity) list = list.filter((v) => v.severity === filterSeverity);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        [v.subjectName, v.violationType, v.description, v.assignedTo]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [violations, search, filterStatus, filterSeverity]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'subject': va = a.subjectName; vb = b.subjectName; break;
        case 'type': va = a.violationType; vb = b.violationType; break;
        case 'severity': va = a.severity; vb = b.severity; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'reported': va = a.reportedDate || ''; vb = b.reportedDate || ''; break;
        case 'assigned': va = a.assignedTo; vb = b.assignedTo; break;
        default: return 0;
      }
      const result = String(va).localeCompare(String(vb));
      return sortAsc ? result : -result;
    });
    return list;
  }, [filtered, sortCol, sortAsc]);

  function handleSort(col) {
    if (sortCol === col) setSortAsc((p) => !p);
    else { setSortCol(col); setSortAsc(true); }
  }

  function sortIndicator(col) {
    if (sortCol !== col) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Skeleton width="220px" height="28px" borderRadius="8px" />
          <Skeleton width="240px" height="14px" borderRadius="4px" />
        </div>
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--r-lg)" />
          ))}
        </div>
        <SkeletonTable rows={4} cols={7} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load violations">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={loadData}>Try Again</Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">Security Violations</div>
          <div className="page-sub">
            {violations.length} violation{violations.length !== 1 ? 's' : ''} tracked
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={stats?.total ?? violations.length} label="Total Violations" color="var(--uscg)" />
        <KpiCard value={stats?.open ?? 0} label="Open" color="var(--red)" />
        <KpiCard value={stats?.closed ?? 0} label="Closed" color="var(--green)" />
        <KpiCard
          value={Object.entries(stats?.bySeverity || {}).filter(([k]) => k === 'HIGH' || k === 'CRITICAL').reduce((s, [, v]) => s + v, 0)}
          label="High/Critical"
          color="var(--amber)"
        />
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            className={styles.searchInput}
            placeholder="Search violations\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search violations"
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="REPORTED">Reported</option>
          <option value="UNDER_INVESTIGATION">Under Investigation</option>
          <option value="ADJUDICATED">Adjudicated</option>
          <option value="CLOSED">Closed</option>
          <option value="REFERRED">Referred</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          aria-label="Filter by severity"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => handleSort('subject')}>
                  Subject{sortIndicator('subject')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('type')}>
                  Type{sortIndicator('type')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('severity')}>
                  Severity{sortIndicator('severity')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('reported')}>
                  Reported{sortIndicator('reported')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('assigned')}>
                  Assigned To{sortIndicator('assigned')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyRow}>
                    {search || filterStatus || filterSeverity ? 'No violations match your filters.' : 'No violations found.'}
                  </td>
                </tr>
              ) : (
                sorted.map((v) => {
                  const sb = violationStatusBadge(v.status);
                  const sv = sevBadge(v.severity);
                  return (
                    <tr key={v.id}>
                      <td className={styles.subjectCell}>{v.subjectName}</td>
                      <td className="text-sm">
                        {TYPE_LABELS[v.violationType] || v.violationType}
                      </td>
                      <td><Badge variant={sv.variant}>{sv.label}</Badge></td>
                      <td><Badge variant={sb.variant}>{sb.label}</Badge></td>
                      <td className={`text-muted ${styles.hideOnMobile}`}>
                        {v.reportedDate ? fmtDate(v.reportedDate) : '\u2014'}
                      </td>
                      <td className={`text-muted text-sm ${styles.hideOnMobile}`}>
                        {v.assignedTo || '\u2014'}
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

export default Violations;
