from __future__ import annotations

from app.core.database import SessionLocal
from app.models.alert import Alert
from app.models.endpoint import Endpoint


def main() -> None:
    db = SessionLocal()
    try:
        if db.query(Endpoint).count():
            print("Database already has endpoints. Skipping seed.")
            return

        endpoints = [
            Endpoint(name="GitHub API", url="https://api.github.com", method="GET", check_interval=60),
            Endpoint(name="HTTPBin GET", url="https://httpbin.org/get", method="GET", check_interval=90),
            Endpoint(name="HTTPBin POST", url="https://httpbin.org/post", method="POST", check_interval=120),
        ]
        db.add_all(endpoints)
        db.commit()

        alerts = [
            Alert(
                endpoint_id=endpoints[0].id,
                type="STATUS_CODE",
                comparison=">",
                threshold=299,
                message="GitHub API returned an unexpected status",
                resolved_at=None,
            ),
            Alert(
                endpoint_id=endpoints[1].id,
                type="RESPONSE_TIME",
                comparison=">",
                threshold=1000,
                message="HTTPBin GET is too slow",
                resolved_at=None,
            ),
        ]
        db.add_all(alerts)
        db.commit()
        print("Seed data inserted.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
