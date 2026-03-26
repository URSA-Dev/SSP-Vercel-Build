# SSP Database — Tier 3

## Stack
- PostgreSQL 15+
- Migrations via Knex.js
- Seed data for development

## Structure
```
database/
├── migrations/            # Timestamped migration files
├── seeds/                 # Development seed data
├── schemas/               # SQL schema reference
└── CLAUDE.md
```

## Key Tables
- users — Authentication, roles, profiles
- cases — Core case records with workflow status
- case_documents — Uploaded/extracted documents
- case_issues — Issues/findings linked to cases
- case_communications — Comms log per case
- case_history — Timeline/audit per case
- policies — Policy library entries
- policy_sections — Editable sections within policies
- fcl_records — Facility clearance tracking
- foreign_travel — Travel records and approvals
- violations — Security violation incidents
- qa_reviews — QA queue items and review results
- audit_log — System-wide audit trail
- notifications — User notifications

## Conventions
- All tables have: id (UUID), created_at, updated_at
- Soft deletes where appropriate (deleted_at)
- Foreign keys with ON DELETE CASCADE or RESTRICT as appropriate
- Indexes on frequently queried columns (status, user_id, case_id)
- ENUM types for statuses, priorities, severities
- All timestamps in UTC
