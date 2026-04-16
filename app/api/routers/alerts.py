from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.schemas.alert import AlertCreate, AlertResponse, AlertUpdate
from app.core.database import get_db
from app.services.alert_service import (
    AlertNotFoundError,
    create_alert as create_alert_service,
    delete_alert as delete_alert_service,
    list_alerts as list_alerts_service,
    resolve_alert as resolve_alert_service,
    update_alert as update_alert_service,
)
from app.services.endpoint_service import EndpointNotFoundError

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(alert_in: AlertCreate, db: Session = Depends(get_db)) -> AlertResponse:
    try:
        return create_alert_service(db, alert_in)
    except EndpointNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("", response_model=list[AlertResponse])
def list_alerts(
    status_filter: str | None = Query(default=None, pattern="^(active|resolved)$"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[AlertResponse]:
    return list_alerts_service(
        db,
        status_filter=status_filter,
        skip=skip,
        limit=limit,
    )


@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: UUID,
    alert_in: AlertUpdate,
    db: Session = Depends(get_db),
) -> AlertResponse:
    try:
        return update_alert_service(db, alert_id, alert_in)
    except AlertNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(alert_id: UUID, db: Session = Depends(get_db)) -> AlertResponse:
    try:
        return resolve_alert_service(db, alert_id)
    except AlertNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(alert_id: UUID, db: Session = Depends(get_db)) -> Response:
    try:
        delete_alert_service(db, alert_id)
    except AlertNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
