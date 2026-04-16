from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, func
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import SessionLocal
from app.core.exceptions import DatabaseOperationError
from app.models.alert import Alert
from app.models.metric import Metric
from app.worker.notifier import notify_alert_triggered

logger = logging.getLogger(__name__)

DEFAULT_EVALUATION_INTERVAL_SECONDS = 5.0


@dataclass(frozen=True)
class LatestMetricSnapshot:
    id: UUID
    endpoint_id: UUID
    response_time_ms: float | None
    status_code: int | None
    is_success: bool | None
    checked_at: datetime


def _compare_values(actual: int | float, comparison: str, threshold: int) -> bool:
    if comparison == ">":
        return actual > threshold
    if comparison == "<":
        return actual < threshold
    if comparison == "==":
        return actual == threshold
    raise ValueError(f"Unsupported comparison operator: {comparison}")


def _resolve_rule_value(rule: Alert, metric: LatestMetricSnapshot) -> int | float | None:
    if rule.type == "RESPONSE_TIME":
        return metric.response_time_ms
    if rule.type == "STATUS_CODE":
        return metric.status_code
    if rule.type == "DOWNTIME":
        if metric.is_success is None:
            return 1
        return 0 if metric.is_success else 1
    return None


def _load_latest_metrics() -> dict[UUID, LatestMetricSnapshot]:
    db = SessionLocal()
    try:
        try:
            latest_metric_subquery = (
                db.query(
                    Metric.endpoint_id.label("endpoint_id"),
                    func.max(Metric.checked_at).label("latest_checked_at"),
                )
                .group_by(Metric.endpoint_id)
                .subquery()
            )

            latest_metrics = (
                db.query(Metric)
                .join(
                    latest_metric_subquery,
                    and_(
                        Metric.endpoint_id == latest_metric_subquery.c.endpoint_id,
                        Metric.checked_at == latest_metric_subquery.c.latest_checked_at,
                    ),
                )
                .all()
            )

            return {
                metric.endpoint_id: LatestMetricSnapshot(
                    id=metric.id,
                    endpoint_id=metric.endpoint_id,
                    response_time_ms=metric.response_time_ms,
                    status_code=metric.status_code,
                    is_success=metric.is_success,
                    checked_at=metric.checked_at,
                )
                for metric in latest_metrics
            }
        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception(
                "Failed to load latest metrics",
                exc_info=exc,
                extra={
                    "event": "alert_evaluation_error",
                    "operation": "load_latest_metrics",
                },
            )
            raise DatabaseOperationError("Failed to load latest metrics") from exc
    finally:
        db.close()


def _evaluate_alert_rules() -> dict[str, object]:
    db = SessionLocal()
    triggered_notifications: list[dict[str, object]] = []
    resolved_count = 0

    try:
        try:
            latest_metrics = _load_latest_metrics()
            rules = (
                db.query(Alert)
                .filter(Alert.is_active.is_(True))
                .order_by(Alert.created_at.asc())
                .all()
            )

            now = datetime.utcnow()

            for rule in rules:
                latest_metric = latest_metrics.get(rule.endpoint_id)
                if latest_metric is None:
                    continue

                actual_value = _resolve_rule_value(rule, latest_metric)
                if actual_value is None:
                    continue

                condition_met = _compare_values(actual_value, rule.comparison, rule.threshold)
                is_currently_triggered = rule.resolved_at is None

                if condition_met and not is_currently_triggered:
                    rule.triggered_at = now
                    rule.resolved_at = None
                    triggered_notifications.append(
                        {
                            "alert_id": str(rule.id),
                            "endpoint_id": str(rule.endpoint_id),
                            "metric_id": str(latest_metric.id),
                            "alert_type": str(rule.type),
                            "comparison": rule.comparison,
                            "threshold": rule.threshold,
                            "metric_value": actual_value,
                            "message": rule.message,
                        }
                    )
                    logger.warning(
                        "Alert triggered",
                        extra={
                            "event": "alert_triggered",
                            "alert_id": str(rule.id),
                            "endpoint_id": str(rule.endpoint_id),
                            "metric_id": str(latest_metric.id),
                            "alert_type": str(rule.type),
                            "comparison": rule.comparison,
                            "threshold": rule.threshold,
                            "metric_value": actual_value,
                        },
                    )
                elif not condition_met and is_currently_triggered:
                    rule.resolved_at = now
                    resolved_count += 1
                    logger.info(
                        "Alert resolved",
                        extra={
                            "event": "alert_resolved",
                            "alert_id": str(rule.id),
                            "endpoint_id": str(rule.endpoint_id),
                            "metric_id": str(latest_metric.id),
                            "alert_type": str(rule.type),
                        },
                    )

            db.commit()
            return {
                "notifications": triggered_notifications,
                "triggered": len(triggered_notifications),
                "resolved": resolved_count,
            }
        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception(
                "Failed to evaluate alert rules",
                exc_info=exc,
                extra={
                    "event": "alert_evaluation_error",
                    "operation": "evaluate_rules",
                },
            )
            raise DatabaseOperationError("Failed to evaluate alert rules") from exc
    finally:
        db.close()


async def evaluate_alerts_once() -> dict[str, int]:
    result = await asyncio.to_thread(_evaluate_alert_rules)
    return {
        "triggered": int(result["triggered"]),
        "resolved": int(result["resolved"]),
    }


async def run_alert_evaluator(
    *,
    interval_seconds: float = DEFAULT_EVALUATION_INTERVAL_SECONDS,
) -> None:
    while True:
        result = await evaluate_and_notify_alerts_once()
        logger.info(
            "Alert evaluation cycle completed",
            extra={
                "event": "alert_evaluation_cycle",
                "triggered_count": result["triggered"],
                "resolved_count": result["resolved"],
            },
        )
        await asyncio.sleep(interval_seconds)


async def evaluate_and_notify_alerts_once() -> dict[str, int]:
    result = await asyncio.to_thread(_evaluate_alert_rules)
    for notification in result["notifications"]:
        await notify_alert_triggered(**notification)

    return {
        "triggered": int(result["triggered"]),
        "resolved": int(result["resolved"]),
    }
