from database import SessionLocal
from models import User, UserRole
from security import get_password_hash

def create_teacher():
    db = SessionLocal()
    email = "teacher@example.com"
    password = "teacherpassword"
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.TEACHER,
            full_name="Test Teacher"
        )
        db.add(user)
        print(f"Created teacher user: {email}")
    else:
        user.role = UserRole.TEACHER
        print(f"Updated user {email} to TEACHER role")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    create_teacher()
