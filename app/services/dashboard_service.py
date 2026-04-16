from sqlalchemy import and_, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import raise_database_error
from app.models.alert import Alert
from app.models.endpoint import Endpoint
from app.models.metric import Metric


def get_dashboard_summary(db: Session) -> dict[str, int | float | None]:
    try:
        latest_metric_subquery = (
            db.query(
                Metric.endpoint_id.label("endpoint_id"),
                func.max(Metric.checked_at).label("latest_checked_at"),
            )
            .group_by(Metric.endpoint_id)
            .subquery()
        )

        latest_metrics_subquery = (
            db.query(
                Metric.endpoint_id.label("endpoint_id"),
                Metric.is_success.label("is_success"),
                Metric.response_time_ms.label("response_time_ms"),
            )
            .join(
                latest_metric_subquery,
                and_(
                    Metric.endpoint_id == latest_metric_subquery.c.endpoint_id,
                    Metric.checked_at == latest_metric_subquery.c.latest_checked_at,
                ),
            )
            .subquery()
        )

        total_endpoints = db.query(func.count(Endpoint.id)).scalar() or 0
        healthy_endpoints = (
            db.query(func.count(latest_metrics_subquery.c.endpoint_id))
            .filter(latest_metrics_subquery.c.is_success.is_(True))
            .scalar()
            or 0
        )
        active_alerts = (
            db.query(func.count(Alert.id))
            .filter(
                Alert.is_active.is_(True),
                Alert.resolved_at.is_(None),
            )
            .scalar()
            or 0
        )
        avg_response_time = db.query(
            func.avg(latest_metrics_subquery.c.response_time_ms)
        ).scalar()

        return {
            "total_endpoints": total_endpoints,
            "healthy_endpoints": healthy_endpoints,
            "unhealthy_endpoints": max(total_endpoints - healthy_endpoints, 0),
            "active_alerts": active_alerts,
            "avg_response_time": float(avg_response_time) if avg_response_time is not None else None,
        }
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to load dashboard summary", exc)
