from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.db.database import Base

class BursaryApplication(Base):
    __tablename__ = "bursary_applications"

    id                  = Column(Integer, primary_key=True, index=True)
    applicant_id        = Column(Integer, ForeignKey("users.id"))
    applicant_name      = Column(String(100))
    national_id         = Column(String(20))
    phone               = Column(String(20))
    sub_location        = Column(String(50))
    institution         = Column(String(200))
    course              = Column(String(200))
    year_of_study       = Column(Integer)
    amount_requested    = Column(Float)
    reason              = Column(Text)
    document_url        = Column(String(500), nullable=True)
    status              = Column(String(20), default="pending")
    admin_notes         = Column(Text, nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

class BursaryAnnouncement(Base):
    __tablename__ = "bursary_announcements"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(200), nullable=False)
    content      = Column(Text, nullable=False)
    amount       = Column(Float, nullable=True)
    deadline     = Column(DateTime, nullable=True)
    author_id    = Column(Integer, ForeignKey("users.id"))
    author_name  = Column(String(100))
    image_url    = Column(String(500), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())