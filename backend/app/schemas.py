from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


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
    institution_id: Optional[int] = None


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
    institution_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Institution Schemas ----
class InstitutionCreate(BaseModel):
    aicte_id: str
    name: str
    institution_type: Optional[str] = "Engineering & Technology"
    category: Optional[str] = "Private-Self-Financed"
    address: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = "Pune"
    pincode: Optional[str] = "411057"
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    university_affiliation: Optional[str] = None
    established_year: Optional[int] = 2004
    campus_acres: Optional[float] = 5.0
    total_intake: Optional[int] = 360


class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    institution_type: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    university_affiliation: Optional[str] = None
    established_year: Optional[int] = None
    campus_acres: Optional[float] = None
    total_intake: Optional[int] = None


class InstitutionOut(BaseModel):
    id: int
    aicte_id: str
    name: str
    institution_type: Optional[str]
    category: Optional[str]
    address: Optional[str]
    state: Optional[str]
    district: Optional[str]
    pincode: Optional[str]
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    university_affiliation: Optional[str]
    established_year: Optional[int]
    campus_acres: Optional[float]
    total_intake: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- Document Version & Document Schemas ----
class DocumentVersionOut(BaseModel):
    id: int
    version_number: int
    filename: str
    file_size: int
    sha256_hash: str
    uploaded_at: datetime
    extracted_data: Optional[Any]
    verification_result: Optional[str]
    change_reason: Optional[str]

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    doc_type: str
    filename: str
    file_size: int
    sha256_hash: str
    version: int = 1
    is_latest: bool = True
    status: str
    verification_result: Optional[str]
    extracted_data: Optional[Any]
    uploaded_at: datetime
    expires_at: Optional[datetime]
    versions: List[DocumentVersionOut] = []

    class Config:
        from_attributes = True


# ---- Finding Schemas ----
class FindingOut(BaseModel):
    id: int
    check_type: Optional[str] = None
    rule_id: str
    rule_description: str
    severity: str
    status: str
    finding_text: str
    detected_issue: Optional[str] = None
    why_attention_needed: Optional[str] = None
    recommended_action: Optional[str] = None
    ai_suggestion: Optional[str] = None
    evidence: Optional[Any]
    page_number: Optional[int] = None
    officer_remark: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewFinding(BaseModel):
    status: str
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
    rule_version: Optional[str] = "APH-2026.1"
    checked_at: datetime

    class Config:
        from_attributes = True


# ---- Validation Run Schemas ----
class ValidationRunOut(BaseModel):
    id: int
    run_number: int
    status: str
    scrutiny_score: float
    rule_version: str
    summary: Optional[str]
    passed_checks: Optional[Any]
    warnings: Optional[Any]
    external_unverified: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Review Action & Decision Records ----
class ClarificationSubmit(BaseModel):
    response_text: str
    document_id: Optional[int] = None


class ReviewActionCreate(BaseModel):
    action_type: str # OBSERVATION, CLARIFICATION_REQUESTED, FORWARDED_TO_COMPLIANCE, FORWARDED_TO_DECISION
    comments: str



class ReviewActionOut(BaseModel):
    id: int
    officer_id: int
    officer_name: str
    officer_role: str
    action_type: str
    comments: str
    created_at: datetime

    class Config:
        from_attributes = True


class DecisionRecordCreate(BaseModel):
    decision: str  # CLEARED, DEFICIENCY, REJECTED
    reasons: str
    order_number: Optional[str] = None
    authority_designation: Optional[str] = "Member Secretary, AICTE"


class DecisionRecordOut(BaseModel):
    id: int
    decision: str
    reasons: str
    order_number: str
    decision_maker_name: str
    authority_designation: str
    decided_at: datetime

    class Config:
        from_attributes = True


# ---- Notification Schemas ----
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    application_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---- Application Schemas ----
class ApplicationCreate(BaseModel):
    institution_name: str
    institution_type: Optional[str] = "Engineering & Technology"
    category: Optional[str] = "Extension of Approval (EoA)"
    academic_year: Optional[str] = "2026-27"
    region: Optional[str] = "Western"
    state: Optional[str] = "Maharashtra"
    city: Optional[str] = "Pune"
    applied_for: Optional[str] = "Continuation of Technical Courses + Intake Verification"


class ApplicationOut(BaseModel):
    id: int
    application_id: str
    institution_id: Optional[int] = None
    institution_name: str
    institution_type: Optional[str]
    category: Optional[str]
    academic_year: Optional[str] = "2026-27"
    region: Optional[str]
    state: Optional[str]
    city: Optional[str]
    applied_for: Optional[str]
    status: str
    submitted_at: datetime
    updated_at: datetime
    scrutiny_score: float

    # Workflow tracking
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

    # Unified Officer & Certificate tracking
    officer_id: Optional[int] = None
    officer_name: Optional[str] = None
    officer_suggestions: Optional[str] = None
    officer_reviewed_at: Optional[datetime] = None
    certificate_issued: Optional[bool] = False
    certificate_number: Optional[str] = None
    certificate_url: Optional[str] = None
    ai_suggestions: Optional[Any] = None

    # Nested entities
    documents: List[DocumentOut] = []
    findings: List[FindingOut] = []
    compliance_checks: List[ComplianceCheckOut] = []
    validation_runs: List[ValidationRunOut] = []
    review_actions: List[ReviewActionOut] = []
    decision_record: Optional[DecisionRecordOut] = None

    class Config:
        from_attributes = True


class OfficerSendSuggestionsRequest(BaseModel):
    suggestions: str
    fault_details: Optional[str] = None


class OfficerApprovalRequest(BaseModel):
    remarks: Optional[str] = "Approved in full accordance with AICTE Approval Process Handbook (APH 2026-27) norms."
    order_number: Optional[str] = None



# ---- Regulatory Rule Schemas ----
class RegulatoryRuleCreate(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: Optional[str] = "high"
    is_mandatory: Optional[bool] = True
    is_active: Optional[bool] = True
    version: Optional[str] = "APH-2026.1"


class RegulatoryRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: Optional[str] = None
    is_mandatory: Optional[bool] = None
    is_active: Optional[bool] = None
    version: Optional[str] = None


class RegulatoryRuleOut(BaseModel):
    id: int
    rule_id: str
    rule_name: str
    category: str
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: str
    is_mandatory: bool = True
    is_active: bool
    version: str = "APH-2026.1"
    created_by: Optional[int] = None
    updated_at: datetime

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


# ---- Dashboard Stats (Section 4) ----
class DashboardStats(BaseModel):
    institution_profile: Optional[Dict[str, Any]] = None
    total_applications: int
    draft_applications: int
    action_required_applications: int
    ready_for_review_applications: int
    under_review_applications: int
    decision_recorded_applications: int
    
    # Legacy compatibility fields
    under_review: int = 0
    deficiencies: int = 0
    cleared: int = 0
    total_documents: int = 0
    total_findings: int = 0
    open_findings: int = 0
    avg_scrutiny_score: float = 0.0
    status_distribution: Dict[str, int] = {}
    type_distribution: Dict[str, int] = {}
    region_distribution: Dict[str, int] = {}
    weekly_submissions: list = []
    compliance_summary: Dict[str, int] = {}
    severity_distribution: Dict[str, int] = {}


# ---- Deficiency Response & Correction Schemas ----
class RespondDeficiencyRequest(BaseModel):
    response_text: str


class CorrectionSubmitRequest(BaseModel):
    app_id: str
    corrected_fields: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


# ---- Regulatory Rule Config Schemas ----
class RegulatoryRuleOut(BaseModel):
    id: int
    rule_id: str
    rule_name: str
    category: str
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: str
    is_mandatory: bool
    is_active: bool
    version: str

    class Config:
        from_attributes = True


class RegulatoryRuleCreate(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: Optional[str] = "high"
    is_mandatory: Optional[bool] = True
    is_active: Optional[bool] = True
    version: Optional[str] = "APH-2026.1"


class RegulatoryRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: Optional[str] = None
    is_mandatory: Optional[bool] = None
    is_active: Optional[bool] = None
    version: Optional[str] = None
