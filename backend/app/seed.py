"""
Seed script: Creates tables and loads the 5 official roles, standard statutory rules, and demo accounts.
Run: python -m app.seed
"""
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Application, Document, Finding, ComplianceCheck, AuditEvent, RegulatoryRule,
    UserRole, AppStatus, FindingSeverity, FindingStatus
)
from app.security import get_password_hash
from datetime import datetime, timedelta
import random, hashlib, string


def random_hash():
    return hashlib.sha256(''.join(random.choices(string.ascii_letters, k=32)).encode()).hexdigest()


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # --- 1. Seed or Update the 5 Official Demo Accounts ---
    demo_users = [
        {
            "email": "institution@example.com",
            "full_name": "ABC Engineering College",
            "role": UserRole.INSTITUTION.value,
            "pass": "inst123"
        },
        {
            "email": "verification@aicte.gov.in",
            "full_name": "Dr. Priya Sharma (Verification Officer)",
            "role": UserRole.VERIFICATION_OFFICER.value,
            "pass": "officer123"
        },
        {
            "email": "compliance@aicte.gov.in",
            "full_name": "Prof. Rajesh Deshmukh (Compliance Reviewer)",
            "role": UserRole.COMPLIANCE_REVIEWER.value,
            "pass": "reviewer123"
        },
        {
            "email": "decision@aicte.gov.in",
            "full_name": "Dr. Anil Sahasrabudhe (Authorized Decision-Maker)",
            "role": UserRole.DECISION_MAKER.value,
            "pass": "decision123"
        },
        {
            "email": "admin@aicte.gov.in",
            "full_name": "Sanjay Verma (System Administrator)",
            "role": UserRole.ADMIN.value,
            "pass": "admin123"
        }
    ]

    for u_data in demo_users:
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if existing:
            existing.role = u_data["role"]
            existing.full_name = u_data["full_name"]
            existing.hashed_password = get_password_hash(u_data["pass"])
            existing.is_active = True
        else:
            new_u = User(
                email=u_data["email"],
                full_name=u_data["full_name"],
                role=u_data["role"],
                hashed_password=get_password_hash(u_data["pass"]),
                is_active=True
            )
            db.add(new_u)
    db.commit()

    admin_user = db.query(User).filter(User.role == UserRole.ADMIN.value).first()

    # --- 2. Seed Default APH Regulatory Checklist & Rules ---
    statutory_rules = [
        {
            "rule_id": "APH-2.1",
            "rule_name": "Infrastructure & Land Area",
            "category": "Land & Building",
            "description": "Clear title ownership of contiguous land parcel meeting minimum prescribed acreage for engineering/polytechnic campus.",
            "required_value": "5.0 Acres Contiguous",
            "severity": "critical"
        },
        {
            "rule_id": "APH-3.4",
            "rule_name": "Faculty & Cadre Ratio",
            "category": "Human Resources",
            "description": "Student to Faculty Ratio (SFR) and Professor / Associate / Assistant cadre ratio compliance.",
            "required_value": "1:20 SFR required (1:2:6 Cadre Ratio)",
            "severity": "high"
        },
        {
            "rule_id": "APH-4.2",
            "rule_name": "Fire & Life Safety Clearance",
            "category": "Statutory Safety",
            "description": "Official Fire Safety NOC issued by State Fire Services Department without conditional restrictions.",
            "required_value": "Valid Permanent/Renewed NOC",
            "severity": "critical"
        },
        {
            "rule_id": "APH-5.1",
            "rule_name": "Approved Building & Structural Plan",
            "category": "Infrastructure",
            "description": "Competent municipal or town planning authority approved structural building layout blueprint.",
            "required_value": "Approved Town Planning Drawing",
            "severity": "high"
        },
        {
            "rule_id": "APH-6.3",
            "rule_name": "Endowment & Financial FDR",
            "category": "Finance",
            "description": "Joint Fixed Deposit Receipt (FDR) created in the name of AICTE and Society for institutional corpus.",
            "required_value": "₹50 Lakhs Joint Fixed Deposit",
            "severity": "medium"
        }
    ]

    for r_data in statutory_rules:
        existing_rule = db.query(RegulatoryRule).filter(RegulatoryRule.rule_id == r_data["rule_id"]).first()
        if not existing_rule:
            db.add(RegulatoryRule(
                rule_id=r_data["rule_id"],
                rule_name=r_data["rule_name"],
                category=r_data["category"],
                description=r_data["description"],
                required_value=r_data["required_value"],
                severity=r_data["severity"],
                is_active=True,
                created_by=admin_user.id if admin_user else None
            ))
    db.commit()

    # --- 3. Seed the 3 Problem Statement Sample Applications ---
    inst_user = db.query(User).filter(User.role == UserRole.INSTITUTION.value).first()
    officer_user = db.query(User).filter(User.role == UserRole.VERIFICATION_OFFICER.value).first()
    reviewer_user = db.query(User).filter(User.role == UserRole.COMPLIANCE_REVIEWER.value).first()
    decision_user = db.query(User).filter(User.role == UserRole.DECISION_MAKER.value).first()

    samples = [
        {
            "application_id": "APP-2001",
            "institution_name": "Apex Institute of Technology",
            "institution_type": "Engineering & Technology",
            "category": "Extension of Approval (EoA)",
            "region": "Western",
            "state": "Maharashtra",
            "city": "Pune",
            "applied_for": "B.Tech Computer Science, Mechanical, Civil & ECE (Intake 600)",
            "status": "cleared",
            "current_stage": "completed",
            "scrutiny_score": 96.0,
            "verification_status": "verified",
            "verification_remarks": "All 5 statutory documents verified against official issuing authorities. Land contiguous, fire NOC active.",
            "compliance_recommendation": "Approval Recommended",
            "final_decision": "CLEARED",
            "decision_order_no": "AICTE/EOA/2026/W-10928",
            "decision_remarks": "Statutory extension granted for Academic Year 2026-27 upon complete evidence verification.",
            "docs": [
                {
                    "doc_type": "Land Title & Ownership Deed",
                    "filename": "apex_land_registered_deed.pdf",
                    "status": "verified",
                    "sha256_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.98,
                        "pages": 14,
                        "campus_area": "5.20 Acres",
                        "contiguous": True,
                        "khasra_survey_no": "Plot 402/1A, Haveli",
                        "issuing_authority": "Office of the Sub-Registrar, Haveli, Pune",
                        "registration_date": "2022-04-14",
                        "encumbrance_status": "Nil / Non-encumbered",
                        "authorized_source_verification": {
                            "source": "State Revenue Dept / Mahabhulekh Portal",
                            "status": "MATCHED",
                            "registry_id": "MH-PN-2022-4021A",
                            "verified_at": "2026-03-01T10:15:00Z"
                        }
                    }
                },
                {
                    "doc_type": "Fire & Life Safety NOC",
                    "filename": "apex_fire_safety_clearance.pdf",
                    "status": "verified",
                    "sha256_hash": "b2c3d4e5f6a10718293a4b5c6d7e8f90123456789abcdef0123456789abcdef1",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.99,
                        "pages": 3,
                        "certificate_no": "PFS/NOC/2024/8891",
                        "issue_date": "2024-02-12",
                        "validity_expiry": "2027-02-11",
                        "issuing_authority": "Directorate of Maharashtra Fire Services, Pune Division",
                        "status": "Valid & Unexpired",
                        "authorized_source_verification": {
                            "source": "State Fire Services Inspection Portal",
                            "status": "VALID",
                            "dispatch_no": "MH-PFS-8891",
                            "renewal_due": "2027-02-11"
                        }
                    }
                },
                {
                    "doc_type": "Approved Building & Structural Plan",
                    "filename": "apex_approved_building_blueprint.pdf",
                    "status": "verified",
                    "sha256_hash": "c3d4e5f6a1b20718293a4b5c6d7e8f90123456789abcdef0123456789abcdef2",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.96,
                        "pages": 8,
                        "sanction_no": "PMC/BP/2023/1102",
                        "built_up_area": "12,450 sq.m",
                        "carpet_area": "9,820 sq.m",
                        "issuing_authority": "Pune Municipal Corporation (Town Planning Dept)",
                        "structural_safety_certified": True,
                        "authorized_source_verification": {
                            "source": "Municipal Town Planning Sanction Repository",
                            "status": "APPROVED",
                            "permit_status": "Occupancy & Sanction Valid"
                        }
                    }
                },
                {
                    "doc_type": "Faculty Master Roster & Cadre List",
                    "filename": "apex_faculty_master_list.pdf",
                    "status": "verified",
                    "sha256_hash": "d4e5f6a1b2c30718293a4b5c6d7e8f90123456789abcdef0123456789abcdef3",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.97,
                        "pages": 6,
                        "total_faculty": 30,
                        "student_intake": 600,
                        "sfr_ratio": "1:20.0",
                        "cadre_breakdown": {"Professors": 4, "Associate Professors": 8, "Assistant Professors": 18},
                        "phd_holders": 16,
                        "authorized_source_verification": {
                            "source": "University Faculty Database & AICTE Faculty ID Registry",
                            "status": "VERIFIED_ACTIVE"
                        }
                    }
                },
                {
                    "doc_type": "Joint Fixed Deposit Receipt (FDR)",
                    "filename": "apex_fdr_corpus_deposit.pdf",
                    "status": "verified",
                    "sha256_hash": "e5f6a1b2c3d40718293a4b5c6d7e8f90123456789abcdef0123456789abcdef4",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.99,
                        "pages": 2,
                        "fdr_number": "SBI/FDR/2023/90182",
                        "bank_name": "State Bank of India, Shivaji Nagar Branch",
                        "deposit_amount": "₹50,00,000",
                        "maturity_period": "8 Years Auto-Renewable",
                        "joint_holders": "Apex Education Trust & Regional Officer AICTE Western Region",
                        "authorized_source_verification": {
                            "source": "Core Banking Bank Confirmation System",
                            "status": "CONFIRMED_LIEN_AICTE"
                        }
                    }
                }
            ],
            "findings": [],
            "checks": [
                {"rule_id": "APH-2.1", "rule_name": "Infrastructure & Land Area", "category": "Land & Building", "result": "pass", "details": "Land area 5.20 Acres exceeds minimum 5.0 Acres norm. Contiguous ownership verified with Sub-Registrar.", "evidence_value": "5.20 Acres Contiguous (Deed #402/1A)", "required_value": "5.0 Acres Contiguous"},
                {"rule_id": "APH-3.4", "rule_name": "Faculty & Cadre Ratio", "category": "Human Resources", "result": "pass", "details": "30 faculty members for 600 student intake satisfies 1:20 SFR with prescribed 1:2:4 cadre ratio.", "evidence_value": "1:20 SFR (30 Verified Teachers)", "required_value": "1:20 SFR required"},
                {"rule_id": "APH-4.2", "rule_name": "Fire & Life Safety Clearance", "category": "Statutory Safety", "result": "pass", "details": "Unconditional Fire NOC valid up to 11-Feb-2027 issued by State Directorate of Fire Services.", "evidence_value": "PFS/NOC/2024/8891 (Valid to Feb 2027)", "required_value": "Valid Permanent/Renewed NOC"},
                {"rule_id": "APH-5.1", "rule_name": "Approved Building & Structural Plan", "category": "Infrastructure", "result": "pass", "details": "Municipal approved structural drawing with 12,450 sq.m built-up area matches approved intake.", "evidence_value": "Sanction PMC/BP/2023/1102 (12,450 sq.m)", "required_value": "Approved Town Planning Drawing"},
                {"rule_id": "APH-6.3", "rule_name": "Endowment & Financial FDR", "category": "Finance", "result": "pass", "details": "Joint FDR of ₹50,00,000 created with AICTE Western Region under 8-year statutory lien.", "evidence_value": "₹50,00,000 Joint SBI Deposit", "required_value": "₹50 Lakhs Joint Fixed Deposit"}
            ]
        },
        {
            "application_id": "APP-2002",
            "institution_name": "Greenfield Polytechnic College",
            "institution_type": "Polytechnic / Diploma",
            "category": "New Programme / Intake Extension",
            "region": "South-Western",
            "state": "Karnataka",
            "city": "Bengaluru",
            "applied_for": "Diploma Mechanical, Civil, Electrical (Intake 600)",
            "status": "deficiency",
            "current_stage": "submission",
            "scrutiny_score": 48.0,
            "verification_status": "evidence_requested",
            "verification_remarks": "Critical statutory deficiencies detected: Missing Fire Safety NOC and Land Area cross-document discrepancy.",
            "compliance_recommendation": "Deficiency Notice Recommended",
            "final_decision": "DEFICIENCY",
            "decision_order_no": "AICTE/DEF/2026/SW-4019",
            "decision_remarks": "Deficiency memo dispatched. Institution instructed to furnish compliant Fire NOC and rectified land deed within 15 calendar days.",
            "docs": [
                {
                    "doc_type": "Land Title & Ownership Deed",
                    "filename": "greenfield_land_deed.pdf",
                    "status": "verified",
                    "sha256_hash": "f6a1b2c3d4e50718293a4b5c6d7e8f90123456789abcdef0123456789abcdef5",
                    "verification_result": "INCONSISTENCY_FLAGGED",
                    "extracted_data": {
                        "confidence": 0.95,
                        "pages": 11,
                        "campus_area": "4.10 Acres",
                        "contiguous": True,
                        "khasra_survey_no": "Sy No. 88/2, Devanahalli",
                        "issuing_authority": "Sub-Registrar Office, Devanahalli, Bengaluru",
                        "registration_date": "2021-08-19",
                        "authorized_source_verification": {
                            "source": "Karnataka Bhoomi Land Records Portal",
                            "status": "MATCHED",
                            "registry_id": "KA-BLR-DEV-882",
                            "verified_at": "2026-03-02T11:20:00Z"
                        }
                    }
                },
                {
                    "doc_type": "Approved Building & Structural Plan",
                    "filename": "greenfield_building_sanction.pdf",
                    "status": "verified",
                    "sha256_hash": "a2b3c4d5e6f10718293a4b5c6d7e8f90123456789abcdef0123456789abcdef6",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.94,
                        "pages": 7,
                        "sanction_no": "BBMP/ADDL/2022/904",
                        "built_up_area": "8,900 sq.m",
                        "issuing_authority": "BBMP Town Planning Department",
                        "authorized_source_verification": {
                            "source": "BBMP Building Permission System",
                            "status": "APPROVED"
                        }
                    }
                },
                {
                    "doc_type": "Faculty Master Roster & Cadre List",
                    "filename": "greenfield_staff_roster.pdf",
                    "status": "verified",
                    "sha256_hash": "b3c4d5e6f1a20718293a4b5c6d7e8f90123456789abcdef0123456789abcdef7",
                    "verification_result": "DEFICIENT_RATIO",
                    "extracted_data": {
                        "confidence": 0.96,
                        "pages": 4,
                        "total_faculty": 22,
                        "student_intake": 600,
                        "sfr_ratio": "1:27.2",
                        "cadre_breakdown": {"Professors": 1, "Associate Professors": 4, "Assistant Professors": 17},
                        "authorized_source_verification": {
                            "source": "DTE Karnataka Faculty Database",
                            "status": "VERIFIED_SHORTAGE"
                        }
                    }
                }
            ],
            "findings": [
                {
                    "rule_id": "APH-4.2",
                    "rule_description": "Statutory Safety: Mandatory Fire & Life Safety Clearance",
                    "severity": FindingSeverity.CRITICAL,
                    "status": FindingStatus.OPEN,
                    "finding_text": "Missing Statutory Document: Fire Safety NOC is NOT uploaded. Non-negotiable mandatory requirement under AICTE Approval Process Handbook Chapter II, Section 4.2.",
                    "officer_remark": "Uploaded dossier contains zero proof of Fire Services NOC. High safety risk."
                },
                {
                    "rule_id": "APH-2.1",
                    "rule_description": "Cross-Document Inconsistency: Declared Campus Acreage vs Extracted Deed Area",
                    "severity": FindingSeverity.HIGH,
                    "status": FindingStatus.OPEN,
                    "finding_text": "Inconsistency Detected: Application Form claims 5.20 Acres, but OCR extraction from Sub-Registrar Deed reveals only 4.10 Acres (-1.10 Acre shortage below mandatory 5.0 Acre norm).",
                    "officer_remark": "Factual mismatch between application claim and title document."
                },
                {
                    "rule_id": "APH-3.4",
                    "rule_description": "Human Resources: Student-Faculty Ratio Norm Violation",
                    "severity": FindingSeverity.HIGH,
                    "status": FindingStatus.OPEN,
                    "finding_text": "Student to Faculty Ratio is 1:27.2 (22 teachers for 600 intake), which violates the statutory maximum 1:20 limit. Minimum 30 full-time faculty required.",
                    "officer_remark": "Shortfall of 8 faculty members. Deficient cadre composition."
                },
                {
                    "rule_id": "APH-6.3",
                    "rule_description": "Statutory Finance: Joint Fixed Deposit Receipt (FDR) Missing",
                    "severity": FindingSeverity.MEDIUM,
                    "status": FindingStatus.OPEN,
                    "finding_text": "Missing Statutory Document: Joint FDR Certificate of ₹50 Lakhs in favor of AICTE has not been submitted.",
                    "officer_remark": "Corpus deposit certificate pending upload."
                }
            ],
            "checks": [
                {"rule_id": "APH-2.1", "rule_name": "Infrastructure & Land Area", "category": "Land & Building", "result": "fail", "details": "Extracted land area of 4.10 Acres falls short of mandatory 5.0 Acres norm. Inconsistency with application claim of 5.20 Acres.", "evidence_value": "4.10 Acres (Deed Sy No. 88/2)", "required_value": "5.0 Acres Contiguous"},
                {"rule_id": "APH-3.4", "rule_name": "Faculty & Cadre Ratio", "category": "Human Resources", "result": "fail", "details": "Current SFR 1:27.2 (22 faculty for 600 intake) exceeds prescribed threshold of 1:20.", "evidence_value": "1:27.2 SFR (Shortfall of 8 faculty)", "required_value": "1:20 SFR required"},
                {"rule_id": "APH-4.2", "rule_name": "Fire & Life Safety Clearance", "category": "Statutory Safety", "result": "fail", "details": "Fire Safety NOC certificate completely missing from supporting documentation dossier.", "evidence_value": "MISSING DOCUMENT", "required_value": "Valid Permanent/Renewed NOC"},
                {"rule_id": "APH-5.1", "rule_name": "Approved Building & Structural Plan", "category": "Infrastructure", "result": "pass", "details": "BBMP approved structural blueprint verified for 8,900 sq.m campus area.", "evidence_value": "BBMP/ADDL/2022/904 (8,900 sq.m)", "required_value": "Approved Town Planning Drawing"},
                {"rule_id": "APH-6.3", "rule_name": "Endowment & Financial FDR", "category": "Finance", "result": "fail", "details": "Joint FDR certificate of ₹50 Lakhs not uploaded in application package.", "evidence_value": "MISSING DOCUMENT", "required_value": "₹50 Lakhs Joint Fixed Deposit"}
            ]
        },
        {
            "application_id": "APP-2003",
            "institution_name": "Modern Institute of Technical Studies",
            "institution_type": "Engineering & Technology",
            "category": "Extension of Approval & Intake Boost",
            "region": "Northern",
            "state": "Delhi NCR",
            "city": "New Delhi",
            "applied_for": "B.Tech Computer Science, Artificial Intelligence & Data Science (Intake 480)",
            "status": "under_review",
            "current_stage": "doc_verification",
            "scrutiny_score": 35.0,
            "verification_status": "evidence_requested",
            "verification_remarks": "CRITICAL FORENSIC FLAGS: File hash collision across multiple institutions and digital tamper artifacts detected in Fire NOC.",
            "compliance_recommendation": "Adverse Action Recommended",
            "final_decision": None,
            "decision_order_no": None,
            "decision_remarks": None,
            "docs": [
                {
                    "doc_type": "Land Title & Ownership Deed",
                    "filename": "modern_land_title.pdf",
                    "status": "verified",
                    "sha256_hash": "c4d5e6f1a2b30718293a4b5c6d7e8f90123456789abcdef0123456789abcdef8",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.96,
                        "pages": 12,
                        "campus_area": "5.05 Acres",
                        "contiguous": True,
                        "khasra_survey_no": "Khasra 94/11, Najafgarh",
                        "issuing_authority": "Sub-Registrar Office, South West Delhi",
                        "authorized_source_verification": {
                            "source": "Delhi Revenue Bhulekh Portal",
                            "status": "MATCHED"
                        }
                    }
                },
                {
                    "doc_type": "Fire & Life Safety NOC",
                    "filename": "modern_fire_clearance_altered.pdf",
                    "status": "flagged",
                    "sha256_hash": "77a88b99c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef99",
                    "verification_result": "ANOMALY_FLAG_DIGITAL_TAMPER",
                    "extracted_data": {
                        "confidence": 0.72,
                        "pages": 2,
                        "certificate_no": "DFS/HQ/2020/5512-MOD",
                        "issue_date": "2020-03-10",
                        "claimed_validity": "2027-03-09",
                        "issuing_authority": "Delhi Fire Service Headquarters",
                        "forensic_analysis": {
                            "tamper_detected": True,
                            "tamper_confidence": 0.94,
                            "flags": [
                                "PDF Creator Metadata: 'Adobe Photoshop 2024 (Macintosh)' detected on statutory certificate",
                                "Timestamp Anomaly: File created in August 2024, but certificate claims official issuance in March 2020",
                                "Optical Font Inconsistency: Certificate number and expiration date show font variance and resampling artifacts"
                            ]
                        },
                        "authorized_source_verification": {
                            "source": "Delhi Fire Service Public Portal API",
                            "status": "RECORD_NOT_FOUND_OR_EXPIRED",
                            "verified_at": "2026-03-03T09:40:00Z"
                        }
                    }
                },
                {
                    "doc_type": "Approved Building & Structural Plan",
                    "filename": "modern_building_plan.pdf",
                    "status": "verified",
                    "sha256_hash": "d5e6f1a2b3c40718293a4b5c6d7e8f90123456789abcdef0123456789abcdef9",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.95,
                        "pages": 6,
                        "sanction_no": "MCD/B-SZ/2021/782",
                        "built_up_area": "10,200 sq.m",
                        "issuing_authority": "Municipal Corporation of Delhi (MCD)",
                        "authorized_source_verification": {
                            "source": "MCD Online Sanction Portal",
                            "status": "APPROVED"
                        }
                    }
                },
                {
                    "doc_type": "Faculty Master Roster & Cadre List",
                    "filename": "modern_faculty_roster.pdf",
                    "status": "verified",
                    "sha256_hash": "e6f1a2b3c4d50718293a4b5c6d7e8f90123456789abcdef0123456789abcdefa",
                    "verification_result": "OFFICIAL_REGISTRY_VERIFIED",
                    "extracted_data": {
                        "confidence": 0.96,
                        "pages": 5,
                        "total_faculty": 25,
                        "student_intake": 480,
                        "sfr_ratio": "1:19.2",
                        "authorized_source_verification": {
                            "source": "State Technical Board Registry",
                            "status": "MATCHED"
                        }
                    }
                },
                {
                    "doc_type": "Joint Fixed Deposit Receipt (FDR)",
                    "filename": "modern_fdr_cloned_receipt.pdf",
                    "status": "flagged",
                    "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    "verification_result": "ANOMALY_FLAG_HASH_COLLISION",
                    "extracted_data": {
                        "confidence": 0.65,
                        "pages": 1,
                        "fdr_number": "PNB/FDR/2021/1109",
                        "deposit_amount": "₹50,00,000",
                        "forensic_analysis": {
                            "hash_collision_detected": True,
                            "duplicate_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                            "prior_submission_detected": {
                                "conflicting_application": "APP-2019-9921",
                                "conflicting_institution": "Pratap College of Polytechnic, Rohtak",
                                "original_submission_date": "2021-06-18"
                            },
                            "flags": [
                                "National Repository Match: Exact byte-for-byte SHA-256 hash was submitted in 2021 by another college",
                                "Suspected fraudulent recycling of FDR deposit receipt across distinct entities"
                            ]
                        },
                        "authorized_source_verification": {
                            "source": "Banking Verification Gateway",
                            "status": "LIEN_CONFLICT_DETECTED"
                        }
                    }
                }
            ],
            "findings": [
                {
                    "rule_id": "APH-4.2",
                    "rule_description": "Forensic Tamper Detection: Digital Alteration & Metadata Mismatch in Fire NOC",
                    "severity": FindingSeverity.CRITICAL,
                    "status": FindingStatus.OPEN,
                    "finding_text": "CRITICAL TAMPER ALERT: Fire Safety NOC metadata proves digital creation via Adobe Photoshop 2024. Expiration date and certificate number show optical clone-stamp artifacts. External registry check indicates no active NOC on file.",
                    "officer_remark": "Clear indicators of forged certificate. Awaiting human statutory review."
                },
                {
                    "rule_id": "APH-6.3",
                    "rule_description": "National Fraud Check: Cross-Institutional SHA-256 Hash Collision",
                    "severity": FindingSeverity.CRITICAL,
                    "status": FindingStatus.OPEN,
                    "finding_text": "FRAUDULENT RECYCLING DETECTED: The submitted FDR certificate SHA-256 hash is an exact byte clone of a document filed in 2021 by Pratap College of Polytechnic (APP-2019-9921). Duplicate financial guarantee reused.",
                    "officer_remark": "Byte-hash collision confirmed across AICTE central database."
                }
            ],
            "checks": [
                {"rule_id": "APH-2.1", "rule_name": "Infrastructure & Land Area", "category": "Land & Building", "result": "pass", "details": "5.05 Acres contiguous land verified against Delhi Revenue portal.", "evidence_value": "5.05 Acres Contiguous", "required_value": "5.0 Acres Contiguous"},
                {"rule_id": "APH-3.4", "rule_name": "Faculty & Cadre Ratio", "category": "Human Resources", "result": "pass", "details": "1:19.2 SFR (25 faculty for 480 intake) conforms to prescribed 1:20 norm.", "evidence_value": "1:19.2 SFR Compliant", "required_value": "1:20 SFR required"},
                {"rule_id": "APH-4.2", "rule_name": "Fire & Life Safety Clearance", "category": "Statutory Safety", "result": "fail", "details": "Statutory Fire NOC rejected due to digital tampering and unauthorized modification.", "evidence_value": "TAMPERED / FAKE NOC", "required_value": "Valid Permanent/Renewed NOC"},
                {"rule_id": "APH-5.1", "rule_name": "Approved Building & Structural Plan", "category": "Infrastructure", "result": "pass", "details": "MCD sanctioned structural layout blueprint verified for 10,200 sq.m campus.", "evidence_value": "MCD/B-SZ/2021/782 (10,200 sq.m)", "required_value": "Approved Town Planning Drawing"},
                {"rule_id": "APH-6.3", "rule_name": "Endowment & Financial FDR", "category": "Finance", "result": "fail", "details": "FDR rejected: Duplicate hash collision detected with external college submission.", "evidence_value": "RECYCLED / DUPLICATE FDR", "required_value": "₹50 Lakhs Joint Fixed Deposit"}
            ]
        }
    ]

    for s in samples:
        app_obj = db.query(Application).filter(Application.application_id == s["application_id"]).first()
        if not app_obj:
            app_obj = Application(
                application_id=s["application_id"],
                institution_name=s["institution_name"],
                institution_type=s["institution_type"],
                category=s["category"],
                region=s["region"],
                state=s["state"],
                city=s["city"],
                applied_for=s["applied_for"],
                status=s["status"],
                current_stage=s["current_stage"],
                submitted_by=inst_user.id if inst_user else None,
                submitted_at=datetime.utcnow() - timedelta(days=5),
                updated_at=datetime.utcnow(),
                scrutiny_score=s["scrutiny_score"],
                verification_status=s["verification_status"],
                verification_officer_id=officer_user.id if officer_user else None,
                verification_remarks=s["verification_remarks"],
                verification_completed_at=datetime.utcnow() - timedelta(days=2),
                compliance_status="completed",
                compliance_reviewer_id=reviewer_user.id if reviewer_user else None,
                compliance_recommendation=s["compliance_recommendation"],
                compliance_remarks="Compliance scrutiny executed against APH 2026-27 rules.",
                compliance_completed_at=datetime.utcnow() - timedelta(days=1),
                decision_maker_id=decision_user.id if decision_user and s["final_decision"] else None,
                final_decision=s["final_decision"],
                decision_remarks=s["decision_remarks"],
                decision_order_no=s["decision_order_no"],
                decision_at=datetime.utcnow() if s["final_decision"] else None
            )
            db.add(app_obj)
            db.commit()
            db.refresh(app_obj)
        else:
            app_obj.institution_name = s["institution_name"]
            app_obj.institution_type = s["institution_type"]
            app_obj.category = s["category"]
            app_obj.region = s["region"]
            app_obj.state = s["state"]
            app_obj.city = s["city"]
            app_obj.applied_for = s["applied_for"]
            app_obj.status = s["status"]
            app_obj.current_stage = s["current_stage"]
            app_obj.scrutiny_score = s["scrutiny_score"]
            app_obj.verification_status = s["verification_status"]
            app_obj.verification_remarks = s["verification_remarks"]
            app_obj.compliance_recommendation = s["compliance_recommendation"]
            app_obj.final_decision = s["final_decision"]
            app_obj.decision_remarks = s["decision_remarks"]
            app_obj.decision_order_no = s["decision_order_no"]
            db.commit()

        # Documents
        for d in s["docs"]:
            existing_doc = db.query(Document).filter(
                Document.application_id == app_obj.id,
                Document.doc_type == d["doc_type"]
            ).first()
            if not existing_doc:
                new_doc = Document(
                    application_id=app_obj.id,
                    doc_type=d["doc_type"],
                    filename=d["filename"],
                    file_path=f"storage/{app_obj.application_id}/{d['filename']}",
                    file_size=random.randint(120000, 850000),
                    sha256_hash=d["sha256_hash"],
                    status=d["status"],
                    verification_result=d["verification_result"],
                    extracted_data=d["extracted_data"],
                    uploaded_at=datetime.utcnow() - timedelta(days=4)
                )
                db.add(new_doc)
            else:
                existing_doc.filename = d["filename"]
                existing_doc.sha256_hash = d["sha256_hash"]
                existing_doc.status = d["status"]
                existing_doc.verification_result = d["verification_result"]
                existing_doc.extracted_data = d["extracted_data"]
        db.commit()

        # Compliance checks
        for c in s["checks"]:
            existing_c = db.query(ComplianceCheck).filter(
                ComplianceCheck.application_id == app_obj.id,
                ComplianceCheck.rule_id == c["rule_id"]
            ).first()
            if not existing_c:
                new_c = ComplianceCheck(
                    application_id=app_obj.id,
                    rule_id=c["rule_id"],
                    rule_name=c["rule_name"],
                    category=c["category"],
                    result=c["result"],
                    details=c["details"],
                    evidence_value=c["evidence_value"],
                    required_value=c["required_value"],
                    checked_at=datetime.utcnow() - timedelta(days=2)
                )
                db.add(new_c)
            else:
                existing_c.result = c["result"]
                existing_c.details = c["details"]
                existing_c.evidence_value = c["evidence_value"]
                existing_c.required_value = c["required_value"]
        db.commit()

        # Findings
        for f in s["findings"]:
            existing_f = db.query(Finding).filter(
                Finding.application_id == app_obj.id,
                Finding.rule_id == f["rule_id"]
            ).first()
            if not existing_f:
                new_f = Finding(
                    application_id=app_obj.id,
                    rule_id=f["rule_id"],
                    rule_description=f["rule_description"],
                    severity=f["severity"],
                    status=f["status"],
                    finding_text=f["finding_text"],
                    officer_remark=f.get("officer_remark"),
                    created_at=datetime.utcnow() - timedelta(days=2)
                )
                db.add(new_f)
            else:
                existing_f.finding_text = f["finding_text"]
                existing_f.officer_remark = f.get("officer_remark")
                existing_f.severity = f["severity"]
                existing_f.status = f["status"]
        db.commit()

        # Audit events
        existing_audits = db.query(AuditEvent).filter(AuditEvent.application_id == app_obj.id).count()
        if existing_audits == 0:
            events = [
                ("Application Submitted", "application", {"portal": "AICTE National Portal", "institution": s["institution_name"]}, -5),
                ("Documents Ingested & SHA-256 Hashed", "document", {"count": len(s["docs"])}, -4),
                ("OCR Data Extracted & Validated", "validation", {"engine": "Multi-Modal AICTE Extraction Suite"}, -3),
                ("Document Forensic Anomaly Scan Completed", "forensics", {"score": s["scrutiny_score"]}, -2),
                ("Authorized Registry Cross-Verification Completed", "verification", {"sources": ["Bhulekh", "Fire Services", "MCD/PMC"]}, -2),
                ("Configurable Compliance Rules Checked", "compliance", {"checks": len(s["checks"])}, -1),
            ]
            if s["final_decision"]:
                events.append((f"Official Statutory Decree: {s['final_decision']}", "decision", {"order_no": s["decision_order_no"], "remarks": s["decision_remarks"]}, 0))

            for act, et, det, day_offset in events:
                db.add(AuditEvent(
                    application_id=app_obj.id,
                    actor_name="AICTE Autonomous Scrutiny Engine" if "Engine" in act or "Ingested" in act or "OCR" in act else "Dr. Anil Sahasrabudhe (Authorized AICTE Officer)",
                    action=act,
                    entity_type=et,
                    entity_id=s["application_id"],
                    details=det,
                    timestamp=datetime.utcnow() + timedelta(days=day_offset, hours=2)
                ))
            db.commit()

    print("Seed completed successfully! 3 rich sample applications (Apex, Greenfield, Modern) & statutory rules active.")
    db.close()


if __name__ == "__main__":
    seed()

