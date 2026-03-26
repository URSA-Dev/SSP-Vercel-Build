/**
 * @file App.jsx
 * @description Root application component for URSA SSP.
 *
 * Responsibilities:
 *   - Defines the top-level route table (React Router v6)
 *   - Wraps authenticated routes in RequireAuth guard + AppShell layout
 *   - Login page renders outside the AppShell (no sidebar/topbar)
 *   - Catch-all route redirects unknown paths to the dashboard
 *
 * @module App
 */

import { Routes, Route, Navigate } from 'react-router-dom';

// ── Layout ────────────────────────────────────────────────────────────────
import AppShell from './layouts/AppShell';

// ── Pages — Public ────────────────────────────────────────────────────────
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// ── Pages — Authenticated (loaded inside AppShell) ────────────────────────
import Dashboard from './pages/Dashboard/Dashboard';
import CasesList from './pages/Cases/CasesList';
import NewCase from './pages/NewCase/NewCase';
import CaseDetail from './pages/CaseDetail/CaseDetail';
import AiExtract from './pages/AiExtract/AiExtract';
import Policies from './pages/Policies/Policies';
import PolicyEditor from './pages/Policies/PolicyEditor';
import QaQueue from './pages/QaQueue/QaQueue';
import Workload from './pages/Workload/Workload';
import Metrics from './pages/Metrics/Metrics';
import Reports from './pages/Reports/Reports';
import AuditLog from './pages/AuditLog/AuditLog';
import Settings from './pages/Settings/Settings';
import FclTracker from './pages/FclTracker/FclTracker';
import ForeignTravel from './pages/ForeignTravel/ForeignTravel';
import Violations from './pages/Violations/Violations';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: Auth Guard
// Description: Route-level authentication wrapper. Checks localStorage for
//              a session token; redirects unauthenticated users to /login.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RequireAuth — Protects child routes by verifying a session token exists.
 *
 * If no `ssp_token` is found in localStorage, the user is redirected to
 * the login page. Uses `replace` to prevent back-button loops.
 *
 * @param {{ children: JSX.Element }} props — Child route elements to protect
 * @returns {JSX.Element} Children if authenticated, or <Navigate> to /login
 */
function RequireAuth({ children }) {
  const token = localStorage.getItem('ssp_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: App Component (default export)
// Description: Root route table. Public routes (login) sit outside the
//              AppShell; authenticated routes are nested inside it.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * App — Root component defining the SSP route structure.
 *
 * Route hierarchy:
 *   /login            → Login page (public, no AppShell)
 *   /                 → Dashboard
 *   /cases            → Case list
 *   /cases/new        → New case wizard
 *   /cases/:id        → Case detail view
 *   /ai-extract       → AI document extraction
 *   /policies         → Policy library
 *   /policies/new     → Policy editor
 *   /qa               → QA queue
 *   /workload         → Workload board
 *   /metrics          → Metrics dashboard
 *   /reports          → Reports
 *   /audit            → Audit log
 *   /settings         → Administration settings
 *   /fcl              → Facility Clearance Level tracker
 *   /foreign-travel   → Foreign travel tracking
 *   /violations       → Security violations
 *   *                 → Catch-all redirect to /
 *
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <Routes>
      {/* ── Public Routes — Auth pages (outside AppShell, no sidebar/topbar) ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Protected Routes — Wrapped in auth guard + AppShell layout ── */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        {/* Core */}
        <Route path="/" element={<Dashboard />} />

        {/* Case Management */}
        <Route path="/cases" element={<CasesList />} />
        <Route path="/cases/new" element={<NewCase />} />
        <Route path="/cases/:id" element={<CaseDetail />} />

        {/* AI & Documents */}
        <Route path="/ai-extract" element={<AiExtract />} />

        {/* Policy */}
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/new" element={<PolicyEditor />} />

        {/* Operations */}
        <Route path="/qa" element={<QaQueue />} />
        <Route path="/workload" element={<Workload />} />

        {/* Analytics */}
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/reports" element={<Reports />} />

        {/* Administration */}
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/settings" element={<Settings />} />

        {/* Security Tracking */}
        <Route path="/fcl" element={<FclTracker />} />
        <Route path="/foreign-travel" element={<ForeignTravel />} />
        <Route path="/violations" element={<Violations />} />
      </Route>

      {/* ── Catch-all — Redirect to dashboard (auth guard handles login) ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
