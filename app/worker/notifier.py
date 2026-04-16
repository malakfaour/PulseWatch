from __future__ import annotations

import asyncio
import logging
import os
import smtplib
import urllib.request
from email.message import EmailMessage
from typing import Any

logger = logging.getLogger(__name__)


def _smtp_settings() -> dict[str, Any] | None:
    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT")
    sender = os.getenv("ALERT_FROM_EMAIL")
    recipient = os.getenv("ALERT_TO_EMAIL")

    if not all([host, port, sender, recipient]):
        return None

    return {
        "host": host,
        "port": int(port),
        "sender": sender,
        "recipient": recipient,
        "username": os.getenv("SMTP_USERNAME"),
        "password": os.getenv("SMTP_PASSWORD"),
        "use_tls": os.getenv("SMTP_USE_TLS", "true").lower() == "true",
    }


def _send_email_notification_sync(
    *,
    subject: str,
    body: str,
    metadata: dict[str, Any],
) -> None:
    settings = _smtp_settings()
    if settings is None:
        logger.info(
            "Alert notification logged",
            extra={
                "event": "alert_notification",
                "channel": "log",
                **metadata,
            },
        )
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings["sender"]
    message["To"] = settings["recipient"]
    message.set_content(body)

    with smtplib.SMTP(settings["host"], settings["port"]) as smtp:
        if settings["use_tls"]:
            smtp.starttls()
        if settings["username"] and settings["password"]:
            smtp.login(settings["username"], settings["password"])
        smtp.send_message(message)

    logger.info(
        "Alert notification sent",
        extra={
            "event": "alert_notification",
            "channel": "email",
            "recipient": settings["recipient"],
            **metadata,
        },
    )


def _send_slack_notification_sync(
    *,
    subject: str,
    body: str,
    metadata: dict[str, Any],
) -> None:
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook_url:
        return

    import json

    payload = json.dumps({"text": f"{subject}\n{body}"}).encode("utf-8")
    request = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10):
        pass

    logger.info(
        "Alert notification sent",
        extra={
            "event": "alert_notification",
            "channel": "slack",
            **metadata,
        },
    )


async def notify_alert_triggered(
    *,
    alert_id: str,
    endpoint_id: str,
    metric_id: str,
    alert_type: str,
    comparison: str,
    threshold: int,
    metric_value: int | float | None,
    message: str | None,
) -> None:
    subject = f"PulseWatch alert triggered: {alert_type}"
    body = "\n".join(
        [
            "An alert rule has been triggered.",
            f"Alert ID: {alert_id}",
            f"Endpoint ID: {endpoint_id}",
            f"Metric ID: {metric_id}",
            f"Type: {alert_type}",
            f"Condition: value {comparison} {threshold}",
            f"Observed value: {metric_value}",
            f"Message: {message or 'No custom message'}",
        ]
    )
    metadata = {
        "alert_id": alert_id,
        "endpoint_id": endpoint_id,
        "metric_id": metric_id,
        "alert_type": alert_type,
        "comparison": comparison,
        "threshold": threshold,
        "metric_value": metric_value,
    }
    try:
        await asyncio.to_thread(
            _send_email_notification_sync,
            subject=subject,
            body=body,
            metadata=metadata,
        )
        await asyncio.to_thread(
            _send_slack_notification_sync,
            subject=subject,
            body=body,
            metadata=metadata,
        )
    except Exception:
        logger.exception(
            "Alert notification failed",
            extra={
                "event": "alert_notification_error",
                **metadata,
            },
        )
