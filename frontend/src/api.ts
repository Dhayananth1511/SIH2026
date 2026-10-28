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
  Institution,
  RegulatoryRule,
  Notification
} from './types';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL as string | undefined;
  if (url && url.trim() !== '') {
    url = url.trim().replace(/\/+$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

export const BASE = getBaseUrl();
export const api = axios.create({ baseURL: BASE, timeout: 15000 });

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

// Institution Profile
export const getInstitutionProfile = async (): Promise<Institution> => {
  const res = await api.get<Institution>('/institution/profile');
  return res.data;
};

export const updateInstitutionProfile = async (data: Partial<Institution>): Promise<Institution> => {
  const res = await api.put<Institution>('/institution/profile', data);
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
  institution_type?: string;
  category?: string;
  academic_year?: string;
  region?: string;
  state?: string;
  city?: string;
  applied_for?: string;
}): Promise<Application> => {
  const res = await api.post<Application>('/applications', data);
  return res.data;
};

// Documents
export const getRequiredDocumentChecklist = async (appId: string): Promise<any[]> => {
  const res = await api.get<any[]>(`/applications/${appId}/required-documents`);
  return res.data;
};

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

export const getDocumentDownloadUrl = (docId: number | string): string => {
  return `${BASE}/documents/${docId}/download`;
};

// AI Validation Middleware (Check 1 to 7)
export const runValidation = async (appId: string): Promise<any> => {
  const res = await api.post(`/applications/${appId}/validate`);
  return res.data;
};

// Workflow: Submit to Scrutiny Officer
export const submitToScrutinyOfficer = async (appId: string): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/submit-to-officer`);
  return res.data;
};

// Officer Review Actions
export const recordScrutinyAction = async (appId: string, actionType: string, comments: string): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/scrutiny-action`, {
    action_type: actionType,
    comments
  });
  return res.data;
};

export const recordComplianceAction = async (appId: string, actionType: string, comments: string): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/compliance-action`, {
    action_type: actionType,
    comments
  });
  return res.data;
};

export const submitClarification = async (appId: string, responseText: string, documentId?: number): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/submit-clarification`, {
    response_text: responseText,
    document_id: documentId
  });
  return res.data;
};


export const recordOfficialDecision = async (
  appId: string,
  decision: string,
  reasons: string,
  orderNumber?: string,
  authorityDesignation?: string
): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/record-decision`, {
    decision,
    reasons,
    order_number: orderNumber,
    authority_designation: authorityDesignation
  });
  return res.data;
};

// Notifications
export const getNotifications = async (): Promise<Notification[]> => {
  const res = await api.get<Notification[]>('/notifications');
  return res.data;
};

export const markNotificationRead = async (id: number): Promise<any> => {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
};

// Audit Logs
export const getAuditLogs = async (params?: Record<string, string> | string): Promise<AuditEvent[]> => {
  const queryParams = typeof params === 'string' ? { app_id: params } : params;
  const res = await api.get<AuditEvent[]>('/audit', { params: queryParams });
  return res.data;
};

// Admin
export const getAdminUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>('/admin/users');
  return res.data;
};

export const updateAdminUserRole = async (userId: number | string, role: string, isActive?: boolean): Promise<User> => {
  const res = await api.put<User>(`/admin/users/${Number(userId)}/role`, { role, is_active: isActive });
  return res.data;
};

export const getAdminRules = async (): Promise<RegulatoryRule[]> => {
  const res = await api.get<RegulatoryRule[]>('/admin/rules');
  return res.data;
};

export const createAdminRule = async (data: Partial<RegulatoryRule>): Promise<RegulatoryRule> => {
  const res = await api.post<RegulatoryRule>('/admin/rules', data);
  return res.data;
};

export const updateAdminRule = async (ruleId: string, data: Partial<RegulatoryRule>): Promise<RegulatoryRule> => {
  const res = await api.put<RegulatoryRule>(`/admin/rules/${ruleId}`, data);
  return res.data;
};

export const deleteAdminRule = async (ruleId: string): Promise<any> => {
  const res = await api.delete(`/admin/rules/${ruleId}`);
  return res.data;
};

// ============================================================================
// Compatibility & Legacy Aliases
// ============================================================================
export const getFindings = async (appId: string): Promise<Finding[]> => {
  const res = await api.get<Finding[]>(`/applications/${appId}/findings`);
  return res.data;
};

export const getCompliance = async (appId: string): Promise<ComplianceCheck[]> => {
  const res = await api.get<ComplianceCheck[]>(`/applications/${appId}/compliance`);
  return res.data;
};

export const getAuditLog = getAuditLogs;

export const reviewFinding = async (findingId: number, status: string, notes?: string): Promise<any> => {
  const res = await api.put(`/findings/${findingId}/review`, { status, notes });
  return res.data;
};

export const updateDocumentOcrField = async (docId: number | string, field: string, value: any, _notes?: string): Promise<any> => {
  const res = await api.put(`/documents/${Number(docId)}/ocr`, { field, value });
  return res.data;
};

export const verifyDocumentItem = async (docId: number | string, status: string, notes?: string): Promise<any> => {
  const res = await api.put(`/documents/${Number(docId)}/verify`, { status, notes });
  return res.data;
};

export const completeVerification = async (appId: string, notes?: string, _status?: string): Promise<any> => {
  return recordScrutinyAction(appId, 'RECOMMEND_COMPLIANCE', notes || 'Scrutiny verification completed');
};

export const submitComplianceRecommendation = async (appId: string, rec?: string, notes?: string, _inspectionReq?: any): Promise<any> => {
  return recordComplianceAction(appId, rec || 'FORWARD_DECISION', notes || 'Compliance review completed');
};

export const issueOfficialDecision = async (
  appId: string,
  decision: string,
  remarks?: string,
  orderNo?: string,
  authorityDesignation?: string
): Promise<any> => {
  return recordOfficialDecision(appId, decision, remarks || '', orderNo, authorityDesignation);
};

export const getApplicationPipeline = async (appId: string): Promise<any> => {
  const res = await api.get(`/applications/${appId}`);
  return res.data;
};

export const getRegulatoryRules = getAdminRules;
export const createRegulatoryRule = createAdminRule;
export const updateRegulatoryRule = updateAdminRule;
export const deleteRegulatoryRule = deleteAdminRule;
export const updateUserRole = updateAdminUserRole;

// ============================================================================
// Unified Officer Review & Approval APIs
// ============================================================================
export const officerSendSuggestions = async (
  appId: string,
  suggestions: string,
  faultDetails?: string
): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/officer-send-suggestions`, {
    suggestions,
    fault_details: faultDetails
  });
  return res.data;
};

export const officerApproveApplication = async (
  appId: string,
  remarks?: string,
  orderNumber?: string
): Promise<Application> => {
  const res = await api.post<Application>(`/applications/${appId}/officer-approve`, {
    remarks,
    order_number: orderNumber
  });
  return res.data;
};

export const getApplicationCertificate = async (appId: string): Promise<any> => {
  const res = await api.get(`/applications/${appId}/certificate`);
  return res.data;
};


