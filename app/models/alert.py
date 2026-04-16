import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


AlertType = Enum(
    "STATUS_CODE",
    "RESPONSE_TIME",
    "DOWNTIME",
    name="alert_type"
)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    endpoint_id = Column(UUID(as_uuid=True), ForeignKey("endpoints.id"), index=True)

    type = Column(AlertType, nullable=False)
    comparison = Column(String)  # ">", "<", "=="
    threshold = Column(Integer)

    message = Column(String)

    is_active = Column(Boolean, default=True)

    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    endpoint = relationship("Endpoint", back_populates="alerts")