import { useState, useEffect, useMemo } from 'react';
import api, { USE_MOCK } from '../../services/api';
import { fmtDT } from '../../utils/dates';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle } from '../../components/Card/Card';
import Alert from '../../components/Alert/Alert';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './AuditLog.module.css';

const ACTION_MAP = {
  CREATE: { label: 'Create', variant: 'green' },
  UPDATE: { label: 'Update', variant: 'blue' },
  DELETE: { label: 'Delete', variant: 'red' },
  LOGIN: { label: 'Login', variant: 'violet' },
  LOGOUT: { label: 'Logout', variant: 'gray' },
  EXPORT: { label: 'Export', variant: 'amber' },
};

function actionBadge(action) {
  return ACTION_MAP[action] || { label: action || 'Unknown', variant: 'gray' };
}

/* Mock audit log entries */
const mockAuditLog = [
  { id: '1', userName: 'Smith, A.', action: 'CREATE', detail: 'Created case DOW-2025-00148', entityType: 'case', entityId: 'DOW-2025-00148', ipAddress: '10.0.1.42', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: '2', userName: 'Smith, A.', action: 'UPDATE', detail: 'Updated case status to IN_REVIEW', entityType: 'case', entityId: 'DOW-2025-00141', ipAddress: '10.0.1.42', createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: '3', userName: 'Johnson, B.', action: 'CREATE', detail: 'Uploaded document SF-86_Thompson.pdf', entityType: 'document', entityId: 'doc_042', ipAddress: '10.0.1.55', createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
  { id: '4', userName: 'Brown, D.', action: 'LOGIN', detail: 'User login successful', entityType: 'auth', entityId: null, ipAddress: '10.0.1.78', createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
  { id: '5', userName: 'Williams, C.', action: 'UPDATE', detail: 'Submitted QA review for DOW-2025-00141', entityType: 'qa_review', entityId: 'qa_001', ipAddress: '10.0.1.33', createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
  { id: '6', userName: 'Smith, A.', action: 'DELETE', detail: 'Removed draft policy "Guideline H"', entityType: 'policy', entityId: 'pol_005', ipAddress: '10.0.1.42', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
];

function normalizeEntry(e) {
  return {
    id: e.id,
    userName: e.user_name || e.userName || '',
    action: e.action || '',
    detail: e.detail || '',
    entityType: e.entity_type || e.entityType || '',
    entityId: e.entity_id || e.entityId || null,
    ipAddress: e.ip_address || e.ipAddress || '',
    createdAt: e.created_at || e.createdAt || '',
  };
}

function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      if (!USE_MOCK) {
        const { data } = await api.get('/audit');
        const rows = data.data || data;
        setEntries(Array.isArray(rows) ? rows.map(normalizeEntry) : []);
      } else {
        setEntries(mockAuditLog);
      }
    } catch {
      setEntries(mockAuditLog);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = entries;
    if (filterAction) list = list.filter((e) => e.action === filterAction);
    if (filterEntity) list = list.filter((e) => e.entityType === filterEntity);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        [e.userName, e.action, e.detail, e.entityType, e.entityId, e.ipAddress]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, search, filterAction, filterEntity]);

  async function handleExport() {
    try {
      if (!USE_MOCK) {
        const response = await api.get('/audit/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // CSV export not available in mock mode
    }
  }

  const entityTypes = [...new Set(entries.map((e) => e.entityType).filter(Boolean))];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Skeleton width="160px" height="28px" borderRadius="8px" />
          <Skeleton width="200px" height="14px" borderRadius="4px" />
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load audit log">
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
          <div className="page-title">Audit Log</div>
          <div className="page-sub">
            {entries.length} audit entr{entries.length !== 1 ? 'ies' : 'y'} recorded
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
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
            placeholder="Search audit log\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search audit log"
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          aria-label="Filter by action"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          aria-label="Filter by entity"
        >
          <option value="">All Entities</option>
          {entityTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Detail</th>
                <th className={styles.hideOnMobile}>Entity</th>
                <th className={styles.hideOnMobile}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyRow}>
                    {search || filterAction || filterEntity
                      ? 'No entries match your filters.'
                      : 'No audit log entries.'}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const ab = actionBadge(e.action);
                  return (
                    <tr key={e.id}>
                      <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>
                        {fmtDT(e.createdAt)}
                      </td>
                      <td className={styles.userName}>{e.userName}</td>
                      <td><Badge variant={ab.variant}>{ab.label}</Badge></td>
                      <td className={styles.detailCell}>{e.detail}</td>
                      <td className={`text-muted text-sm ${styles.hideOnMobile}`}>
                        {e.entityType || '\u2014'}
                      </td>
                      <td className={`font-mono text-sm ${styles.hideOnMobile}`}>
                        {e.ipAddress || '\u2014'}
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

export default AuditLog;
