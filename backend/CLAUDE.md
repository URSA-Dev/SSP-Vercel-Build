# SSP Backend — Tier 2

## Stack
- Node.js with Express
- PostgreSQL via Knex.js
- JWT authentication
- Express middleware for auth, validation, audit logging
- Multer for file uploads
- Helmet + CORS for security headers

## Structure
```
backend/
├── src/
│   ├── routes/            # Express route handlers by resource
│   ├── controllers/       # Business logic
│   ├── models/            # Database queries via Knex
│   ├── middleware/         # Auth, validation, error handling, audit
│   ├── services/          # External integrations (AI extraction, etc.)
│   ├── utils/             # Helpers
│   └── app.js             # Express app setup
├── config/
├── tests/
├── package.json
└── .env.example
```

## API Design
- RESTful: /api/v1/<resource>
- Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Error format: { error: { code, message, details } }
- Pagination: ?page=1&limit=25
- Filtering: ?status=OPEN&priority=HIGH
- Audit trail middleware on all mutating endpoints
- Rate limiting on auth endpoints

## Key Endpoints
- /api/v1/auth — Login, session, user management
- /api/v1/cases — Case CRUD and workflow transitions
- /api/v1/documents — Upload, extraction, status tracking
- /api/v1/policies — Policy library and development
- /api/v1/fcl — Facility clearance tracking
- /api/v1/travel — Foreign travel records
- /api/v1/violations — Security violation management
- /api/v1/qa — QA queue and reviews
- /api/v1/metrics — Dashboard KPIs and analytics
- /api/v1/audit — Audit log queries
- /api/v1/notifications — User notifications
