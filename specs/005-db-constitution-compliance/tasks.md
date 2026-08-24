# Tasks: Database Constitution Compliance

**Input**: Design documents from /specs/005-db-constitution-compliance/
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Test tasks are included because the specification requires independent verification and suite-level validation against PostgreSQL.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

---

## Format: [ID] [P?] [Story?] Description

- [P]: Can run in parallel (different files, no blocking dependency)
- [US#]: User story label (present only in user story phases)
- All tasks include explicit file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare compliance validation artifacts and baseline files used by later phases.

- [X] T001 [P] Add database compliance validation checklist entries in specs/005-db-constitution-compliance/checklists/requirements.md
- [X] T002 [P] Add a backend startup prerequisite section for Docker PostgreSQL in specs/005-db-constitution-compliance/quickstart.md
- [X] T003 Verify PostgreSQL dependency remains present for runtime in backend/requirements.txt

**Checkpoint**: Setup documentation and dependency baseline are ready for implementation work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared guardrails required before user story implementation.

**CRITICAL**: User story implementation starts only after these guardrails exist.

- [X] T004 Add database engine policy constants and centralized validation logic in backend/config/settings.py
- [X] T005 [P] Extend ignore coverage for accidental local DB artifacts in .gitignore
- [X] T006 [P] Add shared tests package scaffold for database policy validation in backend/apps/common/tests/__init__.py

**Checkpoint**: Foundation is in place; user stories can proceed in priority order.

---

## Phase 3: User Story 1 - Enforce PostgreSQL as the Only Database (Priority: P1) 🎯 MVP

**Goal**: Backend startup defaults to PostgreSQL and refuses SQLite or unsupported engines with actionable errors.

**Independent Test**: Start backend with no DB engine override and verify PostgreSQL path is used; set DB_ENGINE to SQLite and verify startup aborts with ImproperlyConfigured.

### Tests for User Story 1

- [X] T007 [P] [US1] Add failing regression test for SQLite prohibition in backend/apps/common/tests/test_sqlite_engine_guard.py
- [X] T008 [P] [US1] Add failing regression test for unsupported DB_ENGINE handling in backend/apps/common/tests/test_unsupported_engine_guard.py

### Implementation for User Story 1

- [X] T009 [US1] Set PostgreSQL as default DB engine and remove SQLite fallback path in backend/config/settings.py
- [X] T010 [US1] Raise ImproperlyConfigured when DB_ENGINE is SQLite in backend/config/settings.py
- [X] T011 [US1] Raise actionable ImproperlyConfigured errors for missing PostgreSQL credentials in backend/config/settings.py
- [X] T012 [US1] Add startup guidance message referencing Docker DB startup command in backend/config/settings.py

**Checkpoint**: US1 is independently testable and prevents non-compliant SQLite startup.

---

## Phase 4: User Story 2 - Provide a Developer Onboarding Environment File (Priority: P2)

**Goal**: Developers can copy an example env file and run backend with Docker PostgreSQL defaults.

**Independent Test**: Copy backend/.env.example to backend/.env, run Docker DB, and start backend without editing DB variables.

### Implementation for User Story 2

- [X] T013 [US2] Replace SQLite-oriented defaults with Docker PostgreSQL defaults in backend/.env.example
- [X] T014 [P] [US2] Add clear descriptions for required DB environment variables in backend/.env.example
- [X] T015 [US2] Ensure onboarding flow includes docker compose DB startup before backend run in specs/005-db-constitution-compliance/quickstart.md
- [X] T016 [US2] Add developer-facing note to frontend onboarding that backend requires PostgreSQL setup in frontend/README.md

**Checkpoint**: US2 onboarding flow is independently executable from documented files.

---

## Phase 5: User Story 3 - Remove the Committed SQLite Database File (Priority: P3)

**Goal**: SQLite database artifacts are not tracked in git and are prevented from future commits.

**Independent Test**: Verify backend/db.sqlite3 is untracked and no *.db or *.sqlite3 files appear in git status after local runs.

### Implementation for User Story 3

- [X] T017 [US3] Remove backend/db.sqlite3 from git tracking and keep local file ignored via .gitignore
- [X] T018 [P] [US3] Add explicit wildcard patterns for *.sqlite3 and *.db in .gitignore
- [X] T019 [US3] Add disposable-local-data guidance and verification command for SQLite artifacts in specs/005-db-constitution-compliance/quickstart.md

**Checkpoint**: US3 cleanup is complete and future SQLite artifacts are blocked from version control.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories and consistency cleanup.

- [X] T020 Run backend test suite and record compliance result notes in specs/005-db-constitution-compliance/checklists/requirements.md
- [X] T021 Run quickstart smoke steps and record outcomes in specs/005-db-constitution-compliance/checklists/requirements.md
- [X] T022 Perform final consistency pass for database policy wording in backend/config/settings.py, backend/.env.example, and specs/005-db-constitution-compliance/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Phase 1 and blocks all user stories
- User Stories (Phases 3-5): Depend on Foundational completion
- Polish (Phase 6): Depends on completion of selected user stories

### User Story Dependencies

- US1 (P1): Depends on Phase 2 only
- US2 (P2): Depends on Phase 2 only
- US3 (P3): Depends on Phase 2 only

### Suggested Story Completion Order

1. US1 (MVP, policy enforcement)
2. US2 (developer onboarding)
3. US3 (repository cleanup)

---

## Parallel Execution Examples

## Parallel Example: User Story 1

- Run T007 and T008 in parallel (backend/apps/common/tests/test_sqlite_engine_guard.py and backend/apps/common/tests/test_unsupported_engine_guard.py)

## Parallel Example: User Story 2

- Run T014 and T015 in parallel (backend/.env.example and specs/005-db-constitution-compliance/quickstart.md)

## Parallel Example: User Story 3

- Run T018 while preparing T017 command sequence (.gitignore updates are independent of index removal)

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2
2. Complete US1 (Phase 3)
3. Validate US1 independently before moving on

### Incremental Delivery

1. Deliver US1 to enforce constitution-critical runtime behavior
2. Deliver US2 to reduce onboarding friction and misconfiguration
3. Deliver US3 to finish repository hygiene and compliance hardening

### Team Parallelization

1. Team completes Setup and Foundational phases together
2. After Phase 2, one developer can execute US1 while another prepares US2 documentation updates
3. US3 cleanup can proceed once .gitignore policy is finalized

---

## Format Validation

- All tasks use markdown checkbox format: - [ ]
- Task IDs are sequential: T001-T022
- [P] markers are applied only to parallelizable tasks
- [US#] labels are present on user story phase tasks only
- Every task includes at least one explicit file path
