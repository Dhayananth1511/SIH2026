from app.database import SessionLocal
from app.models import User
from app.security import get_password_hash

db = SessionLocal()
for email in ["arun@gov.in", "arun@college.edu.in", "admin@gov.in", "bit@bitsathy.ac.in"]:
    u = db.query(User).filter(User.email == email).first()
    if u:
        u.hashed_password = get_password_hash("arun" if "arun" in email else ("admin" if "admin" in email else "bit123"))
        db.commit()
        print(f"Updated password for {email}")
db.close()
