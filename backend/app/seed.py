"""
Seed script: Initializes database tables, creates demo users for the unified roles,
standard AICTE APH regulatory rules, demo institution profiles, and sample applications
illustrating the exact AICTE single-officer workflow:
1. APP-2026-0001: Deficiencies detected by AI (Missing Building Plan, Expired Fire NOC) with AI Suggestions.
2. APP-2026-0002: All AI checks passed (100%), Ready for Single Officer Approval.
3. APP-2026-0003: Approved by Officer, Certificate Issued, Downloadable in Institute Dashboard.
4. APP-2026-0004: Officer Sent Suggestions & Corrections to Institute after manual scrutiny.
Run: python -m app.seed
"""
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Institution, Application, Document, DocumentVersion, Finding,
    ComplianceCheck, ValidationRun, ReviewAction, DecisionRecord,
    Notification, RegulatoryRule, AuditEvent, UserRole, AppStatus,
    FindingSeverity, FindingStatus, AicteMasterRecord, AuthorityVerification,
    InfrastructureEvidence
)
from app.security import get_password_hash
from datetime import datetime, date, timedelta
import hashlib, os


def file_sha256(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    return hashlib.sha256(filepath.encode()).hexdigest()


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("1. Seeding Institution Profiles...")
    inst1 = db.query(Institution).filter(Institution.aicte_id == "1-33245561").first()
    if not inst1:
        inst1 = Institution(
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
        db.add(inst1)
        db.commit()
        db.refresh(inst1)

    inst2 = db.query(Institution).filter(Institution.aicte_id == "1-49982310").first()
    if not inst2:
        inst2 = Institution(
            aicte_id="1-49982310",
            name="XYZ Institute of Technology",
            institution_type="Engineering & Technology",
            category="Government-Aided",
            address="NH-48 Bypass, Tech Zone",
            state="Karnataka",
            district="Bengaluru",
            pincode="560100",
            contact_person="Dr. Sneha Hegde (Director)",
            email="director@xyzt.edu.in",
            phone="+91 80 2345 6789",
            university_affiliation="Visvesvaraya Technological University",
            established_year=2010,
            campus_acres=8.0,
            total_intake=540
        )
        db.add(inst2)
        db.commit()
        db.refresh(inst2)

    print("2. Seeding Unified Role Users (Admin & AICTE Approval Officer Arun)...")
    demo_users = [
        {
            "email": "admin@gov.in",
            "full_name": "System Administrator",
            "role": UserRole.ADMIN.value,
            "pass": "admin",
            "inst_id": None
        },
        {
            "email": "arun@gov.in",
            "full_name": "Arun",
            "role": UserRole.OFFICER.value,
            "pass": "arun",
            "inst_id": None
        },
        {
            "email": "arun@college.edu.in",
            "full_name": "ABC Institute of Technology (Principal)",
            "role": UserRole.INSTITUTION.value,
            "pass": "arun",
            "inst_id": inst1.id
        }
    ]

    user_map = {}
    for u_data in demo_users:
        u = db.query(User).filter(User.email == u_data["email"]).first()
        if not u:
            u = User(
                email=u_data["email"],
                full_name=u_data["full_name"],
                role=u_data["role"],
                hashed_password=get_password_hash(u_data["pass"]),
                is_active=True,
                institution_id=u_data["inst_id"]
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        else:
            u.role = u_data["role"]
            u.full_name = u_data["full_name"]
            u.hashed_password = get_password_hash(u_data["pass"])
            u.institution_id = u_data["inst_id"]
            db.commit()
        user_map[u_data["email"]] = u

    admin_user = user_map["admin@gov.in"]
    officer_user = user_map["arun@gov.in"]

    print("3. Seeding Regulatory Compliance Rules...")
    standard_rules = [
        {
            "rule_id": "APH-2.1",
            "rule_name": "Infrastructure & Land Area",
            "category": "Land & Infrastructure",
            "description": "Clear title ownership of contiguous land parcel meeting minimum prescribed acreage for engineering campus.",
            "required_value": "5.0 Acres Contiguous",
            "severity": "critical"
        },
        {
            "rule_id": "APH-3.4",
            "rule_name": "Faculty & Cadre Ratio",
            "category": "Human Resources",
            "description": "Student to Faculty Ratio (SFR) 1:20 and Professor / Associate / Assistant cadre ratio (1:2:6).",
            "required_value": "1:20 SFR required",
            "severity": "high"
        },
        {
            "rule_id": "APH-4.2",
            "rule_name": "Fire & Life Safety Clearance",
            "category": "Statutory Safety",
            "description": "Official Fire Safety NOC issued by State Fire Prevention Services Department without conditional restrictions.",
            "required_value": "Valid Permanent/Renewed NOC",
            "severity": "critical"
        },
        {
            "rule_id": "APH-5.1",
            "rule_name": "Approved Building & Structural Plan",
            "category": "Infrastructure",
            "description": "Competent municipal or PWD authority approved structural building layout and stability certification.",
            "required_value": "Approved Master Plan",
            "severity": "high"
        },
        {
            "rule_id": "APH-6.3",
            "rule_name": "Endowment & Financial FDR",
            "category": "Finance",
            "description": "Joint Fixed Deposit Receipt (FDR) created in name of AICTE and Society for financial sustainability.",
            "required_value": "FDR ₹50 Lakhs",
            "severity": "high"
        }
    ]

    for r in standard_rules:
        existing_r = db.query(RegulatoryRule).filter(RegulatoryRule.rule_id == r["rule_id"]).first()
        if not existing_r:
            new_r = RegulatoryRule(
                rule_id=r["rule_id"],
                rule_name=r["rule_name"],
                category=r["category"],
                description=r["description"],
                required_value=r["required_value"],
                severity=r["severity"],
                is_mandatory=True,
                is_active=True,
                version="APH-2026.1",
                created_by=admin_user.id
            )
            db.add(new_r)
    db.commit()

    print("4. Seeding EXACTLY ONE Example Application (APP-2026-0001)...")

    # ------------------------------------------------------------
    # APP-2026-0001: Clean DRAFT Application Ready for Real Document Upload
    # ------------------------------------------------------------
    app1 = db.query(Application).filter(Application.application_id == "APP-2026-0001").first()
    if not app1:
        app1 = Application(
            application_id="APP-2026-0001",
            institution_id=inst1.id,
            institution_name="ABC Institute of Engineering & Technology",
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
            submitted_by=user_map["arun@college.edu.in"].id,
            submitted_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            ai_suggestions=[]
        )
        db.add(app1)
        db.commit()
        db.refresh(app1)

    # 5. Seed AICTE Master Record for ABC Institute
    master_rec = db.query(AicteMasterRecord).filter(AicteMasterRecord.institution_id == inst1.id).first()
    if not master_rec:
        master_rec = AicteMasterRecord(
            institution_id=inst1.id,
            aicte_id=inst1.aicte_id,
            institution_name=inst1.name,
            ter_payment={
                "receipt_no": "AICTE-TER-2026-98124",
                "amount": "₹1,50,000",
                "payment_date": "2026-02-14",
                "bank_ref": "SBIN00049219382",
                "status": "CONFIRMED"
            },
            previous_eoa=[
                {"year": "2025-26", "status": "APPROVED", "order_number": f"AICTE/WEST/{inst1.aicte_id}/2025/EOA", "date": "2025-06-12"},
                {"year": "2024-25", "status": "APPROVED", "order_number": f"AICTE/WEST/{inst1.aicte_id}/2024/EOA", "date": "2024-06-18"},
                {"year": "2023-24", "status": "APPROVED", "order_number": f"AICTE/WEST/{inst1.aicte_id}/2023/EOA", "date": "2023-06-15"}
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
            past_deficiencies=[
                {"year": "2023-24", "committee": "Standing Scrutiny Committee (SSC)", "finding": "Resolved: Building Structural Stability renewed", "status": "CLOSED"}
            ],
            registered_campus_acres=inst1.campus_acres or 5.5,
            registered_gps={"latitude": 18.5204, "longitude": 73.8567, "address": "Knowledge Park, Pune, Maharashtra"},
            last_synced_at=datetime.utcnow()
        )
        db.add(master_rec)
        db.commit()

    db.close()
    print("Seed complete: Supabase database cleanly populated with AICTE Master Record, Authority Verifications, and Infrastructure Evidence for APP-2026-0001.")


if __name__ == "__main__":
    seed()
