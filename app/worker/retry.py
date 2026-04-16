from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


async def retry_async(
    operation: Callable[[], Awaitable[T]],
    *,
    attempts: int = 3,
    delay_seconds: float = 0.5,
    retry_exceptions: tuple[type[BaseException], ...] = (Exception,),
) -> T:
    last_error: BaseException | None = None

    for attempt in range(1, attempts + 1):
        try:
            return await operation()
        except retry_exceptions as exc:  # type: ignore[arg-type]
            last_error = exc
            if attempt == attempts:
                break
            await asyncio.sleep(delay_seconds * attempt)

    assert last_error is not None
    raise last_error
