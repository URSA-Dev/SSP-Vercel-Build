import { useState, useEffect, useMemo } from 'react';
import { getRecords, getStats } from '../../services/travel.service';
import { fmtDate } from '../../utils/dates';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import KpiCard from '../../components/KpiCard/KpiCard';
import Alert from '../../components/Alert/Alert';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './ForeignTravel.module.css';

const STATUS_MAP = {
  PENDING: { label: 'Pending', variant: 'amber' },
  APPROVED: { label: 'Approved', variant: 'green' },
  DENIED: { label: 'Denied', variant: 'red' },
  IN_PROGRESS: { label: 'In Travel', variant: 'blue' },
  COMPLETED: { label: 'Completed', variant: 'gray' },
  DEBRIEF_PENDING: { label: 'Debrief Pending', variant: 'violet' },
};

function travelStatusBadge(status) {
  return STATUS_MAP[status] || { label: status || 'Unknown', variant: 'gray' };
}

function ForeignTravel() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
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
      setError(err.message || 'Failed to load travel records');
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
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        [r.subjectName, r.destination, r.purpose, r.status]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, search, filterStatus]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'subject': va = a.subjectName; vb = b.subjectName; break;
        case 'destination': va = a.destination; vb = b.destination; break;
        case 'departure': va = a.departureDate || ''; vb = b.departureDate || ''; break;
        case 'return': va = a.returnDate || ''; vb = b.returnDate || ''; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'purpose': va = a.purpose; vb = b.purpose; break;
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
          <Skeleton width="200px" height="28px" borderRadius="8px" />
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
      <Alert variant="red" icon="&#9888;" title="Failed to load travel records">
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
          <div className="page-title">Foreign Travel</div>
          <div className="page-sub">
            {records.length} travel record{records.length !== 1 ? 's' : ''} tracked
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={stats?.total ?? records.length} label="Total Records" color="var(--uscg)" />
        <KpiCard value={stats?.approved ?? 0} label="Approved" color="var(--green)" />
        <KpiCard value={stats?.pending ?? 0} label="Pending" color="var(--amber)" />
        <KpiCard value={stats?.awaitingDebrief ?? 0} label="Awaiting Debrief" color="var(--violet)" />
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
            placeholder="Search travel records\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search travel records"
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="DENIED">Denied</option>
          <option value="IN_PROGRESS">In Travel</option>
          <option value="COMPLETED">Completed</option>
          <option value="DEBRIEF_PENDING">Debrief Pending</option>
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
                <th className={styles.sortable} onClick={() => handleSort('destination')}>
                  Destination{sortIndicator('destination')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('purpose')}>
                  Purpose{sortIndicator('purpose')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('departure')}>
                  Departure{sortIndicator('departure')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('return')}>
                  Return{sortIndicator('return')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </th>
                <th className={styles.hideOnMobile}>Briefing</th>
                <th className={styles.hideOnMobile}>Debrief</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.emptyRow}>
                    {search || filterStatus ? 'No records match your filters.' : 'No travel records found.'}
                  </td>
                </tr>
              ) : (
                sorted.map((r) => {
                  const sb = travelStatusBadge(r.status);
                  return (
                    <tr key={r.id}>
                      <td className={styles.subjectCell}>{r.subjectName}</td>
                      <td>{r.destination || '\u2014'}</td>
                      <td className={`text-muted text-sm ${styles.hideOnMobile}`}>
                        {r.purpose || '\u2014'}
                      </td>
                      <td className="text-muted">
                        {r.departureDate ? fmtDate(r.departureDate) : '\u2014'}
                      </td>
                      <td className={`text-muted ${styles.hideOnMobile}`}>
                        {r.returnDate ? fmtDate(r.returnDate) : '\u2014'}
                      </td>
                      <td><Badge variant={sb.variant}>{sb.label}</Badge></td>
                      <td className={styles.hideOnMobile}>
                        <Badge variant={r.briefingComplete ? 'green' : 'amber'}>
                          {r.briefingComplete ? 'Complete' : 'Pending'}
                        </Badge>
                      </td>
                      <td className={styles.hideOnMobile}>
                        <Badge variant={r.debriefComplete ? 'green' : 'amber'}>
                          {r.debriefComplete ? 'Complete' : 'Pending'}
                        </Badge>
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

export default ForeignTravel;
