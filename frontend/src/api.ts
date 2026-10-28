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
  Notification,
  AicteMasterRecord,
  AuthorityVerification,
  InfrastructureEvidence,
  CategoryChecklistItem,
  OfficialScrutinySheet
} from './types';

export const formatApiUrl = (raw: string | undefined | null): string | null => {
  if (!raw) return null;
  let url = raw.trim().replace(/\/+$/, '');
  if (!url || url === 'undefined' || url === 'null') return null;

  // If scheme is missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    url = (isLocal ? 'http://' : 'https://') + url;
  }

  try {
    const parsed = new URL(url);
    // If Render internal service name was passed (no dot in hostname, e.g. aicte-compliance-backend-rglx)
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      parsed.hostname = `${parsed.hostname}.onrender.com`;
    }
    return parsed.origin;
  } catch {
    if (!url.includes('.') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      url = `${url}.onrender.com`;
    }
    return url;
  }
};

export const getBaseUrl = (): string => {
  // 1. User or Evaluator runtime override stored in browser
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('AICTE_API_URL') || localStorage.getItem('VITE_API_URL');
    const formatted = formatApiUrl(custom);
    if (formatted) return formatted;
  }

  // 2. Vite build-time environment variable
  const buildUrl = formatApiUrl(import.meta.env.VITE_API_URL as string | undefined);
  if (buildUrl) return buildUrl;

  // 3. Smart domain auto-detection from browser URL
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.');
    if (isLocal) {
      return `http://${host}:8000`;
    }

    // Deployed on Render (*.onrender.com)
    if (host.includes('.onrender.com')) {
      if (host.includes('frontend')) {
        return `https://${host.replace('frontend', 'backend')}`;
      }
      return 'https://aicte-compliance-backend-rglx.onrender.com';
    }

    // Any other cloud HTTPS domain
    return 'https://aicte-compliance-backend-rglx.onrender.com';
  }

  return 'http://127.0.0.1:8000';
};

export let BASE = getBaseUrl();
export const api = axios.create({ baseURL: BASE, timeout: 60000 });

export const setCustomApiUrl = (newUrl: string): string => {
  const formatted = formatApiUrl(newUrl) || newUrl.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('AICTE_API_URL', formatted);
  }
  BASE = formatted;
  api.defaults.baseURL = formatted;
  clearClientCache();
  return formatted;
};

export const resetApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('AICTE_API_URL');
    localStorage.removeItem('VITE_API_URL');
  }
  const defaultUrl = getBaseUrl();
  BASE = defaultUrl;
  api.defaults.baseURL = defaultUrl;
  clearClientCache();
  return defaultUrl;
};

export const getActiveApiUrl = (): string => {
  return (api.defaults.baseURL as string) || BASE || getBaseUrl();
};

export const checkBackendHealth = async (targetUrl?: string): Promise<{
  ok: boolean;
  status: 'online' | 'waking' | 'offline';
  message: string;
  latencyMs?: number;
}> => {
  const target = (targetUrl || getActiveApiUrl()).replace(/\/+$/, '');
  const start = Date.now();
  try {
    const res = await axios.get(`${target}/health`, { timeout: 45000 });
    const latency = Date.now() - start;
    if (res.status === 200) {
      return {
        ok: true,
        status: 'online',
        message: 'Backend server is active & responding.',
        latencyMs: latency
      };
    }
    return {
      ok: false,
      status: 'offline',
      message: `Received status code ${res.status}`
    };
  } catch (err: any) {
    if (err?.code === 'ECONNABORTED') {
      return {
        ok: false,
        status: 'waking',
        message: 'Backend is waking up from free-tier sleep (~30-45s)...'
      };
    }
    return {
      ok: false,
      status: 'offline',
      message: err?.message || 'Cannot reach backend server'
    };
  }
};

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================================================
// Lightning-Fast In-Memory Client Cache with Instant Invalidation on Writes
// ============================================================================
const clientCache = new Map<string, { data: any; expiry: number }>();

export const clearClientCache = () => {
  clientCache.clear();
};

export const cachedGet = async <T>(url: string, params?: any, ttlMs = 20000): Promise<T> => {
  const key = `${url}?${params ? JSON.stringify(params) : ''}`;
  const now = Date.now();
  const cached = clientCache.get(key);
  if (cached && now < cached.expiry) {
    return cached.data as T;
  }
  const res = await api.get<T>(url, { params });
  clientCache.set(key, { data: res.data, expiry: now + ttlMs });
  return res.data;
};

// Auth
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  clearClientCache();
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
};

export const register = async (data: { email: string; full_name: string; password: string; role: string }): Promise<User> => {
  clearClientCache();
  const res = await api.post<User>('/auth/register', data);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  return cachedGet<User>('/auth/me');
};

// Institution Profile
export const getInstitutionProfile = async (): Promise<Institution> => {
  return cachedGet<Institution>('/institution/profile');
};

export const updateInstitutionProfile = async (data: Partial<Institution>): Promise<Institution> => {
  clearClientCache();
  const res = await api.put<Institution>('/institution/profile', data);
  return res.data;
};

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return cachedGet<DashboardStats>('/dashboard/stats');
};

// Applications
export const getApplications = async (params?: Record<string, string>): Promise<Application[]> => {
  return cachedGet<Application[]>('/applications', params);
};

export const getApplication = async (id: string): Promise<Application> => {
  return cachedGet<Application>(`/applications/${id}`);
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
  clearClientCache();
  const res = await api.post<Application>('/applications', data);
  return res.data;
};

// Documents
export const getRequiredDocumentChecklist = async (appId: string): Promise<any[]> => {
  return cachedGet<any[]>(`/applications/${appId}/required-documents`);
};

export const getDocuments = async (appId: string): Promise<Document[]> => {
  return cachedGet<Document[]>(`/applications/${appId}/documents`);
};

export const uploadDocument = async (appId: string, docType: string, file: File): Promise<Document> => {
  clearClientCache();
  const form = new FormData();
  form.append('doc_type', docType);
  form.append('file', file);
  const res = await api.post<Document>(`/applications/${appId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const getDocumentDownloadUrl = (docId: number | string): string => {
  return `${getActiveApiUrl()}/documents/${docId}/download`;
};

// AI Validation Middleware & Multi-Agent Orchestration
export const runValidation = async (appId: string): Promise<any> => {
  clearClientCache();
  const res = await api.post(`/applications/${appId}/validate`);
  return res.data;
};

export const getAiStatus = async (): Promise<any> => {
  const res = await api.get('/ai/status');
  return res.data;
};

export const configureGeminiKey = async (apiKey: string): Promise<any> => {
  const res = await api.post('/ai/configure-key', { gemini_api_key: apiKey });
  return res.data;
};

// Workflow: Submit to Scrutiny Officer
export const submitToScrutinyOfficer = async (appId: string): Promise<Application> => {
  clearClientCache();
  const res = await api.post<Application>(`/applications/${appId}/submit-to-officer`);
  return res.data;
};

// Officer Review Actions
export const recordScrutinyAction = async (appId: string, actionType: string, comments: string): Promise<Application> => {
  clearClientCache();
  const res = await api.post<Application>(`/applications/${appId}/scrutiny-action`, {
    action_type: actionType,
    comments
  });
  return res.data;
};

export const recordComplianceAction = async (appId: string, actionType: string, comments: string): Promise<Application> => {
  clearClientCache();
  const res = await api.post<Application>(`/applications/${appId}/compliance-action`, {
    action_type: actionType,
    comments
  });
  return res.data;
};

export const submitClarification = async (appId: string, responseText: string, documentId?: number): Promise<Application> => {
  clearClientCache();
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
  clearClientCache();
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
  return cachedGet<Notification[]>('/notifications');
};

export const markNotificationRead = async (id: number): Promise<any> => {
  clearClientCache();
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
  return cachedGet<User[]>('/admin/users');
};

export const createAdminUser = async (data: { email: string; full_name: string; password: string; role: string }): Promise<User> => {
  clearClientCache();
  const res = await api.post<User>('/admin/users', data);
  return res.data;
};

export const deleteAdminUser = async (userId: number | string): Promise<any> => {
  clearClientCache();
  const res = await api.delete(`/admin/users/${Number(userId)}`);
  return res.data;
};

export const updateAdminUserRole = async (userId: number | string, role: string, isActive?: boolean): Promise<User> => {
  clearClientCache();
  const res = await api.put<User>(`/admin/users/${Number(userId)}/role`, { role, is_active: isActive });
  return res.data;
};

export const getAdminRules = async (): Promise<RegulatoryRule[]> => {
  return cachedGet<RegulatoryRule[]>('/admin/rules');
};

export const createAdminRule = async (data: Partial<RegulatoryRule>): Promise<RegulatoryRule> => {
  clearClientCache();
  const res = await api.post<RegulatoryRule>('/admin/rules', data);
  return res.data;
};

export const updateAdminRule = async (ruleId: string, data: Partial<RegulatoryRule>): Promise<RegulatoryRule> => {
  clearClientCache();
  const res = await api.put<RegulatoryRule>(`/admin/rules/${ruleId}`, data);
  return res.data;
};

export const deleteAdminRule = async (ruleId: string): Promise<any> => {
  clearClientCache();
  const res = await api.delete(`/admin/rules/${ruleId}`);
  return res.data;
};

// ============================================================================
// Compatibility & Legacy Aliases
// ============================================================================
export const getFindings = async (appId: string): Promise<Finding[]> => {
  return cachedGet<Finding[]>(`/applications/${appId}/findings`);
};

export const getCompliance = async (appId: string): Promise<ComplianceCheck[]> => {
  return cachedGet<ComplianceCheck[]>(`/applications/${appId}/compliance`);
};

export const getAuditLog = getAuditLogs;

export const reviewFinding = async (findingId: number, status: string, notes?: string): Promise<any> => {
  clearClientCache();
  const res = await api.put(`/findings/${findingId}/review`, { status, notes });
  return res.data;
};

export const updateDocumentOcrField = async (docId: number | string, field: string, value: any, _notes?: string): Promise<any> => {
  clearClientCache();
  const res = await api.put(`/documents/${Number(docId)}/ocr`, { field, value });
  return res.data;
};

export const verifyDocumentItem = async (docId: number | string, status: string, notes?: string): Promise<any> => {
  clearClientCache();
  const res = await api.put(`/documents/${Number(docId)}/verify`, { status, notes });
  return res.data;
};

export const completeVerification = async (appId: string, notes?: string, _status?: string): Promise<any> => {
  clearClientCache();
  return recordScrutinyAction(appId, 'RECOMMEND_COMPLIANCE', notes || 'Scrutiny verification completed');
};

export const submitComplianceRecommendation = async (appId: string, rec?: string, notes?: string, _inspectionReq?: any): Promise<any> => {
  clearClientCache();
  return recordComplianceAction(appId, rec || 'FORWARD_DECISION', notes || 'Compliance review completed');
};

export const issueOfficialDecision = async (
  appId: string,
  decision: string,
  remarks?: string,
  orderNo?: string,
  authorityDesignation?: string
): Promise<any> => {
  clearClientCache();
  return recordOfficialDecision(appId, decision, remarks || '', orderNo, authorityDesignation);
};

export const getApplicationPipeline = async (appId: string): Promise<any> => {
  return cachedGet(`/applications/${appId}`);
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
  clearClientCache();
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
  clearClientCache();
  const res = await api.post<Application>(`/applications/${appId}/officer-approve`, {
    remarks,
    order_number: orderNumber
  });
  return res.data;
};

export const getApplicationCertificate = async (appId: string): Promise<any> => {
  return cachedGet(`/applications/${appId}/certificate`);
};

// ============================================================================
// Statutory Regulations & Verification APIs
// ============================================================================
export const getCategoryChecklists = async (): Promise<Record<string, CategoryChecklistItem[]>> => {
  return cachedGet<Record<string, CategoryChecklistItem[]>>('/regulatory/category-checklists');
};

export const getAicteMasterRecord = async (appId: string): Promise<AicteMasterRecord> => {
  return cachedGet<AicteMasterRecord>(`/applications/${appId}/aicte-master-record`);
};

export const getExternalVerifications = async (appId: string): Promise<AuthorityVerification[]> => {
  return cachedGet<AuthorityVerification[]>(`/applications/${appId}/external-verifications`);
};

export const triggerExternalVerification = async (
  appId: string,
  payload: {
    authority_name: string;
    verification_type?: string;
    status: string;
    urn_or_token?: string;
    source_url?: string;
    source_agency?: string;
    response_payload?: Record<string, any>;
    discrepancy_details?: string;
  }
): Promise<AuthorityVerification> => {
  clearClientCache();
  const res = await api.post<AuthorityVerification>(`/applications/${appId}/verify-external-source`, payload);
  return res.data;
};

export const getInfrastructureEvidence = async (appId: string): Promise<InfrastructureEvidence[]> => {
  return cachedGet<InfrastructureEvidence[]>(`/applications/${appId}/infrastructure-evidence`);
};

export const addInfrastructureEvidence = async (
  appId: string,
  payload: {
    evidence_type: string;
    title: string;
    file_path?: string;
    file_url?: string;
    extracted_gps?: { latitude: number; longitude: number; altitude?: number };
    distance_from_campus_meters?: number;
    gps_verified?: boolean;
    cv_detected_objects?: Array<{ label: string; count: number; confidence: number }>;
    compliance_status?: string;
    inspection_notes?: string;
  }
): Promise<InfrastructureEvidence> => {
  clearClientCache();
  const res = await api.post<InfrastructureEvidence>(`/applications/${appId}/infrastructure-evidence`, payload);
  return res.data;
};

export const getOfficialScrutinySheet = async (appId: string): Promise<OfficialScrutinySheet> => {
  return cachedGet<OfficialScrutinySheet>(`/applications/${appId}/official-scrutiny-sheet`);
};

export const uploadInfrastructurePhoto = async (
  appId: string,
  evidenceType: string,
  title: string,
  file: File,
  gpsLat?: number,
  gpsLng?: number
): Promise<InfrastructureEvidence> => {
  clearClientCache();
  const form = new FormData();
  form.append('evidence_type', evidenceType);
  form.append('title', title);
  form.append('file', file);
  if (gpsLat !== undefined) form.append('gps_latitude', String(gpsLat));
  if (gpsLng !== undefined) form.append('gps_longitude', String(gpsLng));
  const res = await api.post<InfrastructureEvidence>(`/applications/${appId}/infrastructure-evidence/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const verifyCryptographicSeal = async (hashSeal: string): Promise<any> => {
  return cachedGet<any>(`/regulatory/verify-seal/${hashSeal}`);
};

