# SSP Database Schema Reference

> Generated from migration files, seed data, and Payload CMS configuration.
> Last updated: 2026-03-24

---

## 1. Database Overview

| Property        | Value                                           |
|-----------------|-------------------------------------------------|
| Database name   | `ssp`                                           |
| Database user   | `ssp`                                           |
| Engine          | PostgreSQL 15+                                  |
| Migrations      | Knex.js (22 migration files)                    |
| Schemas         | `public` (application tables), `payload` (CMS)  |
| Connection      | `postgresql://ssp:***@localhost:5432/ssp`        |

---

## 2. Entity-Relationship Diagram

```
                                    +------------------+
                                    |      users       |
                                    |------------------|
                                    | id (PK, UUID)    |
                                    | email (UNIQUE)   |
                                    | role (user_role) |
                                    +--------+---------+
                                             |
                            +----------------+----------------+
                            | 1:M                             | 1:M
                            v                                 v
                  +---------+---------+            +----------+----------+
                  |       cases       |            |    notifications    |
                  |-------------------|            |---------------------|
                  | id (PK, UUID)     |            | id (PK, UUID)       |
                  | case_number (UQ)  |            | user_id (FK->users) |
                  | assigned_to (FK)--+---> users  | message             |
                  | status            |            | read                |
                  | priority          |            +---------------------+
                  | case_type         |
                  +---+---+---+---+--+
                      |   |   |   |
         +------------+   |   |   +------------------+
         | 1:M            |   | 1:M                  | 1:M
         v                |   v                       v
 +-------+--------+  |  ++----------+      +---------+----------+
 | case_documents  |  |  | case_memos|      | case_communications|
 |-----------------|  |  |-----------|      |--------------------|
 | id (PK, UUID)   |  |  | id (PK)  |      | id (PK, UUID)      |
 | case_id (FK)    |  |  | case_id  |      | case_id (FK)       |
 | doc_type        |  |  |   (FK,UQ)|      | comm_type           |
 | filename        |  |  | memo_text|      | direction           |
 | status          |  |  | version  |      +--------------------+
 | confidence      |  |  +----------+
 +-----------------+  |
                      | 1:M                1:M
         +------------+------------+
         v                         v
 +-------+--------+      +--------+---------+
 |  case_issues    |      |  case_history    |
 |-----------------|      |------------------|
 | id (PK, UUID)   |      | id (PK, UUID)    |
 | case_id (FK)    |      | case_id (FK)     |
 | category        |      | user_name        |
 | severity        |      | action           |
 | guideline       |      | detail           |
 | in_memo         |      +------------------+
 +-----------------+

 +--------+--------+     +--------+--------+
 |   qa_reviews     |     |   audit_log     |
 |------------------|     |-----------------|
 | id (PK, UUID)    |     | id (PK, UUID)   |
 | case_id (FK)-----+---> cases             |
 | submitted_by     |     | user_name       |
 | reviewer         |     | action          |
 | outcome          |     | entity_type     |
 | checklist (JSONB)|     | entity_id       |
 +------------------+     +-----------------+

 +------------------+     +------------------+     +------------------+
 |    policies      |     |  fcl_records     |     | foreign_travel   |
 |------------------|     |------------------|     |------------------|
 | id (PK, UUID)    |     | id (PK, UUID)    |     | id (PK, UUID)    |
 | title            |     | fcl_id (UNIQUE)  |     | travel_id (UQ)   |
 | policy_type      |     | entity_name      |     | subject_name     |
 | status           |     | cage_code        |     | countries        |
 | version          |     | clearance_level  |     | risk_level       |
 | content          |     | status           |     | status           |
 +------------------+     +------------------+     +------------------+

 +------------------+     +------------------+
 |   violations     |     |    settings      |
 |------------------|     |------------------|
 | id (PK, UUID)    |     | id (PK, UUID)    |
 | violation_number |     | scope            |
 |   (UNIQUE)       |     | scope_id         |
 | severity         |     | key              |
 | status           |     | value (JSONB)    |
 | ci_referral      |     +------------------+
 +------------------+

 PAYLOAD SCHEMA (CMS)
 +------------------+  +------------------+  +------------------+  +------------------+
 | payload.users    |  | payload.         |  | payload.         |  | payload.         |
 | (CMS auth)       |  | announcements    |  | help_articles    |  | system_alerts    |
 +------------------+  +------------------+  +------------------+  +------------------+
```

---

## 3. Table Definitions (public schema)

### 3.1 users

User accounts for SSP authentication and role-based access.

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| email           | VARCHAR(255)                | NO       |                          | UNIQUE             |
| password_hash   | VARCHAR(255)                | NO       |                          |                    |
| last_name       | VARCHAR(100)                | NO       |                          |                    |
| first_initial   | VARCHAR(1)                  | NO       |                          |                    |
| role            | `user_role` (ENUM)          | NO       | `'ADJUDICATOR'`          |                    |
| unit            | VARCHAR(200)                | YES      | `'URSA Mobile'`          |                    |
| preferences     | JSONB                       | YES      | `'{}'`                   |                    |
| last_login_at   | TIMESTAMPTZ                 | YES      |                          |                    |
| deleted_at      | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_users_email` -- `email` (partial: `WHERE deleted_at IS NULL`)

**Foreign keys:** None (root table)

---

### 3.2 cases

Core case records with workflow status tracking and suspense deadlines.

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| case_number     | VARCHAR(20)                 | NO       |                          | UNIQUE             |
| subject_last    | VARCHAR(100)                | NO       |                          |                    |
| subject_init    | CHAR(1)                     | NO       |                          |                    |
| case_type       | `case_type` (ENUM)          | NO       |                          |                    |
| status          | `case_status` (ENUM)        | NO       | `'RECEIVED'`             |                    |
| priority        | `case_priority` (ENUM)      | NO       | `'NORMAL'`               |                    |
| received_date   | DATE                        | NO       |                          |                    |
| assigned_to     | UUID                        | YES      |                          | FK -> users.id     |
| suspense_48hr   | TIMESTAMPTZ                 | YES      |                          |                    |
| suspense_3day   | TIMESTAMPTZ                 | YES      |                          |                    |
| met_susp_48     | BOOLEAN                     | YES      | `NULL`                   |                    |
| met_susp_3d     | BOOLEAN                     | YES      | `NULL`                   |                    |
| surge           | BOOLEAN                     | YES      | `false`                  |                    |
| disposition     | `case_disposition` (ENUM)   | YES      |                          |                    |
| rec_status      | VARCHAR(50)                 | YES      | `'Not Started'`          |                    |
| notes           | TEXT                        | YES      |                          |                    |
| deleted_at      | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_cases_status` -- `status`
- `idx_cases_priority` -- `priority`
- `idx_cases_assigned_to` -- `assigned_to`
- `idx_cases_received_date` -- `received_date`

**Foreign keys:**
- `assigned_to` -> `users.id` ON DELETE SET NULL

---

### 3.3 case_documents

Uploaded documents linked to cases, with AI extraction metadata.

| Column           | Type                        | Nullable | Default                  | Constraints        |
|------------------|-----------------------------|----------|--------------------------|--------------------|
| id               | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| case_id          | UUID                        | NO       |                          | FK -> cases.id     |
| doc_type         | VARCHAR(100)                | YES      |                          |                    |
| filename         | VARCHAR(255)                | NO       |                          |                    |
| file_path        | VARCHAR(500)                | YES      |                          |                    |
| file_size        | VARCHAR(20)                 | YES      |                          |                    |
| status           | `document_status` (ENUM)    | YES      | `'processing'`           |                    |
| confidence       | DECIMAL(5,4)                | YES      |                          |                    |
| extracted_fields | JSONB                       | YES      | `'{}'`                   |                    |
| uploaded_at      | TIMESTAMPTZ                 | YES      | `now()`                  |                    |
| deleted_at       | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at       | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at       | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_case_documents_case_id` -- `case_id`
- `idx_case_documents_status` -- `status`

**Foreign keys:**
- `case_id` -> `cases.id` ON DELETE CASCADE

---

### 3.4 case_issues

Adjudicative issues/findings linked to a case, categorized by guideline.

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| case_id         | UUID                        | NO       |                          | FK -> cases.id     |
| category        | VARCHAR(50)                 | NO       |                          |                    |
| subcategory     | VARCHAR(200)                | YES      |                          |                    |
| severity        | `issue_severity` (ENUM)     | NO       |                          |                    |
| guideline       | CHAR(1)                     | YES      |                          |                    |
| in_memo         | BOOLEAN                     | YES      | `false`                  |                    |
| description     | TEXT                        | NO       |                          |                    |
| mitigation      | TEXT                        | YES      |                          |                    |
| mitigation_type | VARCHAR(50)                 | YES      |                          |                    |
| deleted_at      | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_case_issues_case_id` -- `case_id`
- `idx_case_issues_severity` -- `severity`

**Foreign keys:**
- `case_id` -> `cases.id` ON DELETE CASCADE

---

### 3.5 case_communications

Communications log per case (emails, notifications, phone calls).

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| case_id         | UUID                        | NO       |                          | FK -> cases.id     |
| comm_type       | VARCHAR(50)                 | NO       |                          |                    |
| direction       | VARCHAR(20)                 | NO       |                          |                    |
| subject         | VARCHAR(255)                | NO       |                          |                    |
| body            | TEXT                        | NO       |                          |                    |
| suspense_effect | VARCHAR(50)                 | YES      | `'No Effect'`            |                    |
| logged_by       | VARCHAR(100)                | YES      |                          |                    |
| logged_at       | TIMESTAMPTZ                 | YES      | `now()`                  |                    |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_case_communications_case_id` -- `case_id`
- `idx_case_communications_comm_type` -- `comm_type`

**Foreign keys:**
- `case_id` -> `cases.id` ON DELETE CASCADE

---

### 3.6 case_history

Timeline/audit trail of actions performed on a case.

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| case_id         | UUID                        | NO       |                          | FK -> cases.id     |
| user_name       | VARCHAR(100)                | YES      |                          |                    |
| action          | VARCHAR(100)                | NO       |                          |                    |
| detail          | TEXT                        | YES      |                          |                    |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_case_history_case_id` -- `case_id`
- `idx_case_history_created_at` -- `created_at`

**Foreign keys:**
- `case_id` -> `cases.id` ON DELETE CASCADE

---

### 3.7 case_memos

Adjudicative recommendation memoranda (one per case).

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| case_id         | UUID                        | NO       |                          | FK -> cases.id, UNIQUE |
| memo_text       | TEXT                        | YES      |                          |                    |
| version         | INTEGER                     | YES      | `1`                      |                    |
| qa_result       | JSONB                       | YES      |                          |                    |
| saved_at        | TIMESTAMPTZ                 | YES      |                          |                    |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:** None beyond PK and unique constraint on `case_id`.

**Foreign keys:**
- `case_id` -> `cases.id` ON DELETE CASCADE (UNIQUE -- enforces 1:1)

---

### 3.8 policies

Policy library entries (SOPs, directives, desk references).

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| title           | VARCHAR(255)                | NO       |                          |                    |
| policy_type     | VARCHAR(100)                | NO       |                          |                    |
| status          | VARCHAR(20)                 | YES      | `'Draft'`                |                    |
| version         | VARCHAR(20)                 | YES      | `'0.1'`                  |                    |
| content         | TEXT                        | YES      |                          |                    |
| author          | VARCHAR(100)                | YES      |                          |                    |
| last_revised    | TIMESTAMPTZ                 | YES      |                          |                    |
| deleted_at      | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_policies_status` -- `status`

**Foreign keys:** None

---

### 3.9 fcl_records

Facility Clearance Level tracking for contractor entities.

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| fcl_id          | VARCHAR(20)                 | NO       |                          | UNIQUE             |
| entity_name     | VARCHAR(200)                | NO       |                          |                    |
| cage_code       | VARCHAR(20)                 | YES      |                          |                    |
| clearance_level | VARCHAR(50)                 | NO       |                          |                    |
| status          | VARCHAR(20)                 | NO       | `'Pending'`              |                    |
| sponsor         | VARCHAR(200)                | YES      |                          |                    |
| expires_at      | DATE                        | YES      |                          |                    |
| fso_name        | VARCHAR(100)                | YES      |                          |                    |
| employee_count  | INTEGER                     | YES      |                          |                    |
| last_review     | DATE                        | YES      |                          |                    |
| deleted_at      | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_fcl_records_status` -- `status`
- `idx_fcl_records_clearance_level` -- `clearance_level`

**Foreign keys:** None

---

### 3.10 foreign_travel

Foreign travel records with briefing/debrief status and risk tracking.

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| travel_id       | VARCHAR(20)                 | NO       |                          | UNIQUE             |
| subject_name    | VARCHAR(200)                | NO       |                          |                    |
| clearance       | VARCHAR(50)                 | YES      |                          |                    |
| countries       | TEXT                        | NO       |                          |                    |
| depart_date     | DATE                        | YES      |                          |                    |
| return_date     | DATE                        | YES      |                          |                    |
| purpose         | VARCHAR(200)                | YES      |                          |                    |
| briefed         | BOOLEAN                     | YES      | `false`                  |                    |
| debriefed       | BOOLEAN                     | YES      | `false`                  |                    |
| risk_level      | VARCHAR(20)                 | YES      | `'LOW'`                  |                    |
| status          | VARCHAR(20)                 | YES      | `'PLANNED'`              |                    |
| referral_notes  | TEXT                        | YES      |                          |                    |
| deleted_at      | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_foreign_travel_status` -- `status`
- `idx_foreign_travel_risk_level` -- `risk_level`
- `idx_foreign_travel_depart_date` -- `depart_date`

**Foreign keys:** None

---

### 3.11 violations

Security violation incident records with CI referral tracking.

| Column           | Type                        | Nullable | Default                  | Constraints        |
|------------------|-----------------------------|----------|--------------------------|--------------------|
| id               | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| violation_number | VARCHAR(20)                 | NO       |                          | UNIQUE             |
| violation_date   | DATE                        | NO       |                          |                    |
| category         | VARCHAR(50)                 | NO       |                          |                    |
| subcategory      | VARCHAR(200)                | YES      |                          |                    |
| subject_name     | VARCHAR(200)                | NO       |                          |                    |
| clearance        | VARCHAR(50)                 | YES      |                          |                    |
| location         | VARCHAR(200)                | YES      |                          |                    |
| severity         | `violation_severity` (ENUM) | NO       |                          |                    |
| status           | VARCHAR(30)                 | NO       | `'OPEN'`                 |                    |
| sso_notified     | BOOLEAN                     | YES      | `false`                  |                    |
| sso_date         | DATE                        | YES      |                          |                    |
| adj_impact       | BOOLEAN                     | YES      | `false`                  |                    |
| description      | TEXT                        | NO       |                          |                    |
| actions_taken    | TEXT                        | YES      |                          |                    |
| reported_by      | VARCHAR(100)                | YES      |                          |                    |
| closed_date      | DATE                        | YES      |                          |                    |
| ci_referral      | BOOLEAN                     | YES      | `false`                  |                    |
| ci_note          | TEXT                        | YES      |                          |                    |
| deleted_at       | TIMESTAMPTZ                 | YES      |                          | Soft delete        |
| created_at       | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at       | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_violations_status` -- `status`
- `idx_violations_category` -- `category`
- `idx_violations_severity` -- `severity`
- `idx_violations_violation_date` -- `violation_date`

**Foreign keys:** None

---

### 3.12 qa_reviews

QA review queue items linked to cases, with checklist and outcome tracking.

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| case_id         | UUID                        | NO       |                          | FK -> cases.id     |
| submitted_by    | VARCHAR(100)                | YES      |                          |                    |
| submitted_at    | TIMESTAMPTZ                 | YES      | `now()`                  |                    |
| reviewer        | VARCHAR(100)                | YES      |                          |                    |
| reviewed_at     | TIMESTAMPTZ                 | YES      |                          |                    |
| outcome         | VARCHAR(30)                 | YES      |                          |                    |
| checklist       | JSONB                       | YES      | `'[]'`                   |                    |
| comments        | TEXT                        | YES      |                          |                    |
| status          | VARCHAR(20)                 | YES      | `'Pending'`              |                    |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_qa_reviews_case_id` -- `case_id`
- `idx_qa_reviews_status` -- `status`

**Foreign keys:**
- `case_id` -> `cases.id` ON DELETE CASCADE

---

### 3.13 audit_log

System-wide audit trail for all entity changes. Append-only (no `updated_at`).

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| user_name       | VARCHAR(100)                | YES      |                          |                    |
| action          | VARCHAR(100)                | NO       |                          |                    |
| detail          | TEXT                        | YES      |                          |                    |
| entity_type     | VARCHAR(50)                 | YES      |                          |                    |
| entity_id       | UUID                        | YES      |                          |                    |
| ip_address      | VARCHAR(45)                 | YES      |                          |                    |
| created_at      | TIMESTAMPTZ                 | YES      | `now()`                  |                    |

**Indexes:**
- `idx_audit_log_entity` -- `(entity_type, entity_id)` (composite)
- `idx_audit_log_action` -- `action`
- `idx_audit_log_created_at` -- `created_at DESC`

**Foreign keys:** None (references entities polymorphically via entity_type + entity_id)

---

### 3.14 notifications

User notification messages with read/unread tracking.

| Column            | Type                        | Nullable | Default                  | Constraints        |
|-------------------|-----------------------------|----------|--------------------------|--------------------|
| id                | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| user_id           | UUID                        | YES      |                          | FK -> users.id     |
| message           | TEXT                        | NO       |                          |                    |
| notification_type | VARCHAR(50)                 | YES      | `'info'`                 |                    |
| read              | BOOLEAN                     | YES      | `false`                  |                    |
| link              | VARCHAR(255)                | YES      |                          |                    |
| created_at        | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at        | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_notifications_user_id` -- `user_id`
- `idx_notifications_read` -- `read`

**Foreign keys:**
- `user_id` -> `users.id` ON DELETE CASCADE

---

### 3.15 settings

Hierarchical configuration store (tenant-level and user-level settings).

| Column          | Type                        | Nullable | Default                  | Constraints        |
|-----------------|-----------------------------|----------|--------------------------|--------------------|
| id              | UUID                        | NO       | `gen_random_uuid()`      | PRIMARY KEY        |
| scope           | VARCHAR(20)                 | NO       | `'tenant'`               |                    |
| scope_id        | UUID                        | YES      |                          |                    |
| key             | VARCHAR(100)                | NO       |                          |                    |
| value           | JSONB                       | NO       | `'{}'`                   |                    |
| created_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |
| updated_at      | TIMESTAMPTZ                 | NO       | `now()`                  |                    |

**Indexes:**
- `idx_settings_scope_key` -- UNIQUE on `(scope, COALESCE(scope_id, '00000000-...'::uuid), key)`

**Foreign keys:** None

---

## 4. ENUM Types

### user_role
| Value              | Description                              |
|--------------------|------------------------------------------|
| `ADJUDICATOR`      | Standard case adjudicator                |
| `SUPERVISOR`       | Team supervisor with reassignment access |
| `QUALITY_REVIEWER` | QA review queue access                   |
| `ADMIN`            | Full administrative access               |
| `READ_ONLY`        | View-only access                         |

### case_type
| Value | Description                                   |
|-------|-----------------------------------------------|
| `T1`  | Tier 1 investigation                          |
| `T2`  | Tier 2 investigation                          |
| `T3`  | Tier 3 investigation (Secret clearance)       |
| `T5`  | Tier 5 investigation (Top Secret / SCI)       |
| `PPR` | Phased Periodic Reinvestigation               |
| `LBI` | Limited Background Investigation              |

### case_status
| Value                | Description                              |
|----------------------|------------------------------------------|
| `RECEIVED`           | Case received, not yet assigned          |
| `ASSIGNED`           | Assigned to adjudicator                  |
| `IN_REVIEW`          | Active adjudicative review               |
| `ISSUES_IDENTIFIED`  | Issues found during review               |
| `MEMO_DRAFT`         | Recommendation memo in draft             |
| `QA_REVIEW`          | Submitted for quality assurance review   |
| `QA_REVISION`        | Returned from QA for revisions           |
| `FINAL_REVIEW`       | Supervisor final review                  |
| `SUBMITTED`          | Submitted to originating agency          |
| `ON_HOLD`            | Case placed on hold                      |
| `CLOSED_FAVORABLE`   | Closed with favorable determination      |
| `CLOSED_UNFAVORABLE` | Closed with unfavorable determination    |
| `CANCELLED`          | Case cancelled                           |

### case_priority
| Value      | Description                              |
|------------|------------------------------------------|
| `CRITICAL` | Highest priority -- immediate action     |
| `HIGH`     | Elevated priority                        |
| `NORMAL`   | Standard priority                        |
| `LOW`      | Lower priority                           |
| `SURGE`    | Surge-designated from originating agency |

### case_disposition
| Value                    | Description                              |
|--------------------------|------------------------------------------|
| `FAVORABLE`              | Favorable eligibility determination      |
| `FAVORABLE_WITH_COMMENT` | Favorable with adjudicator comments      |
| `UNFAVORABLE`            | Unfavorable eligibility determination    |
| `DEFERRED`               | Determination deferred                   |
| `REFERRED`               | Referred to another authority            |

### document_status
| Value        | Description                              |
|--------------|------------------------------------------|
| `processing` | AI extraction in progress                |
| `awaiting`   | Awaiting human confirmation              |
| `confirmed`  | Human-confirmed extraction               |
| `failed`     | Extraction failed                        |

### issue_severity
| Value            | Description                              |
|------------------|------------------------------------------|
| `CRITICAL`       | Critical severity finding                |
| `HIGH`           | High severity finding                    |
| `MODERATE`       | Moderate severity finding                |
| `LOW`            | Low severity finding                     |
| `ADMINISTRATIVE` | Administrative/procedural only           |

### violation_severity
| Value      | Description                              |
|------------|------------------------------------------|
| `MINOR`    | Minor security violation                 |
| `MODERATE` | Moderate security violation              |
| `SERIOUS`  | Serious security violation               |
| `CRITICAL` | Critical security violation              |

### Application-Level Constants (frontend `constants.js`)

These constants define the allowed values used in the UI and passed to the API. Updated 2026-03-24 to align with the case management template.

**ISSUE_CATEGORIES** (maps to `case_issues.category`):

| Key | Label | Guideline |
|-----|-------|-----------|
| H   | `DRUG_INVOLVEMENT` (was `DRUGS`) | H |
| J   | `CRIMINAL_CONDUCT` (was `CRIMINAL`) | J |
| M   | `USE_IT_SYSTEMS` (was `TECHNOLOGY`) | M |

All other category keys (A-G, I, K, L) are unchanged.

**COMM_TYPES** (maps to `case_communications.comm_type`):

| Old Value | New Value |
|-----------|-----------|
| `INFO_REQUEST` | `INFORMATION_REQUEST` |
| `INFO_RESPONSE` | `INFORMATION_RESPONSE` |

**MITIGATION_TYPES** (maps to `case_issues.mitigation_type`):

| Value | Description |
|-------|-------------|
| `ISOLATED_INCIDENT` | One-time / isolated occurrence |
| `STABLE_EMPLOYMENT` | Demonstrated stable employment record |
| `NONE` | No mitigation applies |

Replaced previous values: `COMPLIANCE_TRAINING`, `BEHAVIOR_MODIFICATION`, `OTHER`.

---

## 5. Seed Data Summary

Seed files load demo data for development and testing. All seed files truncate their target table before inserting.

### 5.1 Users (001_users.js)

| Email                       | Name         | Role         | Password   |
|-----------------------------|-------------|--------------|------------|
| admin@ursamobile.com        | Admin, A.   | ADMIN        | `demo123`  |
| smith@ursamobile.com        | Smith, A.   | ADJUDICATOR  | `demo123`  |
| williams@ursamobile.com     | Williams, K.| ADJUDICATOR  | `demo123`  |
| chen@ursamobile.com         | Chen, D.    | ADJUDICATOR  | `demo123`  |
| johnson@ursamobile.com      | Johnson, T. | SUPERVISOR   | `demo123`  |

All passwords are hashed with bcryptjs (10 rounds). Unit: "URSA Mobile" for all.

### 5.2 Cases (002_cases.js)

| Case Number      | Subject       | Type | Status             | Priority | Assigned To | Surge |
|------------------|---------------|------|--------------------|----------|-------------|-------|
| DOW-2025-00147   | Anderson, R.  | T3   | IN_REVIEW          | HIGH     | Smith, A.   | No    |
| DOW-2025-00148   | Thompson, K.  | T5   | RECEIVED           | CRITICAL | Smith, A.   | Yes   |
| DOW-2025-00141   | Rivera, M.    | T3   | QA_REVIEW          | NORMAL   | Smith, A.   | No    |
| DOW-2025-00135   | Patel, S.     | T5   | CLOSED_FAVORABLE   | NORMAL   | Williams, K.| No    |

### 5.3 Case Documents (003_case_documents.js)

4 documents across 2 cases:
- **Rivera (DOW-2025-00141):** Investigation Report (confirmed, 94%), Credit Report (confirmed, 88%)
- **Anderson (DOW-2025-00147):** Investigation Report (awaiting, 91%), Credit Report (awaiting, 85%)

### 5.4 Case Issues (004_case_issues.js)

2 issues on Rivera case:
- Financial (Guideline F, MODERATE) -- delinquent accounts, payment plan mitigation
- Alcohol (Guideline G, LOW) -- 2021 DUI, treatment/rehabilitation mitigation

### 5.5 Case Communications (005_case_communications.js)

1 communication on Rivera case:
- 48-Hour Initial Notification (Outbound, stops 48-hr clock)

### 5.6 Case Memos (006_case_memos.js)

1 memo on Rivera case:
- Full recommendation memo (version 2, FAVORABLE disposition)
- QA result: 8/8 items PASS

### 5.7 Case History (007_case_history.js)

10 timeline entries on Rivera case covering the full workflow:
Case Created -> Assigned -> Documents Uploaded (x2) -> Extraction Confirmed (x2) -> Issues Identified -> 48-Hour Notification -> Memo Saved -> QA Submitted

### 5.8 Policies (008_policies.js)

| Title                                              | Type           | Status | Version |
|----------------------------------------------------|----------------|--------|---------|
| Suspense Compliance and Case Management Procedures | SOP            | Active | 1.4     |
| AI-Assisted Document Extraction -- Human Review    | Policy         | Active | 1.1     |
| Adjudicative Issue Documentation Standards         | Desk Reference | Draft  | 0.8     |

### 5.9 FCL Records (009_fcl_records.js)

| FCL ID   | Entity Name          | Clearance       | Status    | Employees |
|----------|----------------------|-----------------|-----------|-----------|
| FCL-001  | MarineTech Systems   | SECRET          | Active    | 85        |
| FCL-002  | Coastal Defense Corp | TOP SECRET      | Active    | 240       |
| FCL-003  | Harbor Analytics     | SECRET          | Pending   | 45        |
| FCL-004  | Apex Maritime        | TOP SECRET/SCI  | Suspended | 120       |
| FCL-005  | Nautilus Cyber       | SECRET          | Active    | 65        |

### 5.10 Foreign Travel (010_foreign_travel_violations.js)

| Travel ID    | Subject        | Countries             | Risk     | Status          |
|--------------|----------------|-----------------------|----------|-----------------|
| FT-2025-001  | Williams, K.   | Canada, UK            | LOW      | CLOSED          |
| FT-2025-002  | Chen, D.       | Germany, France       | MODERATE | DEBRIEF PENDING |
| FT-2025-003  | Okonkwo, R.    | Philippines           | LOW      | IN TRAVEL       |
| FT-2025-004  | Torres, A.     | Mexico                | HIGH     | REFERRED        |
| FT-2025-005  | Nakamura, S.   | Russia                | HIGH     | REFERRED        |

### 5.11 Violations (010_foreign_travel_violations.js)

| Violation #  | Subject       | Category              | Severity | Status            | CI Referral |
|--------------|---------------|-----------------------|----------|-------------------|-------------|
| SV-2025-001  | Martinez, R.  | Physical Security     | SERIOUS  | OPEN              | No          |
| SV-2025-002  | Park, J.      | Personnel Security    | MINOR    | CLOSED            | No          |
| SV-2025-003  | Foster, L.    | Information Security  | CRITICAL | UNDER REVIEW      | No          |
| SV-2025-004  | Grant, W.     | Physical Security     | MODERATE | CLOSED            | No          |
| SV-2025-005  | Hughes, C.    | Cybersecurity         | SERIOUS  | OPEN              | Yes         |
| SV-2025-006  | Bell, N.      | Personnel Security    | SERIOUS  | PRELIMINARY INQUIRY | No        |

### 5.12 QA Reviews & Notifications (011_qa_reviews_notifications.js)

- 1 QA review for Rivera case (Pending, 8-item checklist all checked)
- 2 notifications for Smith: surge case assignment warning, QA review completion

---

## 6. Payload Schema (CMS)

The Payload CMS uses a separate `payload` schema within the same `ssp` database. Configured in `/home/kali/SSP/cms/src/payload.config.ts` with `schemaName: 'payload'`.

Payload auto-generates tables based on collection definitions. The following collections are configured:

### payload.users
Built-in Payload authentication collection for CMS admin access. Separate from `public.users`.

| Field    | Type     | Notes                          |
|----------|----------|--------------------------------|
| id       | SERIAL   | Payload uses auto-increment    |
| email    | VARCHAR  | Required, unique               |
| hash     | VARCHAR  | Password hash                  |
| salt     | VARCHAR  | Password salt                  |

### payload.announcements
Platform-wide announcements displayed on the SSP dashboard.

| Field       | Type     | Required | Default | Notes                           |
|-------------|----------|----------|---------|---------------------------------|
| title       | TEXT     | Yes      |         |                                 |
| body        | JSONB    | No       |         | Rich text (Lexical editor)      |
| priority    | VARCHAR  | No       | `info`  | Options: info, warning, critical|
| publishedAt | TIMESTAMP| No       |         |                                 |
| expiresAt   | TIMESTAMP| No       |         |                                 |
| isActive    | BOOLEAN  | No       | `true`  |                                 |

### payload.help_articles
Help/documentation articles for the in-app knowledge base.

| Field     | Type     | Required | Default | Notes                                                        |
|-----------|----------|----------|---------|--------------------------------------------------------------|
| title     | TEXT     | Yes      |         |                                                              |
| slug      | TEXT     | Yes      |         | UNIQUE, URL-friendly identifier                              |
| category  | VARCHAR  | No       |         | getting-started, cases, documents, policies, admin, faq      |
| content   | JSONB    | No       |         | Rich text (Lexical editor)                                   |
| sortOrder | INTEGER  | No       | `0`     | Lower numbers appear first                                   |

### payload.system_alerts
System-wide alert banners (maintenance windows, outages, etc.).

| Field    | Type     | Required | Default | Notes                         |
|----------|----------|----------|---------|-------------------------------|
| title    | TEXT     | Yes      |         |                               |
| message  | JSONB    | No       |         | Rich text (Lexical editor)    |
| severity | VARCHAR  | No       | `info`  | Options: info, warning, error |
| startsAt | TIMESTAMP| No       |         |                               |
| endsAt   | TIMESTAMP| No       |         |                               |
| isActive | BOOLEAN  | No       | `true`  |                               |

Payload also auto-generates internal tables for migrations tracking, preferences, and media storage within the `payload` schema.

---

## 7. Naming Conventions

| Convention           | Pattern                            | Examples                                    |
|----------------------|------------------------------------|---------------------------------------------|
| Table names          | `snake_case`, plural               | `cases`, `case_documents`, `fcl_records`    |
| Column names         | `snake_case`                       | `created_at`, `case_id`, `subject_last`     |
| Primary keys         | `id` (UUID, `gen_random_uuid()`)   | All tables                                  |
| Foreign keys         | `<entity>_id`                      | `case_id`, `user_id`, `assigned_to`         |
| Timestamps           | `created_at`, `updated_at`         | All tables (except audit_log: no updated_at)|
| Soft deletes         | `deleted_at` (TIMESTAMPTZ, nullable)| users, cases, case_documents, case_issues, policies, fcl_records, foreign_travel, violations |
| ENUM types           | `<domain>_<concept>`               | `user_role`, `case_status`, `issue_severity`|
| Index names          | `idx_<table>_<column(s)>`          | `idx_cases_status`, `idx_audit_log_entity`  |
| Case numbers         | `DOW-YYYY-NNNNN`                   | `DOW-2025-00147`                            |
| Timezone handling    | All TIMESTAMPTZ stored in UTC      |                                             |
| Boolean defaults     | `false` or `NULL`                  | `surge`, `read`, `briefed`                  |
| JSONB defaults       | `'{}'` or `'[]'`                   | `preferences`, `extracted_fields`, `checklist`|

---

## 8. Migration History

All migrations are in `/home/kali/SSP/database/migrations/` and use Knex.js with both `up()` and `down()` functions.

| #   | File                             | Description                                                                 |
|-----|----------------------------------|-----------------------------------------------------------------------------|
| 001 | `001_create_users.js`            | Creates `user_role` ENUM and `users` table with partial index on email      |
| 002 | `002_create_cases.js`            | Creates `case_type`, `case_status`, `case_priority`, `case_disposition` ENUMs and `cases` table with 4 indexes |
| 003 | `003_create_case_documents.js`   | Creates `document_status` ENUM and `case_documents` table (FK -> cases, CASCADE) |
| 004 | `004_create_case_issues.js`      | Creates `issue_severity` ENUM and `case_issues` table (FK -> cases, CASCADE) |
| 005 | `005_create_case_communications.js` | Creates `case_communications` table for comms logging (FK -> cases, CASCADE) |
| 006 | `006_create_case_history.js`     | Creates `case_history` table for per-case timeline/audit trail (FK -> cases, CASCADE) |
| 007 | `007_create_case_memos.js`       | Creates `case_memos` table with unique constraint on case_id (1:1 relationship) |
| 008 | `008_create_policies.js`         | Creates `policies` table for the policy library (standalone, no FKs)        |
| 009 | `009_create_fcl_records.js`      | Creates `fcl_records` table for facility clearance tracking (standalone)    |
| 010 | `010_create_foreign_travel.js`   | Creates `foreign_travel` table with risk level and briefing status tracking |
| 011 | `011_create_violations.js`       | Creates `violation_severity` ENUM and `violations` table with CI referral fields |
| 012 | `012_create_qa_reviews.js`       | Creates `qa_reviews` table with JSONB checklist (FK -> cases, CASCADE)      |
| 013 | `013_create_audit_log.js`        | Creates `audit_log` table (append-only, no updated_at, polymorphic entity ref) |
| 014 | `014_create_notifications.js`    | Creates `notifications` table with read tracking (FK -> users, CASCADE)     |
| 015 | `015_create_settings.js`         | Creates `settings` table with composite unique index on scope/scope_id/key  |

### Rollback order

`down()` functions drop tables and ENUM types in reverse order. ENUMs are dropped with `DROP TYPE IF EXISTS` after their dependent table is removed.

---

## Appendix: Foreign Key Map

| Source Table          | Source Column  | Target Table | Target Column | On Delete  |
|-----------------------|----------------|--------------|---------------|------------|
| cases                 | assigned_to    | users        | id            | SET NULL   |
| case_documents        | case_id        | cases        | id            | CASCADE    |
| case_issues           | case_id        | cases        | id            | CASCADE    |
| case_communications   | case_id        | cases        | id            | CASCADE    |
| case_history          | case_id        | cases        | id            | CASCADE    |
| case_memos            | case_id        | cases        | id            | CASCADE    |
| qa_reviews            | case_id        | cases        | id            | CASCADE    |
| notifications         | user_id        | users        | id            | CASCADE    |

---

## Enhanced AI & Document Management Schema (Migrations 017–022)

> Added 2026-03-24. Extends the AI agentic layer with conversation memory, RAG knowledge base, workflow orchestration, evaluation/A/B testing, guardrails, and MongoDB bridge for document management.

### New ENUM Types

| Enum | Values | Migration |
|------|--------|-----------|
| `ai_memory_type` | FACT, PREFERENCE, DECISION, CONTEXT, SUMMARY | 017 |
| `ai_memory_scope` | CASE, USER, AGENT_GLOBAL, SYSTEM | 017 |
| `ai_embedding_status` | PENDING, COMPLETED, FAILED, STALE | 018 |
| `ai_knowledge_source_type` | POLICY, REGULATION, PRECEDENT, GUIDELINE, SOP, TRAINING | 018 |
| `ai_workflow_status` | PENDING, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED | 019 |
| `ai_step_status` | PENDING, RUNNING, COMPLETED, FAILED, SKIPPED, WAITING | 019 |
| `ai_condition_operator` | EQUALS, GT, LT, GTE, LTE, IN, NOT_NULL, ALWAYS | 019 |
| `ai_dataset_type` | TRAINING, VALIDATION, TEST, GOLDEN | 020 |
| `ai_experiment_status` | DRAFT, RUNNING, COMPLETED, CANCELLED | 020 |
| `ai_guardrail_type` | CONTENT_FILTER, PII_DETECTION, OUTPUT_VALIDATION, INPUT_VALIDATION, TOKEN_LIMIT, COST_LIMIT, BIAS_CHECK | 021 |
| `ai_guardrail_action` | LOG, WARN, BLOCK, REDACT, ESCALATE | 021 |
| `ai_guardrail_severity` | INFO, WARNING, BLOCK, CRITICAL | 021 |

### New PostgreSQL Tables

| Table | Migration | Purpose | Append-Only |
|-------|-----------|---------|-------------|
| `ai_conversation_memories` | 017 | Long-term agent context with pgvector embeddings | No |
| `ai_knowledge_sources` | 018 | RAG source documents (policies, regulations) | No |
| `ai_knowledge_chunks` | 018 | Chunked content with vector embeddings for RAG | No |
| `ai_rag_query_log` | 018 | Audit trail of RAG retrievals | Yes |
| `ai_workflows` | 019 | Pipeline definitions with trigger events | No |
| `ai_workflow_steps` | 019 | DAG steps (agent tasks, conditions, human gates) | No |
| `ai_workflow_edges` | 019 | Conditional branching between steps | No |
| `ai_workflow_runs` | 019 | Runtime workflow instances | No |
| `ai_workflow_step_runs` | 019 | Per-step execution records | No |
| `ai_eval_datasets` | 020 | Curated evaluation datasets | No |
| `ai_eval_samples` | 020 | Individual data samples | No |
| `ai_experiments` | 020 | A/B test experiment tracking | No |
| `ai_eval_results` | 020 | Per-sample evaluation results | Yes |
| `ai_guardrails` | 021 | Content filtering and validation rules | No |
| `ai_guardrail_violations` | 021 | Guardrail trigger audit log | Yes |

### Modified Tables

| Table | Migration | Changes |
|-------|-----------|---------|
| `case_documents` | 022 | Added: `mongo_document_id`, `mongo_gridfs_id`, `content_hash`, `version`, `extraction_status` |

### pgvector Extension

Migration 017 enables the `vector` extension for PostgreSQL. Vector columns use `VECTOR(1536)` (compatible with OpenAI/Anthropic embedding models). IVFFlat indexes are used for approximate nearest-neighbor search.

### Migration Registry (017–022)

| # | File | Description |
|---|------|-------------|
| 017 | `017_create_ai_conversation_memory.js` | pgvector extension + ai_conversation_memories table |
| 018 | `018_create_ai_rag_knowledge.js` | RAG knowledge sources, chunks, and query log |
| 019 | `019_create_ai_workflow_orchestration.js` | Workflow DAG: definitions, steps, edges, runs, step runs |
| 020 | `020_create_ai_evaluation.js` | Evaluation datasets, samples, experiments, results |
| 021 | `021_create_ai_guardrails.js` | Guardrail rules and violation log |
| 022 | `022_alter_case_documents_add_mongo_ref.js` | Bridge case_documents to MongoDB document store |

### New Foreign Keys (017–022)

| Source Table | Source Column | Target Table | Target Column | On Delete |
|---|---|---|---|---|
| ai_conversation_memories | agent_id | ai_agents | id | CASCADE |
| ai_conversation_memories | case_id | cases | id | SET NULL |
| ai_conversation_memories | user_id | users | id | SET NULL |
| ai_conversation_memories | source_task_id | ai_tasks | id | SET NULL |
| ai_knowledge_sources | policy_id | policies | id | SET NULL |
| ai_knowledge_sources | created_by | users | id | SET NULL |
| ai_knowledge_chunks | source_id | ai_knowledge_sources | id | CASCADE |
| ai_rag_query_log | task_id | ai_tasks | id | SET NULL |
| ai_workflows | created_by | users | id | SET NULL |
| ai_workflow_steps | workflow_id | ai_workflows | id | CASCADE |
| ai_workflow_steps | fallback_step_id | ai_workflow_steps | id | SET NULL |
| ai_workflow_edges | workflow_id | ai_workflows | id | CASCADE |
| ai_workflow_edges | from_step_id | ai_workflow_steps | id | CASCADE |
| ai_workflow_edges | to_step_id | ai_workflow_steps | id | CASCADE |
| ai_workflow_runs | workflow_id | ai_workflows | id | RESTRICT |
| ai_workflow_runs | case_id | cases | id | SET NULL |
| ai_workflow_runs | document_id | case_documents | id | SET NULL |
| ai_workflow_runs | current_step_id | ai_workflow_steps | id | SET NULL |
| ai_workflow_runs | initiated_by | users | id | SET NULL |
| ai_workflow_step_runs | run_id | ai_workflow_runs | id | CASCADE |
| ai_workflow_step_runs | step_id | ai_workflow_steps | id | RESTRICT |
| ai_workflow_step_runs | task_id | ai_tasks | id | SET NULL |
| ai_eval_datasets | created_by | users | id | SET NULL |
| ai_eval_samples | dataset_id | ai_eval_datasets | id | CASCADE |
| ai_eval_samples | case_id | cases | id | SET NULL |
| ai_eval_samples | annotated_by | users | id | SET NULL |
| ai_experiments | dataset_id | ai_eval_datasets | id | RESTRICT |
| ai_experiments | created_by | users | id | SET NULL |
| ai_eval_results | experiment_id | ai_experiments | id | CASCADE |
| ai_eval_results | sample_id | ai_eval_samples | id | CASCADE |
| ai_eval_results | model_id | ai_models | id | RESTRICT |
| ai_eval_results | prompt_template_id | ai_prompt_templates | id | SET NULL |
| ai_guardrails | created_by | users | id | SET NULL |
| ai_guardrail_violations | guardrail_id | ai_guardrails | id | RESTRICT |
| ai_guardrail_violations | task_id | ai_tasks | id | SET NULL |
| ai_guardrail_violations | case_id | cases | id | SET NULL |
| ai_guardrail_violations | resolved_by | users | id | SET NULL |

---

## MongoDB Document Store

> SSP uses MongoDB for document management alongside PostgreSQL for case management.
> Connection: `mongodb://mongodb:27017/ssp_documents`

### Collections

| Collection | Purpose | Append-Only |
|---|---|---|
| `documents` | Document metadata, GridFS file ref, extraction results, versioning, access control | No |
| `document_audit_trail` | Immutable log of all document operations | Yes |
| `document_templates` | Forms library with expected field mappings for Document AI | No |

### PostgreSQL ↔ MongoDB Bridge

`case_documents.mongo_document_id` → `documents.pg_document_id` (bidirectional reference)

### GridFS

Binary files (PDF, images, DOCX up to 50MB) are stored in MongoDB GridFS (`fs.files` / `fs.chunks`), referenced by `documents.gridfs_file_id`.
