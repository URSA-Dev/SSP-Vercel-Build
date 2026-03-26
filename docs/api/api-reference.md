# SSP Backend API Reference

> **Base URL:** `http://localhost:3001/api/v1`
> **Version:** 1.0.0
> **Last updated:** 2026-03-24

---

## Table of Contents

1. [Authentication & Conventions](#authentication--conventions)
2. [Standard Error Format](#standard-error-format)
3. [Pagination](#pagination)
4. [Dev Environment Credentials](#dev-environment-credentials)
5. [Auth](#1-auth)
6. [Cases](#2-cases)
7. [Documents](#3-documents)
8. [QA](#4-qa)
9. [Policies](#5-policies)
10. [Audit](#6-audit)
11. [Notifications](#7-notifications)
12. [Metrics](#8-metrics)
13. [Settings](#9-settings)
14. [FCL](#10-fcl)
15. [Foreign Travel](#11-foreign-travel)
16. [Violations](#12-violations)
17. [Content](#13-content)
18. [CMS Proxy](#14-cms-proxy)
19. [Health Check](#health-check)

---

## Authentication & Conventions

All authenticated endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via `POST /api/v1/auth/login` and contain:

```json
{
  "sub": "<user_uuid>",
  "email": "user@example.com",
  "role": "ADJUDICATOR",
  "iat": 1711152000,
  "exp": 1711238400
}
```

### Middleware Reference

| Middleware       | Description                                                        |
|------------------|--------------------------------------------------------------------|
| `authenticate`   | Verifies JWT, loads user from DB, attaches `req.user`. Returns 401 on failure. |
| `requireAdmin`   | Same as `authenticate` plus checks `role === 'ADMIN'`. Returns 403 for non-admins. |
| `validate(schema)` | Validates `req.body` and `req.params` against a rule DSL. Returns 400 with details on failure. |
| `auditLog(entity)` | Writes an entry to the `audit_log` table after the request completes. |
| `paginate`       | Parses `?page=` and `?limit=` from query string, attaches `req.pagination`. |

### Validation Rule DSL

Rules are pipe-delimited strings applied per field:

| Rule          | Description                          |
|---------------|--------------------------------------|
| `required`    | Field must be present and non-empty  |
| `string`      | Must be typeof string                |
| `number`      | Must be typeof number                |
| `boolean`     | Must be typeof boolean               |
| `email`       | Basic email format check             |
| `uuid`        | UUID v4 format                       |
| `maxLength:N` | String length <= N                   |
| `minLength:N` | String length >= N                   |
| `in:a,b,c`   | Value must be one of the listed options |

---

## Standard Error Format

All errors use a consistent envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": []
  }
}
```

### Error Codes

| HTTP Status | Code                    | Description                              |
|-------------|-------------------------|------------------------------------------|
| 400         | `VALIDATION_ERROR`      | Request body/params failed validation    |
| 400         | `BAD_REQUEST`           | Generic bad request                      |
| 401         | `UNAUTHORIZED`          | Missing or invalid authentication        |
| 401         | `TOKEN_EXPIRED`         | JWT has expired                          |
| 401         | `INVALID_TOKEN`         | JWT is malformed or invalid              |
| 401         | `INVALID_CREDENTIALS`   | Wrong email or password                  |
| 403         | `FORBIDDEN`             | Authenticated but not authorized         |
| 404         | `NOT_FOUND`             | Route or resource not found              |
| 404         | `CASE_NOT_FOUND`        | Case with given ID does not exist        |
| 404         | `ISSUE_NOT_FOUND`       | Case issue not found                     |
| 404         | `DOCUMENT_NOT_FOUND`    | Document not found                       |
| 404         | `QA_REVIEW_NOT_FOUND`   | QA review not found                      |
| 404         | `POLICY_NOT_FOUND`      | Policy not found                         |
| 404         | `FCL_NOT_FOUND`         | FCL record not found                     |
| 404         | `TRAVEL_NOT_FOUND`      | Travel record not found                  |
| 404         | `VIOLATION_NOT_FOUND`   | Violation not found                      |
| 404         | `NOTIFICATION_NOT_FOUND`| Notification not found                   |
| 404         | `SETTING_NOT_FOUND`     | Setting key not found                    |
| 404         | `USER_NOT_FOUND`        | User not found                           |
| 422         | `INVALID_TRANSITION`    | Invalid workflow status transition        |
| 422         | `INVALID_STATE`         | Resource is not in the required state    |
| 429         | `RATE_LIMITED`          | Too many requests                        |
| 500         | `INTERNAL_ERROR`        | Server error (stack trace in dev mode)   |

### Validation Error Example

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "email is required" },
      { "field": "password", "message": "password must be a string" }
    ]
  }
}
```

---

## Pagination

All list endpoints support pagination via query parameters:

| Parameter | Type   | Default | Max | Description         |
|-----------|--------|---------|-----|---------------------|
| `page`    | number | 1       | --  | Page number (1-based) |
| `limit`   | number | 25      | 100 | Items per page      |

### Paginated Response Format

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Dev Environment Credentials

All seed users share the password `demo123`.

| Email                      | Name          | Role          |
|----------------------------|---------------|---------------|
| `admin@ursamobile.com`     | Admin, A.     | `ADMIN`       |
| `smith@ursamobile.com`     | Smith, A.     | `ADJUDICATOR` |
| `williams@ursamobile.com`  | Williams, K.  | `ADJUDICATOR` |
| `chen@ursamobile.com`      | Chen, D.      | `ADJUDICATOR` |
| `johnson@ursamobile.com`   | Johnson, T.   | `SUPERVISOR`  |

---

## 1. Auth

Base path: `/api/v1/auth`

### POST /auth/login

Authenticate with email and password. Returns a JWT token and user profile.

- **Auth:** None
- **Middleware:** `validate` -> `auditLog('auth')` -> `login`

**Request Body:**

| Field      | Type   | Required | Validation        |
|------------|--------|----------|-------------------|
| `email`    | string | Yes      | `required\|email` |
| `password` | string | Yes      | `required\|string`|

**Success Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "smith@ursamobile.com",
    "last_name": "Smith",
    "first_initial": "A",
    "role": "ADJUDICATOR",
    "unit": "URSA Mobile",
    "created_at": "2026-01-15T00:00:00.000Z",
    "updated_at": "2026-01-15T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code                  | Condition              |
|--------|-----------------------|------------------------|
| 400    | `VALIDATION_ERROR`    | Missing/invalid fields |
| 401    | `INVALID_CREDENTIALS` | Wrong email or password|

---

### POST /auth/logout

Acknowledge client-side token removal.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('auth')` -> `logout`

**Success Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me

Return the authenticated user's profile.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getMe`

**Success Response (200):**

```json
{
  "id": "uuid",
  "email": "smith@ursamobile.com",
  "last_name": "Smith",
  "first_initial": "A",
  "role": "ADJUDICATOR",
  "unit": "URSA Mobile",
  "preferences": {},
  "created_at": "2026-01-15T00:00:00.000Z",
  "updated_at": "2026-01-15T00:00:00.000Z"
}
```

**Error Responses:**

| Status | Code             | Condition     |
|--------|------------------|---------------|
| 401    | `UNAUTHORIZED`   | Not logged in |
| 404    | `USER_NOT_FOUND` | User deleted  |

---

### PUT /auth/me

Update the authenticated user's profile fields.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate` -> `auditLog('user')` -> `updateMe`

**Request Body (all optional, at least one required):**

| Field           | Type   | Validation           |
|-----------------|--------|----------------------|
| `last_name`     | string | `string`             |
| `first_initial` | string | `string\|maxLength:1`|
| `preferences`   | object | --                   |

**Success Response (200):** Updated user object (same shape as GET /me).

**Error Responses:**

| Status | Code               | Condition            |
|--------|--------------------|----------------------|
| 400    | `VALIDATION_ERROR` | No valid fields sent |
| 401    | `UNAUTHORIZED`     | Not logged in        |

---

## 2. Cases

Base path: `/api/v1/cases`

All routes require `authenticate` (applied at router level).

### Case Workflow Status Transitions

```
RECEIVED -> ASSIGNED, ON_HOLD, CANCELLED
ASSIGNED -> IN_REVIEW, ON_HOLD, CANCELLED
IN_REVIEW -> ISSUES_IDENTIFIED, MEMO_DRAFT, ON_HOLD, CANCELLED
ISSUES_IDENTIFIED -> MEMO_DRAFT, IN_REVIEW, ON_HOLD
MEMO_DRAFT -> QA_REVIEW, IN_REVIEW, ON_HOLD
QA_REVIEW -> QA_REVISION, FINAL_REVIEW
QA_REVISION -> QA_REVIEW, MEMO_DRAFT
FINAL_REVIEW -> SUBMITTED, QA_REVISION
SUBMITTED -> CLOSED_FAVORABLE, CLOSED_UNFAVORABLE
ON_HOLD -> RECEIVED, ASSIGNED, IN_REVIEW
CLOSED_FAVORABLE -> (terminal)
CLOSED_UNFAVORABLE -> (terminal)
CANCELLED -> RECEIVED (re-open)
```

### GET /cases

List cases with pagination and filtering.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listCases`

**Query Parameters:**

| Parameter     | Type   | Description                         |
|---------------|--------|-------------------------------------|
| `page`        | number | Page number (default: 1)            |
| `limit`       | number | Items per page (default: 25, max: 100) |
| `status`      | string | Filter by status                    |
| `priority`    | string | Filter by priority                  |
| `assigned_to` | uuid   | Filter by assigned analyst          |
| `case_type`   | string | Filter by case type                 |
| `search`      | string | Search across case fields           |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "case_number": "SSP-2026-00001",
      "case_type": "Initial",
      "subject_last": "Doe",
      "subject_init": "J",
      "status": "IN_REVIEW",
      "priority": "NORMAL",
      "assigned_to": "uuid",
      "received_date": "2026-03-20T00:00:00.000Z",
      "suspense_48hr": "2026-03-22T00:00:00.000Z",
      "suspense_3day": "2026-03-25T00:00:00.000Z",
      "is_overdue_48hr": false,
      "is_overdue_3day": false,
      "created_at": "2026-03-20T00:00:00.000Z",
      "updated_at": "2026-03-21T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 42,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET /cases/:id

Get a single case with all sub-resources (issues, communications, documents, memo, history).

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params: { id: 'required|uuid' } })` -> `getCase`

**Path Parameters:**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `id`      | uuid | Yes      | UUID v4    |

**Success Response (200):** Full case object with nested sub-resources.

**Error Responses:**

| Status | Code             | Condition          |
|--------|------------------|--------------------|
| 400    | `VALIDATION_ERROR` | Invalid UUID     |
| 404    | `CASE_NOT_FOUND` | Case does not exist|

---

### POST /cases

Create a new case. Auto-generates case number, sets status to RECEIVED, assigns to current user.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate` -> `auditLog('case')` -> `createCase`

**Request Body:**

| Field           | Type   | Required | Description                   |
|-----------------|--------|----------|-------------------------------|
| `case_type`     | string | Yes      | Type of case (e.g., "Initial", "Periodic Reinvestigation") |
| `subject_last`  | string | Yes      | Subject's last name           |
| `subject_init`  | string | Yes      | Subject's first initial       |
| `priority`      | string | No       | Default: `NORMAL`             |
| `received_date` | string | No       | ISO 8601 date; default: now   |

**Success Response (201):**

```json
{
  "id": "uuid",
  "case_number": "SSP-2026-00042",
  "case_type": "Initial",
  "subject_last": "Doe",
  "subject_init": "J",
  "status": "RECEIVED",
  "priority": "NORMAL",
  "assigned_to": "uuid",
  "received_date": "2026-03-23T00:00:00.000Z",
  "suspense_48hr": "2026-03-25T00:00:00.000Z",
  "suspense_3day": "2026-03-26T00:00:00.000Z",
  "created_at": "2026-03-23T00:00:00.000Z",
  "updated_at": "2026-03-23T00:00:00.000Z"
}
```

**Error Responses:**

| Status | Code               | Condition                        |
|--------|--------------------|----------------------------------|
| 400    | `VALIDATION_ERROR` | Missing case_type or subject_last|

---

### PUT /cases/:id

Update case fields. Only allowed fields are accepted.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('case')` -> `updateCase`

**Path Parameters:**

| Parameter | Type | Required |
|-----------|------|----------|
| `id`      | uuid | Yes      |

**Allowed Body Fields:**

| Field          | Type   | Description              |
|----------------|--------|--------------------------|
| `subject_last` | string | Subject's last name      |
| `subject_init` | string | Subject's first initial  |
| `priority`     | string | Priority level           |
| `assigned_to`  | uuid   | Reassign to another user |
| `case_type`    | string | Case type                |
| `notes`        | string | Free-text notes          |
| `surge`        | any    | Surge indicator          |
| `disposition`  | string | Disposition value: `FAVORABLE`, `FAVORABLE_WITH_COMMENT`, `UNFAVORABLE`, `DEFERRED`, `REFERRED` |
| `rec_status`   | string | Recommendation status    |

**Success Response (200):** Updated case object.

**Error Responses:**

| Status | Code               | Condition               |
|--------|--------------------|-------------------------|
| 400    | `VALIDATION_ERROR` | No valid fields provided|
| 404    | `CASE_NOT_FOUND`   | Case does not exist     |

---

### PATCH /cases/:id/status

Perform a workflow status transition. Validates against the status transition map.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params, body })` -> `auditLog('case')` -> `updateStatus`

**Path Parameters:**

| Parameter | Type | Required |
|-----------|------|----------|
| `id`      | uuid | Yes      |

**Request Body:**

| Field    | Type   | Required | Description                  |
|----------|--------|----------|------------------------------|
| `status` | string | Yes      | Target status (must be valid)|

**Success Response (200):** Updated case object with new status.

**Error Responses:**

| Status | Code                 | Condition                      |
|--------|----------------------|--------------------------------|
| 400    | `VALIDATION_ERROR`   | Missing status field           |
| 404    | `CASE_NOT_FOUND`     | Case does not exist            |
| 422    | `INVALID_TRANSITION` | Transition not allowed; response includes `details.allowed` array |

---

### DELETE /cases/:id

Soft-delete a case (sets `deleted_at`).

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('case')` -> `deleteCase`

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code             | Condition          |
|--------|------------------|--------------------|
| 404    | `CASE_NOT_FOUND` | Case does not exist|

---

### POST /cases/:id/issues

Add an issue/finding to a case.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params, body })` -> `auditLog('case_issue')` -> `addIssue`

**Path Parameters:**

| Parameter | Type | Required |
|-----------|------|----------|
| `id`      | uuid | Yes      |

**Request Body:**

| Field             | Type    | Required | Description                                          |
|-------------------|---------|----------|------------------------------------------------------|
| `category`        | string  | Yes      | Issue category (from `ISSUE_CATEGORIES` constants)   |
| `subcategory`     | string  | No       | Issue subcategory detail                             |
| `description`     | string  | Yes      | Issue description                                    |
| `severity`        | string  | Yes      | Severity level                                       |
| `guideline`       | string  | No       | Adjudicative guideline reference (single letter A-M) |
| `mitigation_type` | string  | No       | Mitigation type: `ISOLATED_INCIDENT`, `STABLE_EMPLOYMENT`, `NONE` |
| `mitigation`      | string  | No       | Mitigation narrative text                            |
| `in_memo`         | boolean | No       | Whether to include this issue in the memo (default: false) |

**Success Response (201):**

```json
{
  "id": "uuid",
  "case_id": "uuid",
  "category": "FINANCIAL",
  "subcategory": "Delinquent accounts",
  "description": "Unexplained debts exceeding threshold",
  "severity": "MODERATE",
  "guideline": "F",
  "mitigation_type": "STABLE_EMPLOYMENT",
  "mitigation": "Subject has established a payment plan",
  "in_memo": true,
  "created_at": "2026-03-23T00:00:00.000Z",
  "updated_at": "2026-03-23T00:00:00.000Z"
}
```

**Error Responses:**

| Status | Code               | Condition                         |
|--------|--------------------|-----------------------------------|
| 400    | `VALIDATION_ERROR` | Missing required fields           |
| 404    | `CASE_NOT_FOUND`   | Parent case does not exist        |

---

### PUT /cases/:id/issues/:issueId

Update an existing issue.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('case_issue')` -> `updateIssue`

**Path Parameters:**

| Parameter | Type | Required |
|-----------|------|----------|
| `id`      | uuid | Yes      |
| `issueId` | uuid | Yes      |

**Allowed Body Fields:**

| Field             | Type    | Description                    |
|-------------------|---------|--------------------------------|
| `category`        | string  | Issue category                 |
| `subcategory`     | string  | Issue subcategory              |
| `severity`        | string  | Severity level                 |
| `guideline`       | string  | Applicable guideline reference |
| `in_memo`         | boolean | Whether included in memo       |
| `description`     | string  | Description text               |
| `mitigation`      | string  | Mitigation narrative           |
| `mitigation_type` | string  | Type of mitigation             |

**Success Response (200):** Updated issue object.

**Error Responses:**

| Status | Code              | Condition         |
|--------|-------------------|-------------------|
| 404    | `ISSUE_NOT_FOUND` | Issue not found   |

---

### DELETE /cases/:id/issues/:issueId

Soft-delete an issue.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('case_issue')` -> `deleteIssue`

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code              | Condition       |
|--------|-------------------|-----------------|
| 404    | `ISSUE_NOT_FOUND` | Issue not found |

---

### POST /cases/:id/communications

Log a communication event on a case. Automatically checks 48-hour suspense compliance.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params, body })` -> `auditLog('case_communication')` -> `addCommunication`

**Request Body:**

| Field             | Type   | Required | Description                     |
|-------------------|--------|----------|---------------------------------|
| `comm_type`       | string | Yes      | Communication type (from `COMM_TYPES` constants, e.g., `INITIAL_NOTIFICATION`, `INFORMATION_REQUEST`, `INFORMATION_RESPONSE`) |
| `direction`       | string | Yes      | "Inbound" or "Outbound"        |
| `subject`         | string | Yes      | Communication subject line      |
| `body`            | string | No       | Communication body text         |
| `suspense_effect` | string | No       | Impact on suspense tracking: `No Effect`, `Stops Suspense`, or `Starts Clock`. Auto-set to `Stops Suspense` for `INITIAL_NOTIFICATION` comm type. |

**Success Response (201):**

```json
{
  "id": "uuid",
  "case_id": "uuid",
  "comm_type": "Email",
  "direction": "Outbound",
  "subject": "Request for additional information",
  "body": "...",
  "suspense_effect": null,
  "logged_by": "Smith, A.",
  "logged_at": "2026-03-23T14:30:00.000Z",
  "created_at": "2026-03-23T14:30:00.000Z"
}
```

**Error Responses:**

| Status | Code               | Condition            |
|--------|--------------------|----------------------|
| 400    | `VALIDATION_ERROR` | Missing required fields |
| 404    | `CASE_NOT_FOUND`   | Case does not exist  |

---

### GET /cases/:id/history

Get paginated case history/timeline.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `paginate` -> `getHistory`

**Query Parameters:** Standard pagination (`page`, `limit`).

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "action": "STATUS_CHANGED",
      "detail": "Status changed from RECEIVED to ASSIGNED",
      "user_name": "Smith, A.",
      "created_at": "2026-03-21T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 8, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

**Error Responses:**

| Status | Code             | Condition          |
|--------|------------------|--------------------|
| 404    | `CASE_NOT_FOUND` | Case does not exist|

---

### PUT /cases/:id/memo

Save or update the case memo. If a memo exists, increments the version.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params, body })` -> `auditLog('case_memo')` -> `saveMemo`

**Request Body:**

| Field       | Type   | Required | Description     |
|-------------|--------|----------|-----------------|
| `memo_text` | string | Yes      | Full memo text  |

**Success Response (200):**

```json
{
  "id": "uuid",
  "case_id": "uuid",
  "memo_text": "Detailed analysis of subject's case...",
  "version": 3,
  "saved_at": "2026-03-23T15:00:00.000Z",
  "created_at": "2026-03-21T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Code               | Condition          |
|--------|--------------------|---------------------|
| 400    | `VALIDATION_ERROR` | Missing memo_text  |
| 404    | `CASE_NOT_FOUND`   | Case does not exist|

---

### POST /cases/:id/memo/qa-check

Run server-side QA validation checks against the case. Returns 8 checks matching the template's localQACheck.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `qaCheck`

**Success Response (200):**

```json
{
  "checks": [
    { "id": "subject_info", "label": "Subject information is complete", "passed": true },
    { "id": "case_type", "label": "Case type is specified", "passed": true },
    { "id": "issues_present", "label": "At least one issue is documented", "passed": true },
    { "id": "issues_resolved", "label": "All issues have severity and description", "passed": true },
    { "id": "communication_logged", "label": "At least one communication is logged", "passed": false },
    { "id": "memo_exists", "label": "Case memo is written", "passed": true },
    { "id": "memo_content", "label": "Memo has substantive content (100+ chars)", "passed": true },
    { "id": "documents_confirmed", "label": "All documents are confirmed", "passed": true }
  ],
  "allPassed": false
}
```

**Error Responses:**

| Status | Code             | Condition          |
|--------|------------------|--------------------|
| 404    | `CASE_NOT_FOUND` | Case does not exist|

---

### POST /cases/:id/submit-qa

Submit case to the QA review queue. Case must be in `MEMO_DRAFT` status. Transitions case to `QA_REVIEW` and checks 3-day suspense compliance.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('qa_review')` -> `submitQa`

**Success Response (201):**

```json
{
  "id": "uuid",
  "case_id": "uuid",
  "submitted_by": "Smith, A.",
  "submitted_at": "2026-03-23T16:00:00.000Z",
  "status": "Pending",
  "created_at": "2026-03-23T16:00:00.000Z"
}
```

**Error Responses:**

| Status | Code                 | Condition                        |
|--------|----------------------|----------------------------------|
| 404    | `CASE_NOT_FOUND`     | Case does not exist              |
| 422    | `INVALID_TRANSITION` | Case is not in MEMO_DRAFT status |

---

## 3. Documents

Base path: `/api/v1/documents`

All routes require `authenticate` (applied at router level).

### GET /documents/case/:caseId

List all documents for a case.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params: { caseId: 'required|uuid' } })` -> `listDocuments`

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "filename": "SF-86.pdf",
      "file_path": "/uploads/1711152000-123456789.pdf",
      "file_size": "245832",
      "doc_type": "application/pdf",
      "status": "confirmed",
      "extracted_fields": { "document_type": "SF-86", "subject_name": "Doe, J." },
      "created_at": "2026-03-21T00:00:00.000Z"
    }
  ]
}
```

---

### POST /documents/case/:caseId

Upload a document to a case. Kicks off simulated AI extraction.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `multer.single('file')` -> `auditLog('document')` -> `uploadDocument`

**Request:** `multipart/form-data`

| Field  | Type | Required | Description                                |
|--------|------|----------|--------------------------------------------|
| `file` | file | Yes      | The document file                          |

**Allowed MIME types:** `application/pdf`, `image/jpeg`, `image/png`, `image/tiff`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Max file size:** Configured via `config.upload.maxFileSize`

**Success Response (201):**

```json
{
  "id": "uuid",
  "case_id": "uuid",
  "filename": "SF-86.pdf",
  "file_path": "/uploads/1711152000-123456789.pdf",
  "file_size": "245832",
  "doc_type": "application/pdf",
  "status": "processing",
  "extracted_fields": null,
  "created_at": "2026-03-23T00:00:00.000Z"
}
```

> After ~3 seconds, the document status transitions from `processing` to `awaiting` with mock extracted fields.

**Error Responses:**

| Status | Code               | Condition          |
|--------|--------------------|---------------------|
| 400    | `VALIDATION_ERROR` | No file uploaded   |
| 404    | `CASE_NOT_FOUND`   | Case does not exist|

---

### PATCH /documents/:id/confirm

Confirm AI extraction results. Document must be in `awaiting` status.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('document')` -> `confirmExtraction`

**Success Response (200):** Updated document object with `status: "confirmed"`.

**Error Responses:**

| Status | Code               | Condition                     |
|--------|--------------------|-------------------------------|
| 404    | `DOCUMENT_NOT_FOUND`| Document does not exist       |
| 422    | `INVALID_STATE`    | Document not in awaiting state|

---

### PATCH /documents/:id/reject

Reject extraction results. Resets to `processing` and re-runs AI extraction.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('document')` -> `rejectExtraction`

**Success Response (200):** Updated document object with `status: "processing"` and `extracted_fields: null`.

**Error Responses:**

| Status | Code                | Condition                      |
|--------|---------------------|--------------------------------|
| 404    | `DOCUMENT_NOT_FOUND`| Document does not exist        |
| 422    | `INVALID_STATE`     | Document not in awaiting state |

---

### DELETE /documents/:id

Soft-delete a document.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('document')` -> `deleteDocument`

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code                | Condition             |
|--------|---------------------|-----------------------|
| 404    | `DOCUMENT_NOT_FOUND`| Document does not exist|

---

## 4. QA

Base path: `/api/v1/qa`

All routes require `authenticate` (applied at router level).

### GET /qa

List the QA review queue with pagination and optional status filter.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listQueue`

**Query Parameters:**

| Parameter | Type   | Description            |
|-----------|--------|------------------------|
| `page`    | number | Page number            |
| `limit`   | number | Items per page         |
| `status`  | string | Filter by review status (e.g., "Pending", "Completed") |

**Success Response (200):** Paginated list of QA review objects.

```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "submitted_by": "Smith, A.",
      "submitted_at": "2026-03-22T00:00:00.000Z",
      "status": "Pending",
      "outcome": null,
      "reviewer": null,
      "reviewed_at": null
    }
  ],
  "pagination": { ... }
}
```

---

### GET /qa/:id

Get a single QA review with case information.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params: { id: 'required|uuid' } })` -> `getReview`

**Success Response (200):** Full QA review object.

**Error Responses:**

| Status | Code                  | Condition             |
|--------|-----------------------|-----------------------|
| 404    | `QA_REVIEW_NOT_FOUND` | Review does not exist |

---

### POST /qa/:id/review

Submit a QA review decision. Updates both the QA review and the parent case status.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('qa_review')` -> `submitReview`

**Request Body:**

| Field      | Type   | Required | Allowed Values                                      |
|------------|--------|----------|-----------------------------------------------------|
| `outcome`  | string | Yes      | `Passed`, `Minor Revisions`, `Major Revisions`, `Rejected` |
| `comments` | string | No       | Review comments/notes                               |

**Outcome -> Case Status Mapping:**

| Outcome            | New Case Status |
|--------------------|-----------------|
| `Passed`           | `SUBMITTED`     |
| `Minor Revisions`  | `QA_REVISION`   |
| `Major Revisions`  | `QA_REVISION`   |
| `Rejected`         | `QA_REVISION`   |

**Success Response (200):**

```json
{
  "id": "uuid",
  "case_id": "uuid",
  "submitted_by": "Smith, A.",
  "submitted_at": "2026-03-22T00:00:00.000Z",
  "status": "Completed",
  "outcome": "Passed",
  "comments": "Meets all requirements",
  "reviewer": "Johnson, T.",
  "reviewed_at": "2026-03-23T16:30:00.000Z"
}
```

**Error Responses:**

| Status | Code                  | Condition                        |
|--------|-----------------------|----------------------------------|
| 400    | `VALIDATION_ERROR`    | Missing or invalid outcome       |
| 404    | `QA_REVIEW_NOT_FOUND` | Review does not exist            |

---

## 5. Policies

Base path: `/api/v1/policies`

All routes require `authenticate` (applied at router level).

### GET /policies

List policies with pagination and filtering.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listPolicies`

**Query Parameters:**

| Parameter     | Type   | Description             |
|---------------|--------|-------------------------|
| `page`        | number | Page number             |
| `limit`       | number | Items per page          |
| `status`      | string | Filter by status (e.g., "Draft", "Published") |
| `policy_type` | string | Filter by policy type   |

**Success Response (200):** Paginated list of policy objects.

---

### GET /policies/:id

Get a single policy by ID.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params: { id: 'required|uuid' } })` -> `getPolicy`

**Success Response (200):**

```json
{
  "id": "uuid",
  "title": "Personnel Security Policy",
  "policy_type": "SEAD",
  "content": "Full policy text...",
  "author": "Admin, A.",
  "status": "Published",
  "version": "1.2",
  "created_at": "2026-01-15T00:00:00.000Z",
  "updated_at": "2026-03-20T00:00:00.000Z"
}
```

**Error Responses:**

| Status | Code               | Condition              |
|--------|--------------------|------------------------|
| 404    | `POLICY_NOT_FOUND` | Policy does not exist  |

---

### POST /policies

Create a new policy. Starts at version `0.1` with status `Draft`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('policy')` -> `createPolicy`

**Request Body:**

| Field         | Type   | Required | Description                             |
|---------------|--------|----------|-----------------------------------------|
| `title`       | string | Yes      | Policy title                            |
| `policy_type` | string | Yes      | Type (e.g., "SEAD", "EO", "Regulation")|
| `content`     | string | No       | Policy body text                        |
| `author`      | string | No       | Defaults to current user's name         |

**Success Response (201):** Created policy object.

**Error Responses:**

| Status | Code               | Condition                     |
|--------|--------------------|-------------------------------|
| 400    | `VALIDATION_ERROR` | Missing title or policy_type  |

---

### PUT /policies/:id

Update a policy. Auto-bumps version by 0.1 when content changes.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('policy')` -> `updatePolicy`

**Request Body (all optional):**

| Field         | Type   | Description                         |
|---------------|--------|-------------------------------------|
| `title`       | string | Policy title                        |
| `policy_type` | string | Policy type                         |
| `content`     | string | Body text (triggers version bump)   |
| `author`      | string | Author name                         |
| `status`      | string | Status (e.g., "Draft", "Published") |

**Success Response (200):** Updated policy object.

**Error Responses:**

| Status | Code               | Condition             |
|--------|--------------------|------------------------|
| 404    | `POLICY_NOT_FOUND` | Policy does not exist  |

---

### DELETE /policies/:id

Soft-delete a policy.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params })` -> `auditLog('policy')` -> `deletePolicy`

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code               | Condition             |
|--------|--------------------|------------------------|
| 404    | `POLICY_NOT_FOUND` | Policy does not exist  |

---

## 6. Audit

Base path: `/api/v1/audit`

All routes require `authenticate` (applied at router level).

### GET /audit

List audit log entries with pagination and filtering.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listAuditLog`

**Query Parameters:**

| Parameter     | Type   | Description                        |
|---------------|--------|------------------------------------|
| `page`        | number | Page number                        |
| `limit`       | number | Items per page                     |
| `entity_type` | string | Filter by entity type (exact match)|
| `action`      | string | Filter by action (partial, ilike)  |
| `user_name`   | string | Filter by user name (partial, ilike)|
| `date_from`   | string | Filter entries on or after (ISO 8601)|
| `date_to`     | string | Filter entries on or before (ISO 8601)|

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_name": "Smith, A.",
      "action": "CREATE",
      "detail": "Case SSP-2026-00042 created",
      "entity_type": "case",
      "entity_id": "uuid",
      "ip_address": "127.0.0.1",
      "created_at": "2026-03-23T14:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /audit/export

Export audit log entries as a CSV file. Supports the same filters as `GET /audit`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `exportCsv`

**Query Parameters:** Same as `GET /audit` (without `page`/`limit`; returns all matching rows).

**Success Response (200):**

- **Content-Type:** `text/csv`
- **Content-Disposition:** `attachment; filename="audit-log.csv"`

CSV columns: `id`, `user_name`, `action`, `detail`, `entity_type`, `entity_id`, `ip_address`, `created_at`

---

## 7. Notifications

Base path: `/api/v1/notifications`

All routes require `authenticate` (applied at router level).

### GET /notifications

List notifications for the current user, unread first.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listNotifications`

**Query Parameters:** Standard pagination (`page`, `limit`).

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Case assigned to you",
      "message": "Case SSP-2026-00042 has been assigned.",
      "read": false,
      "created_at": "2026-03-23T14:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### PATCH /notifications/:id/read

Mark a single notification as read. Only the notification owner can mark it.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `validate({ params: { id: 'required|uuid' } })` -> `auditLog('notification')` -> `markRead`

**Success Response (200):** Updated notification object with `read: true`.

**Error Responses:**

| Status | Code                    | Condition                      |
|--------|-------------------------|--------------------------------|
| 403    | `FORBIDDEN`             | Notification belongs to another user |
| 404    | `NOTIFICATION_NOT_FOUND`| Notification does not exist    |

---

### PATCH /notifications/read-all

Mark all notifications as read for the current user.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('notification')` -> `markAllRead`

**Success Response (200):**

```json
{
  "message": "All notifications marked as read",
  "count": 12
}
```

---

### DELETE /notifications/clear

Delete all notifications for the current user.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('notification')` -> `clearAll`

**Success Response (200):**

```json
{
  "message": "All notifications cleared",
  "count": 12
}
```

---

## 8. Metrics

Base path: `/api/v1/metrics`

All routes require `authenticate` (applied at router level).

### GET /metrics/dashboard

Dashboard KPIs: active cases, at-risk count, AI extractions awaiting, QA reviews pending.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `dashboardMetrics`

**Success Response (200):**

```json
{
  "activeCases": 42,
  "atRisk": 5,
  "aiExtractions": 3,
  "qaPending": 7
}
```

---

### GET /metrics/workload

Workload distribution per analyst. Returns active case counts and overdue counts per assigned user.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `workloadMetrics`

**Success Response (200):**

```json
{
  "data": [
    {
      "analyst_id": "uuid",
      "analyst_name": "Smith, A.",
      "total_cases": 15,
      "overdue_48hr": 2,
      "overdue_3day": 1
    }
  ]
}
```

---

### GET /metrics/suspense

Suspense compliance statistics for 48-hour and 3-day suspense windows.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `suspenseMetrics`

**Success Response (200):**

```json
{
  "suspense_48hr": {
    "total": 150,
    "met": 142,
    "overdue": 8,
    "compliance_pct": 95
  },
  "suspense_3day": {
    "total": 150,
    "met": 138,
    "overdue": 12,
    "compliance_pct": 92
  }
}
```

---

## 9. Settings

Base path: `/api/v1/settings`

All routes require `authenticate` (applied at router level).

Settings support two scopes: `tenant` (shared across organization) and `user` (per-user overrides). User-scope settings take priority over tenant-scope.

### GET /settings

Get all settings: tenant-level merged with user-level overrides.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getSettings`

**Success Response (200):**

```json
{
  "data": {
    "theme": { "value": "dark", "scope": "user" },
    "default_page_size": { "value": 25, "scope": "tenant" },
    "notifications_enabled": { "value": true, "scope": "tenant" }
  }
}
```

---

### GET /settings/:key

Get a single setting by key. Returns user-scope if it exists, otherwise falls back to tenant-scope.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getSetting`

**Path Parameters:**

| Parameter | Type   | Required | Description  |
|-----------|--------|----------|--------------|
| `key`     | string | Yes      | Setting key  |

**Success Response (200):**

```json
{
  "key": "theme",
  "value": "dark",
  "scope": "user"
}
```

**Error Responses:**

| Status | Code                | Condition           |
|--------|---------------------|---------------------|
| 404    | `SETTING_NOT_FOUND` | Key does not exist  |

---

### PUT /settings/:key

Create or update a setting value (JSONB). Defaults to user scope; admins can write to tenant scope.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('setting')` -> `setSetting`

**Path Parameters:**

| Parameter | Type   | Required |
|-----------|--------|----------|
| `key`     | string | Yes      |

**Request Body:**

| Field   | Type | Required | Description                                    |
|---------|------|----------|------------------------------------------------|
| `value` | any  | Yes      | Setting value (stored as JSONB)                |
| `scope` | string | No    | `"tenant"` (admin only) or `"user"` (default) |

**Success Response (200):** The upserted setting object.

**Error Responses:**

| Status | Code               | Condition       |
|--------|--------------------|-----------------|
| 400    | `VALIDATION_ERROR` | Missing `value` |

---

## 10. FCL

Base path: `/api/v1/fcl`

All routes require `authenticate` (applied at router level). Facility Clearance Level tracking.

### GET /fcl

List FCL records with pagination and filtering.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listRecords`

**Query Parameters:**

| Parameter         | Type   | Description                |
|-------------------|--------|----------------------------|
| `page`            | number | Page number                |
| `limit`           | number | Items per page             |
| `status`          | string | Filter by status           |
| `clearance_level` | string | Filter by clearance level  |
| `search`          | string | Search across fields       |

**Success Response (200):** Paginated list of FCL records.

---

### GET /fcl/stats

Get aggregate FCL statistics.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getStats`

**Success Response (200):**

```json
{
  "data": { ... }
}
```

---

### GET /fcl/:id

Get a single FCL record by ID.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getRecord`

**Success Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "fcl_id": "FCL-00001",
    "entity_name": "ACME Corp",
    "clearance_level": "SECRET",
    "status": "Active",
    "created_at": "2026-01-15T00:00:00.000Z",
    "updated_at": "2026-03-20T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code           | Condition              |
|--------|----------------|------------------------|
| 404    | `FCL_NOT_FOUND`| Record does not exist  |

---

### POST /fcl

Create a new FCL record. Auto-generates `fcl_id`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('fcl')` -> `createRecord`

**Request Body:**

| Field             | Type   | Required | Description          |
|-------------------|--------|----------|----------------------|
| `entity_name`     | string | Yes      | Facility/entity name |
| `clearance_level` | string | Yes      | Clearance level      |

Additional fields from the request body are passed through to the model.

**Success Response (201):**

```json
{
  "data": { "id": "uuid", "fcl_id": "FCL-00042", ... }
}
```

**Error Responses:**

| Status | Code               | Condition                             |
|--------|--------------------|---------------------------------------|
| 400    | `VALIDATION_ERROR` | Missing entity_name or clearance_level|

---

### PUT /fcl/:id

Update an FCL record.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('fcl')` -> `updateRecord`

**Success Response (200):**

```json
{
  "data": { ... }
}
```

**Error Responses:**

| Status | Code           | Condition             |
|--------|----------------|-----------------------|
| 404    | `FCL_NOT_FOUND`| Record does not exist |

---

### DELETE /fcl/:id

Soft-delete an FCL record.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('fcl')` -> `deleteRecord`

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code           | Condition             |
|--------|----------------|-----------------------|
| 404    | `FCL_NOT_FOUND`| Record does not exist |

---

## 11. Foreign Travel

Base path: `/api/v1/travel`

All routes require `authenticate` (applied at router level).

### GET /travel

List foreign travel records with pagination and filtering.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listRecords`

**Query Parameters:**

| Parameter    | Type   | Description            |
|--------------|--------|------------------------|
| `page`       | number | Page number            |
| `limit`      | number | Items per page         |
| `status`     | string | Filter by status       |
| `risk_level` | string | Filter by risk level   |
| `search`     | string | Search across fields   |

**Success Response (200):** Paginated list of travel records.

---

### GET /travel/stats

Get aggregate foreign travel statistics.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getStats`

**Success Response (200):**

```json
{
  "data": { ... }
}
```

---

### GET /travel/:id

Get a single travel record by ID.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getRecord`

**Success Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "travel_id": "TRV-00001",
    "subject_name": "Doe, J.",
    "countries": "Germany, France",
    "status": "Approved",
    "risk_level": "LOW",
    "created_at": "2026-02-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code              | Condition             |
|--------|-------------------|-----------------------|
| 404    | `TRAVEL_NOT_FOUND`| Record does not exist |

---

### POST /travel

Log a new foreign travel notification. Auto-generates `travel_id`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('travel')` -> `createRecord`

**Request Body:**

| Field          | Type   | Required | Description                    |
|----------------|--------|----------|--------------------------------|
| `subject_name` | string | Yes      | Traveler's name                |
| `countries`    | string | Yes      | Destination countries          |

Additional fields from the request body are passed through to the model.

**Success Response (201):**

```json
{
  "data": { "id": "uuid", "travel_id": "TRV-00042", ... }
}
```

**Error Responses:**

| Status | Code               | Condition                        |
|--------|--------------------|----------------------------------|
| 400    | `VALIDATION_ERROR` | Missing subject_name or countries|

---

### PUT /travel/:id

Update a travel record (debrief, status change, referral).

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('travel')` -> `updateRecord`

**Success Response (200):**

```json
{
  "data": { ... }
}
```

**Error Responses:**

| Status | Code              | Condition             |
|--------|-------------------|-----------------------|
| 404    | `TRAVEL_NOT_FOUND`| Record does not exist |

---

### DELETE /travel/:id

Soft-delete a travel record.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('travel')` -> `deleteRecord`

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code              | Condition             |
|--------|-------------------|-----------------------|
| 404    | `TRAVEL_NOT_FOUND`| Record does not exist |

---

## 12. Violations

Base path: `/api/v1/violations`

All routes require `authenticate` (applied at router level).

### GET /violations

List security violations with pagination and filtering.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `paginate` -> `listViolations`

**Query Parameters:**

| Parameter  | Type   | Description                |
|------------|--------|----------------------------|
| `page`     | number | Page number                |
| `limit`    | number | Items per page             |
| `status`   | string | Filter by status           |
| `category` | string | Filter by violation category|
| `severity` | string | Filter by severity         |
| `search`   | string | Search across fields       |

**Success Response (200):** Paginated list of violation records.

---

### GET /violations/stats

Get aggregate violation statistics.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getStats`

**Success Response (200):**

```json
{
  "data": { ... }
}
```

---

### GET /violations/:id

Get a single violation by ID.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `getViolation`

**Success Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "violation_number": "VIO-00001",
    "category": "Unauthorized Disclosure",
    "subject_name": "Doe, J.",
    "severity": "MAJOR",
    "description": "Classified material left unsecured...",
    "status": "OPEN",
    "created_at": "2026-03-15T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code                 | Condition             |
|--------|----------------------|-----------------------|
| 404    | `VIOLATION_NOT_FOUND`| Record does not exist |

---

### POST /violations

Report a new security violation. Auto-generates `violation_number`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('violation')` -> `createViolation`

**Request Body:**

| Field          | Type   | Required | Description                |
|----------------|--------|----------|----------------------------|
| `category`     | string | Yes      | Violation category         |
| `subject_name` | string | Yes      | Subject's name             |
| `severity`     | string | Yes      | Severity level             |
| `description`  | string | Yes      | Incident description       |

Additional fields from the request body are passed through to the model.

**Success Response (201):**

```json
{
  "data": { "id": "uuid", "violation_number": "VIO-00042", ... }
}
```

**Error Responses:**

| Status | Code               | Condition                   |
|--------|--------------------|------------------------------|
| 400    | `VALIDATION_ERROR` | Missing required fields      |

---

### PUT /violations/:id

Update a violation (investigation, status change, CI referral). Auto-sets `closed_date` when status transitions to `CLOSED`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('violation')` -> `updateViolation`

**Success Response (200):**

```json
{
  "data": { ... }
}
```

**Error Responses:**

| Status | Code                 | Condition             |
|--------|----------------------|-----------------------|
| 404    | `VIOLATION_NOT_FOUND`| Record does not exist |

---

### DELETE /violations/:id

Soft-delete a violation.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> `auditLog('violation')` -> `deleteViolation`

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code                 | Condition             |
|--------|----------------------|-----------------------|
| 404    | `VIOLATION_NOT_FOUND`| Record does not exist |

---

## 13. Content

Base path: `/api/v1/content`

Public read API for CMS-managed content. All routes require `authenticate` (any role).

### GET /content/announcements

Returns active, non-expired announcements for dashboard display. Filters by `is_active = true`, `published_at <= now`, and `expires_at > now`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> inline handler

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "System Maintenance Scheduled",
      "body": "SSP will be unavailable on March 25...",
      "is_active": true,
      "published_at": "2026-03-20T00:00:00.000Z",
      "expires_at": "2026-03-26T00:00:00.000Z",
      "created_at": "2026-03-18T00:00:00.000Z"
    }
  ]
}
```

---

### GET /content/help/:slug

Returns a single help article by its URL slug.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> inline handler

**Path Parameters:**

| Parameter | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `slug`    | string | Yes      | URL-friendly slug  |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "slug": "how-to-submit-case",
    "title": "How to Submit a Case for QA Review",
    "body": "Step-by-step instructions...",
    "created_at": "2026-01-15T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code        | Condition               |
|--------|-------------|-------------------------|
| 404    | `NOT_FOUND` | Help article not found  |

---

### GET /content/alerts

Returns active system alerts within their time window. Filters by `is_active = true`, `starts_at <= now`, and `ends_at > now`.

- **Auth:** `authenticate`
- **Middleware:** `authenticate` -> inline handler

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Elevated Threat Level",
      "message": "All facilities are at elevated security posture.",
      "severity": "WARNING",
      "is_active": true,
      "starts_at": "2026-03-22T00:00:00.000Z",
      "ends_at": "2026-03-30T00:00:00.000Z",
      "created_at": "2026-03-22T00:00:00.000Z"
    }
  ]
}
```

---

## 14. CMS Proxy

Base path: `/cms`

Admin-only reverse proxy to the Payload CMS instance. Proxies all HTTP methods and WebSocket connections.

- **Auth:** `requireAdmin` (JWT + `role === 'ADMIN'`)
- **Target:** `$PAYLOAD_URL` (default: `http://localhost:3002`)
- **Proxy options:** `changeOrigin: true`, `ws: true`
- **Security:** Helmet CSP is disabled for `/cms` routes to allow Payload's admin UI scripts/styles.

All requests to `/cms/*` are forwarded directly to the Payload CMS backend. This includes the Payload admin panel, API routes, and media endpoints.

**Error Responses:**

| Status | Code           | Condition                |
|--------|----------------|--------------------------|
| 401    | `UNAUTHORIZED` | Missing/invalid token    |
| 401    | `TOKEN_EXPIRED`| JWT expired              |
| 401    | `INVALID_TOKEN`| Malformed JWT            |
| 403    | `FORBIDDEN`    | User role is not `ADMIN` |

---

## Health Check

### GET /api/v1/health

Simple health check endpoint. No authentication required.

**Success Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-03-23T14:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```
