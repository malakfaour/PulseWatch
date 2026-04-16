from __future__ import annotations

import logging
from pathlib import Path

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def upload_file_to_s3(file_path: Path, object_name: str | None = None) -> str | None:
    settings = get_settings()
    if not settings.aws_s3_bucket:
        return None

    try:
        import boto3  # type: ignore
    except ImportError:
        logger.warning(
            "Skipping S3 upload because boto3 is not installed",
            extra={"event": "s3_upload_skipped", "file_path": str(file_path)},
        )
        return None

    target_name = object_name or file_path.name
    client = boto3.client("s3", region_name=settings.aws_region)
    client.upload_file(str(file_path), settings.aws_s3_bucket, target_name)
    return f"s3://{settings.aws_s3_bucket}/{target_name}"
