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
    officer_verification_outcome: Optional[str] = None
    officer_verification_notes: Optional[str] = None
    officer_verified_by: Optional[int] = None
    officer_verified_at: Optional[datetime] = None
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


# ---- Clarification & Formal Query Schemas ----
class ClarificationOut(BaseModel):
    id: int
    clarification_id: str
    application_id: int
    officer_id: Optional[int] = None
    subject: str
    related_item_type: Optional[str] = "document"
    related_item_id: Optional[str] = None
    question_text: str
    evidence_reference: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "PENDING_INSTITUTION"
    institution_response: Optional[str] = None
    response_attachment: Optional[str] = None
    response_submitted_at: Optional[datetime] = None
    messages: Optional[Any] = []
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClarificationCreate(BaseModel):
    subject: str
    related_item_type: Optional[str] = "document"
    related_item_id: Optional[str] = None
    question_text: str
    evidence_reference: Optional[str] = None
    due_date: Optional[str] = None


class ClarificationReplyRequest(BaseModel):
    reply_text: str
    attachment_url: Optional[str] = None


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


# ---- Officer Scrutiny & Document Verification Requests ----
class DocumentVerifyOutcomeRequest(BaseModel):
    outcome: str # VERIFIED, MISMATCH_DETECTED, VERIFICATION_PENDING, MANUAL_REVIEW_REQUIRED, SOURCE_UNAVAILABLE
    officer_notes: Optional[str] = None
    source_identified: Optional[str] = None
    evidence_reference: Optional[str] = None


class ScrutinyStepReviewRequest(BaseModel):
    section_key: str
    status: str = "REVIEWED" # REVIEWED, DISCREPANCY_FLAGGED, MANUAL_VERIFICATION_REQUIRED
    remarks: Optional[str] = None


class ComplianceRuleReviewRequest(BaseModel):
    rule_id: str
    officer_result: str # PASSED, DEFICIENCY_FOUND, MANUAL_REVIEW_REQUIRED, UNRESOLVED_DISCREPANCY
    officer_remarks: Optional[str] = None


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
    scrutiny_sections_reviewed: Optional[Any] = None

    # Nested entities
    documents: List[DocumentOut] = []
    findings: List[FindingOut] = []
    compliance_checks: List[ComplianceCheckOut] = []
    validation_runs: List[ValidationRunOut] = []
    review_actions: List[ReviewActionOut] = []
    clarifications: List[ClarificationOut] = []
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
    source_reference: Optional[str] = "AICTE Approval Process Handbook (APH 2026-27)"
    applicable_types: Optional[Any] = ["Extension of Approval (EoA)", "New Technical Institution", "Increase in Intake"]
    effective_period: Optional[str] = "2026-2027"
    validation_method: Optional[str] = "AUTOMATED_AND_MANUAL"
    status: Optional[str] = "PUBLISHED"
    change_rationale: Optional[str] = None


class RegulatoryRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    required_value: Optional[str] = None
    severity: Optional[str] = None
    is_mandatory: Optional[bool] = None
    is_active: Optional[bool] = None
    version: Optional[str] = None
    source_reference: Optional[str] = None
    applicable_types: Optional[Any] = None
    effective_period: Optional[str] = None
    validation_method: Optional[str] = None
    status: Optional[str] = None
    change_rationale: Optional[str] = None


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
    source_reference: Optional[str] = "AICTE Approval Process Handbook (APH 2026-27)"
    applicable_types: Optional[Any] = []
    effective_period: Optional[str] = "2026-2027"
    validation_method: Optional[str] = "AUTOMATED_AND_MANUAL"
    status: Optional[str] = "PUBLISHED"
    change_rationale: Optional[str] = None
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


# ---- AICTE Master Institutional Record (AIMR) Schemas ----
class AicteMasterRecordOut(BaseModel):
    id: int
    institution_id: Optional[int]
    aicte_id: str
    institution_name: str
    ter_payment: Optional[Dict[str, Any]] = None
    previous_eoa: Optional[List[Dict[str, Any]]] = None
    approved_programmes: Optional[List[Dict[str, Any]]] = None
    total_sanctioned_intake: Optional[int] = 360
    accreditation_details: Optional[Dict[str, Any]] = None
    faculty_epf_roster: Optional[Dict[str, Any]] = None
    past_deficiencies: Optional[List[Dict[str, Any]]] = None
    registered_campus_acres: Optional[float] = 5.0
    registered_gps: Optional[Dict[str, Any]] = None
    last_synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Issuing Authority Verification Schemas ----
class AuthorityVerificationOut(BaseModel):
    id: int
    application_id: int
    document_id: Optional[int] = None
    authority_name: str
    verification_type: str
    status: str
    urn_or_token: Optional[str] = None
    source_url: Optional[str] = None
    source_agency: Optional[str] = None
    checked_at: datetime
    response_payload: Optional[Dict[str, Any]] = None
    discrepancy_details: Optional[str] = None
    is_conclusive: bool = True

    class Config:
        from_attributes = True


class AuthorityVerificationCreate(BaseModel):
    authority_name: str
    verification_type: str = "API_PORTAL"
    status: str = "VERIFIED"
    urn_or_token: Optional[str] = None
    source_url: Optional[str] = None
    source_agency: Optional[str] = None
    response_payload: Optional[Dict[str, Any]] = None
    discrepancy_details: Optional[str] = None


# ---- Infrastructure Evidence Schemas ----
class InfrastructureEvidenceOut(BaseModel):
    id: int
    application_id: int
    evidence_type: str
    title: str
    file_path: Optional[str] = None
    file_url: Optional[str] = None
    extracted_gps: Optional[Dict[str, Any]] = None
    distance_from_campus_meters: Optional[float] = None
    gps_verified: bool = True
    cv_detected_objects: Optional[List[Dict[str, Any]]] = None
    compliance_status: str = "COMPLIANT_ADVISORY"
    inspection_notes: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class InfrastructureEvidenceCreate(BaseModel):
    evidence_type: str
    title: str
    file_path: Optional[str] = None
    file_url: Optional[str] = None
    extracted_gps: Optional[Dict[str, Any]] = None
    distance_from_campus_meters: Optional[float] = None
    gps_verified: Optional[bool] = True
    cv_detected_objects: Optional[List[Dict[str, Any]]] = None
    compliance_status: Optional[str] = "COMPLIANT_ADVISORY"
    inspection_notes: Optional[str] = None


# ---- Dynamic Category Checklist Item Schema ----
class CategoryChecklistItem(BaseModel):
    doc_type: str
    category: str
    rule_id: str
    required_value: str
    description: str
    is_mandatory: bool = True
    issuing_authority: Optional[str] = None
    verification_mechanism: Optional[str] = None

