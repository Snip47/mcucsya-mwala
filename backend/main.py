from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api.auth_routes import router as auth_router
from app.api.routes import router as main_router
from app.api.admin_routes import router as admin_router
import app.models.user
import app.models.post
import app.models.bursary
import app.models.event
import app.models.message

Base.metadata.create_all(bind=engine)

def create_default_admin():
    from app.db.database import SessionLocal
    from app.models.user import User
    from app.services.auth import hash_password
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.national_id == "42671263").first()
        if not existing:
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
            print("Default admin created successfully")
        else:
            print(f"Admin already exists: {existing.full_name}")
    except Exception as e:
        print(f"Admin setup: {e}")
    finally:
        db.close()

create_default_admin()

app = FastAPI(
    title="MCUCSYA Mwala Chapter API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,  prefix="/api/auth",  tags=["Auth"])
app.include_router(main_router,  prefix="/api",       tags=["Main"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def root():
    return {"status": "MCUCSYA Mwala Chapter API running ✓"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)