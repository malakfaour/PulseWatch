from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str
    environment: str
    database_url: str
    jwt_secret_key: str
    jwt_expire_minutes: int
    rate_limit_requests: int
    rate_limit_window_seconds: int
    enable_scheduler: bool
    export_dir: Path
    smtp_host: str | None
    smtp_port: int | None
    smtp_username: str | None
    smtp_password: str | None
    smtp_use_tls: bool
    alert_from_email: str | None
    alert_to_email: str | None
    slack_webhook_url: str | None
    aws_region: str
    aws_s3_bucket: str | None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    export_dir = Path(os.getenv("EXPORT_DIR", "exports"))
    export_dir.mkdir(parents=True, exist_ok=True)

    smtp_port = os.getenv("SMTP_PORT")

    return Settings(
        app_name=os.getenv("APP_NAME", "PulseWatch"),
        environment=os.getenv("APP_ENV", "development"),
        database_url=os.getenv("DATABASE_URL", ""),
        jwt_secret_key=os.getenv("JWT_SECRET_KEY", "pulsewatch-dev-secret"),
        jwt_expire_minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "60")),
        rate_limit_requests=int(os.getenv("RATE_LIMIT_REQUESTS", "120")),
        rate_limit_window_seconds=int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60")),
        enable_scheduler=_as_bool(os.getenv("ENABLE_SCHEDULER"), True),
        export_dir=export_dir,
        smtp_host=os.getenv("SMTP_HOST"),
        smtp_port=int(smtp_port) if smtp_port else None,
        smtp_username=os.getenv("SMTP_USERNAME"),
        smtp_password=os.getenv("SMTP_PASSWORD"),
        smtp_use_tls=_as_bool(os.getenv("SMTP_USE_TLS"), True),
        alert_from_email=os.getenv("ALERT_FROM_EMAIL"),
        alert_to_email=os.getenv("ALERT_TO_EMAIL"),
        slack_webhook_url=os.getenv("SLACK_WEBHOOK_URL"),
        aws_region=os.getenv("AWS_REGION", "eu-central-1"),
        aws_s3_bucket=os.getenv("AWS_S3_BUCKET"),
    )
