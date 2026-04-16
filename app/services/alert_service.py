from datetime import datetime
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.api.schemas.alert import AlertCreate, AlertUpdate
from app.core.exceptions import raise_database_error
from app.models.alert import Alert
from app.services.endpoint_service import get_endpoint_by_id


class AlertNotFoundError(Exception):
    pass


def create_alert(db: Session, alert_in: AlertCreate) -> Alert:
    try:
        get_endpoint_by_id(db, alert_in.endpoint_id)

        alert = Alert(
            **alert_in.model_dump(),
            resolved_at=datetime.utcnow(),
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to create alert", exc)

def list_alerts(
    db: Session,
    status_filter: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Alert]:
    try:
        query = (
            db.query(Alert)
            .options(joinedload(Alert.endpoint))
            .order_by(Alert.created_at.desc())
        )

        if status_filter == "active":
            query = query.filter(Alert.resolved_at.is_(None))
        elif status_filter == "resolved":
            query = query.filter(Alert.resolved_at.is_not(None))

        return query.offset(skip).limit(limit).all()
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to list alerts", exc)


def get_alert_by_id(db: Session, alert_id: UUID) -> Alert:
    try:
        alert = (
            db.query(Alert)
            .options(joinedload(Alert.endpoint))
            .filter(Alert.id == alert_id)
            .first()
        )
        if alert is None:
            raise AlertNotFoundError("Alert not found")
        return alert
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to fetch alert", exc)


def update_alert(db: Session, alert_id: UUID, alert_in: AlertUpdate) -> Alert:
    try:
        alert = get_alert_by_id(db, alert_id)

        for field, value in alert_in.model_dump(exclude_unset=True).items():
            setattr(alert, field, value)

        db.commit()
        db.refresh(alert)
        return alert
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to update alert", exc)


def delete_alert(db: Session, alert_id: UUID) -> None:
    try:
        alert = get_alert_by_id(db, alert_id)
        db.delete(alert)
        db.commit()
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to delete alert", exc)


def resolve_alert(db: Session, alert_id: UUID) -> Alert:
    try:
        alert = get_alert_by_id(db, alert_id)
        if alert.resolved_at is None:
            alert.resolved_at = datetime.utcnow()
            db.commit()
            db.refresh(alert)
        return alert
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to resolve alert", exc)
