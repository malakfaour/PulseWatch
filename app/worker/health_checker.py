from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from time import perf_counter
from uuid import UUID

import httpx
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import SessionLocal
from app.core.exceptions import DatabaseOperationError
from app.models.endpoint import Endpoint
from app.models.metric import Metric
from app.worker.retry import retry_async

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 10.0
DEFAULT_POLL_INTERVAL_SECONDS = 1.0


@dataclass(frozen=True)
class EndpointSnapshot:
    id: UUID
    url: str
    method: str
    check_interval: int


@dataclass(frozen=True)
class MetricPayload:
    endpoint_id: UUID
    response_time_ms: float
    status_code: int | None
    is_success: bool
    error_message: str | None


def _fetch_active_endpoints() -> list[EndpointSnapshot]:
    db = SessionLocal()
    try:
        try:
            endpoints = (
                db.query(Endpoint)
                .filter(Endpoint.is_active.is_(True))
                .order_by(Endpoint.created_at.asc())
                .all()
            )
            return [
                EndpointSnapshot(
                    id=endpoint.id,
                    url=endpoint.url,
                    method=endpoint.method.upper(),
                    check_interval=max(1, endpoint.check_interval),
                )
                for endpoint in endpoints
            ]
        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception(
                "Failed to fetch active endpoints",
                exc_info=exc,
                extra={
                    "event": "endpoint_check_error",
                    "operation": "fetch_active_endpoints",
                },
            )
            raise DatabaseOperationError("Failed to fetch active endpoints") from exc
    finally:
        db.close()


def _store_metric(payload: MetricPayload) -> None:
    db = SessionLocal()
    try:
        try:
            metric = Metric(
                endpoint_id=payload.endpoint_id,
                response_time_ms=payload.response_time_ms,
                status_code=payload.status_code,
                is_success=payload.is_success,
                error_message=payload.error_message,
            )
            db.add(metric)
            db.commit()
        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception(
                "Failed to store metric",
                exc_info=exc,
                extra={
                    "event": "endpoint_check_error",
                    "operation": "store_metric",
                    "endpoint_id": str(payload.endpoint_id),
                },
            )
            raise DatabaseOperationError("Failed to store metric") from exc
    finally:
        db.close()


async def check_endpoint(
    client: httpx.AsyncClient,
    endpoint: EndpointSnapshot,
) -> MetricPayload:
    started_at = perf_counter()

    try:
        response = await retry_async(
            lambda: client.request(endpoint.method, endpoint.url),
            attempts=3,
            delay_seconds=0.5,
            retry_exceptions=(httpx.HTTPError,),
        )
        duration_ms = (perf_counter() - started_at) * 1000
        payload = MetricPayload(
            endpoint_id=endpoint.id,
            response_time_ms=duration_ms,
            status_code=response.status_code,
            is_success=response.is_success,
            error_message=None if response.is_success else f"HTTP {response.status_code}",
        )
    except httpx.HTTPError as exc:
        duration_ms = (perf_counter() - started_at) * 1000
        logger.warning(
            "Endpoint request failed",
            extra={
                "event": "endpoint_check_error",
                "endpoint_id": str(endpoint.id),
                "url": endpoint.url,
                "method": endpoint.method,
                "error_type": type(exc).__name__,
                "error": str(exc),
                "response_time_ms": round(duration_ms, 2),
            },
        )
        payload = MetricPayload(
            endpoint_id=endpoint.id,
            response_time_ms=duration_ms,
            status_code=None,
            is_success=False,
            error_message=str(exc),
        )

    await asyncio.to_thread(_store_metric, payload)
    return payload


class HealthChecker:
    def __init__(
        self,
        *,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        poll_interval_seconds: float = DEFAULT_POLL_INTERVAL_SECONDS,
    ) -> None:
        self._timeout_seconds = timeout_seconds
        self._poll_interval_seconds = poll_interval_seconds
        self._next_run_by_endpoint: dict[UUID, float] = {}
        self._running_checks: set[UUID] = set()

    async def run(self) -> None:
        async with httpx.AsyncClient(
            timeout=self._timeout_seconds,
            follow_redirects=True,
        ) as client:
            while True:
                await self._schedule_due_checks(client)
                await asyncio.sleep(self._poll_interval_seconds)

    async def _schedule_due_checks(self, client: httpx.AsyncClient) -> None:
        endpoints = await asyncio.to_thread(_fetch_active_endpoints)
        now = asyncio.get_running_loop().time()
        active_ids = {endpoint.id for endpoint in endpoints}

        self._next_run_by_endpoint = {
            endpoint_id: next_run
            for endpoint_id, next_run in self._next_run_by_endpoint.items()
            if endpoint_id in active_ids
        }
        self._running_checks.intersection_update(active_ids)

        for endpoint in endpoints:
            if endpoint.id in self._running_checks:
                continue

            next_run = self._next_run_by_endpoint.get(endpoint.id, now)
            if now < next_run:
                continue

            self._next_run_by_endpoint[endpoint.id] = now + endpoint.check_interval
            self._running_checks.add(endpoint.id)
            task = asyncio.create_task(self._run_single_check(client, endpoint))
            task.add_done_callback(
                lambda completed_task, endpoint_id=endpoint.id: self._on_check_completed(
                    endpoint_id,
                    completed_task,
                )
            )

    def _on_check_completed(
        self,
        endpoint_id: UUID,
        task: asyncio.Task[None],
    ) -> None:
        self._running_checks.discard(endpoint_id)

        try:
            task.result()
        except Exception:
            logger.exception(
                "Health check failed",
                extra={
                    "event": "endpoint_check_error",
                    "endpoint_id": str(endpoint_id),
                },
            )

    async def _run_single_check(
        self,
        client: httpx.AsyncClient,
        endpoint: EndpointSnapshot,
    ) -> None:
        payload = await check_endpoint(client, endpoint)
        logger.info(
            "Endpoint check completed",
            extra={
                "event": "endpoint_checked",
                "endpoint_id": str(endpoint.id),
                "url": endpoint.url,
                "method": endpoint.method,
                "status_code": payload.status_code,
                "is_success": payload.is_success,
                "response_time_ms": round(payload.response_time_ms, 2),
                "error_message": payload.error_message,
            },
        )


async def run_health_checker(
    *,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    poll_interval_seconds: float = DEFAULT_POLL_INTERVAL_SECONDS,
) -> None:
    checker = HealthChecker(
        timeout_seconds=timeout_seconds,
        poll_interval_seconds=poll_interval_seconds,
    )
    await checker.run()
