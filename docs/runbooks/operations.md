# SSP Operations Runbook

## Service Management

### Start Services

Start in this order: PostgreSQL (should be running as a system service), Backend, CMS, Frontend.

```bash
# 1. PostgreSQL (if not running as a system service)
sudo systemctl start postgresql

# 2. Backend API (port 3001)
cd /home/kali/SSP/backend
npm run dev            # development (with --watch)
npm run start          # production (no file watching)

# 3. Payload CMS (port 3002)
cd /home/kali/SSP/cms
npm run dev            # development
npm run start          # production (requires npm run build first)

# 4. Frontend (port 5173)
cd /home/kali/SSP/frontend
npm run dev            # development
npm run preview        # preview production build (requires npm run build first)
```

### Stop Services

Each Node.js service runs in the foreground. Press `Ctrl+C` in the respective terminal, or:

```bash
# Find and kill by port
kill $(ss -tlnp | grep ':3001' | grep -oP 'pid=\K[0-9]+')   # Backend
kill $(ss -tlnp | grep ':3002' | grep -oP 'pid=\K[0-9]+')   # CMS
kill $(ss -tlnp | grep ':5173' | grep -oP 'pid=\K[0-9]+')   # Frontend
```

### Restart a Single Service

```bash
# Example: restart backend
kill $(ss -tlnp | grep ':3001' | grep -oP 'pid=\K[0-9]+')
cd /home/kali/SSP/backend && npm run dev
```

## Database Operations

### Run Migrations

```bash
cd /home/kali/SSP/backend
npm run migrate                # apply all pending migrations
npm run migrate:rollback       # rollback the latest batch
```

Migrations live in `/home/kali/SSP/database/migrations/` (001 through 015).

### Run Seeds

```bash
cd /home/kali/SSP/backend
npm run seed                   # populate dev data
```

Seed files live in `/home/kali/SSP/database/seeds/` (001 through 011).

### Combined Setup

```bash
cd /home/kali/SSP/backend
npm run db:setup               # migrate + seed
```

### Full Database Reset

```bash
PGPASSWORD=ssp_dev_password psql -U ssp -h localhost -d ssp -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd /home/kali/SSP/backend && npm run db:setup
```

## Payload CMS Admin User

Payload CMS manages its own user table separate from the SSP `users` table. To create the first admin user:

1. Start the CMS: `cd /home/kali/SSP/cms && npm run dev`
2. Open `http://localhost:3002/admin` in a browser.
3. On first launch, Payload presents a "Create First User" form.
4. Enter email and password (e.g., `admin@ursamobile.com` / `admin123`).
5. This account is stored in Payload's own `users` collection in PostgreSQL.

To create additional admin users via the API:

```bash
# First, login to get a token
TOKEN=$(curl -s http://localhost:3002/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ursamobile.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# Create a new user
curl -s http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $TOKEN" \
  -d '{"email":"editor@ursamobile.com","password":"editor123"}'
```

## Endpoint Verification

### Health Checks

```bash
# Backend API -- login endpoint (no auth required)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ursamobile.com","password":"demo123"}'
# Expected: 200

# Frontend -- serves index.html
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
# Expected: 200

# CMS Admin panel
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/admin
# Expected: 200 or 302

# PostgreSQL connectivity
PGPASSWORD=ssp_dev_password psql -U ssp -h localhost -d ssp -c "SELECT 1;"
# Expected: returns 1
```

### Authenticated API Calls

```bash
# 1. Get a JWT token
TOKEN=$(curl -s http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ursamobile.com","password":"demo123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# 2. List cases
curl -s http://localhost:3001/api/v1/cases \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30

# 3. Dashboard metrics
curl -s http://localhost:3001/api/v1/metrics \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 4. List policies
curl -s http://localhost:3001/api/v1/policies \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30

# 5. List notifications
curl -s http://localhost:3001/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
```

### Check All Ports Are Listening

```bash
ss -tlnp | grep -E "3001|3002|5173|5432"
```

Expected output shows four LISTEN entries on ports 5432, 5173, 3001, and 3002.

## Login Credentials

### SSP Application Users (seeded)

| Email                     | Password | Role         | Name         |
|---------------------------|----------|--------------|--------------|
| admin@ursamobile.com      | demo123  | ADMIN        | A. Admin     |
| smith@ursamobile.com      | demo123  | ADJUDICATOR  | A. Smith     |
| williams@ursamobile.com   | demo123  | ADJUDICATOR  | K. Williams  |
| chen@ursamobile.com       | demo123  | ADJUDICATOR  | D. Chen      |
| johnson@ursamobile.com    | demo123  | SUPERVISOR   | T. Johnson   |

All passwords are bcrypt-hashed with cost factor 10.

### Payload CMS Admin

| Email                     | Password | Notes                              |
|---------------------------|----------|------------------------------------|
| admin@ursamobile.com      | admin123 | Created on first CMS launch (manual) |

### PostgreSQL

| User | Password          | Database | Host      | Port |
|------|-------------------|----------|-----------|------|
| ssp  | ssp_dev_password  | ssp      | localhost | 5432 |

## Creating Test Content via Payload API

```bash
# Login to Payload CMS
TOKEN=$(curl -s http://localhost:3002/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ursamobile.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# Create a page/content item (adjust collection name to your Payload config)
curl -s http://localhost:3002/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $TOKEN" \
  -d '{
    "title": "Test Page",
    "slug": "test-page",
    "content": "This is test content created via the API."
  }' | python3 -m json.tool

# List all collections available
curl -s http://localhost:3002/api/ \
  -H "Authorization: JWT $TOKEN" | python3 -m json.tool

# Upload a media file
curl -s http://localhost:3002/api/media \
  -H "Authorization: JWT $TOKEN" \
  -F "file=@/path/to/image.png" \
  -F "alt=Test image" | python3 -m json.tool
```

## Backup and Restore

### Backup PostgreSQL

```bash
# Full database dump (compressed)
PGPASSWORD=ssp_dev_password pg_dump -U ssp -h localhost -d ssp \
  -Fc -f ssp_backup_$(date +%Y%m%d_%H%M%S).dump

# SQL-format backup (human-readable)
PGPASSWORD=ssp_dev_password pg_dump -U ssp -h localhost -d ssp \
  --clean --if-exists > ssp_backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only (no data)
PGPASSWORD=ssp_dev_password pg_dump -U ssp -h localhost -d ssp \
  --schema-only > ssp_schema.sql

# Data only
PGPASSWORD=ssp_dev_password pg_dump -U ssp -h localhost -d ssp \
  --data-only > ssp_data.sql
```

### Restore PostgreSQL

```bash
# Restore from compressed dump
PGPASSWORD=ssp_dev_password pg_restore -U ssp -h localhost -d ssp \
  --clean --if-exists ssp_backup_20260323_120000.dump

# Restore from SQL file
PGPASSWORD=ssp_dev_password psql -U ssp -h localhost -d ssp \
  < ssp_backup_20260323_120000.sql
```

### Backup Uploads Directory

```bash
tar czf ssp_uploads_$(date +%Y%m%d_%H%M%S).tar.gz -C /home/kali/SSP/backend uploads/
```

### Restore Uploads

```bash
tar xzf ssp_uploads_20260323_120000.tar.gz -C /home/kali/SSP/backend/
```

## Log Locations

| Service    | Log Output     | Notes                                                  |
|------------|----------------|--------------------------------------------------------|
| Backend    | stdout/stderr  | Runs in foreground; redirect with `npm run dev 2>&1 \| tee backend.log` |
| CMS        | stdout/stderr  | Next.js dev output; redirect with `npm run dev 2>&1 \| tee cms.log` |
| Frontend   | stdout/stderr  | Vite dev server output                                 |
| PostgreSQL | System journal | `sudo journalctl -u postgresql` or `/var/log/postgresql/` |

### Viewing Logs

```bash
# PostgreSQL logs
sudo journalctl -u postgresql --since "1 hour ago" --no-pager

# If running services with log redirect
tail -f /home/kali/SSP/backend/backend.log
tail -f /home/kali/SSP/cms/cms.log

# Application audit log (in database)
PGPASSWORD=ssp_dev_password psql -U ssp -h localhost -d ssp \
  -c "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20;"
```

### Checking for Errors

```bash
# Recent backend errors (if logging to file)
grep -i "error\|ERR\|WARN" /home/kali/SSP/backend/backend.log | tail -20

# Database connection errors
PGPASSWORD=ssp_dev_password psql -U ssp -h localhost -d ssp \
  -c "SELECT * FROM pg_stat_activity WHERE datname = 'ssp';"
```
