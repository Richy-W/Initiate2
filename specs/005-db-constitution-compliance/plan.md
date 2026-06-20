# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

# Implementation Plan: Database Constitution Compliance

**Branch**: `005-db-constitution-compliance` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-db-constitution-compliance/spec.md`

## Summary

Enforce the constitution's PostgreSQL-only mandate by removing SQLite as a valid runtime configuration. Three concrete changes: (1) harden `backend/config/settings.py` to default to PostgreSQL and reject SQLite at startup, (2) update `backend/.env.example` to document Docker Compose PostgreSQL values rather than promoting SQLite, and (3) ensure `backend/db.sqlite3` is removed from git tracking (the `.gitignore` already lists it but the file was committed before the ignore rule took effect). No new dependencies, no schema changes, no new API endpoints.

## Technical Context

**Language/Version**: Python 3.11 / Django 4.2
**Primary Dependencies**: `django-decouple` (env var parsing, already in use), `psycopg2-binary` (already in `requirements.txt`)
**Storage**: PostgreSQL 14 — provided by Docker Compose (`docker/docker-compose.yml`)
**Testing**: Django test runner (`python manage.py test`) + existing pytest setup
**Target Platform**: Linux server (Docker) / Windows dev (Docker Desktop)
**Project Type**: Web service (Django REST Framework API + React SPA)
**Performance Goals**: N/A — this is a configuration-only change
**Constraints**: Must not break the existing Docker Compose workflow; `docker compose up -d db` remains the only prerequisite for local development
**Scale/Scope**: Single file change to `settings.py`, single file update to `.env.example`, one `git rm --cached` operation, `.gitignore` pattern addition

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **I. Bounded Module Design** | ✅ PASS | Changes confined to `backend/config/settings.py`. No cross-app imports introduced. |
| **II. TDD** | ✅ PASS | No business logic added. A smoke test confirming `DB_ENGINE=sqlite3` raises `ImproperlyConfigured` will be added. |
| **III. Technology Stack Compliance** | ✅ PASS | This change *enforces* the constitutionally required PostgreSQL stack. |
| **IV. SPA Design** | N/A | No frontend changes. |
| **V. Technology Review** | N/A | No new technologies introduced. |
| **VI. Accuracy / Intellectual Honesty** | ✅ PASS | Removes the misleading SQLite recommendation from `.env.example`. |
| **VII. API Integration / Data Consistency** | ✅ PASS | Enforcing a single database engine is a prerequisite for consistent data behaviour across environments. |

**Constitution Check Result**: All applicable gates PASS. No violations. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/005-db-constitution-compliance/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

> `data-model.md` and `contracts/` are omitted: no new entities and no new API endpoints.

### Source Code (affected files)

```text
backend/
├── config/
│   └── settings.py          ← MODIFY: remove SQLite default, add startup guard
├── .env.example             ← MODIFY: replace SQLite defaults with PostgreSQL/Docker values
└── db.sqlite3               ← REMOVE FROM GIT TRACKING (git rm --cached)

.gitignore                   ← VERIFY/UPDATE: db.sqlite3 already present; ensure *.db also covered
```

**Structure Decision**: Backend-only configuration change. No new files, no new directories, no frontend involvement.

## Complexity Tracking

*No constitution violations requiring justification.*

---

## Phase 0: Research

*All unknowns resolved from codebase inspection. See [research.md](research.md).*
