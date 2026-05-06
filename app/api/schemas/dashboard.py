from app.api.schemas import CamelModel


class DashboardSummaryResponse(CamelModel):
    total_endpoints: int
    healthy_endpoints: int
    unhealthy_endpoints: int
    active_alerts: int
    avg_response_time: float | None
