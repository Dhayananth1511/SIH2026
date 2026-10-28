"""
Script to wipe all tables in Supabase / SQLite and reset the platform to a clean state with fresh unified data.
Usage:
    python reset_db.py
"""
import sys
from app.database import engine, Base, SessionLocal
from app.models import (
    User, Institution, Application, Document, DocumentVersion, Finding,
    ComplianceCheck, ValidationRun, ReviewAction, DecisionRecord,
    Notification, RegulatoryRule, AuditEvent
)
from app.seed import seed

def reset():
    print("Connecting to database...")
    db = SessionLocal()
    try:
        print("Clearing all mock data from Supabase...")
        db.query(Notification).delete()
        db.query(AuditEvent).delete()
        db.query(ReviewAction).delete()
        db.query(DecisionRecord).delete()
        db.query(ComplianceCheck).delete()
        db.query(ValidationRun).delete()
        db.query(Finding).delete()
        db.query(DocumentVersion).delete()
        db.query(Document).delete()
        db.query(Application).delete()
        db.commit()
        print("All old records cleanly cleared.")
    except Exception as e:
        print("Error clearing records:", e)
        db.rollback()
    finally:
        db.close()

    print("Seeding exactly 1 clean example application (APP-2026-0001)...")
    seed()
    print("Platform successfully reset with 1 real example data in Supabase!")

if __name__ == "__main__":
    reset()
