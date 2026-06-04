from app.db.database import SessionLocal
from app.models.user import User
from app.services.auth import hash_password
from sqlalchemy import select

db = SessionLocal()

try:
    admin = db.execute(
        select(User).where(User.national_id == "42671263")
    ).scalar_one_or_none()

    if admin:
        admin.full_name = "Dancan Kivului"
        admin.phone = "0742162276"
        admin.sub_location = "Kibauni"
        admin.password_hash = hash_password("admin123")
        admin.role = "admin"
        admin.status = "approved"
        print("Existing admin updated.")
    else:
        admin = User(
            full_name="Dancan Kivului",
            national_id="42671263",
            phone="0742162276",
            sub_location="Kibauni",
            password_hash=hash_password("admin123"),
            role="admin",
            status="approved",
        )
        db.add(admin)
        print("Admin created.")

    db.commit()
    print("National ID: 42671263")
    print("Password: admin123")

except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()