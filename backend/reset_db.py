"""
Script to wipe all tables in Supabase and reset the platform to a clean state.
Usage:
    python reset_db.py
"""
import sys
from app.database import engine
from sqlalchemy import text, inspect

def reset(wipe_users=True):
    print("Connecting to database...")
    with engine.connect() as conn:
        if wipe_users:
            print("Wiping all tables (including users) in Supabase...")
            conn.execute(text("TRUNCATE TABLE audit_events, compliance_checks, findings, documents, applications, users RESTART IDENTITY CASCADE;"))
        else:
            print("Wiping applications, documents, findings, checks, and audit events (retaining users)...")
            conn.execute(text("TRUNCATE TABLE audit_events, compliance_checks, findings, documents, applications RESTART IDENTITY CASCADE;"))
        conn.commit()
    print("Database wiped successfully! Platform is ready for fresh usage.")

if __name__ == "__main__":
    wipe_users = True
    if len(sys.argv) > 1 and sys.argv[1].lower() == "--keep-users":
        wipe_users = False
    reset(wipe_users=wipe_users)
