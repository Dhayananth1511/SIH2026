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
    FindingSeverity, FindingStatus
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

    print("2. Seeding Unified Role Demo Users...")
    demo_users = [
        {
            "email": "institution@example.com",
            "full_name": "ABC Institute of Engineering & Technology",
            "role": UserRole.INSTITUTION.value,
            "pass": "inst123",
            "inst_id": inst1.id
        },
        {
            "email": "officer@aicte.gov.in",
            "full_name": "Dr. Priya Sharma (AICTE Scrutiny & Approval Officer)",
            "role": UserRole.OFFICER.value,
            "pass": "officer123",
            "inst_id": None
        },
        # Backwards compatible officer aliases
        {
            "email": "verification@aicte.gov.in",
            "full_name": "Dr. Priya Sharma (Scrutiny & Approval Officer)",
            "role": UserRole.OFFICER.value,
            "pass": "officer123",
            "inst_id": None
        },
        {
            "email": "compliance@aicte.gov.in",
            "full_name": "Prof. Rajesh Deshmukh (Compliance Officer)",
            "role": UserRole.OFFICER.value,
            "pass": "reviewer123",
            "inst_id": None
        },
        {
            "email": "decision@aicte.gov.in",
            "full_name": "Dr. Anil Sahasrabudhe (Approval Officer)",
            "role": UserRole.OFFICER.value,
            "pass": "decision123",
            "inst_id": None
        },
        {
            "email": "admin@aicte.gov.in",
            "full_name": "Sanjay Verma (System Administrator)",
            "role": UserRole.ADMIN.value,
            "pass": "admin123",
            "inst_id": None
        },
        {
            "email": "institution2@example.com",
            "full_name": "XYZ Institute of Technology",
            "role": UserRole.INSTITUTION.value,
            "pass": "inst123",
            "inst_id": inst2.id
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

    inst_user = user_map["institution@example.com"]
    inst_user2 = user_map["institution2@example.com"]
    officer_user = user_map["officer@aicte.gov.in"]
    admin_user = user_map["admin@aicte.gov.in"]

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
    # APP-2026-0001: READY_FOR_REVIEW (Single clean realistic example in Supabase)
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
            status=AppStatus.READY_FOR_REVIEW.value,
            current_stage="ready_for_review",
            scrutiny_score=100.0,
            submitted_by=inst_user.id,
            submitted_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(hours=2),
            ai_suggestions=[]
        )
        db.add(app1)
        db.commit()
        db.refresh(app1)

        docs_specs = [
            ("Land Ownership Title Deed", "Land_Ownership_Title_Deed.pdf", {"land_acres": "5.5 Acres Contiguous", "ownership": "Freehold / Registered Deed No. 4021"}),
            ("Fire Safety NOC Certificate", "Fire_Safety_NOC_Certificate.pdf", {"expiry_date": "2027-05-30", "clearance": "Valid Unconditional NOC"}),
            ("Building Approved Plan & Structural Stability", "Building_Approved_Plan_and_Stability.pdf", {"built_up_area": "18,500 sq.m", "status": "Approved Master Plan"}),
            ("Faculty Cadre & SFR Registry", "Faculty_Cadre_and_SFR_Registry.pdf", {"faculty_count": 72, "sfr": "1:18.5 Compliant"}),
            ("Endowment Joint FDR Receipt", "Endowment_Joint_FDR_Receipt.pdf", {"fdr_amount": "₹50,00,000", "bank": "State Bank of India Joint AICTE"})
        ]
        for dt, fn, ed in docs_specs:
            d = Document(
                application_id=app1.id,
                doc_type=dt,
                filename=fn,
                file_path=f"./storage/uploads/APP-2026-0001/{fn}",
                file_size=420000,
                sha256_hash=file_sha256(fn),
                version=1,
                is_latest=True,
                status="valid",
                verification_result="Verified against AICTE Approval Process Handbook (APH 2026-27).",
                extracted_data={"institution_name": "ABC Institute of Engineering & Technology", **ed},
                uploaded_at=datetime.utcnow() - timedelta(days=1),
                uploaded_by=inst_user.id
            )
            db.add(d)

        # Statutory Compliance Checks (100% PASS)
        for r_id, r_name, req_val, cat in [
            ("APH-2.1", "Infrastructure & Land Area", "5.0 Acres Contiguous", "Land & Infrastructure"),
            ("APH-3.4", "Faculty Cadre & SFR Ratio", "1:20 SFR required", "Human Resources"),
            ("APH-4.2", "Fire & Life Safety Clearance", "Valid Permanent/Renewed NOC", "Statutory Safety"),
            ("APH-5.1", "Approved Building & Structural Plan", "Approved Master Plan", "Infrastructure"),
            ("APH-6.3", "Endowment & Financial FDR", "FDR ₹50 Lakhs", "Finance")
        ]:
            chk = ComplianceCheck(
                application_id=app1.id,
                rule_id=r_id,
                rule_name=r_name,
                category=cat,
                result="PASS",
                details="Statutory clearance verified against official AICTE APH 2026-27 requirements.",
                evidence_value="Compliant & Document Verified",
                required_value=req_val,
                rule_version="APH-2026.1",
                checked_at=datetime.utcnow() - timedelta(hours=2)
            )
            db.add(chk)

        notif1 = Notification(
            user_id=inst_user.id,
            application_id=app1.id,
            title="AI Validation Cleared: Ready for Officer Approval",
            message="All mandatory AICTE document checks for Application #APP-2026-0001 have passed with 100% score. Dossier submitted to AICTE Approval Officer.",
            type="STATUS_CHANGE",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(notif1)
        db.commit()

    db.close()
    print("Seed complete: Supabase database cleanly populated with exactly 1 realistic example application (APP-2026-0001).")


if __name__ == "__main__":
    seed()
