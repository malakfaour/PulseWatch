from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.api.routers.alerts import router as alerts_router
from app.api.routers.auth import router as auth_router
from app.api.routers.dashboard import router as dashboard_router
from app.api.routers.endpoints import router as endpoints_router
from app.api.routers.exports import router as exports_router
from app.api.routers.health import router as health_router
from app.api.routers.metrics import router as metrics_router
from app.api.dependencies import get_current_user
from app.api.middleware.auth import AuthHeaderMiddleware
from app.api.middleware.logging import RequestLoggingMiddleware
from app.api.middleware.rate_limit import RateLimitMiddleware
from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.worker.scheduler import WorkerScheduler
import app.models

settings = get_settings()
configure_logging()
Base.metadata.create_all(bind=engine)

scheduler = WorkerScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.enable_scheduler:
        await scheduler.start()
    try:
        yield
    finally:
        if settings.enable_scheduler:
            await scheduler.stop()


app = FastAPI(title=settings.app_name, lifespan=lifespan)
register_exception_handlers(app)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthHeaderMiddleware)
app.include_router(auth_router)
app.include_router(alerts_router, dependencies=[Depends(get_current_user)])
app.include_router(dashboard_router, dependencies=[Depends(get_current_user)])
app.include_router(endpoints_router, dependencies=[Depends(get_current_user)])
app.include_router(exports_router, dependencies=[Depends(get_current_user)])
app.include_router(health_router)
app.include_router(metrics_router, dependencies=[Depends(get_current_user)])


@app.get("/")
def root():
    return {"message": "PulseWatch is running"}
