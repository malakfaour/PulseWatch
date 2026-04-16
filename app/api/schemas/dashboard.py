from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_endpoints: int
    healthy_endpoints: int
    unhealthy_endpoints: int
    active_alerts: int
    avg_response_time: float | None
