import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    endpoint_id = Column(UUID(as_uuid=True), ForeignKey("endpoints.id"), index=True)

    response_time_ms = Column(Float)
    status_code = Column(Integer)
    is_success = Column(Boolean)

    error_message = Column(String, nullable=True)

    checked_at = Column(DateTime, default=datetime.utcnow)

    endpoint = relationship("Endpoint", back_populates="metrics")