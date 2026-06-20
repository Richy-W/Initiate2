# Research: Database Constitution Compliance

**Phase**: 0 — Outline & Research  
**Date**: 2026-06-11  
**Branch**: `005-db-constitution-compliance`

All findings are drawn from direct inspection of the repository. No external research required.

---

## Finding 1: Current SQLite Configuration in `settings.py`

**Decision**: Replace the SQLite default with PostgreSQL; add an `ImproperlyConfigured` guard that rejects SQLite at startup.

**Current state** (`backend/config/settings.py` lines 99–122):
```python
DB_ENGINE = config('DB_ENGINE', default='django.db.backends.sqlite3')
DB_NAME   = config('DB_NAME',   default='db.sqlite3')

if DB_ENGINE == 'django.db.backends.sqlite3':
    db_name_path = Path(DB_NAME)
    if not db_name_path.is_absolute():
        DB_NAME = BASE_DIR / db_name_path

DATABASES = {
    "default": { "ENGINE": DB_ENGINE, "NAME": DB_NAME }
}

if DB_ENGINE == 'django.db.backends.postgresql':
    DATABASES['default'].update({
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    })
```

**Problem**: When no env vars are set, Django starts with SQLite silently. Any developer who forgets to configure the environment will run against a file-based database with different concurrency, JSON, and constraint semantics than production PostgreSQL.

**Rationale for change**: Django's `ImproperlyConfigured` exception (from `django.core.exceptions`) is the idiomatic way to reject invalid configuration at startup. Raising it early prevents the application from ever reaching a state where SQLite-specific behaviour could mask bugs.

**Proposed approach**:
```python
from django.core.exceptions import ImproperlyConfigured

DB_ENGINE = config('DB_ENGINE', default='django.db.backends.postgresql')

_PROHIBITED_ENGINES = {'django.db.backends.sqlite3', 'django.db.backends.dummy'}
if DB_ENGINE in _PROHIBITED_ENGINES:
    raise ImproperlyConfigured(
        f"DB_ENGINE='{DB_ENGINE}' is prohibited by project constitution. "
        "Use 'django.db.backends.postgresql' and run `docker compose up -d db`."
    )

DATABASES = {
    "default": {
        "ENGINE": DB_ENGINE,
        "NAME": config('DB_NAME', default='dnd_db'),
        "USER": config('DB_USER', default='dnd_user'),
        "PASSWORD": config('DB_PASSWORD', default='dnd_password'),
        "HOST": config('DB_HOST', default='localhost'),
        "PORT": config('DB_PORT', default='5432'),
    }
}
```

**Alternatives considered**:
- *Warn instead of raise*: Rejected. A warning is ignorable. The constitution requires prohibition, not suggestion.
- *Use a separate `settings_dev.py`*: Rejected. Adds complexity with no benefit; the Docker Compose default credentials already solve the local dev problem.
- *CI-only enforcement*: Rejected. The constitution mandates all environments use PostgreSQL, not just CI.

---

## Finding 2: `.env.example` Actively Promotes SQLite

**Decision**: Update `backend/.env.example` to default to PostgreSQL with the Docker Compose credentials.

**Current state** (`backend/.env.example` lines 8–16):
```ini
# Database configuration (SQLite for development, PostgreSQL for production)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# PostgreSQL settings (uncomment for production)
# DB_ENGINE=django.db.backends.postgresql
...
```

**Problem**: This file explicitly recommends SQLite for development, directly contradicting the constitution. A developer who copies `.env.example → .env` will be in a non-compliant state immediately.

**Rationale**: The `.env.example` should pre-fill the Docker Compose values so that `cp .env.example .env` + `docker compose up -d db` = working PostgreSQL backend.

**Proposed approach**: Remove SQLite entries entirely. Set active defaults matching `docker-compose.yml` (`dnd_db`, `dnd_user`, `dnd_password`, host `localhost`, port `5432`).

**Alternatives considered**:
- *Keep SQLite as a commented alternative*: Rejected. Commenting it out but leaving it visible still normalises SQLite as an option.

---

## Finding 3: `backend/db.sqlite3` Is Tracked in Git

**Decision**: Run `git rm --cached backend/db.sqlite3` to remove the file from git tracking.

**Current state**: `git ls-files backend/db.sqlite3` returns a match — the file is tracked. The root `.gitignore` already contains `db.sqlite3`, meaning this was committed before the ignore rule was in place.

**Problem**: A tracked binary development database in the repository causes merge conflicts, exposes development data, signals that SQLite has been used, and creates unnecessary repository size growth.

**Rationale**: `git rm --cached` removes the file from the index without deleting it from the working tree. After the `.gitignore` entry is in place (already is), the file will no longer reappear in `git status`.

**Alternatives considered**:
- *Delete the file entirely*: Acceptable but unnecessary. `--cached` is the safer approach since the developer may want the file temporarily during transition.

---

## Finding 4: `.gitignore` Coverage

**Decision**: Verify `db.sqlite3` is present (it is) and add `*.db` as an additional safety pattern.

**Current state**: `.gitignore` contains `db.sqlite3` (line ~29) but not `*.db`. Django test runner can create `test_*.db` files depending on configuration.

**Rationale**: Adding `*.db` is a one-line addition that prevents any future `.db` file from being accidentally committed.

---

## Finding 5: Test Coverage for the Guard

**Decision**: Add a unit test that sets `DB_ENGINE` to `django.db.backends.sqlite3` in the environment and confirms `ImproperlyConfigured` is raised during settings evaluation.

**Rationale**: TDD gate (Constitution Principle II) applies here. The startup guard is the primary deliverable of Story 1 and must be independently testable.

**Approach**: Use Django's `override_settings` or a subprocess-based test that evaluates the settings module with a patched environment. The simpler approach is a direct unit test in `backend/apps/common/tests/` (or a new `backend/config/tests/`) that imports the settings check logic as a callable and asserts the exception.

---

## Summary of Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Default `DB_ENGINE` to `django.db.backends.postgresql`; raise `ImproperlyConfigured` for SQLite | Constitution prohibition; idiomatic Django error handling |
| 2 | Update `.env.example` to PostgreSQL/Docker Compose defaults only | Developer UX; eliminate misleading SQLite recommendation |
| 3 | `git rm --cached backend/db.sqlite3` | Remove committed binary from git history tracking |
| 4 | Add `*.db` to `.gitignore` | Prevent future accidental commits of test/temp databases |
| 5 | Add unit test for the SQLite startup guard | Constitution TDD gate compliance |
