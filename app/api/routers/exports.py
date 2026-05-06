from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.alert import Alert
from app.models.endpoint import Endpoint
from app.models.metric import Metric
from app.services.s3_service import upload_file_to_s3
from app.worker.exporter import build_csv_bytes, save_export_file

router = APIRouter(prefix="/reports", tags=["exports"])


def _export_response(filename: str, csv_bytes: bytes) -> Response:
    export_path = save_export_file(filename, csv_bytes)
    upload_file_to_s3(export_path)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/endpoints.csv")
def export_endpoints(db: Session = Depends(get_db)) -> Response:
    endpoints = db.query(Endpoint).order_by(Endpoint.created_at.desc()).all()
    csv_bytes = build_csv_bytes(
        ["id", "name", "url", "method", "check_interval", "is_active", "created_at"],
        [
            [
                endpoint.id,
                endpoint.name,
                endpoint.url,
                endpoint.method,
                endpoint.check_interval,
                endpoint.is_active,
                endpoint.created_at,
            ]
            for endpoint in endpoints
        ],
    )
    return _export_response("endpoints.csv", csv_bytes)


@router.get("/metrics.csv")
def export_metrics(
    endpoint_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> Response:
    query = db.query(Metric).order_by(Metric.checked_at.desc())
    if endpoint_id:
        query = query.filter(Metric.endpoint_id == endpoint_id)
    metrics = query.all()
    csv_bytes = build_csv_bytes(
        ["id", "endpoint_id", "response_time_ms", "status_code", "is_success", "error_message", "checked_at"],
        [
            [
                metric.id,
                metric.endpoint_id,
                metric.response_time_ms,
                metric.status_code,
                metric.is_success,
                metric.error_message,
                metric.checked_at,
            ]
            for metric in metrics
        ],
    )
    return _export_response("metrics.csv", csv_bytes)


@router.get("/alerts.csv")
def export_alerts(
    resolved_only: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> Response:
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if resolved_only:
        query = query.filter(Alert.resolved_at.is_not(None))
    alerts = query.all()
    csv_bytes = build_csv_bytes(
        ["id", "endpoint_id", "type", "comparison", "threshold", "message", "is_active", "triggered_at", "resolved_at"],
        [
            [
                alert.id,
                alert.endpoint_id,
                alert.type,
                alert.comparison,
                alert.threshold,
                alert.message,
                alert.is_active,
                alert.triggered_at,
                alert.resolved_at,
            ]
            for alert in alerts
        ],
    )
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return _export_response(f"alerts-{timestamp}.csv", csv_bytes)
