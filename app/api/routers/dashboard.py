from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas.dashboard import DashboardSummaryResponse
from app.core.database import get_db
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardSummaryResponse)
def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummaryResponse:
    return DashboardSummaryResponse.model_validate(get_dashboard_summary(db))
