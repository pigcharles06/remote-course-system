from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import UserRole, ApplicationStatus, ReviewStatus, ReviewResult

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    signature_image_url: Optional[str] = None

    class Config:
        orm_mode = True

# Attachment Schemas
class AttachmentBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int

class Attachment(AttachmentBase):
    id: str
    application_id: str
    uploaded_at: datetime

    class Config:
        orm_mode = True

# Review Schemas
class ReviewBase(BaseModel):
    result: Optional[ReviewResult] = None
    comments: Optional[str] = None

class ReviewCreate(ReviewBase):
    reviewer_id: str
    application_id: str

class Review(ReviewBase):
    id: str
    application_id: str
    reviewer_id: str
    status: ReviewStatus
    submitted_at: Optional[datetime] = None
    reviewer: Optional[User] = None

    class Config:
        orm_mode = True

# Application Schemas
class ApplicationBase(BaseModel):
    course_name_zh: str
    course_name_en: Optional[str] = None
    permanent_course_id: Optional[str] = None
    is_moe_certified: bool = False
    form_data: Optional[Dict[str, Any]] = None
    video_links: Optional[Dict[str, Any]] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(ApplicationBase):
    status: Optional[ApplicationStatus] = None

class Application(ApplicationBase):
    id: str
    teacher_id: str
    status: ApplicationStatus
    submission_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    teacher: Optional[User] = None
    attachments: List[Attachment] = []
    reviews: List[Review] = []

    class Config:
        orm_mode = True
