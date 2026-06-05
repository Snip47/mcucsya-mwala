from fastapi import APIRouter, Depends, HTTPException, Header, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.user import User
from app.models.bursary import BursaryApplication
from app.services.auth import decode_token, hash_password

router = APIRouter()

def get_admin(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/pending")
def get_pending(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_admin(authorization, db)
    return db.query(User).filter(
        User.status == "pending",
        User.role.in_(["leader", "mp"])
    ).order_by(User.created_at.desc()).all()

@router.get("/all-members")
def get_all_members(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_admin(authorization, db)
    return db.query(User).filter(
        User.role != "admin"
    ).order_by(User.role, User.created_at.desc()).all()

@router.get("/admins")
def get_admins(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_admin(authorization, db)
    return db.query(User).filter(User.role == "admin").all()

@router.post("/add-admin")
def add_admin(
    full_name:   str = Form(...),
    national_id: str = Form(...),
    phone:       str = Form(...),
    password:    str = Form(...),
    db: Session      = Depends(get_db),
    authorization: str = Header(...)
):
    get_admin(authorization, db)
    existing = db.query(User).filter(User.national_id == national_id).first()
    if existing:
        if existing.role == "admin":
            raise HTTPException(status_code=400, detail="This person is already an admin")
        existing.role   = "admin"
        existing.status = "approved"
        db.commit()
        return {"message": f"{existing.full_name} promoted to admin"}

    new_admin = User(
        full_name     = full_name,
        national_id   = national_id,
        phone         = phone,
        ward          = "Mwala/Makutano",
        password_hash = hash_password(password),
        role          = "admin",
        status        = "approved",
    )
    db.add(new_admin)
    db.commit()
    return {"message": f"{full_name} added as admin successfully"}

@router.put("/approve/{user_id}")
def approve_user(user_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    get_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "approved"
    db.commit()
    return {"message": f"{user.full_name} approved as {user.role}"}

@router.put("/reject/{user_id}")
def reject_user(user_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    get_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "rejected"
    db.commit()
    return {"message": f"{user.full_name} rejected"}

@router.delete("/delete/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    admin = get_admin(authorization, db)
    user  = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    db.delete(user)
    db.commit()
    return {"message": f"{user.full_name} deleted successfully"}

@router.post("/add-member")
def add_member(
    full_name:   str            = Form(...),
    national_id: str            = Form(...),
    phone:       str            = Form(...),
    role:        str            = Form(...),
    ward:        Optional[str]  = Form(None),
    position:    Optional[str]  = Form(None),
    password:    str            = Form("mcucsya2025"),
    db: Session                 = Depends(get_db),
    authorization: str          = Header(...)
):
    get_admin(authorization, db)
    existing = db.query(User).filter(User.national_id == national_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this ID already exists")
    if role not in ["member", "leader", "mp", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = User(
        full_name     = full_name,
        national_id   = national_id,
        phone         = phone,
        ward          = ward or "Mwala/Makutano",
        position      = position,
        password_hash = hash_password(password),
        role          = role,
        status        = "approved",
    )
    db.add(user)
    db.commit()
    return {"message": f"{full_name} added as {role}. Default password: {password}"}

@router.get("/bursary-applications")
def get_bursary_applications(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_admin(authorization, db)
    return db.query(BursaryApplication).order_by(BursaryApplication.created_at.desc()).all()

@router.put("/bursary/{app_id}")
def update_bursary(
    app_id:      int,
    status:      str,
    admin_notes: str = "",
    db: Session      = Depends(get_db),
    authorization: str = Header(...)
):
    get_admin(authorization, db)
    app = db.query(BursaryApplication).filter(BursaryApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status      = status
    app.admin_notes = admin_notes
    db.commit()
    return {"message": f"Application {status}"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_admin(authorization, db)
    return {
        "total_members":     db.query(User).filter(User.role == "member",  User.status == "approved").count(),
        "total_leaders":     db.query(User).filter(User.role == "leader",  User.status == "approved").count(),
        "total_mp":          db.query(User).filter(User.role == "mp",      User.status == "approved").count(),
        "total_admins":      db.query(User).filter(User.role == "admin").count(),
        "pending_approvals": db.query(User).filter(User.status == "pending").count(),
        "pending_bursary":   db.query(BursaryApplication).filter(BursaryApplication.status == "pending").count(),
    }