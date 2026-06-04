from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.post import Post
from app.models.bursary import BursaryApplication, BursaryAnnouncement
from app.models.event import Event, EventRSVP
from app.models.message import ChatMessage
from app.services.auth import hash_password
import os

Base.metadata.create_all(bind=engine)

db = SessionLocal()

existing = db.query(User).filter(User.national_id == "42671263").first()
if existing:
    existing.role          = "admin"
    existing.status        = "approved"
    existing.password_hash = hash_password("admin123")
    db.commit()
    print(f"Admin updated: {existing.full_name}")
else:
    admin = User(
        full_name     = "Dancan Kivului",
        national_id   = "42671263",
        phone         = "0700000000",
        ward          = "Masii Ward",
        password_hash = hash_password("admin123"),
        role          = "admin",
        status        = "approved",
    )
    db.add(admin)
    db.commit()
    print("Admin created!")

print("National ID: 42671263")
print("Password: admin123")
db.close()