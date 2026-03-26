# SSP Vercel Build — Deployment Readiness Report
**Date:** 2026-03-25
**Project:** /home/kali/SSP Vercel Build/frontend/

---

## PUSH-TO-BUILD PLAN

### Prerequisites (must complete before deploy)
```bash
cd "/home/kali/SSP Vercel Build/frontend"
npm install
npm install -g vercel        # install CLI
vercel login                 # authenticate
vercel link                  # link project (one-time)
```

### Deploy Steps
```bash
# 1. Fix blockers (see below)
# 2. Build locally to verify
npm run build

# 3. Preview deploy
vercel

# 4. Test preview URL (SPA routing, API calls, headers)
curl -I https://<preview-url>/
curl -I https://<preview-url>/cases/123

# 5. Production deploy
vercel --prod
```

---

## GAP ANALYSIS

### BLOCKERS (Must fix before deploy)

| # | Issue | File | Line | Fix |
|---|-------|------|------|-----|
| 1 | **Placeholder backend URL** | `frontend/vercel.json` | 39 | Replace `YOUR_BACKEND_DOMAIN.com` with actual backend URL |
| 2 | **Backend CORS blocks Vercel** | `backend/src/app.js` | 28-31 | FIXED — CORS_ORIGINS env var added |
| 3 | **Source maps expose code** | `frontend/vite.config.js` | 22 | FIXED — sourcemap: false |

### HIGH PRIORITY (Should fix before production)

| # | Issue | File | Impact |
|---|-------|------|--------|
| 4 | **No `engines` in package.json** | `frontend/package.json` | Vercel may use wrong Node version |
| 5 | **File uploads use local disk** | `backend/.env` (UPLOAD_DIR) | Files lost between serverless invocations |
| 6 | **No `DATABASE_URL` for production** | `backend/.env` / `knexfile.js:41` | Backend can't connect to prod DB |
| 7 | **CMS proxy points to localhost** | `backend/src/app.js:34` | `/cms` routes fail without PAYLOAD_URL |

### MEDIUM PRIORITY (Recommended improvements)

| # | Issue | File | Impact |
|---|-------|------|--------|
| 8 | Missing frontend `.gitignore` | `frontend/` | dist/, node_modules may get committed |
| 9 | No DB connection pooling config | `backend/knexfile.js` | Connection exhaustion under load |
| 10 | MongoDB in docker-compose unused | `infrastructure/docker-compose.yml` | Dead config, confusion |
| 11 | Redis in docker-compose unused | `infrastructure/docker-compose.yml` | Dead config, confusion |
| 12 | MCP paths are machine-specific | `.mcp.json` | DBeaver path won't work elsewhere |

### LOW PRIORITY (Nice to have)

| # | Issue | Impact |
|---|-------|--------|
| 13 | No Vercel Analytics integration | Missing performance insights |
| 14 | No preview environment env vars | Preview deploys use same API as prod |
| 15 | No custom domain configured | Using *.vercel.app URL |

---

## DETAILED FINDINGS

### Frontend (Vercel-Ready)

| Component | Status | Notes |
|-----------|--------|-------|
| React 18 + Vite 6 | PASS | Vercel auto-detects Vite framework |
| React Router v6 SPA | PASS | vercel.json rewrites handle fallback |
| Axios API client | PASS | Uses `import.meta.env.VITE_API_URL`, no hardcoded URLs |
| JWT auth flow | PASS | localStorage token, 401 redirect to /login |
| Google Fonts (Roboto) | PASS | CSP in vercel.json allows fonts.googleapis.com |
| Design tokens / CSS | PASS | No external dependencies, responsive breakpoints work |
| Static assets (logos) | PASS | In public/, will be served by Vercel CDN |
| File uploads (FormData) | PASS | Goes through backend API, Vercel 4.5MB body limit OK |
| No SSR / no WebSockets | PASS | Pure client-side SPA, no special Vercel config needed |
| No hardcoded localhost in src/ | PASS | All API calls use relative paths |
| No process.env usage | PASS | Correctly uses import.meta.env for Vite |
| package-lock.json present | PASS | Deterministic builds |
| Build output (dist/) | PASS | 195 modules, index.html + hashed assets |

### Security Headers (vercel.json vs nginx.conf)

| Header | nginx.conf | vercel.json | Match? |
|--------|-----------|-------------|--------|
| X-Frame-Options | SAMEORIGIN | SAMEORIGIN | YES |
| X-Content-Type-Options | nosniff | nosniff | YES |
| X-XSS-Protection | 1; mode=block | 1; mode=block | YES |
| Referrer-Policy | strict-origin-when-cross-origin | strict-origin-when-cross-origin | YES |
| CSP connect-src | self + localhost:3001 | self | IMPROVED (no localhost in prod) |
| CSP font-src | self only | self + fonts.gstatic.com | IMPROVED (Google Fonts now work) |
| CSP style-src | self + unsafe-inline | self + unsafe-inline + fonts.googleapis.com | IMPROVED |

### Caching (vercel.json vs nginx.conf)

| Asset | nginx.conf | vercel.json | Match? |
|-------|-----------|-------------|--------|
| /assets/*.js, *.css | 1yr immutable | 1yr immutable | YES |
| *.png | 1yr immutable | 1yr immutable | YES |
| index.html | no-store, no-cache | no-store, no-cache | YES |
| Hidden files (.*) | deny all | Vercel blocks by default | YES |

### Backend Dependencies (NOT on Vercel)

| Component | Status | Notes |
|-----------|--------|-------|
| CORS config | FIXED | Now reads CORS_ORIGINS env var for production domains |
| Database connection | FAIL | No DATABASE_URL for production |
| CMS proxy | FAIL | PAYLOAD_URL defaults to localhost:3002 |
| File upload storage | FAIL | Uses local filesystem (./uploads) |
| JWT_SECRET | WARN | Hardcoded dev value, needs production secret |
| Health endpoint | PASS | /api/v1/health exists |

---

## FIX INSTRUCTIONS (Blockers Only)

### Fix #1: vercel.json backend URL
```json
// Replace line 39 in frontend/vercel.json
{ "source": "/api/:path*", "destination": "https://YOUR_ACTUAL_BACKEND.com/api/:path*" }
```

### Fix #2: Backend CORS
```javascript
// In backend/src/app.js, change CORS config:
cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ssp-frontend.vercel.app',  // ADD production Vercel domain
    'https://ssp.ursamobile.com',       // ADD custom domain if used
  ],
  credentials: true,
})
```

### Fix #3: Disable source maps
```javascript
// In frontend/vite.config.js, change build config:
build: {
  outDir: 'dist',
  sourcemap: false,  // was: true
},
```

---

## ARCHITECTURE AFTER DEPLOY

```
Browser
  │
  ├── Static files (HTML/JS/CSS/images)
  │     └── Served by Vercel CDN (edge network)
  │
  └── API calls (/api/v1/*)
        └── Vercel Rewrite (edge) ──→ AWS ALB (HTTPS)
              └── ECS Fargate (2-6 tasks, auto-scaling)
                    ├── RDS PostgreSQL 15 (Multi-AZ)
                    └── S3 Uploads (KMS encrypted)
```

- **Frontend:** Vercel CDN (global edge)
- **Backend:** AWS ECS Fargate behind ALB (us-east-1)
- **Database:** AWS RDS PostgreSQL 15 (Multi-AZ, encrypted)
- **Storage:** AWS S3 (document uploads, KMS)
- **Secrets:** AWS Secrets Manager (DB creds, JWT)
- **Monitoring:** AWS CloudWatch → SNS alerts
