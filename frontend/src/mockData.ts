import type { Application, Document, Finding, ComplianceCheck, AuditEvent, DashboardStats } from './types';

export const MOCK_APPLICATIONS: Application[] = [];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  total_applications: 0,
  under_review: 0,
  deficiencies: 0,
  cleared: 0,
  pending: 0,
  rejected: 0,
  total_findings: 0,
  avg_score: 0,
  status_breakdown: {},
  type_breakdown: {},
  region_breakdown: {},
  weekly_submissions: []
};

export const MOCK_DOCUMENTS: Document[] = [];
export const MOCK_FINDINGS: Finding[] = [];
export const MOCK_COMPLIANCE: ComplianceCheck[] = [];
export const MOCK_AUDIT_LOGS: AuditEvent[] = [];
