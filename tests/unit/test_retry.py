from __future__ import annotations

import asyncio

from app.worker.retry import retry_async


def test_retry_async_retries_until_success() -> None:
    attempts = {"count": 0}

    async def flaky_operation() -> str:
        attempts["count"] += 1
        if attempts["count"] < 3:
            raise ValueError("temporary")
        return "ok"

    result = asyncio.run(retry_async(flaky_operation, attempts=3, delay_seconds=0))

    assert result == "ok"
    assert attempts["count"] == 3
