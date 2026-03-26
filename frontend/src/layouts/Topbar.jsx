import { useLocation } from 'react-router-dom';
import s from './Topbar.module.css';

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/cases': 'Cases',
  '/cases/new': 'New Case',
  '/ai-extract': 'AI Document Extraction',
  '/policies': 'Policy Library',
  '/policies/new': 'Policy Development',
  '/fcl': 'FCL Tracker',
  '/foreign-travel': 'Foreign Travel',
  '/violations': 'Security Violations',
  '/qa': 'QA Queue',
  '/workload': 'Workload Board',
  '/metrics': 'Metrics',
  '/reports': 'Reports',
  '/audit': 'Audit Log',
  '/settings': 'Settings',
};

function deriveBreadcrumb(pathname) {
  if (pathname === '/') {
    return [{ label: 'Dashboard', active: true }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [];

  // Check for known routes first
  const knownLabel = ROUTE_LABELS[pathname];
  if (knownLabel) {
    // If nested (e.g. /cases/new), show parent too
    if (segments.length > 1) {
      const parentPath = '/' + segments[0];
      const parentLabel = ROUTE_LABELS[parentPath];
      if (parentLabel) {
        crumbs.push({ label: parentLabel, active: false });
      }
    }
    crumbs.push({ label: knownLabel, active: true });
    return crumbs;
  }

  // Dynamic routes like /cases/:id
  if (segments[0] === 'cases' && segments.length === 2) {
    crumbs.push({ label: 'Cases', active: false });
    crumbs.push({ label: 'Case Detail', active: true });
    return crumbs;
  }

  // Fallback: capitalize segments
  segments.forEach((seg, i) => {
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    crumbs.push({ label, active: i === segments.length - 1 });
  });

  return crumbs;
}

export default function Topbar({ onMenuClick, notificationCount = 0 }) {
  const { pathname } = useLocation();
  const breadcrumbs = deriveBreadcrumb(pathname);

  return (
    <header className={s.topbar}>
      <button
        className={s.hamburger}
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        type="button"
      >
        &#9776;
      </button>

      <div className={s.breadcrumb} aria-label="Breadcrumb">
        <span>SSP</span>
        {breadcrumbs.map((crumb, i) => (
          <span key={i}>
            <span className={s.bcSep}>/</span>
            <span className={crumb.active ? s.bcActive : undefined}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      <div className={s.topbarRight}>
        <span className={s.restrictedBadge}>FOUO &middot; DOW INTERNAL</span>
        <button
          className={s.notifBtn}
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
          type="button"
        >
          &#128276;
          {notificationCount > 0 && <span className={s.notifPip} />}
        </button>
      </div>
    </header>
  );
}
