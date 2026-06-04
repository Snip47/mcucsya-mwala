from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.database import Base

class Post(Base):
    __tablename__ = "posts"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(200), nullable=False)
    content      = Column(Text, nullable=False)
    post_type    = Column(String(50), nullable=False)
    image_url    = Column(String(500), nullable=True)
    author_id    = Column(Integer, ForeignKey("users.id"))
    author_name  = Column(String(100))
    author_role  = Column(String(20))
    is_pinned    = Column(Boolean, default=False)
    views        = Column(Integer, default=0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())