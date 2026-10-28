import axios from 'axios';
import type {
  AuthResponse,
  Application,
  Document,
  Finding,
  ComplianceCheck,
  AuditEvent,
  DashboardStats,
  User,
  RegulatoryRule,
  PipelineInfo
} from './types';

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

const BASE = getBaseUrl();

const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
};

export const register = async (data: { email: string; full_name: string; password: string; role: string }): Promise<User> => {
  const res = await api.post<User>('/auth/register', data);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get<User>('/auth/me');
  return res.data;
};

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get<DashboardStats>('/dashboard/stats');
  return res.data;
};

// Applications
export const getApplications = async (params?: Record<string, string>): Promise<Application[]> => {
  const res = await api.get<Application[]>('/applications', { params });
  return res.data;
};

export const getApplication = async (id: string): Promise<Application> => {
  const res = await api.get<Application>(`/applications/${id}`);
  return res.data;
};

export const createApplication = async (data: {
  institution_name: string;
  institution_type: string;
  category: string;
  region: string;
  state: string;
  city: string;
  applied_for: string;
}): Promise<Application> => {
  const res = await api.post<Application>('/applications', data);
  return res.data;
};

// Documents
export const getDocuments = async (appId: string): Promise<Document[]> => {
  const res = await api.get<Document[]>(`/applications/${appId}/documents`);
  return res.data;
};

export const uploadDocument = async (appId: string, docType: string, file: File): Promise<Document> => {
  const form = new FormData();
  form.append('doc_type', docType);
  form.append('file', file);
  const res = await api.post<Document>(`/applications/${appId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const verifyDocumentItem = async (docId: number | string, status: string, remarks?: string): Promise<Document> => {
  const res = await api.put<Document>(`/documents/${docId}/verify`, null, {
    params: { status_update: status, remarks }
  });
  return res.data;
};

// Findings
export const getFindings = async (appId: string): Promise<Finding[]> => {
  const res = await api.get<Finding[]>(`/applications/${appId}/findings`);
  return res.data;
};

export const getAllFindings = async (params?: Record<string, string>): Promise<Finding[]> => {
  const res = await api.get<Finding[]>('/findings', { params });
  return res.data;
};

export const reviewFinding = async (id: number, status: string, remark: string): Promise<Finding> => {
  const res = await api.put<Finding>(`/findings/${id}/review`, { status, officer_remark: remark });
  return res.data;
};

// Compliance & AI Validation
export const getCompliance = async (appId: string): Promise<ComplianceCheck[]> => {
  const res = await api.get<ComplianceCheck[]>(`/applications/${appId}/compliance`);
  return res.data;
};

export const runValidation = async (appId: string) => {
  const res = await api.post(`/applications/${appId}/validate`);
  return res.data;
};

// Pipeline Stages Actions
export const completeVerification = async (appId: string, remarks: string, status: string = 'verified'): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/complete-verification`, {
    remarks,
    status
  });
  return res.data;
};

export const submitComplianceRecommendation = async (
  appId: string,
  recommendation: string,
  remarks: string,
  inspectionRequired: boolean = false
): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/compliance-recommendation`, {
    recommendation,
    remarks,
    inspection_required: inspectionRequired
  });
  return res.data;
};

export const issueOfficialDecision = async (
  appId: string,
  decision: string,
  reasons: string,
  orderNumber?: string,
  authorityDesignation?: string
): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/official-decision`, {
    decision,
    reasons,
    order_number: orderNumber,
    authority_designation: authorityDesignation
  });
  return res.data;
};

export const getApplicationPipeline = async (appId: string): Promise<PipelineInfo> => {
  const res = await api.get<PipelineInfo>(`/applications/${appId}/pipeline`);
  return res.data;
};

// Admin Endpoints
export const getAdminUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>('/admin/users');
  return res.data;
};

export const updateUserRole = async (userId: number | string, role: string, isActive: boolean = true): Promise<User> => {
  const res = await api.put<User>(`/admin/users/${userId}/role`, {
    role,
    is_active: isActive
  });
  return res.data;
};

export const getRegulatoryRules = async (): Promise<RegulatoryRule[]> => {
  const res = await api.get<RegulatoryRule[]>('/admin/rules');
  return res.data;
};

export const createRegulatoryRule = async (rule: Partial<RegulatoryRule>): Promise<RegulatoryRule> => {
  const res = await api.post<RegulatoryRule>('/admin/rules', rule);
  return res.data;
};

export const updateRegulatoryRule = async (ruleId: string, rule: Partial<RegulatoryRule>): Promise<RegulatoryRule> => {
  const res = await api.put<RegulatoryRule>(`/admin/rules/${ruleId}`, rule);
  return res.data;
};

export const deleteRegulatoryRule = async (ruleId: string): Promise<any> => {
  const res = await api.delete(`/admin/rules/${ruleId}`);
  return res.data;
};

// Audit
export const getAuditLog = async (appId?: string): Promise<AuditEvent[]> => {
  const res = await api.get<AuditEvent[]>('/audit', { params: appId ? { app_id: appId } : {} });
  return res.data;
};

// Interactive Workflow Extensions
export const updateProfile = async (data: { institution_name?: string; contact_person?: string; phone?: string; address?: string }): Promise<User> => {
  const res = await api.put<User>('/auth/profile', data);
  return res.data;
};

export const raiseApplicationDeficiency = async (
  appId: string,
  category: string,
  findingText: string,
  severity: string = 'high'
): Promise<Finding> => {
  const res = await api.post<Finding>(`/applications/${appId}/raise-deficiency`, {
    category,
    finding_text: findingText,
    severity
  });
  return res.data;
};

export const respondToDeficiency = async (findingId: number, responseText: string): Promise<Finding> => {
  const res = await api.post<Finding>(`/findings/${findingId}/respond`, {
    response_text: responseText
  });
  return res.data;
};

export const updateDocumentOcrField = async (
  docId: number | string,
  fieldName: string,
  fieldValue: string,
  reason: string
): Promise<Document> => {
  const res = await api.put<Document>(`/documents/${docId}/ocr-data`, {
    field_name: fieldName,
    field_value: fieldValue,
    reason
  });
  return res.data;
};

export default api;

