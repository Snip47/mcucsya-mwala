from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.services.auth import hash_password
import app.models.post
import app.models.bursary
import app.models.event
import app.models.message

Base.metadata.create_all(bind=engine)

db = SessionLocal()

existing = db.query(User).filter(User.national_id == "42671263").first()
if existing:
    db.delete(existing)
    db.commit()
    print("Old admin deleted")

admin = User(
    full_name     = "Dancan Kivului",
    national_id   = "42671263",
    phone         = "0742162276",
    ward          = "kibauni ward",
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