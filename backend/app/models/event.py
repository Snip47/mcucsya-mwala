from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.database import Base

class Event(Base):
    __tablename__ = "events"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(200), nullable=False)
    description  = Column(Text, nullable=False)
    location     = Column(String(200))
    event_date   = Column(DateTime, nullable=False)
    image_url    = Column(String(500), nullable=True)
    author_id    = Column(Integer, ForeignKey("users.id"))
    author_name  = Column(String(100))
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id         = Column(Integer, primary_key=True, index=True)
    event_id   = Column(Integer, ForeignKey("events.id"))
    user_id    = Column(Integer, ForeignKey("users.id"))
    user_name  = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())