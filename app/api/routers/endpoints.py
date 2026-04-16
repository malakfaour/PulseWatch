from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.schemas.endpoint import EndpointCreate, EndpointResponse, EndpointUpdate
from app.core.database import get_db
from app.services.endpoint_service import (
    EndpointNotFoundError,
    create_endpoint as create_endpoint_service,
    delete_endpoint as delete_endpoint_service,
    get_endpoint_by_id,
    list_endpoints as list_endpoints_service,
    update_endpoint as update_endpoint_service,
)

router = APIRouter(prefix="/endpoints", tags=["endpoints"])


@router.post("", response_model=EndpointResponse, status_code=status.HTTP_201_CREATED)
def create_endpoint(
    endpoint_in: EndpointCreate,
    db: Session = Depends(get_db),
) -> EndpointResponse:
    return create_endpoint_service(db, endpoint_in)


@router.get("", response_model=list[EndpointResponse])
def list_endpoints(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[EndpointResponse]:
    return list_endpoints_service(db, skip=skip, limit=limit)


@router.get("/{endpoint_id}", response_model=EndpointResponse)
def get_endpoint(endpoint_id: UUID, db: Session = Depends(get_db)) -> EndpointResponse:
    try:
        return get_endpoint_by_id(db, endpoint_id)
    except EndpointNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.put("/{endpoint_id}", response_model=EndpointResponse)
def update_endpoint(
    endpoint_id: UUID,
    endpoint_in: EndpointUpdate,
    db: Session = Depends(get_db),
) -> EndpointResponse:
    try:
        return update_endpoint_service(db, endpoint_id, endpoint_in)
    except EndpointNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete("/{endpoint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_endpoint(endpoint_id: UUID, db: Session = Depends(get_db)) -> Response:
    try:
        delete_endpoint_service(db, endpoint_id)
    except EndpointNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
