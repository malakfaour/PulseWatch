from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class DatabaseOperationError(Exception):
    def __init__(self, message: str = "Database operation failed") -> None:
        super().__init__(message)
        self.message = message


def raise_database_error(
    db: Session,
    message: str,
    exc: Exception,
) -> None:
    db.rollback()
    logger.exception(
        message,
        exc_info=exc,
        extra={
            "event": "database_error",
            "error_type": type(exc).__name__,
        },
    )
    raise DatabaseOperationError(message) from exc


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DatabaseOperationError)
    async def database_operation_exception_handler(
        request: Request,
        exc: DatabaseOperationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"detail": exc.message},
        )
