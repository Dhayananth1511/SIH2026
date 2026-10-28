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
            submitted_by=None,
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
                uploaded_by=None
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
            user_id=officer_user.id,
            application_id=app1.id,
            title="AI Validation Cleared: Ready for Officer Approval",
            message="All mandatory AICTE document checks for Application #APP-2026-0001 have passed with 100% score. Dossier submitted to AICTE Approval Officer.",
            type="STATUS_CHANGE",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(notif1)
        db.commit()

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

    # 6. Seed Issuing Authority Verifications for APP-2026-0001
    seeded_app = db.query(Application).filter(Application.application_id == "APP-2026-0001").first()
    if seeded_app:
        if db.query(AuthorityVerification).filter(AuthorityVerification.application_id == seeded_app.id).count() == 0:
            auth_specs = [
                ("State Directorate of Fire Prevention Services", "API_PORTAL", "VERIFIED", "MAH-FIRE-2026-88192", "https://fire.maharashtra.gov.in/verify", "State Fire Prevention Services Department", {"clearance_type": "Permanent Academic NOC", "expiry": "2027-05-30"}),
                ("State Land Revenue Cadastre / Bhulekh", "QR_CODE", "VERIFIED", "KL-SURVEY-4021/B", "https://bhulekh.maharashtra.gov.in/cadastre", "Department of Land Records & Settlement", {"land_title": "Clear / Non-Encumbered", "contiguous_acres": 5.50}),
                ("Municipal Corporation Town Planning / PWD", "URN_LOOKUP", "VERIFIED", "PWD-PUNE-STAB-9921", "https://pmc.gov.in/townplanning/verify", "Public Works Department", {"structural_stability": "Certified A-Grade", "seismic_zone": "Zone III Compliant"}),
                ("Affiliating State Technical University", "API_PORTAL", "VERIFIED", "UNIV-SPPU-AFF-2026-04", "https://unipune.ac.in/affiliation/check", "Academic Affiliation Section", {"status": "Active Permanent Affiliation", "approved_courses": 4}),
                ("National DigiLocker Academic Depository", "API_PORTAL", "VERIFIED", "DIGI-CERT-88129", "https://digilocker.gov.in/api/verify", "Ministry of Electronics and IT (MeitY)", {"doc_type": "Institutional Land & FDR Records", "integrity": "Cryptographically Sealed"})
            ]
            for a_name, v_type, a_stat, u_tok, s_url, s_agency, resp in auth_specs:
                db.add(AuthorityVerification(
                    application_id=seeded_app.id,
                    authority_name=a_name,
                    verification_type=v_type,
                    status=a_stat,
                    urn_or_token=u_tok,
                    source_url=s_url,
                    source_agency=s_agency,
                    checked_at=datetime.utcnow(),
                    response_payload=resp,
                    discrepancy_details=None,
                    is_conclusive=True
                ))
            db.commit()

        # 7. Seed Infrastructure Evidence
        if db.query(InfrastructureEvidence).filter(InfrastructureEvidence.application_id == seeded_app.id).count() == 0:
            default_evidence = [
                ("PHOTO_COMPUTER_CENTER", "Central Computing Facility & AI Lab", {"latitude": 18.5206, "longitude": 73.8569, "altitude": 560}, 25.0, True, [{"label": "Active Workstations", "count": 64, "confidence": 0.98}, {"label": "UPS Power Grid", "count": 2, "confidence": 0.95}], "COMPLIANT_ADVISORY", "Instructional terminal count meets APH Clause 5.3 norms for 360 intake."),
                ("PHOTO_LIBRARY", "Central Library & Digital Reading Hall", {"latitude": 18.5202, "longitude": 73.8565, "altitude": 562}, 30.0, True, [{"label": "Reading Desks", "count": 120, "confidence": 0.97}, {"label": "Stack Racks", "count": 24, "confidence": 0.99}], "COMPLIANT_ADVISORY", "Carpet area and seating capacity verified compliant with Chapter II."),
                ("PHOTO_BARRIER_FREE_RAMP", "Barrier-Free Access Ramp & Braille Lift", {"latitude": 18.5205, "longitude": 73.8568, "altitude": 560}, 15.0, True, [{"label": "Wheelchair Ramp Gradient 1:12", "count": 1, "confidence": 0.94}, {"label": "Accessible Handrails", "count": 2, "confidence": 0.96}], "COMPLIANT_ADVISORY", "Rights of Persons with Disabilities Act & AICTE barrier-free norms satisfied."),
                ("PHOTO_FIRE_SAFETY", "Active Fire Hydrant & Sprinkler Assembly", {"latitude": 18.5208, "longitude": 73.8571, "altitude": 561}, 45.0, True, [{"label": "Fire Extinguisher ABC Type", "count": 4, "confidence": 0.99}, {"label": "Hydrant Valve Assembly", "count": 1, "confidence": 0.95}], "COMPLIANT_ADVISORY", "Operational fire suppression system installed per State Fire NOC specifications.")
            ]
            for e_type, e_title, e_gps, e_dist, e_gps_v, e_cv, e_status, e_notes in default_evidence:
                db.add(InfrastructureEvidence(
                    application_id=seeded_app.id,
                    evidence_type=e_type,
                    title=e_title,
                    file_path=None,
                    file_url=None,
                    extracted_gps=e_gps,
                    distance_from_campus_meters=e_dist,
                    gps_verified=e_gps_v,
                    cv_detected_objects=e_cv,
                    compliance_status=e_status,
                    inspection_notes=e_notes,
                    uploaded_at=datetime.utcnow()
                ))
            db.commit()

    db.close()
    print("Seed complete: Supabase database cleanly populated with AICTE Master Record, Authority Verifications, and Infrastructure Evidence for APP-2026-0001.")


if __name__ == "__main__":
    seed()
