from datetime import datetime
from uuid import UUID

from sqlalchemy import asc, desc
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import raise_database_error
from app.models.metric import Metric
from app.services.endpoint_service import get_endpoint_by_id


def list_metrics(
    db: Session,
    endpoint_id: UUID | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    skip: int = 0,
    limit: int = 100,
    sort_by_response_time: str | None = None,
) -> list[Metric]:
    try:
        query = (
            db.query(Metric)
            .options(joinedload(Metric.endpoint))
        )

        if endpoint_id is not None:
            query = query.filter(Metric.endpoint_id == endpoint_id)

        if start_date is not None:
            query = query.filter(Metric.checked_at >= start_date)

        if end_date is not None:
            query = query.filter(Metric.checked_at <= end_date)

        if sort_by_response_time == "asc":
            query = query.order_by(asc(Metric.response_time_ms), desc(Metric.checked_at))
        elif sort_by_response_time == "desc":
            query = query.order_by(desc(Metric.response_time_ms), desc(Metric.checked_at))
        else:
            query = query.order_by(desc(Metric.checked_at))

        return query.offset(skip).limit(limit).all()
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to list metrics", exc)


def list_metrics_for_endpoint(
    db: Session,
    endpoint_id: UUID,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    skip: int = 0,
    limit: int = 100,
    sort_by_response_time: str | None = None,
) -> list[Metric]:
    get_endpoint_by_id(db, endpoint_id)
    return list_metrics(
        db,
        endpoint_id=endpoint_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
        sort_by_response_time=sort_by_response_time,
    )
