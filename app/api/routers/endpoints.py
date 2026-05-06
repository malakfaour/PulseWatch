from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.schemas.endpoint import (
    EndpointCreate,
    EndpointPageResponse,
    EndpointResponse,
    EndpointUpdate,
)
from app.core.database import get_db
from app.models.endpoint import Endpoint
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


@router.get("", response_model=EndpointPageResponse)
def list_endpoints(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, alias="pageSize", ge=1, le=100),
    db: Session = Depends(get_db),
) -> EndpointPageResponse:
    skip = (page - 1) * page_size
    items = list_endpoints_service(db, skip=skip, limit=page_size)
    total = db.query(Endpoint).count()
    total_pages = (total + page_size - 1) // page_size if total else 0
    return EndpointPageResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


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
