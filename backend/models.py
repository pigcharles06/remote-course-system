from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
from database import Base

class UserRole(str, enum.Enum):
    TEACHER = "TEACHER"
    REVIEWER = "REVIEWER"
    ADMIN = "ADMIN"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    CORRECTION_NEEDED = "CORRECTION_NEEDED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class ReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"

class ReviewResult(str, enum.Enum):
    PASSED = "PASSED"
    MODIFICATION_NEEDED = "MODIFICATION_NEEDED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(Enum(UserRole))
    department = Column(String, nullable=True)
    signature_image_url = Column(String, nullable=True)

    applications = relationship("Application", back_populates="teacher")
    reviews = relationship("Review", back_populates="reviewer")

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String, ForeignKey("users.id"))
    course_name_zh = Column(String)
    course_name_en = Column(String, nullable=True)
    permanent_course_id = Column(String, nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)
    submission_time = Column(DateTime, nullable=True)
    is_moe_certified = Column(Boolean, default=False)
    form_data = Column(JSON, nullable=True)
    video_links = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    teacher = relationship("User", back_populates="applications")
    attachments = relationship("Attachment", back_populates="application")
    reviews = relationship("Review", back_populates="application")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String, ForeignKey("applications.id"))
    file_name = Column(String)
    file_path = Column(String)
    file_type = Column(String)
    file_size = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="attachments")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String, ForeignKey("applications.id"))
    reviewer_id = Column(String, ForeignKey("users.id"))
    status = Column(Enum(ReviewStatus), default=ReviewStatus.PENDING)
    result = Column(Enum(ReviewResult), nullable=True)
    comments = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")
