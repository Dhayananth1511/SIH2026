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

    print("4. Seeding Applications...")

    # ------------------------------------------------------------
    # APP-2026-0001: ACTION_REQUIRED (AI Deficiencies Found with AI Suggestions)
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
            applied_for="Continuation of B.Tech CSE, ECE, AI&DS + Intake Expansion",
            status=AppStatus.ACTION_REQUIRED.value,
            current_stage="submission",
            scrutiny_score=60.0,
            submitted_by=inst_user.id,
            submitted_at=datetime.utcnow() - timedelta(days=3),
            updated_at=datetime.utcnow() - timedelta(hours=2),
            ai_suggestions=[
                {
                    "rule_id": "APH-5.1",
                    "document": "Building Approved Plan & Structural Stability",
                    "detected_issue": "Mandatory master plan missing.",
                    "suggestion": "AI Suggestion: AICTE APH Section 5.1 Mandate: Upload the Master Layout and Structural Stability Certificate certified by a registered Chartered Engineer/Architect and stamped by the Municipal / PWD Planning Authority. Ensure all instructional and administrative carpet areas (min 4,200 sq.m) are legibly demarcated.",
                    "severity": "critical"
                },
                {
                    "rule_id": "VAL-DOC-EXPIRED",
                    "document": "Fire Safety NOC Certificate",
                    "detected_issue": "Certificate expired on 14-Jan-2026.",
                    "suggestion": "AI Suggestion: The uploaded Fire Safety NOC is expired. AICTE strictly requires valid clearance for Academic Year 2026-27. Apply for renewal immediately at the State Fire Services Portal, and upload the current renewed certificate or official provisional renewal receipt with valid acknowledgment number.",
                    "severity": "high"
                }
            ]
        )
        db.add(app1)
        db.commit()
        db.refresh(app1)

        # Upload docs: Land deed, expired fire NOC, faculty registry, joint FDR
        doc1_land = Document(
            application_id=app1.id,
            doc_type="Land Ownership Title Deed",
            filename="Land_Ownership_Title_Deed.pdf",
            file_path="./storage/uploads/APP-2026-0001/Land_Ownership_Title_Deed.pdf",
            file_size=428190,
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            version=1,
            is_latest=True,
            status="valid",
            verification_result="Land area 5.5 Acres contiguous confirmed.",
            extracted_data={"land_acres": "5.5 Acres", "institution_name": "ABC Institute of Engineering & Technology", "expiry_date": None},
            uploaded_at=datetime.utcnow() - timedelta(days=3),
            uploaded_by=inst_user.id
        )
        doc1_fire = Document(
            application_id=app1.id,
            doc_type="Fire Safety NOC Certificate",
            filename="Fire_Safety_NOC_Expired_2026.pdf",
            file_path="./storage/uploads/APP-2026-0001/Fire_Safety_NOC_Expired_2026.pdf",
            file_size=312450,
            sha256_hash="a1b2c3d4e5f67890123456789abcdef1234567890abcdef1234567890abcdef1",
            version=1,
            is_latest=True,
            status="deficient",
            verification_result="Expired on 14-Jan-2026. Action required.",
            extracted_data={"expiry_date": "2026-01-14", "institution_name": "ABC Institute of Engineering & Technology"},
            uploaded_at=datetime.utcnow() - timedelta(days=3),
            uploaded_by=inst_user.id
        )
        doc1_faculty = Document(
            application_id=app1.id,
            doc_type="Faculty Cadre & SFR Registry",
            filename="Faculty_Cadre_and_SFR_Registry.pdf",
            file_size=512000,
            sha256_hash="b2c3d4e5f67890123456789abcdef1234567890abcdef1234567890abcdef12",
            version=1,
            is_latest=True,
            status="valid",
            verification_result="SFR 1:19 compliant with AICTE norms.",
            extracted_data={"sfr": "1:19", "institution_name": "ABC Institute of Engineering & Technology"},
            uploaded_at=datetime.utcnow() - timedelta(days=3),
            uploaded_by=inst_user.id
        )
        doc1_fdr = Document(
            application_id=app1.id,
            doc_type="Endowment Joint FDR Receipt",
            filename="Endowment_Joint_FDR_Receipt.pdf",
            file_size=245000,
            sha256_hash="c3d4e5f67890123456789abcdef1234567890abcdef1234567890abcdef1234",
            version=1,
            is_latest=True,
            status="valid",
            verification_result="Joint FDR ₹50 Lakhs verified.",
            extracted_data={"fdr_amount": "₹50 Lakhs", "institution_name": "ABC Institute of Engineering & Technology"},
            uploaded_at=datetime.utcnow() - timedelta(days=3),
            uploaded_by=inst_user.id
        )
        db.add_all([doc1_land, doc1_fire, doc1_faculty, doc1_fdr])
        db.commit()

        # Findings for App 1
        f1_missing = Finding(
            application_id=app1.id,
            check_type="COMPLETENESS",
            rule_id="APH-5.1",
            rule_description="Missing Document: Building Approved Plan & Structural Stability",
            severity=FindingSeverity.CRITICAL,
            status=FindingStatus.OPEN,
            finding_text="Mandatory supporting document 'Building Approved Plan & Structural Stability' is missing from the application submission.",
            detected_issue="Required master building layout not uploaded.",
            why_attention_needed="AICTE APH Section 5.1 requires approved building layout and engineer certification prior to officer approval.",
            recommended_action="Upload the municipal/PWD approved master layout and structural stability certificate.",
            ai_suggestion="AI Suggestion: AICTE APH Section 5.1 Mandate: Upload the Master Layout and Structural Stability Certificate certified by a registered Chartered Engineer/Architect and stamped by the Municipal / PWD Planning Authority. Ensure all instructional and administrative carpet areas (min 4,200 sq.m) are legibly demarcated.",
            evidence={"required_document": "Building Approved Plan & Structural Stability", "category": "Infrastructure"},
            page_number=1
        )
        f1_expired = Finding(
            application_id=app1.id,
            document_id=doc1_fire.id,
            check_type="CONSISTENCY",
            rule_id="VAL-DOC-EXPIRED",
            rule_description="Certificate Expired: Fire Safety NOC Certificate",
            severity=FindingSeverity.HIGH,
            status=FindingStatus.OPEN,
            finding_text="The uploaded certificate 'Fire_Safety_NOC_Expired_2026.pdf' expired on 14-Jan-2026.",
            detected_issue="Fire safety validity expired on 14-Jan-2026.",
            why_attention_needed="AICTE statutory approvals require valid, unexpired safety clearances for Academic Year 2026-27.",
            recommended_action="Upload current renewed Fire NOC from State Fire Services Department.",
            ai_suggestion="AI Suggestion: The uploaded Fire Safety NOC is expired. AICTE strictly requires valid clearance for Academic Year 2026-27. Apply for renewal immediately at the State Fire Services Portal, and upload the current renewed certificate or official provisional renewal receipt with valid acknowledgment number.",
            evidence={"document": "Fire_Safety_NOC_Expired_2026.pdf", "extracted_expiry": "2026-01-14"},
            page_number=1
        )
        db.add_all([f1_missing, f1_expired])

        # Notification for Institution
        notif1 = Notification(
            user_id=inst_user.id,
            application_id=app1.id,
            title="Action Required: AI Validation Deficiencies Detected",
            message="AI Validation detected 2 issue(s) in Application #APP-2026-0001: Missing Building Plan & Expired Fire NOC. Please check AI suggestions and rectify before submission.",
            type="DEFICIENCY_ALERT",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(notif1)
        db.commit()

    # ------------------------------------------------------------
    # APP-2026-0002: READY_FOR_REVIEW (All AI Checks Passed 100% -> Ready for Officer Approval)
    # ------------------------------------------------------------
    app2 = db.query(Application).filter(Application.application_id == "APP-2026-0002").first()
    if not app2:
        app2 = Application(
            application_id="APP-2026-0002",
            institution_id=inst1.id,
            institution_name="ABC Institute of Engineering & Technology",
            institution_type="Engineering & Technology",
            category="New Technical Course Addition",
            academic_year="2026-27",
            region="Western",
            state="Maharashtra",
            city="Pune",
            applied_for="Addition of B.Tech Robotics & Automation (60 Seats)",
            status=AppStatus.READY_FOR_REVIEW.value,
            current_stage="ready_for_review",
            scrutiny_score=100.0,
            submitted_by=inst_user.id,
            submitted_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(hours=5),
            ai_suggestions=[]
        )
        db.add(app2)
        db.commit()
        db.refresh(app2)

        docs_specs = [
            ("Land Ownership Title Deed", "Land_Ownership_Title_Deed.pdf", {"land_acres": "5.5 Acres", "ownership": "Freehold"}),
            ("Fire Safety NOC Certificate", "Fire_Safety_NOC_Certificate.pdf", {"expiry_date": "2027-05-30"}),
            ("Building Approved Plan & Structural Stability", "Building_Approved_Plan_and_Stability.pdf", {"built_up_area": "18,500 sq.m", "status": "Approved"}),
            ("Faculty Cadre & SFR Registry", "Faculty_Cadre_and_SFR_Registry.pdf", {"faculty_count": 72, "sfr": "1:18.5"}),
            ("Endowment Joint FDR Receipt", "Endowment_Joint_FDR_Receipt.pdf", {"fdr_amount": "₹50,00,000", "bank": "State Bank of India"})
        ]
        for dt, fn, ed in docs_specs:
            d = Document(
                application_id=app2.id,
                doc_type=dt,
                filename=fn,
                file_path=f"./storage/uploads/APP-2026-0002/{fn}",
                file_size=400000,
                sha256_hash=file_sha256(fn),
                version=1,
                is_latest=True,
                status="valid",
                verification_result="Verified against APH standard.",
                extracted_data={"institution_name": "ABC Institute of Engineering & Technology", **ed},
                uploaded_at=datetime.utcnow() - timedelta(days=2),
                uploaded_by=inst_user.id
            )
            db.add(d)

        for r_id, r_name in [("APH-2.1", "Land Area"), ("APH-3.4", "Faculty Ratio"), ("APH-4.2", "Fire NOC"), ("APH-5.1", "Building Plan"), ("APH-6.3", "Endowment FDR")]:
            chk = ComplianceCheck(
                application_id=app2.id,
                rule_id=r_id,
                rule_name=r_name,
                category="Statutory Norms",
                result="PASS",
                details="Compliance verified against official APH requirements.",
                evidence_value="Compliant",
                required_value="Required standard met",
                rule_version="APH-2026.1",
                checked_at=datetime.utcnow() - timedelta(hours=5)
            )
            db.add(chk)

        notif2 = Notification(
            user_id=inst_user.id,
            application_id=app2.id,
            title="AI Validation Cleared: Ready for Officer Approval",
            message="All mandatory checks for Application #APP-2026-0002 have passed with 100% score. Dossier is in Officer Approval queue.",
            type="STATUS_CHANGE",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=5)
        )
        db.add(notif2)
        db.commit()

    # ------------------------------------------------------------
    # APP-2026-0003: APPROVED (Officer Approved -> Certificate Issued & Downloadable)
    # ------------------------------------------------------------
    app3 = db.query(Application).filter(Application.application_id == "APP-2026-0003").first()
    if not app3:
        app3 = Application(
            application_id="APP-2026-0003",
            institution_id=inst1.id,
            institution_name="ABC Institute of Engineering & Technology",
            institution_type="Engineering & Technology",
            category="Extension of Approval (EoA)",
            academic_year="2026-27",
            region="Western",
            state="Maharashtra",
            city="Pune",
            applied_for="Annual Extension of Approval (EoA) 2026-27",
            status=AppStatus.APPROVED.value,
            current_stage="completed",
            scrutiny_score=100.0,
            submitted_by=inst_user.id,
            submitted_at=datetime.utcnow() - timedelta(days=5),
            updated_at=datetime.utcnow() - timedelta(hours=4),
            officer_id=officer_user.id,
            officer_name=officer_user.full_name,
            officer_reviewed_at=datetime.utcnow() - timedelta(hours=4),
            certificate_issued=True,
            certificate_number="AICTE/CERT/2026-27/0003",
            decision_order_no="AICTE/EoA/2026-27/APP-2026-0003",
            final_decision="CLEARED",
            decision_remarks="Extension of Approval (EoA) granted for Academic Year 2026-27 following complete verified compliance with AICTE Approval Process Handbook norms.",
            decision_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(app3)
        db.commit()
        db.refresh(app3)

        # Upload 5 verified documents
        for dt, fn in [
            ("Land Ownership Title Deed", "Land_Title_Deed_Approved.pdf"),
            ("Fire Safety NOC Certificate", "Fire_Safety_NOC_Renewed.pdf"),
            ("Building Approved Plan & Structural Stability", "Master_Building_Layout.pdf"),
            ("Faculty Cadre & SFR Registry", "Faculty_Register_2026.pdf"),
            ("Endowment Joint FDR Receipt", "Endowment_FDR_50L.pdf")
        ]:
            db.add(Document(
                application_id=app3.id,
                doc_type=dt,
                filename=fn,
                file_size=380000,
                sha256_hash=file_sha256(fn),
                version=1,
                is_latest=True,
                status="valid",
                verification_result="Verified & Approved by Officer.",
                uploaded_at=datetime.utcnow() - timedelta(days=5),
                uploaded_by=inst_user.id
            ))

        # Add DecisionRecord
        dec_rec3 = DecisionRecord(
            application_id=app3.id,
            decision_maker_id=officer_user.id,
            decision_maker_name=officer_user.full_name,
            decision="CLEARED",
            reasons="Extension of Approval (EoA) granted for Academic Year 2026-27 following complete verified compliance with AICTE Approval Process Handbook norms.",
            order_number="AICTE/EoA/2026-27/APP-2026-0003",
            authority_designation="AICTE Approval Officer / Member Secretary",
            decided_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(dec_rec3)

        act3 = ReviewAction(
            application_id=app3.id,
            officer_id=officer_user.id,
            officer_name=officer_user.full_name,
            officer_role="OFFICER",
            action_type="OFFICER_APPROVED",
            comments="Dossier scrutinized and verified against statutory norms. Approval Certificate #AICTE/CERT/2026-27/0003 generated.",
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(act3)

        notif3 = Notification(
            user_id=inst_user.id,
            application_id=app3.id,
            title="Congratulations: AICTE Approval Granted & Certificate Issued!",
            message="Application #APP-2026-0003 has been approved by Officer Dr. Priya Sharma. Official Certificate #AICTE/CERT/2026-27/0003 is now available for download in your Institute Dashboard.",
            type="DECISION_RECORDED",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(notif3)
        db.commit()

    # ------------------------------------------------------------
    # APP-2026-0004: OFFICER SENT SUGGESTIONS (Fault Found by Officer -> Sent to Institute)
    # ------------------------------------------------------------
    app4 = db.query(Application).filter(Application.application_id == "APP-2026-0004").first()
    if not app4:
        officer_suggestion_text = (
            "Officer Scrutiny Directive: Discrepancy observed between Survey No. 42/1 cited in Land Title Deed and "
            "Municipal Layout. Please obtain and upload a certified Revenue Mutation Certificate from the Tahsildar / "
            "Taluk office confirming the contiguous 5.5-acre campus boundary."
        )
        app4 = Application(
            application_id="APP-2026-0004",
            institution_id=inst1.id,
            institution_name="ABC Institute of Engineering & Technology",
            institution_type="Engineering & Technology",
            category="Extension of Approval (EoA)",
            academic_year="2026-27",
            region="Western",
            state="Maharashtra",
            city="Pune",
            applied_for="Annual Extension of Approval (EoA) 2026-27",
            status=AppStatus.ACTION_REQUIRED.value,
            current_stage="submission",
            scrutiny_score=85.0,
            submitted_by=inst_user.id,
            submitted_at=datetime.utcnow() - timedelta(days=6),
            updated_at=datetime.utcnow() - timedelta(hours=1),
            officer_id=officer_user.id,
            officer_name=officer_user.full_name,
            officer_suggestions=officer_suggestion_text,
            officer_reviewed_at=datetime.utcnow() - timedelta(hours=1),
            ai_suggestions=[
                {
                    "rule_id": "OFFICER-REMARK",
                    "document": "Land Revenue Survey Boundary",
                    "detected_issue": "Discrepancy in Survey No. 42/1 identified during officer review.",
                    "suggestion": officer_suggestion_text,
                    "severity": "high"
                }
            ]
        )
        db.add(app4)
        db.commit()
        db.refresh(app4)

        # Upload docs
        for dt, fn in [
            ("Land Ownership Title Deed", "Land_Title_Deed.pdf"),
            ("Fire Safety NOC Certificate", "Fire_Safety_NOC_Valid.pdf"),
            ("Building Approved Plan & Structural Stability", "Building_Master_Plan.pdf"),
            ("Faculty Cadre & SFR Registry", "Faculty_Register.pdf"),
            ("Endowment Joint FDR Receipt", "Joint_FDR.pdf")
        ]:
            db.add(Document(
                application_id=app4.id,
                doc_type=dt,
                filename=fn,
                file_size=350000,
                sha256_hash=file_sha256(fn),
                version=1,
                is_latest=True,
                status="valid",
                verification_result="Pending clarification on survey number.",
                uploaded_at=datetime.utcnow() - timedelta(days=6),
                uploaded_by=inst_user.id
            ))

        # Add Finding for officer's directive
        f4_officer = Finding(
            application_id=app4.id,
            check_type="OFFICER_REVIEW",
            rule_id="OFFICER-REMARK",
            rule_description="Officer Scrutiny Directive & Action Required",
            severity=FindingSeverity.HIGH,
            status=FindingStatus.OPEN,
            finding_text=officer_suggestion_text,
            detected_issue="Land survey boundary discrepancy between deed and layout plan.",
            why_attention_needed="Clear contiguous campus title without boundary encumbrance is strictly required under AICTE APH Section 2.1.",
            recommended_action="Submit Tahsildar revenue mutation certificate and updated sketch.",
            ai_suggestion=officer_suggestion_text,
            officer_remark=officer_suggestion_text,
            reviewed_by=officer_user.id,
            reviewed_at=datetime.utcnow() - timedelta(hours=1),
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(f4_officer)

        act4 = ReviewAction(
            application_id=app4.id,
            officer_id=officer_user.id,
            officer_name=officer_user.full_name,
            officer_role="OFFICER",
            action_type="OFFICER_SUGGESTIONS_SENT",
            comments=officer_suggestion_text,
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(act4)

        notif4 = Notification(
            user_id=inst_user.id,
            application_id=app4.id,
            title="Officer Review: Suggestions & Rectification Required",
            message=f"AICTE Officer Dr. Priya Sharma reviewed Application #APP-2026-0004 and requested changes: {officer_suggestion_text}",
            type="DEFICIENCY_ALERT",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(notif4)
        db.commit()

    db.close()
    print("Seed complete: Unified roles, standard rules, realistic sample applications, and certificates seeded successfully!")


if __name__ == "__main__":
    seed()
