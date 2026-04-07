from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    method = Column(String, default="GET")
    check_interval = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow)

    metrics = relationship("Metric", back_populates="endpoint")
    alerts = relationship("Alert", back_populates="endpoint")


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id"))
    response_time_ms = Column(Integer)
    status_code = Column(Integer)
    is_success = Column(Boolean)
    checked_at = Column(DateTime, default=datetime.utcnow)

    endpoint = relationship("Endpoint", back_populates="metrics")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id"))
    type = Column(String)
    threshold = Column(Integer)
    triggered_at = Column(DateTime)
    resolved_at = Column(DateTime, nullable=True)

    endpoint = relationship("Endpoint", back_populates="alerts")
