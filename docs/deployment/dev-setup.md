# SSP Developer Setup Guide

## Prerequisites

| Tool       | Required Version | Notes                                     |
|------------|------------------|--------------------------------------------|
| Node.js    | v22.x LTS        | v22.22.0 tested; uses ES modules (`"type": "module"`) |
| npm        | 10.x+            | Ships with Node 22                         |
| PostgreSQL | 15+              | Must support `gen_random_uuid()`           |
| Git        | 2.x              | SSH access to `github.com/URSA-Dev/SSP`    |

## Architecture Overview

```
Port 5173  ─  Frontend (React / Vite dev server)
                 │  proxies /api and /cms to :3001
Port 3001  ─  Backend  (Node.js / Express API)
                 │  reads/writes database
Port 3002  ─  CMS      (Payload CMS / Next.js)
                 │  reads/writes database
Port 5432  ─  PostgreSQL
```

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone git@github.com:URSA-Dev/SSP.git
cd SSP
```

### 2. Create the PostgreSQL Database and User

```bash
sudo -u postgres psql <<SQL
CREATE USER ssp WITH PASSWORD 'ssp_dev_password';
CREATE DATABASE ssp OWNER ssp;
GRANT ALL PRIVILEGES ON DATABASE ssp TO ssp;
SQL
```

### 3. Install Dependencies (all services)

```bash
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
cd cms      && npm install && cd ..
cd database && npm install && cd ..
```

### 4. Configure Environment Files

**Backend** (`backend/.env`):

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ssp
DB_USER=ssp
DB_PASS=ssp_dev_password
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
ANTHROPIC_API_KEY=
```

**CMS** (`cms/.env`):

```env
DATABASE_URL=postgresql://ssp:ssp_dev_password@localhost:5432/ssp
PAYLOAD_SECRET=payload-cms-secret-change-in-production
```

The frontend does not require a `.env` file in development; it proxies API requests to `localhost:3001` via Vite config.

### 5. Run Migrations and Seed Data

```bash
cd backend
npm run migrate      # runs Knex migrations from database/migrations/
npm run seed         # loads dev seed data from database/seeds/
```

Or use the combined command:

```bash
npm run db:setup     # migrate + seed in one step
```

There are 15 migration files (001 through 015) and 11 seed files covering users, cases, documents, policies, FCL records, travel, violations, QA reviews, and notifications.

### 6. Start Services (in order)

Start services in three separate terminals. **Order matters** -- the database must be running before the backend, and the backend must be running before the frontend proxy will work.

**Terminal 1 -- Backend API:**

```bash
cd SSP/backend
npm run dev          # node --watch src/server.js  ->  :3001
```

**Terminal 2 -- Payload CMS:**

```bash
cd SSP/cms
npm run dev          # next dev -p 3002            ->  :3002
```

**Terminal 3 -- Frontend:**

```bash
cd SSP/frontend
npm run dev          # vite                        ->  :5173
```

### 7. Verify Everything Is Running

```bash
# Check all four ports are listening
ss -tlnp | grep -E "3001|3002|5173|5432"

# Quick health checks
curl -s http://localhost:3001/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ursamobile.com","password":"demo123"}' | head -c 200

curl -s http://localhost:5173/ | head -c 200

curl -s http://localhost:3002/admin | head -c 200
```

## Port Assignments

| Service    | Port | Protocol | Binds To  |
|------------|------|----------|-----------|
| Frontend   | 5173 | HTTP     | 0.0.0.0   |
| Backend    | 3001 | HTTP     | 0.0.0.0   |
| CMS        | 3002 | HTTP     | 0.0.0.0   |
| PostgreSQL | 5432 | TCP      | 127.0.0.1 |

The Vite dev server binds to `0.0.0.0` (configured in `vite.config.js`), so it is accessible from other machines on the LAN.

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable          | Description                      | Default / Example                   |
|-------------------|----------------------------------|-------------------------------------|
| `PORT`            | Express listen port              | `3001`                              |
| `NODE_ENV`        | Environment mode                 | `development`                       |
| `DB_HOST`         | PostgreSQL host                  | `localhost`                         |
| `DB_PORT`         | PostgreSQL port                  | `5432`                              |
| `DB_NAME`         | Database name                    | `ssp`                               |
| `DB_USER`         | Database user                    | `ssp`                               |
| `DB_PASS`         | Database password                | `ssp_dev_password`                  |
| `JWT_SECRET`      | Token signing key                | Change in production                |
| `JWT_EXPIRES_IN`  | Token TTL                        | `24h`                               |
| `UPLOAD_DIR`      | File upload path                 | `./uploads`                         |
| `MAX_FILE_SIZE`   | Max upload size in bytes         | `52428800` (50 MB)                  |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | Optional                          |

### CMS (`cms/.env`)

| Variable          | Description                      | Default / Example                              |
|-------------------|----------------------------------|------------------------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string     | `postgresql://ssp:ssp_dev_password@localhost:5432/ssp` |
| `PAYLOAD_SECRET`  | Payload encryption key           | Change in production                           |

## Remote Access

### Tailscale

If the dev machine is on a Tailscale network, all services bound to `0.0.0.0` are reachable at the Tailscale IP. PostgreSQL is bound to `127.0.0.1` by default, so only the frontend (5173), backend (3001), and CMS (3002) are accessible remotely without additional configuration.

```bash
# From another Tailscale device
curl http://<tailscale-ip>:5173/
```

### LAN Access

The Vite dev server already binds to `0.0.0.0`. For the backend and CMS, verify they also bind to all interfaces (they do by default with Express and Next.js). Access via:

```
http://<lan-ip>:5173   # Frontend
http://<lan-ip>:3001   # Backend API
http://<lan-ip>:3002   # CMS Admin
```

### SSH Tunnel

For remote access without exposing ports:

```bash
ssh -L 5173:localhost:5173 -L 3001:localhost:3001 -L 3002:localhost:3002 user@dev-machine
```

Then access all services on `localhost` from the remote machine.

## Troubleshooting

### Next.js / Payload CMS Version Pinning

Payload CMS v3.78 requires a compatible Next.js version. The CMS `package.json` pins `next` to `^15.3.9`. If you see build errors related to Next.js internals, ensure you are on a 15.3.x release:

```bash
cd cms
npm ls next    # verify version
```

If mismatched, delete `node_modules` and `package-lock.json` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Missing `graphql` Dependency

Payload CMS requires `graphql` as a peer dependency. It is listed explicitly in `cms/package.json` (`^16.13.1`). If you see `Cannot find module 'graphql'`, run:

```bash
cd cms && npm install graphql@^16.13.1
```

### Database Column Mismatches

If migrations have been modified after being run, you may see column-not-found errors at runtime. Never edit a migration that has already been applied. Instead:

```bash
cd backend
npm run migrate:rollback   # roll back the latest batch
npm run migrate            # re-run migrations
npm run seed               # re-seed data
```

For a full reset:

```bash
PGPASSWORD=ssp_dev_password psql -U ssp -h localhost -d ssp -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:setup
```

### Port Already in Use

```bash
# Find what is using a port
ss -tlnp | grep :3001
# Kill the process
kill -9 <pid>
```

### Knex CLI Not Found

The `knex` CLI is used via `npx` through npm scripts. If `npm run migrate` fails with "knex not found", ensure you have installed backend dependencies:

```bash
cd backend && npm install
```

### CMS Build Fails with TypeScript Errors

The CMS uses TypeScript. If type generation is stale:

```bash
cd cms
npm run generate:types
npm run build
```

### Frontend Proxy 502 Errors

The Vite dev server proxies `/api` and `/cms` routes to `localhost:3001`. If you see 502 errors, the backend is not running. Start the backend first.
