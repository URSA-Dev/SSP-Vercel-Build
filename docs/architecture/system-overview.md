# SSP System Architecture Overview

**Security Support Platform** -- 3-tier SaaS case management for the Department of War (DoW), personnel security domain.

**Last updated:** 2026-03-23

---

## 1. System Architecture Diagram

```
                         +--------------------+
                         |    End Users       |
                         | (Browser clients)  |
                         +--------+-----------+
                                  |
                          HTTPS / WSS
                                  |
               +------------------v-------------------+
               |     Tailscale  100.97.194.42         |
               |     LAN        192.168.1.187         |
               +------------------+-------------------+
                                  |
                    +-------------v--------------+
                    |   FRONTEND (Tier 1)        |
                    |   Vite Dev / Static Build   |
                    |   Port 5173                 |
                    |   React 18 SPA              |
                    |                             |
                    |   Proxies:                  |
                    |   /api/* --> :3001           |
                    |   /cms/* --> :3001           |
                    +---+-----------------+-------+
                        |                 |
                   /api/v1/*          /cms/*
                        |                 |
                    +---v-----------------v-------+
                    |   BACKEND (Tier 2)          |
                    |   Express API               |
                    |   Port 3001                 |
                    |                             |
                    |   Routes:                   |
                    |   /api/v1/* -- REST API      |
                    |   /cms/*   -- reverse proxy  |
                    |              (requireAdmin)  |
                    +---+-----------------+-------+
                        |                 |
                  Knex (pg)        http-proxy-middleware
                        |                 |
                    +---v---+    +--------v--------+
                    |       |    |   CMS (Tier 2b) |
                    |       |    |   Payload 3 +   |
                    |       |    |   Next.js 15    |
                    |       |    |   Port 3002     |
                    |       |    +--------+--------+
                    |       |             |
                    | PostgreSQL          | @payloadcms/db-postgres
                    |  (Tier 3)           |
                    |  Port 5432   <------+
                    |                     |
                    |  +---------------+  |
                    |  | public schema |  |
                    |  | (SSP tables)  |  |
                    |  +---------------+  |
                    |  | payload schema|  |
                    |  | (CMS tables)  |  |
                    |  +---------------+  |
                    +---------------------+
```

### Data Flow Summary

```
Browser --5173--> Vite --proxy--> Express :3001 --Knex--> PostgreSQL :5432 (public.*)
                                     |
                                     +--proxy /cms--> Payload :3002 --adapter--> PostgreSQL :5432 (payload.*)
```

All browser traffic enters through port 5173. The Vite dev server proxies `/api` and `/cms` requests to the Express backend on port 3001. The backend handles API routes directly and reverse-proxies `/cms/*` to the Payload CMS on port 3002. Both the backend and the CMS connect to the same PostgreSQL instance on port 5432 but use separate schemas.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | ^18.3.1 | UI component library |
| | React Router DOM | ^6.28.0 | Client-side routing |
| | Axios | ^1.7.9 | HTTP client |
| | Vite | ^6.0.1 | Build tool / dev server |
| | CSS Modules | -- | Scoped component styles |
| **Backend** | Node.js | 18+ (LTS) | Runtime |
| | Express | ^4.21.1 | HTTP framework |
| | Knex.js | ^3.1.0 | SQL query builder / migrations |
| | pg | ^8.13.1 | PostgreSQL driver |
| | jsonwebtoken | ^9.0.2 | JWT auth |
| | bcryptjs | ^2.4.3 | Password hashing |
| | Helmet | ^8.0.0 | Security headers |
| | CORS | ^2.8.5 | Cross-origin policy |
| | http-proxy-middleware | ^3.0.5 | CMS reverse proxy |
| | Multer | ^1.4.5-lts.1 | File uploads |
| **CMS** | Payload | ^3.78.0 | Headless CMS |
| | Next.js | ^15.3.9 | CMS admin UI framework |
| | @payloadcms/db-postgres | ^3.78.0 | Payload PostgreSQL adapter |
| | @payloadcms/richtext-lexical | ^3.78.0 | Rich text editor |
| | GraphQL | ^16.13.1 | CMS query API |
| | sharp | ^0.33.0 | Image processing |
| **Database** | PostgreSQL | 15+ | RDBMS |
| **Infra** | Terraform | -- | Multi-cloud IaC |
| | Tailscale | -- | Mesh VPN for remote access |

---

## 3. Service Topology

### Development Environment

| Service | Port | Host Binding | Start Command | Process |
|---------|------|-------------|---------------|---------|
| Frontend | 5173 | `0.0.0.0` | `cd frontend && npm run dev` | `vite` |
| Backend | 3001 | `localhost` | `cd backend && npm run dev` | `node --watch src/server.js` |
| CMS | 3002 | `localhost` | `cd cms && npm run dev` | `next dev -p 3002` |
| PostgreSQL | 5432 | `localhost` | System service | `postgres` |

### Production

| Service | Start Command | Notes |
|---------|--------------|-------|
| Frontend | `cd frontend && npm run build` | Static files served by reverse proxy or CDN |
| Backend | `cd backend && npm start` | `node src/server.js` |
| CMS | `cd cms && npm run build && npm start` | `next start -p 3002` |
| PostgreSQL | Managed (RDS/Cloud SQL) | Connection via `DATABASE_URL` |

### Database Environments

| Environment | Database Name | Connection Pool |
|-------------|--------------|----------------|
| Development | `ssp` | min: 2, max: 10 |
| Test | `ssp_test` | default |
| Production | via `DATABASE_URL` | min: 2, max: 20 |

---

## 4. Request Flow Diagrams

### 4a. Normal API Call (e.g., GET /api/v1/cases)

```
Browser
  |
  |  GET /api/v1/cases?status=OPEN&page=1
  v
Vite Dev Server (:5173)
  |
  |  proxy: /api/* --> localhost:3001
  v
Express (:3001)
  |
  +-- helmet() .............. security headers injected
  +-- cors() ................ origin check (5173, 3000)
  +-- express.json() ........ body parsing
  |
  +-- /api/v1/cases route
  |     |
  |     +-- authenticate middleware
  |     |     |
  |     |     +-- Extract Bearer token from Authorization header
  |     |     +-- jwt.verify(token, JWT_SECRET)
  |     |     +-- Lookup user in DB, attach req.user
  |     |     +-- 401 if invalid/expired
  |     |
  |     +-- casesController.list()
  |           |
  |           +-- Validate query params
  |           +-- Knex query: db('cases').where(...).paginate(...)
  |           +-- Return { data: [...], pagination: {...} }
  |
  v
Response: 200 { data, pagination }
```

### 4b. CMS Admin Access (e.g., admin edits an announcement)

```
Browser
  |
  |  GET /cms/admin  (or any /cms/* path)
  v
Vite Dev Server (:5173)
  |
  |  proxy: /cms/* --> localhost:3001
  v
Express (:3001)
  |
  +-- helmet({ contentSecurityPolicy: false }) ... relaxed CSP for /cms
  |
  +-- /cms mount point
  |     |
  |     +-- requireAdmin middleware
  |     |     |
  |     |     +-- Extract Bearer token from Authorization header
  |     |     +-- jwt.verify(token, JWT_SECRET)  <-- SSP JWT, NOT Payload JWT
  |     |     +-- DB lookup: user must exist AND role === 'ADMIN'
  |     |     +-- 401 if no token, 403 if non-admin
  |     |
  |     +-- createProxyMiddleware()
  |           |
  |           +-- Forward request to http://localhost:3002
  |           +-- changeOrigin: true
  |           +-- WebSocket support (ws: true)
  |
  v
Payload CMS (:3002)
  |
  +-- Payload's own auth layer (separate user collection)
  +-- Admin UI served (Next.js SSR)
  +-- CRUD operations on payload.* schema tables
  |
  v
Response: HTML/JSON back through proxy chain to browser
```

**Key point:** Two layers of authentication protect CMS access. First, the SSP `requireAdmin` middleware verifies the user holds an ADMIN role via SSP's JWT. Then, Payload enforces its own session/auth on the admin panel. This is defense-in-depth -- even if Payload auth is compromised, the Express proxy gate blocks non-admin SSP users.

### 4c. Content Read (e.g., dashboard loads announcements)

```
Browser
  |
  |  GET /api/v1/content/announcements
  v
Vite Dev Server (:5173)
  |
  |  proxy: /api/* --> localhost:3001
  v
Express (:3001)
  |
  +-- /api/v1/content route
  |     |
  |     +-- authenticate middleware (any role -- not admin-only)
  |     |
  |     +-- Knex query DIRECTLY against payload schema:
  |     |     db('payload.announcements')
  |     |       .where('is_active', true)
  |     |       .where('published_at', '<=', now)
  |     |       .where('expires_at', '>', now)  -- or null
  |     |       .orderBy('created_at', 'desc')
  |     |
  |     +-- Return { data: [...] }
  |
  v
Response: 200 { data: [announcements] }
```

**Key point:** Content reads do NOT proxy to Payload. The backend reads Payload's tables directly via Knex (cross-schema query `payload.announcements`). This avoids an extra network hop and keeps read latency low. Payload is only involved when admins write/edit content through the CMS admin UI.

---

## 5. Authentication Architecture

### SSP Authentication (Primary)

```
Login Flow:
  POST /api/v1/auth/login { email, password }
    |
    +-- bcrypt.compare(password, user.password_hash)
    +-- Generate JWT: jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET)
    +-- Return { token, user: { id, email, role, ... } }

Token Lifecycle:
  +-- Issued at login
  +-- Expires in: 24h (configurable via JWT_EXPIRES_IN)
  +-- Stored client-side (browser memory / localStorage)
  +-- Sent as: Authorization: Bearer <token>
  +-- Verified by: authenticate middleware (all /api/v1/* routes except login)
  +-- Claims: { sub: UUID, role: string, iat, exp }
```

### Payload CMS Authentication (Separate)

```
  +-- Payload maintains its own `users` collection in the payload schema
  +-- Session-based auth within the Payload admin panel
  +-- Completely independent of SSP's JWT system
  +-- PAYLOAD_SECRET signs Payload's own tokens
  +-- CMS users are NOT SSP users -- separate identity stores
```

### Auth Boundary Summary

| Concern | SSP Auth | Payload Auth |
|---------|----------|-------------|
| Identity store | `public.users` table | `payload.users` table |
| Token type | JWT (Bearer) | Payload session/cookie |
| Secret | `JWT_SECRET` env var | `PAYLOAD_SECRET` env var |
| Token lifetime | 24h (configurable) | Payload default |
| Middleware | `authenticate`, `requireAdmin` | Payload built-in |
| Scope | All `/api/v1/*` routes | `/cms/*` admin panel |

### Defense-in-Depth for CMS

Access to the CMS admin panel requires passing through BOTH auth systems:

1. **Express gate:** `requireAdmin` checks SSP JWT -- user must be ADMIN role
2. **Payload gate:** Payload's own login screen authenticates the CMS admin user

A user must hold credentials in both systems to manage content.

---

## 6. Security Layers

### Layer 1: Transport / Network

- **Tailscale mesh VPN** for remote access (no exposed ports to public internet in dev)
- **LAN access** at 192.168.1.187 for local network clients
- Vite binds to `0.0.0.0` (all interfaces) in dev; production uses a reverse proxy

### Layer 2: HTTP Security Headers (Helmet)

Applied globally via `helmet()`:

| Header | Purpose |
|--------|---------|
| Content-Security-Policy | Restricts script/style sources (disabled for `/cms` path so Payload admin panel can load its own assets) |
| X-Content-Type-Options | Prevents MIME sniffing (`nosniff`) |
| X-Frame-Options | Prevents clickjacking (`DENY` or `SAMEORIGIN`) |
| Strict-Transport-Security | Forces HTTPS in production |
| X-XSS-Protection | Legacy XSS filter hint |
| Referrer-Policy | Controls referer leakage |

### Layer 3: CORS

```javascript
cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
})
```

- Whitelisted origins only
- Credentials (cookies/auth headers) allowed
- Production config should restrict to actual deployment domain

### Layer 4: Authentication & Authorization

- **authenticate** middleware -- verifies JWT on all API routes (except `/auth/login`)
- **requireAdmin** middleware -- verifies JWT AND checks `role === 'ADMIN'` (used for CMS proxy gate)
- Tokens verified against `JWT_SECRET`; user existence confirmed via DB lookup
- Soft-deleted users (`deleted_at IS NOT NULL`) are rejected

### Layer 5: Input Validation & Query Safety

- All request input validated at controller level
- Parameterized queries via Knex -- no SQL string concatenation
- Request body size limited to 10MB (`express.json({ limit: '10mb' })`)
- File upload size limited to 50MB (configurable via `MAX_FILE_SIZE`)

### Layer 6: Error Handling

- Global error handler catches unhandled errors
- Consistent error format: `{ error: { code, message, details } }`
- No sensitive data (stack traces, DB errors) leaked in responses
- 404 handler for undefined routes

### Layer 7: Audit Trail

- All mutating endpoints write to `audit_log` table
- Tracks: who, what, when, before/after state
- Immutable -- no delete/update on audit records

### Layer 8: Database

- UUID primary keys (non-sequential, non-guessable)
- Soft deletes preserve data for audit
- Schema isolation between SSP and Payload data
- Connection pooling (min 2, max 10 dev / max 20 prod)

---

## 7. Database Architecture

### Schema Isolation

The SSP application and Payload CMS share a single PostgreSQL instance but use separate schemas:

```
PostgreSQL Instance: ssp (port 5432)
|
+-- public schema (SSP application data)
|   |
|   +-- users                  -- SSP user accounts, roles, profiles
|   +-- cases                  -- Core case records, workflow status
|   +-- case_documents         -- Uploaded/extracted documents
|   +-- case_issues            -- Issues/findings linked to cases
|   +-- case_communications    -- Communication log per case
|   +-- case_history           -- Timeline/audit trail per case
|   +-- policies               -- Policy library entries
|   +-- policy_sections        -- Editable sections within policies
|   +-- fcl_records            -- Facility clearance tracking
|   +-- foreign_travel         -- Travel records and approvals
|   +-- violations             -- Security violation incidents
|   +-- qa_reviews             -- QA queue items and results
|   +-- audit_log              -- System-wide immutable audit trail
|   +-- notifications          -- User notification records
|   |
|   Managed by: Knex.js migrations (backend/database/migrations/)
|
+-- payload schema (CMS content data)
    |
    +-- users                  -- Payload CMS admin users (separate from SSP users)
    +-- announcements          -- Dashboard announcements
    +-- help_articles          -- Help/documentation articles
    +-- system_alerts          -- System-wide alert banners
    +-- (Payload internal)     -- migrations, media, preferences, etc.
    |
    Managed by: Payload's built-in migration system (@payloadcms/db-postgres)
```

### Cross-Schema Access Pattern

- **Writes to payload schema:** Only through Payload CMS admin UI (port 3002)
- **Reads from payload schema:** Backend content routes query `payload.*` tables directly via Knex (e.g., `db('payload.announcements')`)
- **No cross-dependency:** SSP tables have no foreign keys to payload tables and vice versa
- **Independent migration lifecycles:** Knex manages `public`, Payload manages `payload`

### Table Conventions

| Convention | Rule |
|-----------|------|
| Primary keys | UUID via `gen_random_uuid()` |
| Timestamps | `created_at`, `updated_at` on all tables, UTC |
| Soft deletes | `deleted_at` column where applicable |
| Naming | `snake_case`, plural table names |
| Indexes | All foreign keys, plus columns in WHERE/ORDER BY/JOIN |
| Enums | PostgreSQL ENUM types for status, priority, severity |
| Cascades | `ON DELETE CASCADE` or `RESTRICT` per relationship |

---

## 8. Environment Variables Reference

### Backend (.env)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `3001` | No | Express server port |
| `NODE_ENV` | `development` | No | Environment: development, test, production |
| `DB_HOST` | `localhost` | No | PostgreSQL host |
| `DB_PORT` | `5432` | No | PostgreSQL port |
| `DB_NAME` | `ssp` | No | Database name |
| `DB_USER` | `ssp` | No | Database user |
| `DB_PASS` | `ssp_dev_password` | Yes (prod) | Database password |
| `DB_NAME_TEST` | `ssp_test` | No | Test database name |
| `DATABASE_URL` | -- | Yes (prod) | Full connection string (production only, overrides individual DB_* vars) |
| `JWT_SECRET` | `change-me-in-production` | **Yes (prod)** | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `24h` | No | Token expiration (e.g., `1h`, `7d`) |
| `UPLOAD_DIR` | `./uploads` | No | File upload storage path |
| `MAX_FILE_SIZE` | `52428800` (50MB) | No | Max upload size in bytes |
| `ANTHROPIC_API_KEY` | -- | No | API key for AI document extraction |
| `PAYLOAD_URL` | `http://localhost:3002` | No | Payload CMS internal URL for proxy target |

### CMS (.env)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `postgresql://ssp:ssp_dev_password@localhost:5432/ssp` | Yes | PostgreSQL connection string |
| `PAYLOAD_SECRET` | `payload-cms-secret-change-in-production` | **Yes (prod)** | Secret for Payload token signing |
| `PAYLOAD_CONFIG_PATH` | `src/payload.config.ts` | Set via `cross-env` | Path to Payload config (set in npm scripts) |

### Frontend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | -- | API base URL override (if not using Vite proxy) |

---

## 9. Network Interfaces and Remote Access

### Development Host

| Interface | Address | Purpose |
|-----------|---------|---------|
| Tailscale | `100.97.194.42` | Remote access over mesh VPN, accessible from any Tailscale-connected device |
| LAN | `192.168.1.187` | Local network access |
| Loopback | `127.0.0.1` | Local-only services |

### Port Exposure

| Port | Service | Binds To | Accessible From |
|------|---------|----------|----------------|
| 5173 | Vite (Frontend) | `0.0.0.0` | LAN, Tailscale, localhost |
| 3001 | Express (Backend) | `localhost` | localhost only (accessed via Vite proxy) |
| 3002 | Payload (CMS) | `localhost` | localhost only (accessed via Express proxy) |
| 5432 | PostgreSQL | `localhost` | localhost only |

### Access Patterns

- **Local development:** `http://localhost:5173`
- **LAN access:** `http://192.168.1.187:5173`
- **Remote (Tailscale):** `http://100.97.194.42:5173`
- **CMS admin:** `http://localhost:5173/cms/admin` (proxied through Vite -> Express -> Payload)

Only port 5173 is exposed to the network. All other services are accessible only via localhost, with the Vite dev server acting as the single entry point that proxies traffic to backend services.

---

## 10. Design Decisions and Trade-offs

### Why Payload CMS as a Separate Service?

**Decision:** Run Payload as an independent Next.js application on its own port (3002) rather than embedding it into the Express backend.

**Rationale:**
- Payload 3 is built on Next.js, which has its own server runtime, middleware, and routing -- it cannot be embedded as Express middleware
- Separation allows independent scaling, deployment, and restarts
- CMS crashes do not bring down the main API
- Payload can be upgraded independently of the Express backend
- Clean boundary: content management is a distinct concern from case management

**Trade-off:** Extra process to manage in development; slightly more complex deployment topology.

### Why Reverse Proxy Through Express?

**Decision:** Route all `/cms/*` traffic through the Express backend via `http-proxy-middleware` instead of exposing Payload directly.

**Rationale:**
- Single entry point simplifies CORS, SSL termination, and network security
- Enables the `requireAdmin` gate -- SSP admin role check happens before any request reaches Payload
- Users never need to know about port 3002
- Consistent auth model: SSP JWT is the first gate for everything
- WebSocket support included (`ws: true`) for Payload's live preview features

**Trade-off:** Added latency for CMS requests (one extra hop). Acceptable because CMS is admin-only, low-traffic.

### Why Same Database, Separate Schemas?

**Decision:** Payload and SSP share a single PostgreSQL instance but use distinct schemas (`public` vs `payload`).

**Rationale:**
- One database to provision, back up, and manage
- Schema isolation provides logical separation without operational overhead of multiple databases
- Backend can read CMS content directly via cross-schema queries (`payload.announcements`) without a network call to Payload's API -- lower latency for dashboard content
- No foreign key coupling between schemas -- either can be migrated independently
- In production, could split to separate databases if scaling demands it

**Trade-off:** Shared resource contention (connection pool, I/O). If Payload's migrations modify the database in unexpected ways, it could theoretically affect SSP operations. Mitigated by schema isolation and independent migration lifecycles.

### Why Direct DB Reads Instead of Payload API for Content?

**Decision:** The backend's `/api/v1/content/*` routes query Payload's tables directly via Knex rather than calling Payload's REST/GraphQL API.

**Rationale:**
- Eliminates a network hop (backend -> Payload -> DB becomes backend -> DB)
- Simpler error handling -- no need to handle Payload API failures
- Read-only access -- backend never writes to payload schema tables
- Content queries are simple selects with time-window filters

**Trade-off:** Tight coupling to Payload's database schema. If Payload changes its table structure in a major version upgrade, the content routes must be updated. Acceptable because the queries are few, simple, and covered by integration tests.

### Why JWT Over Sessions?

**Decision:** Stateless JWT tokens for SSP authentication.

**Rationale:**
- Stateless -- no server-side session store required
- Scales horizontally without sticky sessions
- Works well for SPA architecture (token stored client-side, sent as Bearer header)
- 24-hour expiry balances security with UX (no constant re-login)
- Simple to implement and verify in middleware

**Trade-off:** Cannot revoke individual tokens before expiry (would need a token blacklist/redis). Soft-deleted users are caught by the DB lookup in auth middleware, providing a partial revocation mechanism.

### Why Vite as Single Entry Point?

**Decision:** All browser traffic goes through Vite's dev server, which proxies `/api` and `/cms` to backend services.

**Rationale:**
- Developers only need to remember one URL (`localhost:5173`)
- No CORS issues in development -- everything appears same-origin
- Hot module replacement (HMR) for frontend code
- Mirrors production topology where a reverse proxy (nginx/ALB) would serve the same role

**Trade-off:** Adds a proxy hop in development. In production, Vite is replaced by a proper reverse proxy or CDN.

### Multi-Cloud Strategy

**Decision:** Infrastructure-as-code targeting AWS (primary), Azure (DR), GCP (AI/ML).

**Rationale:**
- AWS for production workloads (mature, DoW-compatible, FedRAMP)
- Azure for disaster recovery and compliance (DoD IL compatibility)
- GCP for AI/ML workloads (Vertex AI for document extraction)
- Terraform ensures reproducible, auditable infrastructure

**Trade-off:** Multi-cloud complexity. Mitigated by Terraform modules that abstract provider differences.

---

## Appendix: Quick Start for New Developers

```bash
# 1. Clone the repository
git clone git@github.com:URSA-Dev/SSP.git && cd SSP

# 2. Start PostgreSQL (must be running on port 5432)
#    Create database and user:
#    CREATE USER ssp WITH PASSWORD 'ssp_dev_password';
#    CREATE DATABASE ssp OWNER ssp;

# 3. Backend setup
cd backend
cp .env.example .env          # Edit as needed
npm install
npm run db:setup              # Runs migrations + seeds

# 4. CMS setup
cd ../cms
npm install
npm run dev                   # Starts on port 3002

# 5. Frontend setup
cd ../frontend
npm install
npm run dev                   # Starts on port 5173

# 6. Open http://localhost:5173 in your browser
```

**Startup order matters:** PostgreSQL -> CMS (3002) -> Backend (3001) -> Frontend (5173)
