import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth.service';
import s from './Sidebar.module.css';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { icon: '\u{1F4CA}', label: 'Dashboard', to: '/' },
      { icon: '\u{1F4C1}', label: 'Cases', to: '/cases' },
      { icon: '\u{2795}', label: 'New Case', to: '/cases/new' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { icon: '\u{2726}', label: 'AI Document Extraction', to: '/ai-extract' },
      { icon: '\u{1F4DD}', label: 'Policy Development', to: '/policies/new' },
    ],
  },
  {
    label: 'Compliance & Security',
    items: [
      { icon: '\u{1F4D6}', label: 'Policy Library', to: '/policies' },
      { icon: '\u{1F3E2}', label: 'FCL Tracker', to: '/fcl' },
      { icon: '\u{2708}\uFE0F', label: 'Foreign Travel', to: '/foreign-travel' },
      { icon: '\u{1F6A8}', label: 'Security Violations', to: '/violations' },
    ],
  },
  {
    label: 'Quality & Reports',
    items: [
      { icon: '\u{2705}', label: 'QA Queue', to: '/qa', badge: true },
      { icon: '\u{1F4CB}', label: 'Workload Board', to: '/workload' },
      { icon: '\u{1F4C8}', label: 'Metrics', to: '/metrics' },
      { icon: '\u{1F4D1}', label: 'Reports', to: '/reports' },
      { icon: '\u{1F4DC}', label: 'Audit Log', to: '/audit' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { icon: '\u{2699}\uFE0F', label: 'Settings', to: '/settings' },
      { icon: '\u{1F4F0}', label: 'Content Editor', href: '/cms/admin', adminOnly: true },
    ],
  },
];

const DEFAULT_USER = {
  last_name: 'Smith',
  first_initial: 'A',
  role: 'Adjudicator',
};

export default function Sidebar({ isOpen, onClose, user = DEFAULT_USER, qaCount = 0 }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className={`${s.sidebar} ${isOpen ? s.sidebarOpen : ''}`}
      aria-label="Main navigation"
    >
      {/* Logo / brand */}
      <div className={s.sbTop}>
        <div className={s.sbLogo}>
          <div className={s.sbLogoMark}>SSP</div>
          <div className={s.sbLogoText}>
            <div className={s.name}>URSA SSP</div>
            <div className={s.tagline}>Security Support Platform</div>
          </div>
        </div>
        <div className={s.sbEnvPill}>
          <span className={s.sbEnvDot} />
          DEVELOPMENT
        </div>
      </div>

      {/* Navigation */}
      <nav className={s.sbNav}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || user.role === 'ADMIN',
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <div className={s.sbGroupLbl}>{group.label}</div>
              {visibleItems.map((item) =>
                item.href ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className={s.sbItem}
                    onClick={onClose}
                  >
                    <span className={s.ic}>{item.icon}</span>
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `${s.sbItem} ${isActive ? s.sbItemActive : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className={s.ic}>{item.icon}</span>
                    {item.label}
                    {item.badge && qaCount > 0 && (
                      <span className={s.sbBadge}>{qaCount}</span>
                    )}
                  </NavLink>
                ),
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer — current user */}
      <div className={s.sbFooter}>
        <div className={s.userRow}>
          <div className={s.userAv}>
            {user.first_initial}{user.last_name?.[0] || ''}
          </div>
          <div>
            <div className={s.userName}>
              {user.first_initial}. {user.last_name}
            </div>
            <div className={s.userRole}>{user.role}</div>
          </div>
        </div>
        <button className={s.signOutBtn} onClick={handleLogout} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
