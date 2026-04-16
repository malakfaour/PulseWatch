from __future__ import annotations

import asyncio
import logging

logger = logging.getLogger(__name__)


class WorkerScheduler:
    def __init__(self) -> None:
        self._tasks: list[asyncio.Task[None]] = []

    async def start(self) -> None:
        if self._tasks:
            return

        from app.worker.alert_evaluator import run_alert_evaluator
        from app.worker.health_checker import run_health_checker

        self._tasks = [
            asyncio.create_task(
                run_health_checker(),
                name="pulsewatch-health-checker",
            ),
            asyncio.create_task(
                run_alert_evaluator(),
                name="pulsewatch-alert-evaluator",
            ),
        ]
        logger.info("Background scheduler started with %s tasks", len(self._tasks))

    async def stop(self) -> None:
        if not self._tasks:
            return

        tasks = list(self._tasks)
        self._tasks.clear()

        for task in tasks:
            task.cancel()

        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, Exception) and not isinstance(result, asyncio.CancelledError):
                logger.exception("Background task exited with an error", exc_info=result)

        logger.info("Background scheduler stopped")
