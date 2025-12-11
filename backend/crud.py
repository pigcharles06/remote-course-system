from sqlalchemy.orm import Session
import models, schemas, security
from datetime import datetime

def get_user(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        role=user.role,
        department=user.department
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_applications(db: Session, skip: int = 0, limit: int = 100, user_id: str = None):
    query = db.query(models.Application)
    if user_id:
        query = query.filter(models.Application.teacher_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_application(db: Session, application: schemas.ApplicationCreate, user_id: str):
    db_application = models.Application(
        **application.dict(),
        teacher_id=user_id
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

def get_users_by_role(db: Session, role: models.UserRole):
    return db.query(models.User).filter(models.User.role == role).all()

def create_review(db: Session, review: schemas.ReviewCreate):
    db_review = models.Review(
        application_id=review.application_id,
        reviewer_id=review.reviewer_id,
        status=models.ReviewStatus.PENDING
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Update application status to UNDER_REVIEW
    application = db.query(models.Application).filter(models.Application.id == review.application_id).first()
    if application:
        application.status = models.ApplicationStatus.UNDER_REVIEW
        db.commit()
        
    return db_review

def get_reviews_by_reviewer(db: Session, reviewer_id: str):
    return db.query(models.Review).filter(models.Review.reviewer_id == reviewer_id).all()

def get_application(db: Session, application_id: str):
    return db.query(models.Application).filter(models.Application.id == application_id).first()

def update_review(db: Session, review_id: str, review_update: schemas.ReviewBase):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if db_review:
        db_review.result = review_update.result
        db_review.comments = review_update.comments
        db_review.status = models.ReviewStatus.COMPLETED
        db_review.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(db_review)
        
        # Check if all reviews are completed to update application status
        # For now, simple logic: if this review is completed, maybe update app status?
        # Let's keep it simple: just update review for now.
        
    return db_review
