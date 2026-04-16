from app.core.database import SessionLocal
from app.models.alert import Alert
from app.models.endpoint import Endpoint
from app.models.metric import Metric
from app.services.dashboard_service import get_dashboard_summary


def test_dashboard_summary_aggregates_current_state() -> None:
    db = SessionLocal()
    endpoint = Endpoint(
        name="Dashboard API",
        url="https://example.com/dashboard",
        method="GET",
        check_interval=30,
        is_active=True,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    db.add(
        Metric(
            endpoint_id=endpoint.id,
            response_time_ms=150,
            status_code=200,
            is_success=True,
        )
    )
    db.add(
        Alert(
            endpoint_id=endpoint.id,
            type="RESPONSE_TIME",
            comparison=">",
            threshold=100,
            message="Slow",
            resolved_at=None,
        )
    )
    db.commit()

    summary = get_dashboard_summary(db)
    assert summary["total_endpoints"] == 1
    assert summary["healthy_endpoints"] == 1
    assert summary["active_alerts"] == 1
    db.close()
