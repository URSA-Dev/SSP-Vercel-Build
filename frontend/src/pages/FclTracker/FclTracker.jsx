import { useState, useEffect, useMemo } from 'react';
import { getRecords, getStats } from '../../services/fcl.service';
import { fmtDate } from '../../utils/dates';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import KpiCard from '../../components/KpiCard/KpiCard';
import Alert from '../../components/Alert/Alert';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './FclTracker.module.css';

const STATUS_MAP = {
  ACTIVE: { label: 'Active', variant: 'green' },
  PENDING: { label: 'Pending', variant: 'amber' },
  SUSPENDED: { label: 'Suspended', variant: 'red' },
  REVOKED: { label: 'Revoked', variant: 'red' },
  EXPIRED: { label: 'Expired', variant: 'gray' },
};

const LEVEL_MAP = {
  'TOP SECRET': { label: 'Top Secret', variant: 'red' },
  SECRET: { label: 'Secret', variant: 'amber' },
  CONFIDENTIAL: { label: 'Confidential', variant: 'blue' },
};

function fclStatusBadge(status) {
  return STATUS_MAP[status] || { label: status || 'Unknown', variant: 'gray' };
}

function levelBadge(level) {
  return LEVEL_MAP[level] || { label: level || 'Unknown', variant: 'gray' };
}

function FclTracker() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [recs, st] = await Promise.all([getRecords(), getStats()]);
      setRecords(recs);
      setStats(st);
    } catch (err) {
      setError(err.message || 'Failed to load FCL records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = records;
    if (filterStatus) list = list.filter((r) => r.status === filterStatus);
    if (filterLevel) list = list.filter((r) => r.clearanceLevel === filterLevel);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        [r.facilityName, r.cageCode, r.clearanceLevel, r.status, r.sponsoringAgency]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, search, filterStatus, filterLevel]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'facility': va = a.facilityName; vb = b.facilityName; break;
        case 'cage': va = a.cageCode; vb = b.cageCode; break;
        case 'level': va = a.clearanceLevel; vb = b.clearanceLevel; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'expires': va = a.expirationDate || ''; vb = b.expirationDate || ''; break;
        case 'agency': va = a.sponsoringAgency; vb = b.sponsoringAgency; break;
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

  /* ── Render ── */

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Skeleton width="180px" height="28px" borderRadius="8px" />
          <Skeleton width="220px" height="14px" borderRadius="4px" />
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
      <Alert variant="red" icon="&#9888;" title="Failed to load FCL records">
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
          <div className="page-title">FCL Tracker</div>
          <div className="page-sub">
            {records.length} facility clearance record{records.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={stats?.total ?? records.length} label="Total Records" color="var(--uscg)" />
        <KpiCard value={stats?.active ?? 0} label="Active" color="var(--green)" />
        <KpiCard value={stats?.expiringSoon ?? 0} label="Expiring Soon" color="var(--amber)" />
        <KpiCard
          value={Object.keys(stats?.byLevel || {}).length}
          label="Clearance Levels"
          color="var(--violet)"
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
            placeholder="Search facilities\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search FCL records"
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          aria-label="Filter by clearance level"
        >
          <option value="">All Levels</option>
          <option value="TOP SECRET">Top Secret</option>
          <option value="SECRET">Secret</option>
          <option value="CONFIDENTIAL">Confidential</option>
        </select>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => handleSort('facility')}>
                  Facility{sortIndicator('facility')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('cage')}>
                  CAGE Code{sortIndicator('cage')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('level')}>
                  Clearance Level{sortIndicator('level')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('expires')}>
                  Expiration{sortIndicator('expires')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('agency')}>
                  Sponsor{sortIndicator('agency')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyRow}>
                    {search || filterStatus || filterLevel ? 'No records match your filters.' : 'No FCL records found.'}
                  </td>
                </tr>
              ) : (
                sorted.map((r) => {
                  const sb = fclStatusBadge(r.status);
                  const lb = levelBadge(r.clearanceLevel);
                  return (
                    <tr key={r.id}>
                      <td className={styles.facilityCell}>{r.facilityName}</td>
                      <td className="font-mono text-sm">{r.cageCode}</td>
                      <td><Badge variant={lb.variant}>{lb.label}</Badge></td>
                      <td><Badge variant={sb.variant}>{sb.label}</Badge></td>
                      <td className={`text-muted ${styles.hideOnMobile}`}>
                        {r.expirationDate ? fmtDate(r.expirationDate) : '\u2014'}
                      </td>
                      <td className={`text-muted text-sm ${styles.hideOnMobile}`}>
                        {r.sponsoringAgency || '\u2014'}
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

export default FclTracker;
