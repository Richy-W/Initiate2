# Quickstart: Database Constitution Compliance

**Feature**: `005-db-constitution-compliance`  
**Branch**: `005-db-constitution-compliance`

## What This Feature Does

Enforces the project constitution's PostgreSQL-only mandate. After this feature is merged:

- The backend **will not start** if `DB_ENGINE` is set to SQLite (or omitted while the default was SQLite).
- `backend/.env.example` provides ready-to-use PostgreSQL credentials matching the Docker Compose setup.
- `backend/db.sqlite3` is no longer tracked in git.

---

## Developer Setup (After This Feature Merges)

### Prerequisites

- Docker Desktop installed and running
- `git` available on your PATH

### Backend Startup Prerequisite

Before running backend migrations or the backend server, start PostgreSQL from Docker Compose:

```bash
docker compose -f docker/docker-compose.yml up -d db
```

The backend is constitution-compliant only when using PostgreSQL. SQLite is intentionally blocked.

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd TavernKeeper

# 2. Copy the environment file
cp backend/.env.example backend/.env

# 3. Start the PostgreSQL database container
docker compose -f docker/docker-compose.yml up -d db

# 4. Install Python dependencies (inside your virtual environment)
pip install -r backend/requirements.txt

# 5. Run migrations
cd backend
python manage.py migrate

# 6. Start the development server
python manage.py runserver
```

The backend will be available at `http://localhost:8000`.

### If the Backend Refuses to Start

If you see:

```
django.core.exceptions.ImproperlyConfigured: DB_ENGINE='django.db.backends.sqlite3' is prohibited by project constitution.
```

**Fix**: Ensure `backend/.env` contains PostgreSQL configuration and the Docker Compose database is running:

```bash
docker compose -f docker/docker-compose.yml up -d db
```

If you see a PostgreSQL connection refused error, the `db` container is not running. Start it with the command above.

### Disposable Local SQLite Data Check

If SQLite files were created during local experimentation, confirm they are not tracked:

```bash
git status --short -- backend/*.db backend/*.sqlite3
```

The command should produce no tracked file entries after compliance changes.

---

## Environment Variables Reference

All required variables are documented in `backend/.env.example`. The table below describes each:

| Variable | Default (Docker Compose) | Description |
|----------|--------------------------|-------------|
| `DEBUG` | `True` | Django debug mode. Set `False` in production. |
| `SECRET_KEY` | `django-insecure-...` | Django secret key. Generate a secure value for production. |
| `DB_ENGINE` | `django.db.backends.postgresql` | Database engine. Only PostgreSQL is permitted. |
| `DB_NAME` | `dnd_db` | Database name. Matches the Docker Compose `POSTGRES_DB` value. |
| `DB_USER` | `dnd_user` | Database user. Matches the Docker Compose `POSTGRES_USER` value. |
| `DB_PASSWORD` | `dnd_password` | Database password. Matches the Docker Compose `POSTGRES_PASSWORD` value. |
| `DB_HOST` | `localhost` | Database host. Use `localhost` for Docker Desktop port-mapped access. |
| `DB_PORT` | `5432` | Database port. |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated list of allowed hosts. |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL for WebSocket channel layer. |

---

## What Changed From the Previous Setup

| Before | After |
|--------|-------|
| `DB_ENGINE` defaulted to SQLite when unset | `DB_ENGINE` defaults to PostgreSQL; startup fails if SQLite is configured |
| `.env.example` recommended SQLite for local dev | `.env.example` provides Docker Compose PostgreSQL values only |
| `backend/db.sqlite3` was tracked in git | File removed from git tracking; covered by `.gitignore` |

---

## Running Tests

```bash
# Ensure the db container is running first
docker compose -f docker/docker-compose.yml up -d db

cd backend
python manage.py test
```

Tests run against the PostgreSQL instance. SQLite is not used in any test environment.
