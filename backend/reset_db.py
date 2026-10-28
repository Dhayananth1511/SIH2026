"""
Script to wipe all tables in Supabase / SQLite and reset the platform to a clean state with fresh unified data.
Usage:
    python reset_db.py
"""
import sys
from app.database import engine, Base
from app.models import (
    User, Institution, Application, Document, DocumentVersion, Finding,
    ComplianceCheck, ValidationRun, ReviewAction, DecisionRecord,
    Notification, RegulatoryRule, AuditEvent
)
from app.seed import seed

def reset():
    print("Connecting to database...")
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Re-creating all tables with updated schema...")
    Base.metadata.create_all(bind=engine)
    print("Seeding fresh data as per unified single-officer workflow...")
    seed()
    print("Platform successfully reset with fresh data!")

if __name__ == "__main__":
    reset()
