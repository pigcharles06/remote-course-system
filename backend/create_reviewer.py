from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import security

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

def create_reviewer_user():
    db = SessionLocal()
    try:
        email = "reviewer@example.com"
        password = "reviewerpassword"
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if user:
            print(f"User {email} found. Updating role to REVIEWER...")
            user.role = models.UserRole.REVIEWER
            user.hashed_password = security.get_password_hash(password)
        else:
            print(f"User {email} not found. Creating new REVIEWER user...")
            hashed_password = security.get_password_hash(password)
            user = models.User(
                email=email,
                hashed_password=hashed_password,
                name="Reviewer User",
                role=models.UserRole.REVIEWER
            )
            db.add(user)
            
        db.commit()
        print("Reviewer user created/updated successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_reviewer_user()
