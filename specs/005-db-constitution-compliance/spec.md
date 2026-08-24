# Feature Specification: Database Constitution Compliance

**Feature Branch**: `005-db-constitution-compliance`  
**Created**: 2026-06-11  
**Status**: Draft  
**Input**: User description: "I want to ensure database compliance with the constitution."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enforce PostgreSQL as the Only Database (Priority: P1)

A developer clones the repository and attempts to start the backend outside of Docker without any database environment variables set. The system should refuse to start with SQLite and instead guide the developer to use the project-standard PostgreSQL setup.

**Why this priority**: The constitution explicitly prohibits SQLite due to concurrency limitations and behavioural differences that mask production bugs. Any developer running SQLite is working in a non-representative environment that can hide real defects. Eliminating the SQLite escape hatch is the single most important database compliance step.

**Independent Test**: Can be fully tested by starting the Django backend with no `.env` file present and verifying the application raises a clear configuration error rather than silently falling back to SQLite.

**Acceptance Scenarios**:

1. **Given** no `DB_ENGINE` environment variable is set, **When** the Django application starts, **Then** it defaults to PostgreSQL configuration (not SQLite) and fails with a clear, actionable error if PostgreSQL credentials are missing.
2. **Given** `DB_ENGINE=django.db.backends.sqlite3` is explicitly set, **When** the Django application starts, **Then** it raises an error stating SQLite is prohibited by project constitution and exits.
3. **Given** valid PostgreSQL credentials are set via environment variables, **When** the Django application starts, **Then** it connects to PostgreSQL successfully.

---

### User Story 2 - Provide a Developer Onboarding Environment File (Priority: P2)

A new developer joins the project and needs to understand what environment variables are required to run the backend against the Docker Compose PostgreSQL instance. There should be a documented `.env.example` file that pre-fills the correct values for the Docker Compose setup.

**Why this priority**: Without a reference environment file, developers either guess variable names, introduce SQLite by accident, or waste time reading Docker Compose config to reverse-engineer the expected values. This story removes that friction.

**Independent Test**: Can be fully tested by copying `.env.example` to `.env`, running `docker compose up -d db`, and confirming the backend starts and connects to PostgreSQL without any additional configuration.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** a developer copies `.env.example` to `.env` and starts the Docker Compose database, **Then** the backend connects to PostgreSQL without any manual variable editing.
2. **Given** the `.env.example` file, **When** it is reviewed, **Then** every required database environment variable is documented with a description and the expected value for the Docker Compose setup.
3. **Given** the `.env.example` file, **When** it is reviewed, **Then** no secret values (passwords, keys) are hard-coded with production values — only development defaults matching the Docker Compose configuration.

---

### User Story 3 - Remove the Committed SQLite Database File (Priority: P3)

The repository currently contains a committed `backend/db.sqlite3` file. This file should not exist in version control: it contains development data, can cause merge conflicts, and signals that SQLite has been used contrary to the constitution.

**Why this priority**: Removing the file is a cleanup step that confirms the shift to PostgreSQL is real and complete. It is lower priority than preventing future SQLite use but is required for full compliance.

**Independent Test**: Can be fully tested by verifying the file no longer appears in `git status` or `git ls-files` after the change.

**Acceptance Scenarios**:

1. **Given** the `backend/db.sqlite3` file is tracked in git, **When** this story is implemented, **Then** the file is removed from git tracking and added to `.gitignore`.
2. **Given** a developer runs the backend with PostgreSQL credentials, **When** they create data and stop the server, **Then** no `.db` or `.sqlite3` file is created in the repository.
3. **Given** the `.gitignore` is updated, **When** a developer accidentally runs SQLite locally, **Then** the resulting file is ignored by git and not committed.

---

### Edge Cases

- What happens when the Docker Compose PostgreSQL container is not running? The backend should fail with a clear connection error, not silently switch to SQLite.
- What happens when `DB_ENGINE` is set to an unsupported value? The application should reject it at startup with an actionable error message.
- What happens to existing data in `db.sqlite3` when the project migrates to PostgreSQL? The existing SQLite data is development-only and disposable; no migration of its content is required. A note in the README should confirm this.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Django settings MUST default to PostgreSQL as the database engine when no `DB_ENGINE` environment variable is provided.
- **FR-002**: The Django application MUST raise a startup error and refuse to run if the configured database engine is SQLite.
- **FR-003**: The Django application MUST raise a clear, actionable startup error if PostgreSQL connection credentials are missing or incomplete.
- **FR-004**: A `.env.example` file MUST exist at the repository root (or `backend/`) documenting all required database environment variables with their expected values for the Docker Compose development setup.
- **FR-005**: The `backend/db.sqlite3` file MUST be removed from git tracking and added to `.gitignore`.
- **FR-006**: Any `*.sqlite3` and `*.db` file patterns MUST be listed in `.gitignore` to prevent future accidental commits.
- **FR-007**: The project README or onboarding documentation MUST include a step confirming that `docker compose up -d db` is required before starting the backend.

### Assumptions

- The existing `db.sqlite3` file contains only development data and can be discarded without data migration.
- The Docker Compose configuration (`docker/docker-compose.yml`) already provides a fully functional PostgreSQL container — no changes to it are required.
- `psycopg2-binary` is already listed in `requirements.txt` — no new dependencies need to be introduced.
- All existing Django migrations are already compatible with PostgreSQL; any SQLite-specific migration patterns would be caught by running `migrate` against the Docker PostgreSQL instance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Starting the backend with no database environment variables set results in a startup failure with an error message identifying the missing PostgreSQL credentials — no silent fallback to SQLite occurs.
- **SC-002**: A developer following only the `.env.example` and Docker Compose instructions can have the backend running against PostgreSQL within 5 minutes of cloning the repository.
- **SC-003**: Zero `*.sqlite3` or `*.db` files appear in `git status` after the changes are applied.
- **SC-004**: All existing Django test suites pass when run against the Docker Compose PostgreSQL instance, confirming no SQLite-specific assumptions exist in the codebase.
- **SC-005**: A code review of `settings.py` shows no code path that permits SQLite as a valid runtime configuration.
