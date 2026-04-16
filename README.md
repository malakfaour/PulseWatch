# PulseWatch

PulseWatch is a cloud-ready API monitoring platform inspired by Datadog and New Relic. It tracks uptime, latency, status codes, and alert lifecycles for external services through a FastAPI backend, background workers, and a React dashboard.

## Features

- Endpoint registration, update, enable/disable, and pagination
- Background health checks with retry support
- Metric collection for latency, HTTP status, success rate, and failures
- Threshold-based alert evaluation with trigger and resolve lifecycle
- Notifications through email, Slack, or structured logs
- JWT authentication for protected APIs
- Dashboard summary API and CSV exports
- Structured logging, rate limiting, and request middleware
- React + Vite frontend for dashboard, endpoints, alerts, and settings
- Docker, AWS scaffolding, Alembic migration files, and CI workflow

## Project Layout

```text
app/
  api/            FastAPI routers, schemas, dependencies, middleware
  core/           config, database, security, logging, exceptions
  models/         SQLAlchemy models
  services/       business logic and data access
  worker/         scheduler, health checker, alerts, notifications, exports
frontend/         React + Vite dashboard
infra/            Docker and AWS deployment scaffolding
migrations/       Alembic configuration and initial migration
scripts/          utility scripts for worker startup, seeding, and superuser creation
tests/            unit and integration tests
```

## Local Setup

1. Copy the environment template:

```powershell
Copy-Item .env.example .env
```

2. Install Python dependencies:

```powershell
venv\Scripts\python -m pip install -r requirements-dev.txt
```

3. Install frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

4. Start the stack:

```powershell
docker compose up -d db
venv\Scripts\python -m uvicorn app.api.main:app --reload
```

5. In another terminal, start the frontend:

```powershell
cd frontend
npm run dev
```

## Useful Scripts

- `python scripts/create_superuser.py --email admin@example.com`
- `python scripts/seed_db.py`
- `python scripts/run_worker.py`

## API Highlights

- `POST /auth/register`
- `POST /auth/login`
- `GET /dashboard`
- `GET /health`
- `GET /exports/*.csv`
- `CRUD /endpoints`
- `Read /metrics`
- `CRUD /alerts`

## Testing

Run the backend test suite:

```powershell
pytest
```

Build the frontend:

```powershell
cd frontend
npm run build
```

## Deployment Notes

- `docker-compose.yml` runs the local app stack
- `infra/docker-compose.yml` and `infra/docker/` contain deployment-oriented containers
- `infra/aws/` contains starter IAM, S3, EC2, and security group definitions
- `.github/workflows/ci.yml` runs backend tests and frontend build checks
