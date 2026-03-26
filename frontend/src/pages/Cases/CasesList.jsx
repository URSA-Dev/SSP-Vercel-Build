import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases } from '../../services/cases.service';
import { fmtDate } from '../../utils/dates';
import { suspenseCalc } from '../../utils/suspense';
import { statusBadge, priorityBadge } from '../../utils/format';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Skeleton, SkeletonTable } from '../../components/Skeleton/Skeleton';
import styles from './CasesList.module.css';

const THREE_DAY_MS = 3 * 24 * 3600 * 1000;

function suspenseBadge(deadline, totalMs, met) {
  if (met) return { label: 'Met \u2713', variant: 'green' };
  if (!deadline) return { label: '\u2014', variant: 'gray' };

  const calc = suspenseCalc(deadline, totalMs);
  let variant = 'green';
  if (calc.over) variant = 'red';
  else if (calc.pct >= 75) variant = 'amber';

  return { label: calc.text, variant };
}

function CasesList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  function loadCases() {
    setLoading(true);
    setError(null);
    getCases()
      .then((data) => {
        setCases(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load cases');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadCases();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return cases;
    const q = search.toLowerCase();
    return cases.filter((c) => {
      const text = [
        c.id,
        c.subjectName,
        c.caseType,
        c.status,
        c.priority,
        c.assignedTo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }, [cases, search]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;

    const compare = (a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'id':
          va = a.id; vb = b.id; break;
        case 'subject':
          va = a.subjectName; vb = b.subjectName; break;
        case 'type':
          va = a.caseType; vb = b.caseType; break;
        case 'status':
          va = a.status; vb = b.status; break;
        case 'priority':
          va = a.priority; vb = b.priority; break;
        case 'received':
          va = a.receivedDate || ''; vb = b.receivedDate || ''; break;
        case 'susp48':
          va = a.suspenseDate || ''; vb = b.suspenseDate || ''; break;
        case 'docs':
          va = a.docCount || 0; vb = b.docCount || 0; break;
        default:
          return 0;
      }
      if (typeof va === 'number') return va - vb;
      return String(va).localeCompare(String(vb));
    };

    const list = [...filtered];
    list.sort((a, b) => {
      const result = compare(a, b);
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

  function handleRowClick(caseId) {
    navigate(`/cases/${caseId}`);
  }

  function sortIndicator(col) {
    if (sortCol !== col) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="page">
        <div className="page-hdr page-hdr-row">
          <div>
            <Skeleton width="120px" height="28px" borderRadius="8px" />
            <Skeleton width="180px" height="14px" borderRadius="4px" />
          </div>
        </div>
        <SkeletonTable rows={6} cols={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className={styles.errorWrap}>
          <p className={styles.errorText}>{error}</p>
          <Button variant="secondary" onClick={loadCases}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-hdr page-hdr-row">
        <div>
          <div className="page-title">Cases</div>
          <div className="page-sub">
            {cases.length} total case{cases.length !== 1 ? 's' : ''} across all
            stages
          </div>
        </div>
        <div className="btn-group">
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className={styles.searchInput}
              placeholder="Search cases\u2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search cases"
            />
          </div>
          <Button variant="primary" onClick={() => navigate('/cases/new')}>
            + New Case
          </Button>
        </div>
      </div>

      {/* ── Cases Table ── */}
      <Card className={styles.tableCard}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => handleSort('id')}>
                  Case Number{sortIndicator('id')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('subject')}>
                  Subject{sortIndicator('subject')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('type')}>
                  Type{sortIndicator('type')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('priority')}>
                  Priority{sortIndicator('priority')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('received')}>
                  Received{sortIndicator('received')}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('susp48')}>
                  48-hr Suspense{sortIndicator('susp48')}
                </th>
                <th className={styles.hideOnMobile}>3-Day Suspense</th>
                <th className={`${styles.sortable} ${styles.hideOnMobile}`} onClick={() => handleSort('docs')}>
                  Docs{sortIndicator('docs')}
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="10" className={styles.emptyRow}>
                    {search ? 'No cases match your search.' : 'No cases found.'}
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const sb = statusBadge(c.status);
                  const pb = priorityBadge(c.priority);

                  /* 48-hr suspense */
                  const s48 = suspenseBadge(
                    c.suspenseDate,
                    48 * 3600 * 1000,
                    c.metSupp48,
                  );

                  /* 3-day suspense — deadline = suspenseDate + 1 day offset, or dedicated field */
                  const susp3dDeadline = c.susp3d || (
                    c.suspenseDate
                      ? new Date(new Date(c.suspenseDate).getTime() + (THREE_DAY_MS - 48 * 3600 * 1000)).toISOString()
                      : null
                  );
                  const s3d = suspenseBadge(
                    susp3dDeadline,
                    THREE_DAY_MS,
                    c.metSupp3d,
                  );

                  const confirmedDocs = c.confirmedDocCount ?? 0;
                  const totalDocs = c.docCount ?? 0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRowClick(c.id);
                      }}
                    >
                      <td className={`td-primary font-mono ${styles.caseNum}`}>
                        {c.id}
                        {c.surgeFlag && (
                          <Badge variant="violet" className={styles.surgeBadge}>
                            SURGE
                          </Badge>
                        )}
                      </td>
                      <td>{c.subjectName}</td>
                      <td>
                        <Badge variant="navy">{c.caseType}</Badge>
                      </td>
                      <td>
                        <Badge variant={sb.variant}>{sb.label}</Badge>
                      </td>
                      <td className={styles.hideOnMobile}>
                        <Badge variant={pb.variant}>{pb.label}</Badge>
                      </td>
                      <td className={`text-muted ${styles.dateCell}`}>
                        {fmtDate(c.receivedDate)}
                      </td>
                      <td>
                        <Badge variant={s48.variant}>{s48.label}</Badge>
                      </td>
                      <td className={styles.hideOnMobile}>
                        <Badge variant={s3d.variant}>{s3d.label}</Badge>
                      </td>
                      <td className={`text-muted text-sm ${styles.hideOnMobile}`}>
                        {confirmedDocs}/{totalDocs}
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(c.id);
                          }}
                        >
                          Open &rarr;
                        </Button>
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

export default CasesList;
