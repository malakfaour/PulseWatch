from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.schemas.endpoint import EndpointCreate, EndpointUpdate
from app.core.exceptions import raise_database_error
from app.models.endpoint import Endpoint


class EndpointNotFoundError(Exception):
    pass


def create_endpoint(db: Session, endpoint_in: EndpointCreate) -> Endpoint:
    try:
        endpoint_data = endpoint_in.model_dump()
        endpoint_data["url"] = str(endpoint_data["url"])
        endpoint = Endpoint(**endpoint_data)
        db.add(endpoint)
        db.commit()
        db.refresh(endpoint)
        return endpoint
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to create endpoint", exc)


def list_endpoints(db: Session, skip: int = 0, limit: int = 100) -> list[Endpoint]:
    try:
        return (
            db.query(Endpoint)
            .order_by(Endpoint.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to list endpoints", exc)


def get_endpoint_by_id(db: Session, endpoint_id: UUID) -> Endpoint:
    try:
        endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
        if endpoint is None:
            raise EndpointNotFoundError("Endpoint not found")
        return endpoint
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to fetch endpoint", exc)


def delete_endpoint(db: Session, endpoint_id: UUID) -> None:
    try:
        endpoint = get_endpoint_by_id(db, endpoint_id)
        db.delete(endpoint)
        db.commit()
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to delete endpoint", exc)


def update_endpoint(
    db: Session,
    endpoint_id: UUID,
    endpoint_in: EndpointUpdate,
) -> Endpoint:
    try:
        endpoint = get_endpoint_by_id(db, endpoint_id)
        endpoint_data = endpoint_in.model_dump()
        endpoint_data["url"] = str(endpoint_data["url"])

        for field, value in endpoint_data.items():
            setattr(endpoint, field, value)

        db.commit()
        db.refresh(endpoint)
        return endpoint
    except SQLAlchemyError as exc:
        raise_database_error(db, "Failed to update endpoint", exc)
