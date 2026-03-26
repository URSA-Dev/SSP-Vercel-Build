# URSA SSP — Security Support Platform

## Overview
3-tier SaaS case management application for the Department of War (DoW).
Personnel security domain with complex interactive workflows.

## Architecture
```
SSP/
├── .claude/
│   ├── skills/                # Reusable workflow skills
│   │   ├── ui-design/         # World-class UI design review & fix
│   │   ├── code-review/       # Code quality review
│   │   ├── testing/           # Test generation & execution
│   │   ├── deploy/            # Deployment automation
│   │   ├── security-scan/     # Security vulnerability scanning
│   │   ├── db-migrate/        # Database migration management
│   │   ├── api-docs/          # API documentation generation
│   │   ├── performance-audit/ # Performance analysis
│   │   ├── cloud-deploy-aws/  # AWS deployment
│   │   ├── vercel-deploy/     # Vercel frontend deployment
│   │   ├── data-layer/        # Data layer design & optimization
│   │   ├── devops/            # CI/CD, containers, monitoring, secrets
│   │   └── iac-terraform/     # Terraform IaC, AWS modules
│   ├── agents/                # Specialized AI subagents
│   │   ├── security-reviewer.md
│   │   ├── code-reviewer.md
│   │   ├── db-architect.md
│   │   ├── cloud-architect.md
│   │   ├── qa-tester.md
│   │   └── ui-expert.md
│   └── rules/                 # Path-specific rules
│       ├── frontend.md
│       ├── backend.md
│       └── database.md
├── frontend/                  # Tier 1 — React SPA
├── backend/                   # Tier 2 — Node.js/Express API
├── database/                  # Tier 3 — PostgreSQL
├── infrastructure/            # AWS IaC (Terraform)
│   └── aws/                   # ECS, ALB, RDS, S3, VPC, IAM, Secrets
├── docs/
├── tasks/                     # Task tracking (todo.md, lessons.md)
└── CLAUDE.md
```

## Operational Rules

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake twice
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

### Task Management
1. **Plan First**: Write plan to tasks/todo.md with checkable items
2. **Verify Plans**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to tasks/todo.md
6. **Capture Lessons**: Update tasks/lessons.md after corrections

### Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.

## Design System
- Theme: Army Olive / DoW (primary: #4a5c2f)
- Font: Outfit (sans), JetBrains Mono (mono)
- Government-grade clean white aesthetic
- Responsive — mobile-first with sidebar navigation

## Modules
- Dashboard (KPIs, overdue tracking)
- Cases (CRUD, detail views, workflow state machine)
- New Case (multi-step wizard)
- AI Document Extraction
- Policy Library & Development
- FCL Tracker (Facility Clearance Level)
- Foreign Travel tracking
- Security Violations
- QA Queue
- Workload Board
- Metrics & Reports
- Audit Log
- Settings / Administration

## Conventions
- Use kebab-case for file names
- Use PascalCase for React components
- Use camelCase for JS variables and functions
- REST API routes: /api/v1/<resource>
- All dates in ISO 8601 format
- Audit trail on all state changes

## Source HTML Template
- Location: ~/Desktop/URSA SSP - Updated - 3-17-2026.html
- GitHub: https://github.com/URSA-Dev/SSP
- This is the reference UI — all components should match this design

## Infrastructure Strategy
- **Frontend:** Vercel (CDN, edge network, SPA hosting)
- **Backend:** AWS ECS Fargate behind ALB (HTTPS, auto-scaling 2-6 tasks)
- **Database:** AWS RDS PostgreSQL 15 (Multi-AZ, encrypted, 14-day backups)
- **Storage:** AWS S3 (document uploads, KMS encrypted)
- **Secrets:** AWS Secrets Manager (DB credentials, JWT secret)
- **Monitoring:** AWS CloudWatch (CPU, memory, 5xx, storage alarms → SNS)
- **IaC:** Terraform (infrastructure/aws/)
