"""
Clean Data Script: Wipes all dummy applications, dummy documents, mock findings,
compliance checks, mock verifications, and mock infrastructure evidence.
Preserves users, institution profile, AICTE Central Master Record, and regulatory rules.
Initializes clean Application #APP-2026-0001 in DRAFT status with 0 documents, ready for real testing.
Usage:
    python clean_data.py
"""
import os
import shutil
from datetime import datetime
from app.database import engine, Base, SessionLocal
from app.models import (
    User, Institution, Application, Document, DocumentVersion, Finding,
    ComplianceCheck, ValidationRun, ReviewAction, DecisionRecord,
    Notification, RegulatoryRule, AuditEvent, UserRole, AppStatus,
    AicteMasterRecord, AuthorityVerification, InfrastructureEvidence
)
from app.security import get_password_hash


def clean_database_and_storage():
    print("=" * 60)
    print("AICTE Regulatory Platform: Purging All Dummy Data...")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Clear all evidence, findings, documents, runs, reviews, decisions
        print("1. Deleting all mock findings, checks, reviews, decisions, notifications...")
        db.query(Notification).delete()
        db.query(AuditEvent).delete()
        db.query(ReviewAction).delete()
        db.query(DecisionRecord).delete()
        db.query(ComplianceCheck).delete()
        db.query(ValidationRun).delete()
        db.query(Finding).delete()
        db.query(DocumentVersion).delete()
        db.query(Document).delete()
        db.query(AuthorityVerification).delete()
        db.query(InfrastructureEvidence).delete()
        db.query(Application).delete()
        db.commit()
        print("   [OK] All transactional mock rows deleted.")

        # 2. Clear physical storage folders
        print("2. Cleaning physical uploaded files...")
        base_dir = os.path.dirname(os.path.abspath(__file__))
        upload_dirs = [
            os.path.join(base_dir, "storage", "uploads"),
            os.path.join(base_dir, "uploads")
        ]
        for u_dir in upload_dirs:
            if os.path.exists(u_dir):
                for item in os.listdir(u_dir):
                    item_path = os.path.join(u_dir, item)
                    try:
                        if os.path.isdir(item_path):
                            shutil.rmtree(item_path)
                        elif not item.startswith(".gitkeep"):
                            os.remove(item_path)
                    except Exception as e:
                        print(f"   Warning cleaning {item_path}: {e}")
        # Ensure fresh folder for APP-2026-0001
        os.makedirs(os.path.join(base_dir, "storage", "uploads", "APP-2026-0001"), exist_ok=True)
        print("   [OK] Upload directories wiped clean.")

        # 3. Ensure Institution exists
        print("3. Verifying Institution Profile...")
        inst = db.query(Institution).filter(Institution.aicte_id == "1-33245561").first()
        if not inst:
            inst = Institution(
                aicte_id="1-33245561",
                name="ABC Institute of Engineering & Technology",
                institution_type="Engineering & Technology",
                category="Private-Self-Financed",
                address="Sector 62, Institutional Area, Knowledge Park",
                state="Maharashtra",
                district="Pune",
                pincode="411057",
                contact_person="Dr. Ramesh Kulkarni (Principal)",
                email="principal@abcinstitute.edu.in",
                phone="+91 98765 43210",
                university_affiliation="Savitribai Phule Pune University",
                established_year=2004,
                campus_acres=5.5,
                total_intake=720
            )
            db.add(inst)
            db.commit()
            db.refresh(inst)
        print(f"   [OK] Institution '{inst.name}' ready (AICTE ID: {inst.aicte_id}).")

        # 4. Seed / Verify Standard Users
        print("4. Verifying Standard Platform Users...")
        users_config = [
            {
                "email": "arun@gov.in",
                "full_name": "Dr. Arun Sharma (AICTE Scrutiny Officer)",
                "role": UserRole.OFFICER.value,
                "password": "arun",
                "inst_id": None
            },
            {
                "email": "arun@college.edu.in",
                "full_name": "ABC Institute of Technology (Principal)",
                "role": UserRole.INSTITUTION.value,
                "password": "arun",
                "inst_id": inst.id
            },
            {
                "email": "admin@gov.in",
                "full_name": "System Administrator",
                "role": UserRole.ADMIN.value,
                "password": "admin",
                "inst_id": None
            }
        ]

        user_map = {}
        for uc in users_config:
            u = db.query(User).filter(User.email == uc["email"]).first()
            if not u:
                u = User(
                    email=uc["email"],
                    full_name=uc["full_name"],
                    role=uc["role"],
                    hashed_password=get_password_hash(uc["password"]),
                    is_active=True,
                    institution_id=uc["inst_id"]
                )
                db.add(u)
                db.commit()
                db.refresh(u)
            else:
                u.full_name = uc["full_name"]
                u.role = uc["role"]
                u.hashed_password = get_password_hash(uc["password"])
                u.institution_id = uc["inst_id"]
                u.is_active = True
                db.commit()
                db.refresh(u)
            user_map[uc["email"]] = u
            print(f"   [OK] User: {uc['email']} (Role: {uc['role']})")

        college_user = user_map["arun@college.edu.in"]

        # 5. Ensure Standard APH Regulatory Rules exist
        print("5. Verifying AICTE Approval Process Handbook (APH 2026-27) Rules...")
        standard_rules = [
            ("APH-2.1", "Infrastructure & Land Area", "Land & Infrastructure", "Clear title ownership of contiguous land parcel meeting minimum prescribed acreage for engineering campus.", "5.0 Acres Contiguous", "critical"),
            ("APH-3.4", "Faculty & Cadre Ratio", "Human Resources", "Student to Faculty Ratio (SFR) 1:20 and Professor / Associate / Assistant cadre ratio (1:2:6).", "1:20 SFR required", "high"),
            ("APH-4.2", "Fire & Life Safety Clearance", "Statutory Safety", "Official Fire Safety NOC issued by State Fire Prevention Services Department without conditional restrictions.", "Valid Permanent/Renewed NOC", "critical"),
            ("APH-5.1", "Approved Building & Structural Plan", "Infrastructure", "Competent municipal or PWD authority approved structural building layout and stability certification.", "Approved Master Plan", "high"),
            ("APH-6.3", "Endowment & Financial FDR", "Finance", "Joint Fixed Deposit Receipt (FDR) created in name of AICTE and Society for financial sustainability.", "FDR ₹50 Lakhs", "high")
        ]
        for r_id, r_name, cat, desc, req_v, sev in standard_rules:
            existing = db.query(RegulatoryRule).filter(RegulatoryRule.rule_id == r_id).first()
            if not existing:
                db.add(RegulatoryRule(
                    rule_id=r_id,
                    rule_name=r_name,
                    category=cat,
                    description=desc,
                    required_value=req_v,
                    severity=sev,
                    is_mandatory=True,
                    is_active=True,
                    version="APH-2026.1",
                    created_by=user_map["admin@gov.in"].id
                ))
        db.commit()
        print("   [OK] Standard regulatory rules in place.")

        # 6. Ensure AICTE Central Master Record (AIMR) exists for the college
        print("6. Verifying AICTE Central Master Record (AIMR)...")
        aimr = db.query(AicteMasterRecord).filter(AicteMasterRecord.institution_id == inst.id).first()
        if not aimr:
            aimr = AicteMasterRecord(
                institution_id=inst.id,
                aicte_id=inst.aicte_id,
                institution_name=inst.name,
                ter_payment={
                    "receipt_no": "AICTE-TER-2026-98124",
                    "amount": "₹1,50,000",
                    "payment_date": "2026-02-14",
                    "bank_ref": "SBIN00049219382",
                    "status": "CONFIRMED"
                },
                previous_eoa=[
                    {"year": "2025-26", "status": "APPROVED", "order_number": f"AICTE/WEST/{inst.aicte_id}/2025/EOA", "date": "2025-06-12"},
                    {"year": "2024-25", "status": "APPROVED", "order_number": f"AICTE/WEST/{inst.aicte_id}/2024/EOA", "date": "2024-06-18"},
                    {"year": "2023-24", "status": "APPROVED", "order_number": f"AICTE/WEST/{inst.aicte_id}/2023/EOA", "date": "2023-06-15"}
                ],
                approved_programmes=[
                    {"program": "UG Engineering", "course": "Computer Science & Engineering", "sanctioned_intake": 180},
                    {"program": "UG Engineering", "course": "Electronics & Communication Engineering", "sanctioned_intake": 120},
                    {"program": "UG Engineering", "course": "Artificial Intelligence & Data Science", "sanctioned_intake": 60},
                    {"program": "PG Engineering", "course": "M.Tech Computer Science & Engineering", "sanctioned_intake": 18}
                ],
                total_sanctioned_intake=378,
                accreditation_details={
                    "nba": "Tier-1 Accredited for 3 UG Programs (CSE, ECE, Mech) - Valid till 30-06-2027",
                    "naac": "Grade A+ (CGPA 3.48), Cycle 2 - Valid up to 2028"
                },
                faculty_epf_roster={
                    "total_faculty": 72,
                    "cadre_ratio": "1:2:7.3 (Prof: 7, Assoc: 14, Asst: 51)",
                    "sfr_ratio": "1:18.5 Compliant",
                    "epf_registered_count": 72
                },
                past_deficiencies=[],
                registered_campus_acres=inst.campus_acres or 5.5,
                registered_gps={"latitude": 18.5204, "longitude": 73.8567, "address": "Knowledge Park, Pune, Maharashtra"},
                last_synced_at=datetime.utcnow()
            )
            db.add(aimr)
            db.commit()
        print("   [OK] AICTE Master Record ready.")

        # 7. Create CLEAN Application APP-2026-0001 (0 documents, DRAFT status)
        print("7. Initializing Clean Application #APP-2026-0001...")
        clean_app = Application(
            application_id="APP-2026-0001",
            institution_id=inst.id,
            institution_name=inst.name,
            institution_type="Engineering & Technology",
            category="Extension of Approval (EoA)",
            academic_year="2026-27",
            region="Western",
            state="Maharashtra",
            city="Pune",
            applied_for="Annual Extension of Approval (EoA) 2026-27 for B.Tech & M.Tech Programs",
            status=AppStatus.DRAFT.value,
            current_stage="submission",
            scrutiny_score=0.0,
            submitted_by=college_user.id,
            submitted_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            ai_suggestions=[],
            certificate_issued=False,
            certificate_number=None,
            verification_status="pending",
            final_decision=None,
            decision_remarks=None
        )
        db.add(clean_app)
        db.commit()
        db.refresh(clean_app)
        print(f"   [OK] Clean Application created: #{clean_app.application_id} (Status: {clean_app.status}, Documents: 0, Score: 0%).")

        print("=" * 60)
        print("CLEANUP COMPLETE: Dummy data successfully removed.")
        print("You can now upload real documents (.pdf, .jpg, .png) and test AI validation!")
        print("=" * 60)

    except Exception as e:
        print("Error during cleanup:", e)
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    clean_database_and_storage()
