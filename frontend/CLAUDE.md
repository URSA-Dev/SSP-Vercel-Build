# SSP Frontend — Tier 1

## Stack
- React 18+ with hooks
- React Router for navigation
- CSS Modules (matching existing design system)
- Vite for build tooling
- Axios for API client

## Structure
```
frontend/
├── src/
│   ├── components/        # Reusable UI (Button, Badge, Card, Modal, Toast, etc.)
│   ├── pages/             # Page-level (Dashboard, Cases, Settings, etc.)
│   ├── layouts/           # Shell layout (Sidebar + Topbar + Content)
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client functions
│   ├── store/             # State management
│   ├── utils/             # Helpers (date formatting, suspense calc, etc.)
│   ├── styles/            # Design system tokens, global CSS
│   └── App.jsx
├── public/
└── package.json
```

## Design System Reference
- All CSS variables, components, and patterns from the source HTML template
- Preserve exact color palette, spacing, typography
- Extract: KPI cards, tables, badges, buttons, modals, wizard steps, timeline, AI panel, SLA rings, upload zones, toasts, alerts

## Human Factors Standards
- Clear visual hierarchy and information density
- Keyboard navigable — all interactive elements
- WCAG 2.1 AA compliance
- Consistent interaction patterns across all modules
- Loading states, error states, empty states for all views
- Toast notifications for user feedback
- Responsive layout with mobile sidebar overlay
- Minimum touch target: 44x44px on mobile
