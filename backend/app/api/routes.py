from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.bursary import BursaryApplication, BursaryAnnouncement
from app.models.event import Event, EventRSVP
from app.services.auth import decode_token
from app.services.cloudinary_upload import upload_image, upload_document

router = APIRouter()

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token   = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.status != "approved":
        raise HTTPException(status_code=403, detail="Account not approved")
    return user

# ── Posts ──────────────────────────────────────────────
@router.get("/posts")
def get_posts(post_type: Optional[str] = None, db: Session = Depends(get_db), authorization: str = Header(...)):
    get_current_user(authorization, db)
    query = db.query(Post).order_by(Post.is_pinned.desc(), Post.created_at.desc())
    if post_type:
        query = query.filter(Post.post_type == post_type)
    return query.limit(100).all()

@router.post("/posts")
async def create_post(
    title:     str            = Form(...),
    content:   str            = Form(...),
    post_type: str            = Form(...),
    image:     Optional[UploadFile] = File(None),
    db: Session               = Depends(get_db),
    authorization: str        = Header(...)
):
    user = get_current_user(authorization, db)
    if user.role not in ["leader", "mp", "admin"]:
        raise HTTPException(status_code=403, detail="Only leaders and above can post")

    allowed = {
        "leader": ["announcement", "mentorship", "event_info"],
        "mp":     ["announcement", "county_program"],
        "admin":  ["announcement", "mentorship", "event_info", "county_program"]
    }
    if post_type not in allowed.get(user.role, []):
        raise HTTPException(status_code=403, detail=f"Your role cannot post this type")

    image_url = None
    if image and image.filename:
        contents  = await image.read()
        image_url = upload_image(contents, folder="mcucsya/posts")

    post = Post(
        title=title, content=content, post_type=post_type,
        image_url=image_url, author_id=user.id,
        author_name=user.full_name, author_role=user.role
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post
@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    user = get_current_user(authorization, db)
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(post)
    db.commit()
    return {"message": "Deleted"}

# ── Opportunities ──────────────────────────────────────
@router.get("/opportunities")
def get_opportunities(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_current_user(authorization, db)
    return db.query(Post).filter(
        Post.post_type == "opportunity"
    ).order_by(Post.created_at.desc()).all()

@router.post("/opportunities")
async def create_opportunity(
    title:      str            = Form(...),
    content:    str            = Form(...),
    opp_type:   str            = Form("job"),
    apply_link: Optional[str]  = Form(None),
    deadline:   Optional[str]  = Form(None),
    image:      Optional[UploadFile] = File(None),
    db: Session                = Depends(get_db),
    authorization: str         = Header(...)
):
    user = get_current_user(authorization, db)
    if user.role not in ["leader", "mp", "admin"]:
        raise HTTPException(status_code=403, detail="Only leaders and MP can post opportunities")

    image_url = None
    if image and image.filename:
        contents  = await image.read()
        image_url = upload_image(contents, "mcucsya/opportunities")

    full_content = content
    if apply_link: full_content += f"\n\nAPPLY_LINK:{apply_link}"
    if deadline:   full_content += f"\n\nDEADLINE:{deadline}"
    full_content += f"\n\nTYPE:{opp_type}"

    post = Post(
        title=title, content=full_content, post_type="opportunity",
        image_url=image_url, author_id=user.id,
        author_name=user.full_name, author_role=user.role
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

# ── Bursary ────────────────────────────────────────────
@router.get("/bursary/links")
def get_bursary_links(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_current_user(authorization, db)
    return db.query(BursaryAnnouncement).order_by(BursaryAnnouncement.created_at.desc()).all()

@router.post("/bursary/link")
def post_bursary_link(
    title:    str            = Form(...),
    link:     str            = Form(...),
    deadline: Optional[str]  = Form(None),
    notes:    Optional[str]  = Form(None),
    db: Session              = Depends(get_db),
    authorization: str       = Header(...)
):
    user = get_current_user(authorization, db)
    if user.role not in ["mp", "admin"]:
        raise HTTPException(status_code=403, detail="Only MP can post bursary links")

    content = f"BURSARY_LINK:{link}"
    if notes:    content += f"\n\nNOTES:{notes}"
    if deadline: content += f"\n\nDEADLINE:{deadline}"

    ann = BursaryAnnouncement(
        title=title, content=content,
        author_id=user.id, author_name=user.full_name
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

@router.post("/bursary/apply")
async def apply_bursary(
    institution:      str            = Form(...),
    course:           str            = Form(...),
    year_of_study:    int            = Form(...),
    amount_requested: float          = Form(...),
    reason:           str            = Form(...),
    document:         Optional[UploadFile] = File(None),
    db: Session                      = Depends(get_db),
    authorization: str               = Header(...)
):
    user = get_current_user(authorization, db)
    existing = db.query(BursaryApplication).filter(
        BursaryApplication.applicant_id == user.id,
        BursaryApplication.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending application")

    doc_url = None
    if document and document.filename:
        contents = await document.read()
        doc_url  = upload_document(contents, "mcucsya/bursary_docs")

    app = BursaryApplication(
        applicant_id=user.id, applicant_name=user.full_name,
        national_id=user.national_id, phone=user.phone,
        sub_location=user.ward, institution=institution,
        course=course, year_of_study=year_of_study,
        amount_requested=amount_requested, reason=reason,
        document_url=doc_url
    )
    db.add(app)
    db.commit()
    return {"message": "Application submitted!"}

@router.get("/bursary/my-applications")
def my_applications(db: Session = Depends(get_db), authorization: str = Header(...)):
    user = get_current_user(authorization, db)
    return db.query(BursaryApplication).filter(
        BursaryApplication.applicant_id == user.id
    ).order_by(BursaryApplication.created_at.desc()).all()

# ── Events ─────────────────────────────────────────────
@router.get("/events")
def get_events(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_current_user(authorization, db)
    return db.query(Event).filter(Event.is_active == True).order_by(Event.event_date.asc()).all()

@router.post("/events")
async def create_event(
    title:       str            = Form(...),
    description: str            = Form(...),
    location:    str            = Form(...),
    event_date:  str            = Form(...),
    image:       Optional[UploadFile] = File(None),
    db: Session                 = Depends(get_db),
    authorization: str          = Header(...)
):
    user = get_current_user(authorization, db)
    if user.role not in ["leader", "mp", "admin"]:
        raise HTTPException(status_code=403, detail="Only leaders can create events")

    from datetime import datetime
    image_url = None
    if image and image.filename:
        contents  = await image.read()
        image_url = upload_image(contents, "mcucsya/events")

    event = Event(
        title=title, description=description,
        location=location, event_date=datetime.fromisoformat(event_date),
        image_url=image_url, author_id=user.id, author_name=user.full_name
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.post("/events/{event_id}/rsvp")
def rsvp(event_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    user = get_current_user(authorization, db)
    existing = db.query(EventRSVP).filter(
        EventRSVP.event_id == event_id, EventRSVP.user_id == user.id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "RSVP cancelled"}
    db.add(EventRSVP(event_id=event_id, user_id=user.id, user_name=user.full_name))
    db.commit()
    return {"message": "RSVP confirmed!"}

# ── Leaders list ───────────────────────────────────────
@router.get("/leaders")
def get_leaders(db: Session = Depends(get_db), authorization: str = Header(...)):
    get_current_user(authorization, db)
    return db.query(User).filter(
        User.role == "leader", User.status == "approved"
    ).order_by(User.ward).all()
@router.get("/profile")
def get_profile(db: Session = Depends(get_db), authorization: str = Header(...)):
    return get_current_user(authorization, db)
@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    user  = get_current_user(authorization, db)
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted"}

@router.delete("/opportunities/{post_id}")
def delete_opportunity(post_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    user = get_current_user(authorization, db)
    post = db.query(Post).filter(Post.id == post_id, Post.post_type == "opportunity").first()
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    if post.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(post)
    db.commit()
    return {"message": "Deleted"}

@router.delete("/bursary/links/{ann_id}")
def delete_bursary_link(ann_id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    user = get_current_user(authorization, db)
    if user.role not in ["mp", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    ann = db.query(BursaryAnnouncement).filter(BursaryAnnouncement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(ann)
    db.commit()
    return {"message": "Deleted"}