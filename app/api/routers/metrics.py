from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.schemas.metric import MetricResponse
from app.core.database import get_db
from app.services.endpoint_service import EndpointNotFoundError
from app.services.metric_service import (
    list_metrics as list_metrics_service,
    list_metrics_for_endpoint as list_metrics_for_endpoint_service,
)

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("", response_model=list[MetricResponse])
def list_metrics(
    endpoint_id: UUID | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    sort_by_response_time: str | None = Query(default=None, pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
) -> list[MetricResponse]:
    return list_metrics_service(
        db,
        endpoint_id=endpoint_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
        sort_by_response_time=sort_by_response_time,
    )


@router.get("/{endpoint_id}", response_model=list[MetricResponse])
def list_metrics_for_endpoint(
    endpoint_id: UUID,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    sort_by_response_time: str | None = Query(default=None, pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
) -> list[MetricResponse]:
    try:
        return list_metrics_for_endpoint_service(
            db,
            endpoint_id,
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=limit,
            sort_by_response_time=sort_by_response_time,
        )
    except EndpointNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
