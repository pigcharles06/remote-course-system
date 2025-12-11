from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def delete_all_applications():
    db = SessionLocal()
    try:
        num_deleted = db.query(models.Application).delete()
        db.commit()
        print(f"Deleted {num_deleted} applications.")
    except Exception as e:
        print(f"Error deleting applications: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_applications()
