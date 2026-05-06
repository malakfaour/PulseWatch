# PulseWatch

> API uptime and performance monitoring with a FastAPI backend, background checks, alerting, and a React dashboard.

PulseWatch is a full-stack monitoring platform for tracking the health of external services. It records uptime, latency, status codes, and alert activity, then surfaces that data through a secure API and a lightweight frontend dashboard.

## Overview

PulseWatch helps teams monitor APIs and endpoints from a single place. The backend exposes authenticated endpoints for dashboards, alerts, metrics, and exports, while background jobs continuously run health checks and evaluate alert conditions.

## Features

- `Endpoint monitoring` for uptime, latency, and HTTP status tracking
- `Alert lifecycle management` with trigger and resolve behavior
- `Background workers` for recurring health checks and alert evaluation
- `JWT authentication` for protected routes
- `Dashboard and exports` for operational visibility and reporting
- `Structured middleware` for logging, auth handling, and rate limiting
- `React frontend` for dashboards, endpoint views, alerts, and settings
- `Docker support` for local database and containerized services

## Architecture

```text
React Frontend
      |
      v
FastAPI API
      |
      v
Worker Scheduler
      |
      v
PostgreSQL / SQLite (tests)
```

- The `frontend` calls the FastAPI backend over HTTP.
- The `API` handles authentication, endpoint management, metrics, alerts, dashboard data, and exports.
- The `worker layer` performs scheduled health checks and alert evaluation.
- The `database` stores users, endpoints, alerts, and collected metrics.

## Tech Stack

- `Frontend:` React, Vite, Axios
- `Backend:` FastAPI, Uvicorn, SQLAlchemy
- `Background jobs:` asyncio-based scheduler
- `Database:` PostgreSQL for local/dev, SQLite for tests
- `Infra:` Docker Compose, AWS starter templates
- `Testing:` Pytest

## Project Structure

```text
app/
  api/         FastAPI routers, schemas, dependencies, middleware
  core/        Settings, database setup, logging, security, exceptions
  models/      SQLAlchemy models
  services/    Business logic and data access
  worker/      Health checks, alert evaluation, scheduler, exports
frontend/      React + Vite application
scripts/       Utility scripts for worker startup, seeding, and admin setup
tests/         Unit and integration tests
infra/         Docker and AWS deployment scaffolding
migrations/    Alembic configuration and schema history
```

## Setup

### 1. Clone and configure environment

```powershell
git clone https://github.com/malakfaour/pulsewatch.git
cd PulseWatch
Copy-Item .env.example .env
```

Update `.env` as needed. By default, the template is configured for a local PostgreSQL container.

### 2. Install backend dependencies

```powershell
venv\Scripts\python -m pip install -r requirements-dev.txt
```

If you do not already have a virtual environment:

```powershell
python -m venv venv
venv\Scripts\activate
venv\Scripts\python -m pip install -r requirements-dev.txt
```

### 3. Start the database

```powershell
docker compose up -d db
```

### 4. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

## Run Locally

### Backend API

```powershell
venv\Scripts\python -m uvicorn app.api.main:app --reload
```

The API starts on `http://127.0.0.1:8000`.

Note: the API starts the scheduler automatically when `ENABLE_SCHEDULER=true` in `.env`.

### Frontend

```powershell
cd frontend
npm run dev
```

The frontend runs on Vite's local dev server and talks to the API at `http://127.0.0.1:8000` by default.

### Optional dedicated worker

If you want to run the worker as a separate process, disable the API scheduler first:

```powershell
$env:ENABLE_SCHEDULER="false"
venv\Scripts\python -m uvicorn app.api.main:app --reload
```

Then, in another terminal:

```powershell
venv\Scripts\python scripts\run_worker.py
```

## Testing

Run the backend test suite:

```powershell
venv\Scripts\python -m pytest
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Tests use a SQLite database and disable the scheduler automatically through the test configuration.

## API Docs

Interactive API documentation is available once the backend is running:

- `Swagger UI:` `http://127.0.0.1:8000/docs`
- `ReDoc:` `http://127.0.0.1:8000/redoc`

## Future Improvements

- Add richer notification integrations and delivery retries
- Expand observability with historical trends and anomaly detection
- Introduce frontend test coverage and end-to-end test automation
- Support multi-environment monitoring and tenant separation
- Add production deployment automation for cloud infrastructure

## License

This project is provided for educational and portfolio use unless a separate license is added.
