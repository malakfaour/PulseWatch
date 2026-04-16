from __future__ import annotations

from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.models.alert import Alert
from app.models.endpoint import Endpoint
from app.models.metric import Metric
from app.worker.alert_evaluator import evaluate_and_notify_alerts_once


def test_alert_evaluator_triggers_and_resolves() -> None:
    db = SessionLocal()
    endpoint = Endpoint(
        name="API",
        url="https://example.com",
        method="GET",
        check_interval=60,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    endpoint_id = endpoint.id

    alert = Alert(
        endpoint_id=endpoint_id,
        type="STATUS_CODE",
        comparison=">",
        threshold=299,
        message="bad status",
        resolved_at=datetime.utcnow(),
    )
    db.add(alert)
    db.add(
        Metric(
            endpoint_id=endpoint_id,
            response_time_ms=200,
            status_code=500,
            is_success=False,
            checked_at=datetime.utcnow(),
        )
    )
    db.commit()
    alert_id = alert.id
    db.close()

    result = __import__("asyncio").run(evaluate_and_notify_alerts_once())
    assert result["triggered"] == 1

    db = SessionLocal()
    stored_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    assert stored_alert is not None
    assert stored_alert.resolved_at is None

    db.add(
        Metric(
            endpoint_id=endpoint_id,
            response_time_ms=120,
            status_code=200,
            is_success=True,
            checked_at=datetime.utcnow() + timedelta(seconds=1),
        )
    )
    db.commit()
    db.close()

    result = __import__("asyncio").run(evaluate_and_notify_alerts_once())
    assert result["resolved"] == 1
