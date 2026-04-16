from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.models.endpoint import Endpoint
from app.models.metric import Metric


def test_metrics_filters_sorting_and_pagination(client, auth_headers) -> None:
    db = SessionLocal()
    endpoint = Endpoint(
        name="Metrics API",
        url="https://example.com/metrics",
        method="GET",
        check_interval=30,
        is_active=True,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    endpoint_id = endpoint.id

    now = datetime.utcnow()
    db.add_all(
        [
            Metric(endpoint_id=endpoint_id, response_time_ms=300, status_code=200, is_success=True, checked_at=now),
            Metric(endpoint_id=endpoint_id, response_time_ms=100, status_code=200, is_success=True, checked_at=now + timedelta(seconds=1)),
            Metric(endpoint_id=endpoint_id, response_time_ms=200, status_code=500, is_success=False, checked_at=now + timedelta(seconds=2)),
        ]
    )
    db.commit()
    db.close()

    response = client.get(
        f"/metrics/{endpoint_id}?limit=2&sort_by_response_time=asc",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["response_time_ms"] == 100
