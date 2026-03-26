# SSP Vercel Build — Comprehensive Technical Review
**Date:** 2026-03-26
**Scope:** Full 2-tier architecture audit (Vercel Frontend + AWS Backend)
**Live URL:** https://frontend-red-three-13.vercel.app

---

## EXECUTIVE SUMMARY

The SSP (Security Support Platform) is a 2-tier SaaS case management application for the Department of War (DoW) personnel security domain. The architecture separates the frontend (Vercel CDN) from the backend (AWS ECS Fargate + RDS PostgreSQL).

| Metric | Value |
|--------|-------|
| **Frontend lines of code** | ~2,860 (config + source) |
| **Backend lines of code** | ~2,500 (config + source) |
| **Database migrations** | 22 (7 core + 8 AI + 1 bridge) |
| **Database seeds** | 15 files, 50+ records |
| **AWS Terraform modules** | 11 (VPC, ECS, RDS, S3, IAM, KMS, Secrets, ALB, Monitoring) |
| **React components** | 25+ shared, 16 pages, 8 modals |
| **API endpoints** | 40+ (13 route modules) |
| **Claude Code config** | 9 agents, 6 commands, 3 rules, 18 skills |
| **Build status** | PASSING (200 modules, 0 errors) |
| **Deployment status** | LIVE on Vercel |

---

## ARCHITECTURE

```
                    ┌─────────────────────────────┐
                    │       VERCEL CDN             │
                    │   React 18 + Vite 6 SPA      │
                    │                              │
    Browser ───────►│  25+ components, 16 pages    │
                    │  CSS Modules + design tokens  │
                    │  Axios + JWT auth             │
                    │  Mock data fallbacks          │
                    │                              │
                    │  Rewrite: /api/* ─────────────┼──► AWS ALB (HTTPS)
                    └─────────────────────────────┘        │
                                                           ▼
              ┌───────────┐      ┌──────────────┐      ┌──────────┐
              │  AWS ALB   │─────►│  ECS Fargate  │─────►│ RDS PG15 │
              │  TLS 1.2+  │      │  Express 4.21 │      │ Multi-AZ │
              │  Port 443  │      │  Knex.js ORM  │      │ KMS enc  │
              └───────────┘      │  JWT + bcrypt  │      └──────────┘
                                 │  Multer upload │
                                 │  Helmet + CORS │      ┌──────────┐
                                 │  Audit logging │─────►│ S3 Uploads│
                                 └──────────────┘      │ KMS enc  │
                                                       └──────────┘
```

---

## TIER 1: FRONTEND (Vercel)

### Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| React Router | 6.28.0 | Client-side routing |
| Vite | 6.0.1 | Build tooling |
| Axios | 1.7.9 | HTTP client |
| CSS Modules | native | Scoped styling |

### File Structure (2,860 lines)
```
frontend/
├── vercel.json          — SPA routing, security headers, caching, API proxy
├── .env.production      — VITE_API_URL=/api/v1
├── .vercelignore        — Excludes Docker/nginx artifacts
├── vite.config.js       — Build config (sourcemap: false)
├── src/
│   ├── App.jsx          — 19 routes, auth guard
│   ├── main.jsx         — React 18 entry, BrowserRouter + ToastProvider
│   ├── layouts/         — AppShell (sidebar + topbar + content)
│   ├── pages/           — 16 page components
│   │   ├── Dashboard, Cases, NewCase (4-step wizard), CaseDetail (6 tabs)
│   │   ├── Policies, PolicyEditor, QaQueue, Workload
│   │   ├── Metrics, Reports, AuditLog, Settings
│   │   ├── FclTracker, ForeignTravel, Violations
│   │   └── Login, ForgotPassword, ResetPassword
│   ├── components/      — 25+ shared (Button, Badge, Card, Modal, Table, etc.)
│   ├── services/        — 11 API service modules with mock fallbacks
│   ├── hooks/           — useConfirm, useMediaQuery (7 breakpoint helpers)
│   ├── utils/           — constants, dates, format, suspense calc
│   └── styles/          — design-tokens.css, globals.css, animations.css, utilities.css
```

### Case Management Workflow (Primary Feature)

| Feature | Status | Notes |
|---------|--------|-------|
| Case list (search, filter, sort) | COMPLETE | 4 mock cases, SLA badge calc |
| New case wizard (4 steps) | COMPLETE | Subject → Type → Priority → Review |
| Case detail (6 tabs) | COMPLETE | Overview, Documents, Issues, Comms, Memo, History |
| Document upload + AI extraction | COMPLETE | UploadDocModal → confirmExtraction service |
| Issue management | COMPLETE | Add/delete with SEAD-4 guideline refs |
| Communications logging | COMPLETE | 8 types, suspense effect tracking |
| Memo drafting + QA checklist | COMPLETE | 8-point QA, disposition selection |
| Status workflow (13 states) | COMPLETE | Full transition validation |
| SLA ring (48-hr, 3-day) | COMPLETE | Real-time countdown with ok/warn/over |
| Audit history timeline | COMPLETE | Chronological event log |

### Security Headers (vercel.json)

| Header | Value | Status |
|--------|-------|--------|
| X-Frame-Options | SAMEORIGIN | PASS |
| X-Content-Type-Options | nosniff | PASS |
| X-XSS-Protection | 1; mode=block | PASS |
| Referrer-Policy | strict-origin-when-cross-origin | PASS |
| Content-Security-Policy | self + Google Fonts | PASS |
| Cache-Control (assets) | 1yr immutable | PASS |
| Cache-Control (index.html) | no-store, no-cache | PASS |

### Design System

| Token | Value |
|-------|-------|
| Primary | #4a5c2f (Army Olive) |
| Font (sans) | Roboto |
| Font (mono) | Roboto Mono |
| Breakpoints | 1024px, 768px, 480px |
| Shadows | 6 levels (xs → xl) |
| Border radius | 4px → 9999px |
| Sidebar | 240px (collapsible on mobile) |

### Frontend Issues Found

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | HIGH | No testing infrastructure (0 tests) | package.json |
| 2 | HIGH | Auth guard checks localStorage only, no JWT validation | App.jsx |
| 3 | MEDIUM | CSP allows unsafe-inline styles | vercel.json |
| 4 | MEDIUM | Notification count hardcoded (not wired to API) | AppShell.jsx |
| 5 | MEDIUM | User data hardcoded defaults in Sidebar | Sidebar.jsx |
| 6 | MEDIUM | No request timeout on Axios | api.js |
| 7 | MEDIUM | No error boundary components | App.jsx |
| 8 | MEDIUM | Memo layout not responsive (inline grid) | Memo.jsx |
| 9 | LOW | Font mismatch (Roboto vs Outfit in reference) | design-tokens.css |
| 10 | LOW | genId() not UUID format | format.js |
| 11 | LOW | No favicon defined | index.html |
| 12 | LOW | Environment hardcoded "DEVELOPMENT" | Sidebar.jsx |

---

## TIER 2: BACKEND (AWS)

### Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 (Alpine) | Runtime |
| Express | 4.21.1 | HTTP framework |
| Knex.js | 3.1.0 | SQL query builder |
| PostgreSQL | 15 | Primary database |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |
| Multer | 1.4.5 | File uploads |
| Helmet | 8.0.0 | Security headers |
| CORS | 2.8.5 | Cross-origin |

### File Structure (~2,500 lines)
```
backend/
├── src/
│   ├── app.js           — Express app (13 route modules, CORS, Helmet, CMS proxy)
│   ├── server.js        — Entry point (port binding)
│   ├── config/          — Centralized config + Knex database connection
│   ├── middleware/       — auth, audit, error-handler, validate, pagination, require-admin
│   ├── routes/          — 13 route modules (auth, cases, documents, policies, etc.)
│   ├── controllers/     — 12 controller modules (business logic)
│   ├── models/          — 10 model modules (Knex queries)
│   ├── utils/           — result.js, document-constants.js
│   └── errors/          — BaseError, domain errors (defined but unused)
```

### API Endpoints (40+)

| Module | Endpoints | Auth | Audit |
|--------|-----------|------|-------|
| /api/v1/auth | 4 (login, logout, me, update) | Partial | Yes |
| /api/v1/cases | 18 (CRUD + issues + comms + docs + memo + QA) | Yes | Yes |
| /api/v1/documents | 5 (upload, list, confirm, reject, delete) | Yes | Yes |
| /api/v1/policies | 5 (CRUD) | Yes | Yes |
| /api/v1/qa | 3 (queue, review, submit) | Yes | Yes |
| /api/v1/audit | 2 (list, CSV export) | Yes | No |
| /api/v1/notifications | 4 (list, read, read-all, clear) | Yes | No |
| /api/v1/metrics | 3 (dashboard, workload, suspense) | Yes | No |
| /api/v1/settings | 3 (list, get, set) | Yes | Yes |
| /api/v1/fcl | 6 (CRUD + stats) | Yes | Yes |
| /api/v1/travel | 6 (CRUD + stats) | Yes | Yes |
| /api/v1/violations | 6 (CRUD + stats) | Yes | Yes |
| /api/v1/content | 3 (announcements, help, alerts) | Yes | No |

### Case Workflow State Machine

```
RECEIVED → ASSIGNED → IN_REVIEW → ISSUES_IDENTIFIED → MEMO_DRAFT
                          ↓                              ↓
                       ON_HOLD ←──────────────────┐   QA_REVIEW
                                                   │      ↓
         FINAL_REVIEW ← QA_REVISION ← QA_REVIEW → SUBMITTED
            ↓
         CLOSED_FAVORABLE / CLOSED_UNFAVORABLE

Terminal: CLOSED_FAVORABLE, CLOSED_UNFAVORABLE
Reopen: CANCELLED → RECEIVED
```

### Middleware Pipeline

```
Request → authenticate → validate → [route handler] → auditLog → response
                                         ↓
                                    error-handler → { error: { code, message } }
```

| Middleware | Purpose | Lines |
|-----------|---------|-------|
| auth.js | JWT verification, user lookup | 107 |
| audit.js | Intercepts mutations, writes audit_log | 63 |
| error-handler.js | Global error handler, consistent format | 61 |
| validate.js | Schema validation (required, uuid, email, etc.) | 111 |
| pagination.js | Parse page/limit, build meta | 54 |
| require-admin.js | Role-based access (ADMIN only) | 68 |

### Backend Issues Found

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | CRITICAL | Race condition in auth middleware (.then() without await) | auth.js, require-admin.js |
| 2 | CRITICAL | JWT_SECRET defaults to placeholder | config/index.js |
| 3 | HIGH | No database transactions (non-atomic writes) | controllers/*.js |
| 4 | HIGH | No testing infrastructure (0 tests) | package.json |
| 5 | HIGH | Settings role check case-sensitivity bug | settings.controller.js |
| 6 | MEDIUM | Policy version bump uses float arithmetic | policies.controller.js |
| 7 | MEDIUM | ID generation race conditions (non-atomic) | case.model.js |
| 8 | MEDIUM | CSV export no row limit (memory risk) | audit.controller.js |
| 9 | MEDIUM | Error classes defined but never used | errors/*.js |
| 10 | MEDIUM | Health check doesn't verify DB connection | app.js |
| 11 | LOW | No structured logging (console only) | All controllers |
| 12 | LOW | No request size limits per route | app.js |

---

## DATABASE LAYER

### Schema (22 migrations, 1,800+ lines)

| Category | Tables | Purpose |
|----------|--------|---------|
| Core | users, cases, case_documents, case_issues, case_communications, case_history, case_memos | Case management workflow |
| Compliance | policies, fcl_records, foreign_travel, violations | Security compliance tracking |
| System | qa_reviews, audit_log, notifications, settings | Platform operations |
| AI Layer | ai_models, ai_agents, ai_prompt_templates, ai_tasks, ai_task_messages, ai_outputs, ai_human_reviews, ai_metrics, ai_feature_store, ai_agent_events | AI orchestration (11 tables) |
| AI Knowledge | ai_conversation_memory, ai_knowledge_sources, ai_knowledge_chunks, ai_rag_query_log | RAG + semantic memory |
| AI Workflow | ai_workflows, ai_workflow_steps, ai_workflow_edges, ai_workflow_runs, ai_workflow_step_runs | DAG pipeline execution |
| AI Quality | ai_eval_datasets, ai_eval_samples, ai_experiments, ai_eval_results | A/B testing + evaluation |
| AI Safety | ai_guardrails, ai_guardrail_violations | Content filtering + PII detection |
| Bridge | case_documents (mongo_ref columns) | PostgreSQL ↔ MongoDB |

### Seed Data (15 files, 2,286 lines)

| Seed | Records | Quality |
|------|---------|---------|
| Users | 5 (Admin + Adjudicators + Supervisor) | High |
| Cases | 4 (mixed workflow stages) | Very High |
| Documents | 4 (with extraction fields) | High |
| Issues | 2 (Guideline F, G) | High |
| Communications | 1 (48-hr notification) | Medium |
| Memos | 1 (full adjudicative memo) | Very High |
| History | 10 events (full timeline) | Very High |
| Policies | 3 (SOP, Policy, Draft) | High |
| FCL Records | 5 (mixed clearance levels) | Medium |
| Travel + Violations | 5 + 6 (various statuses) | Very High |
| QA + Notifications | 1 + 2 | Medium |
| AI Agents + Templates | 7 + 7 (Claude, Document AI, Vertex) | Very High |
| AI Guardrails | 8 (PII, content, token, bias) | High |
| AI Workflows | 2 pipelines + 10 steps + 8 edges | Very High |
| AI Knowledge | SEAD-4 (13 chunks) + EO 12968 | Very High |

---

## AWS INFRASTRUCTURE (Terraform)

### Resources Deployed

| Resource | Config | Purpose |
|----------|--------|---------|
| VPC | 10.0.0.0/16, 3 subnet tiers, 2 AZs | Network isolation |
| ALB | HTTPS (TLS 1.2+), ACM cert | Load balancing |
| ECS Fargate | 2-6 tasks, circuit breaker | Container orchestration |
| RDS PostgreSQL 15 | Multi-AZ, KMS, 14-day backup | Database |
| S3 | Versioned, KMS, lifecycle rules | Document storage |
| Secrets Manager | KMS encrypted, rotation ready | Credential management |
| IAM | Least privilege roles | Access control |
| CloudWatch | CPU, memory, 5xx alarms → SNS | Monitoring |
| KMS | Annual rotation, custom keys | Encryption |
| VPC Flow Logs | All traffic → CloudWatch | Network audit |

### Infrastructure Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | HIGH | Single NAT Gateway (SPOF) |
| 2 | HIGH | No ECS auto-scaling policies defined |
| 3 | HIGH | Missing ALB 5xx error alarm |
| 4 | MEDIUM | No WAF on ALB |
| 5 | MEDIUM | ECS egress to 0.0.0.0/0 too broad |
| 6 | MEDIUM | Missing ECR pull permissions in execution role |
| 7 | LOW | S3 lifecycle transition at 90 days may be aggressive |

---

## CLAUDE CODE CONFIGURATION

| Component | Count | Purpose |
|-----------|-------|---------|
| Agents | 9 | cloud-architect, code-reviewer, db-architect, devops-engineer, frontend-builder, qa-tester, security-reviewer, ui-expert, ux-auditor |
| Commands | 6 | add-feature, db-migrate, review, security-scan, test-all, upload-flow |
| Rules | 3 | backend (auth, audit, SQL safety), database (UUID, timestamps, migrations), frontend (React, responsive, accessibility) |
| Skills | 18 | api-docs, cloud-deploy (aws/azure/gcp), code-review, data-layer, db-migrate, deploy, devops, doc-management, iac-terraform, network-architecture, performance-audit, security-scan, testing, ui-design |
| MCP Servers | 4 | GitHub, PostgreSQL, Filesystem, DBeaver |

---

## OVERALL ASSESSMENT

### Strengths
- Clean separation of concerns across all layers
- Comprehensive mock data enables demo without backend
- Full case management workflow with 13-state machine
- Sophisticated AI infrastructure (agents, guardrails, RAG, workflows, evaluation)
- Government-grade design system with Army Olive theme
- Security headers, KMS encryption, audit trails throughout
- Vercel deployment working and live

### Weaknesses
- Zero test coverage (frontend and backend)
- Race condition in authentication middleware
- No database transactions for multi-step operations
- JWT secret defaults to insecure placeholder
- Single NAT Gateway (infrastructure SPOF)
- No structured logging or error boundaries

### Demo Readiness: 90%
The case management workflow is fully functional with mock data. Document upload/confirm flow was fixed in this session. The app is live at https://frontend-red-three-13.vercel.app.

### Production Readiness: 65%
Critical blockers: auth race condition, missing tests, JWT secret validation, NAT HA, transaction support.

### Estimated Remediation
- **Demo-ready polish:** 1-2 days (Phase 2-3 visual fixes)
- **Production-ready:** 2-3 weeks (testing, auth fixes, transactions, infra hardening)
