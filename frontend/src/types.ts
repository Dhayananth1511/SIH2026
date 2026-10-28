export type UserRole =
  | 'institution'
  | 'verification_officer'
  | 'compliance_reviewer'
  | 'decision_maker'
  | 'admin';

export interface User {
  id: number | string;
  email: string;
  full_name: string;
  role: UserRole | string;
  is_active: boolean;
  created_at: string;
}

export interface Application {
  id: string | number;
  application_id?: string;
  institution_id?: string;
  institution_name: string;
  institution_type?: string;
  category?: string;
  application_type?: string;
  applied_for?: string;
  region?: string;
  state?: string;
  city?: string;
  status:
    | 'submitted'
    | 'under_review'
    | 'doc_verified'
    | 'compliance_review'
    | 'decision_pending'
    | 'deficiency'
    | 'cleared'
    | 'rejected'
    | string;
  submitted_at: string;
  updated_at?: string;
  score?: number;
  scrutiny_score?: number;

  // 5-Stage Pipeline Workflow tracking
  current_stage?: 'submission' | 'ai_validation' | 'doc_verification' | 'compliance_review' | 'decision' | 'completed' | string;
  verification_status?: 'pending' | 'verified' | 'evidence_requested' | string;
  verification_officer_id?: number;
  verification_remarks?: string;
  verification_completed_at?: string;
  compliance_status?: 'pending' | 'completed' | string;
  compliance_reviewer_id?: number;
  compliance_recommendation?: 'RECOMMENDED_APPROVAL' | 'RECOMMENDED_DEFICIENCY' | 'RECOMMENDED_INSPECTION' | string;
  compliance_remarks?: string;
  compliance_completed_at?: string;
  decision_maker_id?: number;
  final_decision?: 'CLEARED' | 'DEFICIENCY' | 'REJECTED' | string;
  decision_remarks?: string;
  decision_order_no?: string;
  decision_at?: string;
}

export interface Document {
  id: string | number;
  application_id?: string;
  doc_type: string;
  filename: string;
  file_size?: number;
  sha256_hash?: string;
  status: 'verified' | 'pending' | 'processing' | 'flagged' | 'evidence_requested' | string;
  verification_result?: string;
  extracted_data?: Record<string, any>;
  uploaded_at?: string;
  created_at?: string;
  page_count?: number;
  confidence_score?: number;
  is_tampered?: boolean;
  file_path?: string;
  expires_at?: string;
}

export interface Finding {
  id: number;
  application_id?: string;
  document_id?: string;
  rule_id?: string;
  rule_description?: string;
  finding_type?: string;
  title?: string;
  description?: string;
  finding_text?: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  status: 'open' | 'confirmed' | 'dismissed' | 'escalated' | string;
  evidence?: any;
  officer_remark?: string;
  page_number?: number;
  reviewed_at?: string;
  created_at: string;
}

export interface ComplianceCheck {
  id: number;
  application_id?: string;
  rule_id?: string;
  rule_name: string;
  clause_reference?: string;
  category: string;
  is_compliant?: boolean;
  passed_items?: number;
  total_items?: number;
  score?: number;
  result?: 'pass' | 'fail' | 'warning' | 'not_applicable' | string;
  details: string;
  evidence_value?: string;
  required_value?: string;
  checked_at?: string;
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
  timestamp?: string;
  created_at?: string;
}

export interface DashboardStats {
  total_applications: number;
  under_review: number;
  deficiencies: number;
  cleared: number;
  pending?: number;
  rejected?: number;
  total_documents?: number;
  total_findings?: number;
  open_findings?: number;
  avg_score?: number;
  avg_scrutiny_score?: number;
  status_breakdown?: Record<string, number>;
  type_breakdown?: Record<string, number>;
  region_breakdown?: Record<string, number>;
  monthly_trend?: any[];
  severity_breakdown?: Record<string, number>;
  status_distribution?: Record<string, number>;
  type_distribution?: Record<string, number>;
  region_distribution?: Record<string, number>;
  weekly_submissions?: { week: string; count: number; date: string }[];
  compliance_summary?: { pass: number; fail: number; warning: number; total: number };
  severity_distribution?: Record<string, number>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number | string;
  full_name: string;
  role: string;
}

export interface RegulatoryRule {
  id: number;
  rule_id: string;
  rule_name: string;
  category: string;
  description?: string;
  required_value?: string;
  severity: string;
  is_active: boolean;
  created_by?: number;
  updated_at: string;
}

export interface PipelineStageStep {
  step: number;
  name: string;
  role: string;
  actor: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completed_at?: string;
  summary: string;
}

export interface PipelineInfo {
  application_id: string;
  institution_name: string;
  current_stage: string;
  status: string;
  scrutiny_score: number;
  stages: PipelineStageStep[];
}
