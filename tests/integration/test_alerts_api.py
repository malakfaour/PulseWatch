from app.core.database import SessionLocal
from app.models.endpoint import Endpoint


def test_alerts_filters_and_manual_resolve(client, auth_headers) -> None:
    db = SessionLocal()
    endpoint = Endpoint(
        name="Alerts API",
        url="https://example.com/alerts",
        method="GET",
        check_interval=30,
        is_active=True,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    db.close()

    create_response = client.post(
        "/alerts",
        headers=auth_headers,
        json={
            "endpoint_id": str(endpoint.id),
            "type": "STATUS_CODE",
            "comparison": ">",
            "threshold": 299,
            "message": "Bad status",
            "is_active": True,
        },
    )
    assert create_response.status_code == 201
    alert_id = create_response.json()["id"]

    resolved_response = client.get("/alerts?status_filter=resolved", headers=auth_headers)
    assert resolved_response.status_code == 200
    assert len(resolved_response.json()) == 1

    manual_resolve = client.patch(f"/alerts/{alert_id}/resolve", headers=auth_headers)
    assert manual_resolve.status_code == 200
