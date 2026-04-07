# PulseWatch

PulseWatch is a FastAPI backend for tracking monitored endpoints and storing uptime-style metrics and alerts in PostgreSQL.

## Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- Docker Compose

## Project Structure

```text
.
|-- backend/
|   |-- database.py
|   |-- main.py
|   |-- models.py
|   `-- .env.example
|-- docker-compose.yml
`-- README.md
```

## Requirements

- Python 3.11+
- Docker Desktop

## Environment Setup

Create an environment file from the example:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set `DATABASE_URL` in `backend/.env`:

```env
DATABASE_URL=postgresql://pulsewatch_user:securepassword@localhost:5432/pulsewatch
```

## Run Postgres With Docker

Start the database container:

```powershell
docker compose up -d
```

This starts PostgreSQL 16 with:

- Database: `pulsewatch`
- User: `pulsewatch_user`
- Port: `5432`

## Run The API Locally

From the project root:

```powershell
cd backend
..\venv\Scripts\python -m uvicorn main:app --reload
```

The API will be available at:

- App: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Current Data Model

The application defines three core tables:

- `endpoints`
- `metrics`
- `alerts`

Tables are created automatically on startup through SQLAlchemy metadata.

## Git Notes

Sensitive and local-only files are excluded from git, including:

- `venv/`
- `backend/.env`
- `__pycache__/`

## GitHub

The local repository is initialized and connected to:

`https://github.com/malakfaour/pulsewatch.git`

If the repository exists and your account has access, push with:

```powershell
git push -u origin main
```
