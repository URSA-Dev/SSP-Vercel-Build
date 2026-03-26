import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicies, deletePolicy } from '../../services/policies.service';
import { fmtDate } from '../../utils/dates';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import KpiCard from '../../components/KpiCard/KpiCard';
import Alert from '../../components/Alert/Alert';
import EmptyState from '../../components/EmptyState/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import ViewPolicyModal from '../../components/modals/ViewPolicyModal';
import styles from './Policies.module.css';

const STATUS_MAP = {
  ACTIVE: { label: 'Active', variant: 'green' },
  DRAFT: { label: 'Draft', variant: 'amber' },
  ARCHIVED: { label: 'Archived', variant: 'gray' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'blue' },
};

function policyStatusBadge(status) {
  return STATUS_MAP[status] || { label: status || 'Unknown', variant: 'gray' };
}

function Policies() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function loadPolicies() {
    setLoading(true);
    setError(null);
    getPolicies()
      .then((data) => {
        setPolicies(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load policies');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadPolicies();
  }, []);

  const filtered = useMemo(() => {
    let list = policies;
    if (filterStatus) {
      list = list.filter((p) => p.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const text = [p.title, p.category, p.version, p.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(q);
      });
    }
    return list;
  }, [policies, search, filterStatus]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'title': va = a.title; vb = b.title; break;
        case 'category': va = a.category; vb = b.category; break;
        case 'version': va = a.version; vb = b.version; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'effective': va = a.effectiveDate || ''; vb = b.effectiveDate || ''; break;
        default: return 0;
      }
      const result = String(va).localeCompare(String(vb));
      return sortAsc ? result : -result;
    });
    return list;
  }, [filtered, sortCol, sortAsc]);

  function handleSort(col) {
    if (sortCol === col) {
      setSortAsc((prev) => !prev);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  }

  function sortIndicator(col) {
    if (sortCol !== col) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePolicy(deleteTarget.id);
      setPolicies((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch {
      // handled silently
    }
    setDeleteTarget(null);
  }

  /* ── Stats ── */
  const activeCount = policies.filter((p) => p.status === 'ACTIVE').length;
  const draftCount = policies.filter((p) => p.status === 'DRAFT').length;
  const archivedCount = policies.filter((p) => p.status === 'ARCHIVED').length;

  /* ── Render ── */

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <Skeleton width="180px" height="28px" borderRadius="8px" />
            <Skeleton width="220px" height="14px" borderRadius="4px" />
          </div>
        </div>
        <div className="kpi-row">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--r-lg)" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="red" icon="&#9888;" title="Failed to load policies">
        {error}
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={loadPolicies}>Try Again</Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">Policy Library</div>
          <div className="page-sub">
            {policies.length} polic{policies.length !== 1 ? 'ies' : 'y'} across all categories
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => navigate('/policies/new')}>
            + New Policy
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard value={policies.length} label="Total Policies" color="var(--uscg)" />
        <KpiCard value={activeCount} label="Active" color="var(--green)" />
        <KpiCard value={draftCount} label="Drafts" color="var(--amber)" />
        <KpiCard value={archivedCount} label="Archived" color="var(--ink-5)" />
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
            placeholder="Search policies\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search policies"
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
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
          <option value="UNDER_REVIEW">Under Review</option>
        </select>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => handleSort('title')}>
                  Title{sortIndicator('title')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('category')}>
                  Category{sortIndicator('category')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('version')}>
                  Version{sortIndicator('version')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('effective')}>
                  Effective Date{sortIndicator('effective')}
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyRow}>
                    {search || filterStatus ? 'No policies match your filters.' : 'No policies found.'}
                  </td>
                </tr>
              ) : (
                sorted.map((p) => {
                  const sb = policyStatusBadge(p.status);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setViewPolicy(p)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setViewPolicy(p); }}
                      className={styles.clickRow}
                    >
                      <td className={styles.titleCell}>{p.title}</td>
                      <td>
                        <Badge variant="navy">{p.category || '\u2014'}</Badge>
                      </td>
                      <td className="font-mono text-sm">{p.version}</td>
                      <td>
                        <Badge variant={sb.variant}>{sb.label}</Badge>
                      </td>
                      <td className={`text-muted ${styles.hideOnMobile}`}>
                        {p.effectiveDate ? fmtDate(p.effectiveDate) : '\u2014'}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => { e.stopPropagation(); setViewPolicy(p); }}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Modal */}
      {viewPolicy && (
        <ViewPolicyModal
          isOpen={!!viewPolicy}
          onClose={() => setViewPolicy(null)}
          onEdit={() => {
            setViewPolicy(null);
            navigate(`/policies/new?edit=${viewPolicy.id}`);
          }}
          policy={viewPolicy}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete Policy"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default Policies;
