from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum


class UserRole(str, enum.Enum):
    INSTITUTION = "institution"                     # 1. Institution User
    OFFICER = "officer"                             # 2. Unified AICTE Scrutiny & Approval Officer
    ADMIN = "admin"                                 # 3. System Administrator
    
    # Backwards compatibility aliases
    SCRUTINY_OFFICER = "scrutiny_officer"
    COMPLIANCE_OFFICER = "compliance_officer"
    CHAIRMAN = "chairman"
    VERIFICATION_OFFICER = "verification_officer"
    COMPLIANCE_REVIEWER = "compliance_reviewer"
    DECISION_MAKER = "decision_maker"


class AppStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    VALIDATING = "VALIDATING"
    ACTION_REQUIRED = "ACTION_REQUIRED"             # Deficiencies found (by AI or Officer) - institute must fix
    READY_FOR_REVIEW = "READY_FOR_REVIEW"           # AI Validation passed - ready for officer review
    UNDER_OFFICER_REVIEW = "UNDER_OFFICER_REVIEW"   # Under officer review
    APPROVED = "APPROVED"                           # Approved by Officer & Certificate Issued
    REJECTED = "REJECTED"                           # Rejected by Officer
    
    # Backwards compatibility aliases
    UNDER_SCRUTINY = "UNDER_SCRUTINY"
    UNDER_COMPLIANCE_REVIEW = "UNDER_COMPLIANCE_REVIEW"
    CLARIFICATION_REQUESTED = "CLARIFICATION_REQUESTED"
    DECISION_RECORDED = "DECISION_RECORDED"


class FindingSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String(50), default="institution")
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Optional link to institution
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)

    applications = relationship("Application", back_populates="submitted_by_user", foreign_keys="Application.submitted_by")
    institution = relationship("Institution", back_populates="users", foreign_keys=[institution_id])
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Institution(Base):
    __tablename__ = "institutions"
    id = Column(Integer, primary_key=True, index=True)
    aicte_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    institution_type = Column(String(100), default="Engineering & Technology")
    category = Column(String(100), default="Private-Self-Financed")
    address = Column(Text, nullable=True)
    state = Column(String(100), default="Maharashtra")
    district = Column(String(100), default="Pune")
    pincode = Column(String(20), default="411057")
    contact_person = Column(String(150), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    university_affiliation = Column(String(255), default="State Technical University")
    established_year = Column(Integer, default=2004)
    campus_acres = Column(Float, default=5.0)
    total_intake = Column(Integer, default=360)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="institution", foreign_keys="User.institution_id")
    applications = relationship("Application", back_populates="institution", foreign_keys="Application.institution_id")
    aicte_master_record = relationship("AicteMasterRecord", back_populates="institution", uselist=False, cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String, unique=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    institution_name = Column(String, nullable=False)
    institution_type = Column(String, default="Engineering & Technology")
    category = Column(String, default="Extension of Approval (EoA)")
    academic_year = Column(String(50), default="2026-27")
    region = Column(String, default="Western")
    state = Column(String, default="Maharashtra")
    city = Column(String, default="Pune")
    applied_for = Column(String, default="Continuation of Technical Courses + Intake Verification")
    status = Column(String(50), default="DRAFT")
    submitted_by = Column(Integer, ForeignKey("users.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    scrutiny_score = Column(Float, default=0.0)

    # Workflow tracking
    current_stage = Column(String(50), default="submission") # submission, ready_for_review, scrutiny, compliance, decision, completed
    verification_status = Column(String(50), default="pending")
    verification_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verification_remarks = Column(Text, nullable=True)
    verification_completed_at = Column(DateTime, nullable=True)
    compliance_status = Column(String(50), default="pending")
    compliance_reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    compliance_recommendation = Column(Text, nullable=True)
    compliance_remarks = Column(Text, nullable=True)
    compliance_completed_at = Column(DateTime, nullable=True)
    decision_maker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    final_decision = Column(Text, nullable=True) # CLEARED, DEFICIENCY, REJECTED
    decision_remarks = Column(Text, nullable=True)
    decision_order_no = Column(String(100), nullable=True)
    decision_at = Column(DateTime, nullable=True)

    # Unified Officer & Approval Certificate tracking
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    officer_name = Column(String(150), nullable=True)
    officer_suggestions = Column(Text, nullable=True)  # Faults/suggestions sent by officer to institute
    officer_reviewed_at = Column(DateTime, nullable=True)
    certificate_issued = Column(Boolean, default=False)
    certificate_number = Column(String(100), nullable=True)
    certificate_url = Column(String(255), nullable=True)
    ai_suggestions = Column(JSON, nullable=True)  # Overall AI suggestions for the institute

    institution = relationship("Institution", back_populates="applications", foreign_keys=[institution_id])
    submitted_by_user = relationship("User", back_populates="applications", foreign_keys=[submitted_by])
    officer = relationship("User", foreign_keys=[officer_id])
    verification_officer = relationship("User", foreign_keys=[verification_officer_id])
    compliance_reviewer = relationship("User", foreign_keys=[compliance_reviewer_id])
    decision_maker = relationship("User", foreign_keys=[decision_maker_id])

    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="application", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="application", cascade="all, delete-orphan")
    compliance_checks = relationship("ComplianceCheck", back_populates="application", cascade="all, delete-orphan")
    validation_runs = relationship("ValidationRun", back_populates="application", cascade="all, delete-orphan")
    review_actions = relationship("ReviewAction", back_populates="application", cascade="all, delete-orphan")
    decision_record = relationship("DecisionRecord", back_populates="application", uselist=False, cascade="all, delete-orphan")
    authority_verifications = relationship("AuthorityVerification", back_populates="application", cascade="all, delete-orphan")
    infrastructure_evidence = relationship("InfrastructureEvidence", back_populates="application", cascade="all, delete-orphan")



class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    doc_type = Column(String)  # Land Ownership Title Deed, Fire Safety NOC, Building Plan, etc.
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    sha256_hash = Column(String)
    version = Column(Integer, default=1)
    is_latest = Column(Boolean, default=True)
    status = Column(String, default="pending")  # valid, deficient, flagged, pending, not_verifiable
    verification_result = Column(String, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    application_id = Column(Integer, ForeignKey("applications.id"))
    version_number = Column(Integer, default=1)
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    sha256_hash = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    extracted_data = Column(JSON, nullable=True)
    verification_result = Column(String, nullable=True)
    change_reason = Column(Text, nullable=True)

    document = relationship("Document", back_populates="versions")


class ValidationRun(Base):
    __tablename__ = "validation_runs"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    run_number = Column(Integer, default=1)
    status = Column(String(50)) # ACTION_REQUIRED, READY_FOR_REVIEW
    scrutiny_score = Column(Float, default=0.0)
    rule_version = Column(String(50), default="APH-2026.1")
    summary = Column(Text, nullable=True)
    passed_checks = Column(JSON, nullable=True)
    warnings = Column(JSON, nullable=True)
    external_unverified = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    application = relationship("Application", back_populates="validation_runs")


class Finding(Base):
    __tablename__ = "findings"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    validation_run_id = Column(Integer, ForeignKey("validation_runs.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    check_type = Column(String(50), nullable=True) # COMPLETENESS, EXTRACTION, CONSISTENCY, MANIPULATION, EXTERNAL_AUTH, COMPLIANCE
    rule_id = Column(String)
    rule_description = Column(Text)
    severity = Column(Enum(FindingSeverity, name="findingseverity", create_type=False), default=FindingSeverity.HIGH)
    status = Column(Enum(FindingStatus, name="findingstatus", create_type=False), default=FindingStatus.OPEN)
    finding_text = Column(Text)
    detected_issue = Column(Text, nullable=True)
    why_attention_needed = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    ai_suggestion = Column(Text, nullable=True) # LLM generated actionable guidance
    evidence = Column(JSON, nullable=True)
    page_number = Column(Integer, nullable=True)
    officer_remark = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="findings")


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    validation_run_id = Column(Integer, ForeignKey("validation_runs.id"), nullable=True)
    rule_id = Column(String)
    rule_name = Column(String)
    category = Column(String)
    result = Column(String)  # pass, fail, warning, not_verifiable
    details = Column(Text)
    evidence_value = Column(String, nullable=True)
    required_value = Column(String, nullable=True)
    rule_version = Column(String(50), default="APH-2026.1")
    checked_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="compliance_checks")


class RegulatoryRule(Base):
    __tablename__ = "regulatory_rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(50), unique=True, index=True, nullable=False)
    rule_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    required_value = Column(String(255), nullable=True)
    severity = Column(String(50), default="high")
    is_mandatory = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    version = Column(String(50), default="APH-2026.1")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReviewAction(Base):
    __tablename__ = "review_actions"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    officer_id = Column(Integer, ForeignKey("users.id"))
    officer_name = Column(String)
    officer_role = Column(String(50)) # SCRUTINY_OFFICER, COMPLIANCE_OFFICER, CHAIRMAN
    action_type = Column(String(50)) # OBSERVATION, CLARIFICATION_REQUESTED, FORWARDED_TO_COMPLIANCE, FORWARDED_TO_DECISION, DECISION_RECORDED
    comments = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="review_actions")


class DecisionRecord(Base):
    __tablename__ = "decision_records"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)
    decision_maker_id = Column(Integer, ForeignKey("users.id"))
    decision_maker_name = Column(String)
    decision = Column(String(50)) # CLEARED, DEFICIENCY, REJECTED
    reasons = Column(Text, nullable=False)
    order_number = Column(String(100), nullable=False)
    authority_designation = Column(String(150), default="Member Secretary, AICTE")
    decided_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="decision_record")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="DEFICIENCY_ALERT") # DEFICIENCY_ALERT, STATUS_CHANGE, CLARIFICATION_REQUEST, DECISION_RECORDED
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="audit_events")


class AicteMasterRecord(Base):
    """
    Authorized AICTE Central Repository Records for an Institution.
    Enables zero repeated manual checking by pre-validating against AICTE's institutional master data.
    """
    __tablename__ = "aicte_master_records"
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), unique=True)
    aicte_id = Column(String(50), unique=True, index=True, nullable=False)
    institution_name = Column(String, nullable=False)
    ter_payment = Column(JSON, nullable=True) # {receipt_no, amount, payment_date, bank_ref, status}
    previous_eoa = Column(JSON, nullable=True) # list of past approvals: [{year, status, order_number, date}]
    approved_programmes = Column(JSON, nullable=True) # [{program, course, sanctioned_intake}]
    total_sanctioned_intake = Column(Integer, default=360)
    accreditation_details = Column(JSON, nullable=True) # {nba, naac_grade, naac_cgpa, valid_till}
    faculty_epf_roster = Column(JSON, nullable=True) # {total_faculty, sfr_ratio, cadre_ratio, epf_compliance}
    past_deficiencies = Column(JSON, nullable=True) # list of past SSC/SAC committee deficiencies
    registered_campus_acres = Column(Float, default=5.0)
    registered_gps = Column(JSON, nullable=True) # {latitude, longitude, address}
    last_synced_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="aicte_master_record")


class AuthorityVerification(Base):
    """
    Official Issuing Authority Verification Record.
    Implements the statutory 6-state taxonomy:
    VERIFIED, MISMATCH_DETECTED, EXPIRED, VERIFICATION_PENDING, SOURCE_UNAVAILABLE, MANUAL_REVIEW_REQUIRED.
    """
    __tablename__ = "authority_verifications"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    authority_name = Column(String(150), nullable=False) # DigiLocker, State Fire Dept, Revenue Cadastre, University
    verification_type = Column(String(50), default="API_PORTAL") # API_PORTAL, QR_CODE, DIGITAL_SIGNATURE_DSC, URN_LOOKUP
    status = Column(String(50), default="VERIFICATION_PENDING") # VERIFIED, MISMATCH_DETECTED, EXPIRED, VERIFICATION_PENDING, SOURCE_UNAVAILABLE, MANUAL_REVIEW_REQUIRED
    urn_or_token = Column(String(150), nullable=True)
    source_url = Column(String(255), nullable=True)
    source_agency = Column(String(150), nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)
    response_payload = Column(JSON, nullable=True)
    discrepancy_details = Column(Text, nullable=True)
    is_conclusive = Column(Boolean, default=True)

    application = relationship("Application", back_populates="authority_verifications")
    document = relationship("Document")


class InfrastructureEvidence(Base):
    """
    Infrastructure Evidence & Computer Vision Compliance Record.
    Validates geo-tagged campus photos and architectural floor plans against APH norms.
    """
    __tablename__ = "infrastructure_evidence"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    evidence_type = Column(String(100), nullable=False) # PHOTO_COMPUTER_CENTER, PHOTO_LIBRARY, PHOTO_BARRIER_FREE_RAMP, PHOTO_FIRE_SAFETY, FLOOR_PLAN_PWD
    title = Column(String(200), nullable=False)
    file_path = Column(String(255), nullable=True)
    file_url = Column(String(255), nullable=True)
    extracted_gps = Column(JSON, nullable=True) # {latitude, longitude, altitude}
    distance_from_campus_meters = Column(Float, nullable=True)
    gps_verified = Column(Boolean, default=True)
    cv_detected_objects = Column(JSON, nullable=True) # [{label: "Computer Terminals", count: 45, confidence: 0.96}]
    compliance_status = Column(String(50), default="COMPLIANT_ADVISORY") # COMPLIANT_ADVISORY, DEFICIENCY_FLAGGED, PHYSICAL_INSPECTION_RECOMMENDED
    inspection_notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="infrastructure_evidence")

