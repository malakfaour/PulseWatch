from __future__ import annotations

import csv
import io
from pathlib import Path
from typing import Iterable

from app.core.config import get_settings


def build_csv_bytes(headers: list[str], rows: Iterable[Iterable[object]]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")


def save_export_file(filename: str, csv_bytes: bytes) -> Path:
    export_path = get_settings().export_dir / filename
    export_path.write_bytes(csv_bytes)
    return export_path
