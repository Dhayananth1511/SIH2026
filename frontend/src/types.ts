export type UserRole =
  | 'institution'
  | 'officer'
  | 'admin';

export interface User {
  id: number | string;
  email: string;
  full_name: string;
  role: UserRole | string;
  is_active: boolean;
  institution_id?: number;
  created_at: string;
}

export interface Institution {
  id: number;
  aicte_id: string;
  name: string;
  institution_type?: string;
  category?: string;
  address?: string;
  state?: string;
  district?: string;
  pincode?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  university_affiliation?: string;
  established_year?: number;
  campus_acres?: number;
  total_intake?: number;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'ACTION_REQUIRED'
  | 'READY_FOR_REVIEW'
  | 'UNDER_OFFICER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_SCRUTINY'
  | 'UNDER_COMPLIANCE_REVIEW'
  | 'CLARIFICATION_REQUESTED'
  | 'DECISION_RECORDED'
  | string;

export interface DocumentVersion {
  id: number;
  version_number: number;
  filename: string;
  file_size: number;
  sha256_hash: string;
  uploaded_at: string;
  extracted_data?: Record<string, any>;
  verification_result?: string;
  change_reason?: string;
}

export interface Document {
  id: number | string;
  application_id?: number | string;
  doc_type: string;
  filename: string;
  file_size?: number;
  sha256_hash?: string;
  file_hash?: string;
  version?: number;
  is_latest?: boolean;
  status: 'valid' | 'deficient' | 'pending' | 'flagged' | 'not_verifiable' | string;
  verification_result?: string;
  extracted_data?: Record<string, any>;
  uploaded_at: string;
  expires_at?: string;
  officer_verification_outcome?: string;
  officer_verification_notes?: string;
  officer_verified_by?: number;
  officer_verified_at?: string;
  versions?: DocumentVersion[];
}

export interface ClarificationMessage {
  sender_role: 'OFFICER' | 'INSTITUTION' | string;
  sender_name: string;
  timestamp: string;
  text: string;
  attachment?: string;
}

export interface Clarification {
  id: number;
  clarification_id: string;
  application_id: number | string;
  officer_id?: number;
  subject: string;
  related_item_type?: string;
  related_item_id?: string;
  question_text: string;
  evidence_reference?: string;
  due_date?: string;
  status: 'PENDING_INSTITUTION' | 'RESPONSE_SUBMITTED' | 'RESOLVED' | 'REOPENED' | string;
  institution_response?: string;
  response_attachment?: string;
  response_submitted_at?: string;
  messages?: ClarificationMessage[];
  created_at: string;
  resolved_at?: string;
}

export interface Finding {
  id: number;
  application_id?: number | string;
  document_id?: number | string;
  check_type?: 'COMPLETENESS' | 'EXTRACTION' | 'CONSISTENCY' | 'MANIPULATION' | 'EXTERNAL_AUTH' | 'COMPLIANCE' | 'OFFICER_REVIEW' | string;
  rule_id: string;
  rule_description: string;
  title?: string;
  description?: string;
  finding_type?: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  status: 'open' | 'confirmed' | 'dismissed' | 'resolved' | string;
  finding_text: string;
  detected_issue?: string;
  why_attention_needed?: string;
  recommended_action?: string;
  suggested_action?: string;
  field_name?: string;
  doc_type?: string;
  ai_suggestion?: string;
  evidence?: any;
  page_number?: number;
  officer_remark?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ComplianceCheck {
  id: number;
  application_id?: number | string;
  rule_id: string;
  rule_name: string;
  category: string;
  result: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_VERIFIABLE' | string;
  details: string;
  evidence_value?: string;
  required_value?: string;
  extracted_value?: string;
  is_compliant?: boolean;
  notes?: string;
  rule_version?: string;
  checked_at?: string;
}

export interface ValidationRun {
  id: number;
  run_number: number;
  status: string;
  scrutiny_score: number;
  rule_version: string;
  summary?: string;
  passed_checks?: string[];
  warnings?: string[];
  external_unverified?: string[];
  created_at: string;
}

export interface ReviewAction {
  id: number;
  officer_id: number;
  officer_name: string;
  officer_role: string;
  action_type: 'FORWARDED_TO_COMPLIANCE' | 'FORWARDED_TO_DECISION' | 'CLARIFICATION_REQUESTED' | 'OBSERVATION' | string;
  comments: string;
  created_at: string;
}

export interface DecisionRecord {
  id: number;
  decision: 'CLEARED' | 'DEFICIENCY' | 'REJECTED' | string;
  reasons: string;
  order_number: string;
  decision_maker_name: string;
  authority_designation: string;
  decided_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'DEFICIENCY_ALERT' | 'STATUS_CHANGE' | 'CLARIFICATION_REQUEST' | 'DECISION_RECORDED' | string;
  is_read: boolean;
  created_at: string;
  application_id?: number;
}

export interface PipelineInfo {
  application_id: string;
  institution_name: string;
  current_stage: string;
  status: string;
  scrutiny_score: number;
  stages: any[];
}

export interface Application {
  id: string | number;
  application_id: string;
  institution_id?: number;
  institution_name: string;
  institution_type?: string;
  category?: string;
  application_type?: string;
  academic_year?: string;
  applied_for?: string;
  region?: string;
  state?: string;
  city?: string;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
  scrutiny_score: number;
  score?: number;

  current_stage?: 'submission' | 'ready_for_review' | 'scrutiny' | 'compliance' | 'decision' | 'completed' | string;
  verification_status?: string;
  verification_officer_id?: number;
  verification_remarks?: string;
  verification_completed_at?: string;
  compliance_status?: string;
  compliance_reviewer_id?: number;
  compliance_recommendation?: string;
  compliance_remarks?: string;
  compliance_completed_at?: string;
  decision_maker_id?: number;
  final_decision?: 'CLEARED' | 'DEFICIENCY' | 'REJECTED' | string;
  decision_remarks?: string;
  decision_order_no?: string;
  decision_at?: string;

  // Unified Officer & Certificate tracking
  officer_id?: number;
  officer_name?: string;
  officer_suggestions?: string;
  officer_reviewed_at?: string;
  certificate_issued?: boolean;
  certificate_number?: string;
  certificate_url?: string;
  ai_suggestions?: Array<{
    rule_id: string;
    document: string;
    detected_issue?: string;
    suggestion: string;
    severity: string;
  }>;

  scrutiny_sections_reviewed?: Record<string, { status: string; reviewed_by: string; reviewed_at: string; remarks?: string }>;

  documents?: Document[];
  findings?: Finding[];
  compliance_checks?: ComplianceCheck[];
  validation_runs?: ValidationRun[];
  review_actions?: ReviewAction[];
  clarifications?: Clarification[];
  decision_record?: DecisionRecord;
}

export interface RegulatoryRule {
  id: number;
  rule_id: string;
  rule_name: string;
  category: string;
  description?: string;
  required_value?: string;
  severity: string;
  is_mandatory: boolean;
  is_active: boolean;
  version: string;
  source_reference?: string;
  applicable_types?: string[] | string;
  effective_period?: string;
  validation_method?: string;
  status?: string;
  change_rationale?: string;
  created_by?: number;
  updated_at: string;
}

export interface AuditEvent {
  id: number;
  actor_name?: string;
  user_name?: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  app_id?: string;
  details?: any;
  ip_address?: string;
  timestamp: string;
  created_at?: string;
}

export interface DashboardStats {
  institution_profile?: {
    name: string;
    aicte_id: string;
    type: string;
    state: string;
    city: string;
    affiliation: string;
    campus_acres: number;
  };
  total_applications: number;
  draft_applications: number;
  action_required_applications: number;
  ready_for_review_applications: number;
  under_review_applications: number;
  decision_recorded_applications: number;

  // Compatibility
  under_review?: number;
  deficiencies?: number;
  cleared?: number;
  pending?: number;
  rejected?: number;
  total_documents?: number;
  total_findings?: number;
  open_findings?: number;
  avg_scrutiny_score?: number;
  avg_score?: number;
  weekly_submissions?: any[];
  status_distribution?: Record<string, number>;
  status_breakdown?: Record<string, number>;
  type_breakdown?: Record<string, number>;
  region_breakdown?: Record<string, number>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  full_name: string;
  role: string;
  institution_id?: number;
}

export interface AicteMasterRecord {
  id: number;
  institution_id?: number;
  aicte_id: string;
  institution_name: string;
  ter_payment?: {
    receipt_no: string;
    amount: string;
    payment_date: string;
    bank_ref: string;
    status: string;
  };
  previous_eoa?: Array<{
    year: string;
    status: string;
    order_number: string;
    date: string;
  }>;
  approved_programmes?: Array<{
    program: string;
    course: string;
    sanctioned_intake: number;
  }>;
  total_sanctioned_intake?: number;
  accreditation_details?: {
    nba?: string;
    naac?: string;
    valid_till?: string;
  };
  faculty_epf_roster?: {
    total_faculty: number;
    cadre_ratio: string;
    sfr_ratio: string;
    epf_registered_count: number;
  };
  past_deficiencies?: Array<{
    year: string;
    committee: string;
    finding: string;
    status: string;
  }>;
  registered_campus_acres?: number;
  registered_gps?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  last_synced_at?: string;
}

export interface AuthorityVerification {
  id: number;
  application_id: number;
  document_id?: number;
  authority_name: string;
  verification_type: 'API_PORTAL' | 'QR_CODE' | 'DIGITAL_SIGNATURE_DSC' | 'URN_LOOKUP' | string;
  status: 'VERIFIED' | 'MISMATCH_DETECTED' | 'EXPIRED' | 'VERIFICATION_PENDING' | 'SOURCE_UNAVAILABLE' | 'MANUAL_REVIEW_REQUIRED' | string;
  urn_or_token?: string;
  source_url?: string;
  source_agency?: string;
  checked_at: string;
  response_payload?: Record<string, any>;
  discrepancy_details?: string;
  is_conclusive: boolean;
}

export interface InfrastructureEvidence {
  id: number;
  application_id: number;
  evidence_type: string;
  title: string;
  file_path?: string;
  file_url?: string;
  extracted_gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  distance_from_campus_meters?: number;
  gps_verified: boolean;
  cv_detected_objects?: Array<{
    label: string;
    count: number;
    confidence: number;
  }>;
  compliance_status: 'COMPLIANT_ADVISORY' | 'DEFICIENCY_FLAGGED' | 'PHYSICAL_INSPECTION_RECOMMENDED' | string;
  inspection_notes?: string;
  uploaded_at: string;
}

export interface CategoryChecklistItem {
  doc_type: string;
  category: string;
  rule_id: string;
  required_value: string;
  description: string;
  is_mandatory: boolean;
  issuing_authority?: string;
  verification_mechanism?: string;
}

export interface OfficialScrutinySheet {
  form_id: string;
  form_title: string;
  council: string;
  ministry: string;
  generated_at: string;
  cryptographic_seal: string;
  application: {
    application_id: string;
    institution_name: string;
    category: string;
    academic_year: string;
    region: string;
    state: string;
    city: string;
    applied_for: string;
    scrutiny_score: number;
    status: string;
    certificate_issued?: boolean;
    certificate_number?: string;
  };
  master_record: {
    aicte_id: string;
    ter_payment: {
      receipt_no: string;
      amount?: string;
      status: string;
    };
    sanctioned_intake: number;
    previous_eoa_status: string;
  };
  documents_count: number;
  open_findings_count: number;
  compliance_checks_count: number;
  authority_verifications: Array<{
    authority: string;
    type: string;
    status: string;
    token?: string;
  }>;
  infrastructure_evidence: Array<{
    title: string;
    gps_verified: boolean;
    compliance_status: string;
  }>;
  statutory_safeguards: string;
}

