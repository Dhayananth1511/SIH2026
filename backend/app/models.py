from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum


class UserRole(str, enum.Enum):
    INSTITUTION = "institution"                     # 1. Institution User
    VERIFICATION_OFFICER = "verification_officer"   # 2. Verification Officer
    COMPLIANCE_REVIEWER = "compliance_reviewer"     # 3. Compliance Reviewer
    DECISION_MAKER = "decision_maker"               # 4. Authorized AICTE Decision-Maker
    ADMIN = "admin"                                 # 5. System Administrator


class AppStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    DOC_VERIFIED = "doc_verified"
    COMPLIANCE_REVIEW = "compliance_review"
    DECISION_PENDING = "decision_pending"
    DEFICIENCY = "deficiency"
    CLEARED = "cleared"
    REJECTED = "rejected"


class FindingSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"
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
    applications = relationship("Application", back_populates="submitted_by_user", foreign_keys="Application.submitted_by")


class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String, unique=True, index=True)
    institution_name = Column(String, nullable=False)
    institution_type = Column(String)  # Engineering, Polytechnic, MBA
    category = Column(String)  # EoA, New Course, Intake Increase
    region = Column(String)
    state = Column(String)
    city = Column(String)
    applied_for = Column(String)
    status = Column(String(50), default="submitted")
    submitted_by = Column(Integer, ForeignKey("users.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    scrutiny_score = Column(Float, default=0.0)

    # 5-Stage Pipeline Workflow tracking
    current_stage = Column(String(50), default="submission") # submission, ai_validation, doc_verification, compliance_review, decision, completed
    verification_status = Column(String(50), default="pending") # pending, verified, evidence_requested
    verification_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verification_remarks = Column(Text, nullable=True)
    verification_completed_at = Column(DateTime, nullable=True)
    compliance_status = Column(String(50), default="pending") # pending, under_scrutiny, recommended_approval, recommended_deficiency, recommended_inspection
    compliance_reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    compliance_recommendation = Column(Text, nullable=True)
    compliance_remarks = Column(Text, nullable=True)
    compliance_completed_at = Column(DateTime, nullable=True)
    decision_maker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    final_decision = Column(Text, nullable=True) # CLEARED, DEFICIENCY, REJECTED
    decision_remarks = Column(Text, nullable=True)
    decision_order_no = Column(String(100), nullable=True)
    decision_at = Column(DateTime, nullable=True)

    submitted_by_user = relationship("User", back_populates="applications", foreign_keys=[submitted_by])
    verification_officer = relationship("User", foreign_keys=[verification_officer_id])
    compliance_reviewer = relationship("User", foreign_keys=[compliance_reviewer_id])
    decision_maker = relationship("User", foreign_keys=[decision_maker_id])

    documents = relationship("Document", back_populates="application")
    findings = relationship("Finding", back_populates="application")
    audit_events = relationship("AuditEvent", back_populates="application")
    compliance_checks = relationship("ComplianceCheck", back_populates="application")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    doc_type = Column(String)  # Land Certificate, NOC, Faculty List, etc.
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    sha256_hash = Column(String)
    status = Column(String, default="pending")  # verified, processing, pending, flagged
    verification_result = Column(String)
    extracted_data = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    application = relationship("Application", back_populates="documents")


class Finding(Base):
    __tablename__ = "findings"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    rule_id = Column(String)
    rule_description = Column(Text)
    severity = Column(Enum(FindingSeverity))
    status = Column(Enum(FindingStatus), default=FindingStatus.OPEN)
    finding_text = Column(Text)
    evidence = Column(JSON, nullable=True)
    officer_remark = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    application = relationship("Application", back_populates="findings")


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    rule_id = Column(String)
    rule_name = Column(String)
    category = Column(String)
    result = Column(String)  # pass, fail, warning, not_applicable
    details = Column(Text)
    evidence_value = Column(String, nullable=True)
    required_value = Column(String, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)
    application = relationship("Application", back_populates="compliance_checks")


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


class RegulatoryRule(Base):
    __tablename__ = "regulatory_rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(50), unique=True, index=True, nullable=False)
    rule_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    required_value = Column(String(255), nullable=True)
    severity = Column(String(50), default="high")
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
