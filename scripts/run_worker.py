import asyncio
import logging

from app.worker.scheduler import WorkerScheduler


async def _run() -> None:
    scheduler = WorkerScheduler()
    await scheduler.start()
    try:
        while True:
            await asyncio.sleep(3600)
    finally:
        await scheduler.stop()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    asyncio.run(_run())


if __name__ == "__main__":
    main()
