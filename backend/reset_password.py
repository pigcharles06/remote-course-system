from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import security

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

def reset_user_password():
    db = SessionLocal()
    try:
        email = "test@example.com"
        password = "password"
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if user:
            print(f"User {email} found. Updating password...")
            user.hashed_password = security.get_password_hash(password)
            # Ensure other fields are set correctly
            user.role = models.UserRole.TEACHER
            user.name = "Test User"
        else:
            print(f"User {email} not found. Creating new user...")
            hashed_password = security.get_password_hash(password)
            user = models.User(
                email=email,
                hashed_password=hashed_password,
                name="Test User",
                role=models.UserRole.TEACHER
            )
            db.add(user)
            
        db.commit()
        print("User credentials updated successfully.")
        
        # Verify
        db.refresh(user)
        print(f"Verification: Password valid? {security.verify_password(password, user.hashed_password)}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_user_password()
