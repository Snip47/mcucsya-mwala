from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.user import User
from app.services.auth import hash_password, verify_password, create_access_token, decode_token
from app.services.cloudinary_upload import upload_image

router = APIRouter()

MWALA_WARDS = [
    "Mwala Ward", "Mbiuni Ward", "Makutano Ward",
    "Kibauni Ward", "Wamunyu Ward", "Masii Ward"
]

@router.post("/register/member")
async def register_member(
    full_name:     str            = Form(...),
    national_id:   str            = Form(...),
    phone:         str            = Form(...),
    ward:          str            = Form(...),
    password:      str            = Form(...),
    institution:   Optional[str]  = Form(None),
    course:        Optional[str]  = Form(None),
    year_of_study: Optional[str]  = Form(None),
    profile_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.national_id == national_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this ID already exists.")
    if len(national_id) < 6 or len(national_id) > 9:
        raise HTTPException(status_code=400, detail="Please enter a valid ID number (6-9 digits)")

    photo_url = None
    if profile_photo and profile_photo.filename:
        contents  = await profile_photo.read()
        photo_url = upload_image(contents, folder="mcucsya/profiles")

    user = User(
        full_name     = full_name,
        national_id   = national_id,
        phone         = phone,
        ward          = ward,
        password_hash = hash_password(password),
        institution   = institution,
        course        = course,
        year_of_study = year_of_study if institution else None,
        role          = "member",
        status        = "approved",
        profile_photo = photo_url,
    )
    db.add(user)
    db.commit()
    return {"message": "Registration successful! You can now login.", "status": "approved"}

@router.post("/register/leader")
async def register_leader(
    full_name:     str            = Form(...),
    national_id:   str            = Form(...),
    phone:         str            = Form(...),
    ward:          str            = Form(...),
    position:      str            = Form(...),
    password:      str            = Form(...),
    profile_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.national_id == national_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this ID already exists.")
    if len(national_id) < 6 or len(national_id) > 9:
        raise HTTPException(status_code=400, detail="Please enter a valid ID number (6-9 digits)")

    photo_url = None
    if profile_photo and profile_photo.filename:
        contents  = await profile_photo.read()
        photo_url = upload_image(contents, folder="mcucsya/profiles")

    user = User(
        full_name     = full_name,
        national_id   = national_id,
        phone         = phone,
        ward          = ward,
        position      = position,
        password_hash = hash_password(password),
        role          = "leader",
        status        = "pending",
        profile_photo = photo_url,
    )
    db.add(user)
    db.commit()
    return {"message": "Registration submitted! Awaiting admin approval.", "status": "pending"}

@router.post("/register/mp")
async def register_mp(
    full_name:     str            = Form(...),
    national_id:   str            = Form(...),
    phone:         str            = Form(...),
    password:      str            = Form(...),
    profile_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.national_id == national_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this ID already exists.")
    if len(national_id) < 6 or len(national_id) > 9:
        raise HTTPException(status_code=400, detail="Please enter a valid ID number (6-9 digits)")

    photo_url = None
    if profile_photo and profile_photo.filename:
        contents  = await profile_photo.read()
        photo_url = upload_image(contents, folder="mcucsya/profiles")

    user = User(
        full_name     = full_name,
        national_id   = national_id,
        phone         = phone,
        ward          = "Mwala Constituency",
        password_hash = hash_password(password),
        role          = "mp",
        status        = "pending",
        profile_photo = photo_url,
    )
    db.add(user)
    db.commit()
    return {"message": "MP registration submitted! Awaiting admin approval.", "status": "pending"}

@router.post("/login")
def login(
    national_id: str = Form(...),
    password:    str = Form(...),
    role:        str = Form(...),
    db: Session      = Depends(get_db)
):
    user = db.query(User).filter(User.national_id == national_id).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid ID or password")
    if role == "admin" and user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not authorized as admin.")
    if user.role != role:
        raise HTTPException(status_code=403,
            detail=f"This account is registered as '{user.role}'. Please select '{user.role}' to login.")
    if user.status == "pending":
        raise HTTPException(status_code=403, detail="Your account is pending admin approval.")
    if user.status == "rejected":
        raise HTTPException(status_code=403, detail="Your account has been rejected. Contact admin.")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":            user.id,
            "full_name":     user.full_name,
            "national_id":   user.national_id,
            "role":          user.role,
            "status":        user.status,
            "ward":          user.ward,
            "position":      user.position,
            "profile_photo": user.profile_photo,
            "institution":   user.institution,
            "phone":         user.phone,
            "course":        user.course,
            "year_of_study": user.year_of_study,
        }
    }

@router.get("/validate")
def validate_token(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.status != "approved":
        raise HTTPException(status_code=403, detail="Account not approved")
    return {"valid": True, "role": user.role}

@router.put("/update-photo")
async def update_photo(
    profile_photo: UploadFile = File(...),
    authorization: str        = Header(...),
    db: Session               = Depends(get_db)
):
    token   = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    contents          = await profile_photo.read()
    photo_url         = upload_image(contents, folder="mcucsya/profiles")
    user.profile_photo = photo_url
    db.commit()
    return {"photo_url": photo_url}