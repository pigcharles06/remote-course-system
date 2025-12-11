from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
import io
import os
import uuid
import traceback

import models, schemas, crud, database, security
import word_generator

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Remote Course System API", redirect_slashes=False)

# Create downloads directory if not exists
DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Mount static files for downloads
app.mount("/downloads", StaticFiles(directory=DOWNLOADS_DIR), name="downloads")

# CORS - Allow all origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# Initialize demo users on startup
@app.on_event("startup")
def init_demo_users():
    db = database.SessionLocal()
    try:
        # Check if demo user exists
        existing_user = db.query(models.User).filter(models.User.email == "test@example.com").first()
        if not existing_user:
            print("[STARTUP] Creating demo users...")
            # Create teacher demo user
            teacher = models.User(
                email="test@example.com",
                hashed_password=security.get_password_hash("password"),
                name="Demo Teacher",
                role="TEACHER",
                department="資訊工程系"
            )
            db.add(teacher)
            
            # Create admin demo user
            admin = models.User(
                email="admin@example.com",
                hashed_password=security.get_password_hash("password"),
                name="Demo Admin",
                role="ADMIN",
                department="教務處"
            )
            db.add(admin)
            
            # Create reviewer demo user
            reviewer = models.User(
                email="reviewer@example.com",
                hashed_password=security.get_password_hash("password"),
                name="Demo Reviewer",
                role="REVIEWER",
                department="教學發展中心"
            )
            db.add(reviewer)
            
            db.commit()
            print("[STARTUP] Demo users created successfully!")
        else:
            print("[STARTUP] Demo users already exist.")
    except Exception as e:
        print(f"[STARTUP] Error creating demo users: {e}")
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except security.JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/token", response_model=dict)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.post("/api/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/api/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/api/applications/", response_model=schemas.Application)
def create_application(
    application: schemas.ApplicationCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_application(db=db, application=application, user_id=current_user.id)

@app.get("/api/applications/", response_model=List[schemas.Application])
def read_applications(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.ADMIN:
        return crud.get_applications(db, skip=skip, limit=limit)
    else:
        return crud.get_applications(db, skip=skip, limit=limit, user_id=current_user.id)

@app.get("/api/users/reviewers", response_model=List[schemas.User])
def read_reviewers(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_users_by_role(db, role=models.UserRole.REVIEWER)

@app.post("/api/reviews/", response_model=schemas.Review)
def create_review(
    review: schemas.ReviewCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_review(db=db, review=review)

@app.get("/api/reviews/me", response_model=List[schemas.Review])
def read_my_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.REVIEWER:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_reviews_by_reviewer(db, reviewer_id=current_user.id)

@app.put("/api/reviews/{review_id}", response_model=schemas.Review)
def update_review(
    review_id: str,
    review: schemas.ReviewBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # TODO: Check if user is the assigned reviewer
    return crud.update_review(db=db, review_id=review_id, review_update=review)

@app.get("/api/applications/{application_id}", response_model=schemas.Application)
def read_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # TODO: Check permissions
    application = crud.get_application(db, application_id=application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@app.put("/api/applications/{application_id}", response_model=schemas.Application)
def update_application(
    application_id: str,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update application form data."""
    application = crud.get_application(db, application_id=application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check permission (owner or admin)
    if application.teacher_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")
    
    # Update form_data
    if "form_data" in update_data:
        application.form_data = update_data["form_data"]
        # Also update course name if it changed
        if "course_name_zh" in update_data["form_data"]:
            application.course_name_zh = update_data["form_data"]["course_name_zh"]
        db.commit()
        db.refresh(application)
    
    return application

@app.get("/api/applications/{application_id}/download")
def download_application_document(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate and download a Word document for the application."""
    import traceback
    print(f"[DOWNLOAD] Starting download for application_id={application_id}")
    
    # Fetch application
    application = crud.get_application(db, application_id=application_id)
    if application is None:
        print(f"[DOWNLOAD] Application not found")
        raise HTTPException(status_code=404, detail="Application not found")
    
    print(f"[DOWNLOAD] Found application: {application.course_name_zh}")
    
    # Check permission (owner or admin)
    if application.teacher_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        print(f"[DOWNLOAD] Not authorized")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get form data
    form_data = application.form_data
    if not form_data:
        print(f"[DOWNLOAD] No form data")
        raise HTTPException(status_code=400, detail="No form data available for this application")
    
    print(f"[DOWNLOAD] Form data keys: {list(form_data.keys())[:10]}...")
    
    try:
        # Generate document
        print(f"[DOWNLOAD] Starting document generation...")
        doc_bytes = word_generator.generate_document(form_data)
        print(f"[DOWNLOAD] Generated {len(doc_bytes)} bytes")
        
        # Create filename with URL encoding for Chinese characters
        course_name = form_data.get("course_name_zh", "課程申請")
        filename = f"{course_name}_教學計畫表.docx"
        print(f"[DOWNLOAD] Filename: {filename}")
        
        # URL encode the filename for Content-Disposition header
        from urllib.parse import quote
        encoded_filename = quote(filename)
        
        # ASCII fallback filename (for browsers that don't support filename*)
        ascii_filename = "teaching_plan.docx"
        
        # Return as download with proper headers
        return StreamingResponse(
            io.BytesIO(doc_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{ascii_filename}"; filename*=UTF-8\'\'{encoded_filename}',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        print(f"[DOWNLOAD] Error: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating document: {str(e)}")


@app.post("/api/applications/{application_id}/generate-upload")
async def generate_and_upload_to_drive(
    application_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate Word document and save to downloads folder, return download link."""
    
    print(f"[GENERATE] Generating document for application: {application_id}")
    
    # Get application
    application = crud.get_application(db, application_id=application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check permission
    if application.teacher_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get form data
    form_data = application.form_data
    if not form_data:
        raise HTTPException(status_code=400, detail="No form data available")
    
    try:
        # Generate document
        print(f"[GENERATE] Generating document...")
        doc_bytes = word_generator.generate_document(form_data)
        print(f"[GENERATE] Generated {len(doc_bytes)} bytes")
        
        # Create filename with unique ID to avoid conflicts
        course_name = form_data.get("course_name_zh", "課程申請")
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = f"{course_name}_{unique_id}_教學計畫表.docx"
        
        # Save to downloads folder
        file_path = os.path.join(DOWNLOADS_DIR, safe_filename)
        with open(file_path, 'wb') as f:
            f.write(doc_bytes)
        print(f"[GENERATE] Saved to: {file_path}")
        
        # Return download URL (relative to backend)
        download_url = f"http://localhost:8000/downloads/{safe_filename}"
        
        return {
            "success": True,
            "filename": safe_filename,
            "downloadUrl": download_url,
            "size": len(doc_bytes)
        }
        
    except Exception as e:
        print(f"[GENERATE] Error: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating document: {str(e)}")


# =============================================================================
# AI Assistant API Endpoints
# =============================================================================
import ai_assistant

@app.post("/api/ai-assistant/chat")
async def ai_chat(
    request: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Chat with AI assistant for form filling help."""
    message = request.get("message", "")
    step = request.get("step", 1)
    form_data = request.get("formData", {})
    image = request.get("image", None)  # Base64 image data
    
    assistant = ai_assistant.get_assistant()
    response = assistant.chat(message, step, form_data, image)
    
    return {"response": response}


@app.post("/api/ai-assistant/welcome")
async def ai_welcome(
    request: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Get welcome message when entering a page."""
    step = request.get("step", 1)
    form_data = request.get("formData", {})
    
    assistant = ai_assistant.get_assistant()
    response = assistant.get_welcome_message(step, form_data)
    
    return {"response": response}


@app.post("/api/ai-assistant/check-page")
async def ai_check_page(
    request: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Check form data before changing page."""
    step = request.get("step", 1)
    form_data = request.get("formData", {})
    
    assistant = ai_assistant.get_assistant()
    response = assistant.check_before_page_change(step, form_data)
    
    return {"response": response}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

