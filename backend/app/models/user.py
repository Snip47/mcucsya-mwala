from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    full_name       = Column(String(100), nullable=False)
    national_id     = Column(String(20), unique=True, index=True, nullable=False)
    phone           = Column(String(20), nullable=False)
    ward            = Column(String(50),  nullable=True)
    position        = Column(String(100), nullable=True)
    email           = Column(String(100), unique=True, nullable=True)
    password_hash   = Column(String(255), nullable=False)
    role            = Column(String(20),  default="member")
    status          = Column(String(20),  default="pending")
    profile_photo   = Column(String(500), nullable=True)
    bio             = Column(String(300), nullable=True)
    institution     = Column(String(200), nullable=True)
    course          = Column(String(200), nullable=True)
    year_of_study   = Column(String(20),  nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())