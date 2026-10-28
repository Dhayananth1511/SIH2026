from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from app.models import UserRole, AppStatus, FindingSeverity, FindingStatus


# ---- Auth Schemas ----
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    role: str


class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: Optional[str] = "institution"


class UserRoleUpdate(BaseModel):
    role: str
    is_active: Optional[bool] = True


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Application Schemas ----
class ApplicationCreate(BaseModel):
    institution_name: str
    institution_type: str
    category: str
    region: str
    state: str
    city: str
    applied_for: str


class ApplicationOut(BaseModel):
    id: int
    application_id: str
    institution_name: str
    institution_type: Optional[str]
    category: Optional[str]
    region: Optional[str]
    state: Optional[str]
    city: Optional[str]
    applied_for: Optional[str]
    status: str
    submitted_at: datetime
    updated_at: datetime
    scrutiny_score: float

    # Pipeline tracking
    current_stage: Optional[str] = "submission"
    verification_status: Optional[str] = "pending"
    verification_officer_id: Optional[int] = None
    verification_remarks: Optional[str] = None
    verification_completed_at: Optional[datetime] = None
    compliance_status: Optional[str] = "pending"
    compliance_reviewer_id: Optional[int] = None
    compliance_recommendation: Optional[str] = None
    compliance_remarks: Optional[str] = None
    compliance_completed_at: Optional[datetime] = None
    decision_maker_id: Optional[int] = None
    final_decision: Optional[str] = None
    decision_remarks: Optional[str] = None
    decision_order_no: Optional[str] = None
    decision_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Pipeline Action Request Schemas ----
class CompleteVerificationRequest(BaseModel):
    remarks: str
    status: Optional[str] = "verified" # verified or evidence_requested


class SubmitComplianceRecommendationRequest(BaseModel):
    recommendation: str  # RECOMMENDED_APPROVAL, RECOMMENDED_DEFICIENCY, RECOMMENDED_INSPECTION
    remarks: str
    inspection_required: Optional[bool] = False


class OfficialDecisionRequest(BaseModel):
    decision: str  # CLEARED, DEFICIENCY, REJECTED
    reasons: str
    order_number: Optional[str] = None
    authority_designation: Optional[str] = "Member Secretary, AICTE"


# ---- Regulatory Rule Schemas ----
class RegulatoryRuleCreate(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: Optional[str] = "high"
    is_active: Optional[bool] = True


class RegulatoryRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None


class RegulatoryRuleOut(BaseModel):
    id: int
    rule_id: str
    rule_name: str
    category: str
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: str
    is_active: bool
    created_by: Optional[int] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- Document Schemas ----
class DocumentOut(BaseModel):
    id: int
    doc_type: str
    filename: str
    file_size: int
    sha256_hash: str
    status: str
    verification_result: Optional[str]
    extracted_data: Optional[Any]
    uploaded_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---- Finding Schemas ----
class FindingOut(BaseModel):
    id: int
    rule_id: str
    rule_description: str
    severity: str
    status: str
    finding_text: str
    evidence: Optional[Any]
    officer_remark: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewFinding(BaseModel):
    status: FindingStatus
    officer_remark: str


# ---- Compliance Schemas ----
class ComplianceCheckOut(BaseModel):
    id: int
    rule_id: str
    rule_name: str
    category: str
    result: str
    details: str
    evidence_value: Optional[str]
    required_value: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True


# ---- Audit Schemas ----
class AuditEventOut(BaseModel):
    id: int
    actor_name: str
    action: str
    entity_type: str
    entity_id: Optional[str]
    details: Optional[Any]
    timestamp: datetime

    class Config:
        from_attributes = True


# ---- Dashboard Stats ----
class DashboardStats(BaseModel):
    total_applications: int
    under_review: int
    deficiencies: int
    cleared: int
    total_documents: int
    total_findings: int
    open_findings: int
    avg_scrutiny_score: float
    status_distribution: dict
    type_distribution: dict
    region_distribution: dict
    weekly_submissions: list
    compliance_summary: dict
    severity_distribution: dict


# ---- Interactive Workflow Schemas ----
class RaiseDeficiencyRequest(BaseModel):
    category: str
    finding_text: str
    severity: Optional[str] = "high"


class RespondDeficiencyRequest(BaseModel):
    response_text: str


class OcrUpdateRequest(BaseModel):
    field_name: str
    field_value: str
    reason: str


class ProfileUpdateRequest(BaseModel):
    institution_name: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None

