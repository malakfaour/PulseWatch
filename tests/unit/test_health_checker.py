from __future__ import annotations

from app.core.database import SessionLocal
from app.models.endpoint import Endpoint
from app.models.metric import Metric
from app.worker.health_checker import MetricPayload, _fetch_active_endpoints, _store_metric


def test_fetch_active_endpoints_returns_only_enabled_rows() -> None:
    db = SessionLocal()
    db.add(
        Endpoint(
            name="API A",
            url="https://example.com/a",
            method="GET",
            check_interval=30,
            is_active=True,
        )
    )
    db.add(
        Endpoint(
            name="API B",
            url="https://example.com/b",
            method="GET",
            check_interval=30,
            is_active=False,
        )
    )
    db.commit()
    db.close()

    endpoints = _fetch_active_endpoints()
    assert len(endpoints) == 1
    assert endpoints[0].url == "https://example.com/a"


def test_store_metric_persists_metric_row() -> None:
    db = SessionLocal()
    endpoint = Endpoint(
        name="API A",
        url="https://example.com/a",
        method="GET",
        check_interval=30,
        is_active=True,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    db.close()

    _store_metric(
        MetricPayload(
            endpoint_id=endpoint.id,
            response_time_ms=123.4,
            status_code=200,
            is_success=True,
            error_message=None,
        )
    )

    db = SessionLocal()
    assert db.query(Metric).count() == 1
    db.close()
