# URSA SSP Vercel Build — Security Support Platform

## Overview
3-tier SaaS case management application for the Department of War (DoW).
Personnel security domain with complex interactive workflows.
**Vercel deployment variant** — frontend hosted on Vercel, AWS-only infrastructure.

## Architecture
```
SSP-Vercel-Build/
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
│   │   ├── rag-framework/     # RAG pipelines, embeddings, vector search
│   │   ├── data-layer/        # Data layer design & optimization
│   │   ├── devops/            # CI/CD, containers, monitoring, secrets
│   │   └── iac-terraform/     # Terraform IaC, modules
│   ├── agents/                # Feature-specific subagents
│   │   ├── case-workflow.md       # Case CRUD, state machine, SLA, wizard
│   │   ├── document-extraction.md # Upload, AI extraction, MongoDB refs
│   │   ├── fcl-travel-violations.md # FCL, foreign travel, violations
│   │   ├── policy-qa.md          # Policy library, editor, QA queue
│   │   ├── metrics-reporting.md  # Dashboard, metrics, reports, audit log
│   │   ├── ai-rag-architect.md   # AI/RAG pipelines, embeddings, guardrails
│   │   ├── security-reviewer.md  # Cross-cutting: security & compliance
│   │   ├── cloud-architect.md    # Cross-cutting: AWS infra
│   │   └── devops-engineer.md    # Cross-cutting: CI/CD, containers
│   └── rules/                 # Path-specific rules
│       ├── frontend.md
│       ├── backend.md
│       └── database.md
├── frontend/                  # Tier 1 — React SPA (Vercel-hosted)
├── backend/                   # Tier 2 — Node.js/Express API
├── database/                  # Tier 3 — PostgreSQL
├── infrastructure/            # AWS-only IaC
│   └── aws/
├── docs/
└── CLAUDE.md
```

## Vercel-Specific
- Frontend deployed via Vercel (config: `frontend/vercel.json`)
- Production env: `frontend/.env.production`
- Ignore rules: `frontend/.vercelignore`
- No Azure/GCP infrastructure in this variant — AWS only
- GitHub repo: https://github.com/URSA-Dev/SSP-Vercel-Build (public)

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

## Workflow Patterns

### Phase-Gated Plans
- Use `/phased-plan` command for any multi-step feature
- Each phase has a verification gate — do not proceed until it passes
- Maximum 4 phases per feature to keep scope manageable

### Cross-Model Review
- Use `/cross-review` to generate a review package after significant changes
- Send to a fresh Claude context, Codex, or GPT-4 for independent review
- Fresh context catches bugs the original agent misses

### Background Tasks
- Run `npm run dev` as a background task while debugging against the running server
- Use background agents for parallel research while building

### Screenshot Debugging
- When UI bugs are hard to describe, take a screenshot and share it
- Claude can analyze images directly — faster than describing layout issues

### Git Worktrees
- Use worktrees for parallel feature development (e.g., UI fixes + API changes)
- Each worktree gets its own branch and working directory
- Prevents context-switching overhead between features

### Side Chains (/btw)
- Use `/btw` to ask questions or make notes while Claude works on a long task
- Side chains don't interrupt the main task flow

### Recurring Tasks (/loop)
- Schedule recurring checks: test runs, security scans, doc staleness
- Runs for up to 3 days — useful for overnight CI monitoring

### Agent Selection Guide
- **Feature work**: Use feature-specific agents (case-workflow, document-extraction, etc.)
- **Repeatable workflows**: Use commands (review, test-all, phased-plan, cross-review)
- **Reusable capabilities**: Use skills (testing, deploy, security-scan)
- **Small/simple tasks**: Skip agents — vanilla Claude Code is faster

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
- GitHub: https://github.com/URSA-Dev/SSP-Vercel-Build
- This is the reference UI — all components should match this design

## Deployment Strategy
- Frontend: Vercel (auto-deploy from main branch)
- Backend: AWS ECS Fargate
- Database: AWS RDS PostgreSQL
- Infrastructure: Terraform (AWS only)
