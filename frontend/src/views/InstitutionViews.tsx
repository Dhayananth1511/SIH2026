import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  getApplications,
  createApplication,
  getDocuments,
  uploadDocument,
  runValidation,
  submitToScrutinyOfficer,
  getDashboardStats,
  getInstitutionProfile,
  updateInstitutionProfile,
  getNotifications,
  markNotificationRead,
  getDocumentDownloadUrl,
  submitClarification
} from '../api';
import type {
  Application,
  Document,
  Finding,
  DashboardStats,
  Institution,
  Notification
} from '../types';
import {
  Building2,
  ClipboardList,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  RefreshCw,
  Eye,
  FileText,
  FileCheck,
  Send,
  ExternalLink,
  ShieldCheck,
  Search,
  Scroll,
  Award
} from 'lucide-react';
import DocumentOcrModal from '../components/DocumentOcrModal';
import RegulatoryOrderModal from '../components/RegulatoryOrderModal';
import ApprovalCertificateModal from '../components/ApprovalCertificateModal';


interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc?: (docName: string) => void;
}

const REQUIRED_DOCS_LIST = [
  { doc_type: "Land Ownership Title Deed", category: "Land & Infrastructure", required_value: "5.0 Acres Contiguous" },
  { doc_type: "Fire Safety NOC Certificate", category: "Statutory Safety", required_value: "Valid Permanent/Renewed NOC" },
  { doc_type: "Building Approved Plan & Structural Stability", category: "Infrastructure", required_value: "Approved Master Plan" },
  { doc_type: "Faculty Cadre & SFR Registry", category: "Human Resources", required_value: "1:20 SFR required" },
  { doc_type: "Endowment Joint FDR Receipt", category: "Finance", required_value: "Joint FDR ₹50 Lakhs" }
];

export default function InstitutionViews({ subPage, onNavigate, onSelectApp, onViewDoc }: Props) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<Institution | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Selected Application for Deficiency Resolution or Document Upload
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appDocs, setAppDocs] = useState<Document[]>([]);
  const [validatingAppId, setValidatingAppId] = useState<string | null>(null);

  // Wizard state for Create Application (Section 5)
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    institution_name: user?.full_name || 'ABC Institute of Engineering & Technology',
    institution_type: 'Engineering & Technology',
    category: 'Extension of Approval (EoA)',
    academic_year: '2026-27',
    region: 'Western',
    state: 'Maharashtra',
    city: 'Pune',
    applied_for: 'Continuation of Technical Courses + Intake Expansion'
  });
  const [wizardCreatedApp, setWizardCreatedApp] = useState<Application | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  // Replacement file upload state
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementDocType, setReplacementDocType] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Modal states for OCR inspection, Regulatory Orders, and Clarifications
  const [inspectingDoc, setInspectingDoc] = useState<Document | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateApp, setCertificateApp] = useState<Application | null>(null);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationReplyText, setClarificationReplyText] = useState('');
  const [submittingClarification, setSubmittingClarification] = useState(false);


  // Profile Edit State
  const [profileEditForm, setProfileEditForm] = useState({
    name: '',
    aicte_id: '',
    institution_type: '',
    category: '',
    state: '',
    district: '',
    address: '',
    contact_person: '',
    email: '',
    phone: '',
    university_affiliation: ''
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, statsData, profData, notifsData] = await Promise.all([
        getApplications().catch(() => []),
        getDashboardStats().catch(() => null),
        getInstitutionProfile().catch(() => null),
        getNotifications().catch(() => [])
      ]);
      setApps(appsData);
      setStats(statsData);
      setProfile(profData);
      setNotifications(notifsData);

      if (profData) {
        setProfileEditForm({
          name: profData.name || '',
          aicte_id: profData.aicte_id || '',
          institution_type: profData.institution_type || 'Engineering & Technology',
          category: profData.category || 'Private-Self-Financed',
          state: profData.state || 'Maharashtra',
          district: profData.district || 'Pune',
          address: profData.address || '',
          contact_person: profData.contact_person || '',
          email: profData.email || '',
          phone: profData.phone || '',
          university_affiliation: profData.university_affiliation || ''
        });
      }

      if (appsData.length > 0 && !selectedApp) {
        loadAppDetails(appsData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAppDetails = async (appItem: Application) => {
    setSelectedApp(appItem);
    if (appItem.documents && appItem.documents.length > 0) {
      setAppDocs(appItem.documents);
    } else {
      try {
        const docsData = await getDocuments(appItem.application_id);
        setAppDocs(docsData);
      } catch {
        setAppDocs([]);
      }
    }
  };

  // Run AI Validation Middleware
  const handleValidateApplication = async (appId: string) => {
    setValidatingAppId(appId);
    try {
      const res = await runValidation(appId);
      setActionNotice(`✓ Validation finished: ${res.summary}`);
      await loadData();
      if (selectedApp && selectedApp.application_id === appId) {
        const updated = await getApplications();
        const currentUpdated = updated.find(a => a.application_id === appId);
        if (currentUpdated) setSelectedApp(currentUpdated);
      }
      setTimeout(() => setActionNotice(''), 5000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Validation run failed.');
    } finally {
      setValidatingAppId(null);
    }
  };

  // Submit to AICTE Approval Officer
  const handleSubmitToOfficer = async (appId: string) => {
    try {
      await submitToScrutinyOfficer(appId);
      setActionNotice('✓ Application submitted successfully to the AICTE Approval Officer.');
      await loadData();
      setTimeout(() => setActionNotice(''), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Submission to officer failed.');
    }
  };

  // Handle Replacement Document Upload
  const handleUploadReplacement = async (appId: string, docType: string, file: File) => {
    try {
      setUploadingDocType(docType);
      await uploadDocument(appId, docType, file);
      setUploadSuccessMsg(`✓ Uploaded new version for ${docType}`);
      const updatedDocs = await getDocuments(appId);
      setAppDocs(updatedDocs);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploadingDocType(null);
    }
  };

  // Wizard Application Creation
  const handleWizardSubmitStep2 = async () => {
    try {
      const created = await createApplication({
        institution_name: wizardForm.institution_name,
        institution_type: wizardForm.institution_type,
        category: wizardForm.category,
        academic_year: wizardForm.academic_year,
        region: wizardForm.region,
        state: wizardForm.state,
        city: wizardForm.city,
        applied_for: wizardForm.applied_for
      });
      setWizardCreatedApp(created);
      setWizardStep(3);
      loadData();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to create application draft.');
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateInstitutionProfile(profileEditForm);
      setProfile(updated);
      setProfileSavedMsg('✓ Institution profile updated successfully.');
      setTimeout(() => setProfileSavedMsg(''), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const getNextActionText = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'DRAFT') return 'Upload Documents & Run Validation';
    if (s === 'ACTION_REQUIRED') return 'Review Suggestions & Rectify Deficiencies';
    if (s === 'READY_FOR_REVIEW') return 'Submit to AICTE Officer for Approval';
    if (s === 'UNDER_OFFICER_REVIEW' || s === 'UNDER_SCRUTINY') return 'Awaiting AICTE Officer Approval';
    if (s === 'APPROVED' || s === 'DECISION_RECORDED') return 'Download AICTE Approval Certificate';
    if (s === 'CLARIFICATION_REQUESTED') return 'Submit Clarification / Documents';
    return 'Under Regulatory Review';
  };

  if (loading && apps.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Loading Institution Desk...
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {actionNotice && (
        <div style={{
          padding: '10px 16px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '6px',
          color: '#065f46',
          fontSize: '12.5px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          {actionNotice}
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. INSTITUTION DASHBOARD (Section 4) */}
      {/* ============================================================ */}
      {(subPage === 'inst-dashboard' || subPage === 'dashboard') && (
        <div>
          {/* Profile Summary Card */}
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1d4ed8', fontWeight: '700' }}>
                  Institution Profile Summary
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '4px 0 6px 0' }}>
                  {profile?.name || user?.full_name || 'ABC Institute of Engineering & Technology'}
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span><strong>AICTE Permanent ID:</strong> {profile?.aicte_id || '1-33245561'}</span>
                  <span><strong>Category:</strong> {profile?.category || 'Private-Self-Financed'}</span>
                  <span><strong>Affiliation:</strong> {profile?.university_affiliation || 'State Technical University'}</span>
                  <span><strong>Campus:</strong> {profile?.campus_acres || 5.5} Acres Contiguous</span>
                </div>
              </div>

              <div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setWizardStep(1);
                    onNavigate('inst-create-app');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Create Application</span>
                </button>
              </div>
            </div>
          </div>

          {/* Certificate of Approval Award Banner for Approved Applications */}
          {apps.some(a => (a.status || '').toUpperCase() === 'APPROVED' || (a.status || '').toUpperCase() === 'DECISION_RECORDED' || (a.final_decision || '').toUpperCase() === 'CLEARED' || (a.status || '').toUpperCase() === 'CLEARED' || Boolean(a.certificate_issued)) && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #fef3c7 100%)',
              border: '2px solid #d97706',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #b45309, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(180, 83, 9, 0.3)',
                  flexShrink: 0
                }}>
                  <Award size={26} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#78350f', letterSpacing: '0.3px' }}>
                      AICTE Extension of Approval (EoA) Granted &bull; Academic Year 2026–2027
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      background: '#059669',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '800'
                    }}>
                      OFFICIALLY APPROVED
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400e', marginTop: '3px', lineHeight: '1.4' }}>
                    Congratulations! All statutory clearances and APH norms have been verified. Your official AICTE Certificate of Approval is ready for download and print.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const approved = apps.find(a => (a.status || '').toUpperCase() === 'APPROVED' || (a.status || '').toUpperCase() === 'DECISION_RECORDED' || (a.final_decision || '').toUpperCase() === 'CLEARED' || (a.status || '').toUpperCase() === 'CLEARED' || Boolean(a.certificate_issued));
                    if (approved) {
                      setCertificateApp(approved);
                      setShowCertificateModal(true);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(30, 58, 138, 0.35)'
                  }}
                >
                  <Award size={16} />
                  <span>Download Approval Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* 6 Essential Summary Metric Counters (Section 4) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div className="gov-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Total Applications</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                {stats?.total_applications || apps.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #94a3b8' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Draft Applications</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#475569', marginTop: '4px' }}>
                {stats?.draft_applications || apps.filter(a => a.status === 'DRAFT').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700' }}>Action Required</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
                {stats?.action_required_applications || apps.filter(a => a.status === 'ACTION_REQUIRED').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #10b981', background: '#ecfdf5' }}>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>Ready for Review</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
                {stats?.ready_for_review_applications || apps.filter(a => a.status === 'READY_FOR_REVIEW').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '600' }}>Under Review</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0369a1', marginTop: '4px' }}>
                {stats?.under_review_applications || apps.filter(a => a.status === 'UNDER_SCRUTINY' || a.status === 'UNDER_COMPLIANCE_REVIEW').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #6366f1' }}>
              <div style={{ fontSize: '11px', color: '#4338ca', fontWeight: '600' }}>Decision Recorded</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#4338ca', marginTop: '4px' }}>
                {stats?.decision_recorded_applications || apps.filter(a => a.status === 'DECISION_RECORDED').length}
              </div>
            </div>
          </div>

          {/* Compact Applications Table (Section 4) */}
          <div className="gov-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                My Regulatory Applications
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Academic Year 2026-27 Approval Filing
              </span>
            </div>

            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Institution</th>
                    <th>Application Type</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Next Action</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No applications created yet. Click "+ Create Application" to begin your regulatory submission.
                      </td>
                    </tr>
                  ) : (
                    apps.map(appItem => (
                      <tr key={appItem.id}>
                        <td style={{ fontWeight: '700', color: '#1d4ed8' }}>
                          {appItem.application_id}
                        </td>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>
                          {appItem.institution_name}
                        </td>
                        <td>{appItem.category || 'Extension of Approval'}</td>
                        <td style={{ fontSize: '11.5px', color: '#475569' }}>
                          {new Date(appItem.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span className={`status-badge status-${appItem.status?.toLowerCase()}`}>
                            {appItem.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: '11.5px', fontWeight: '600', color: appItem.status === 'ACTION_REQUIRED' ? '#b45309' : '#334155' }}>
                          {getNextActionText(appItem.status)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => loadAppDetails(appItem)}
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <Eye size={12} />
                              <span>View Dossier</span>
                            </button>

                            {appItem.status === 'ACTION_REQUIRED' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => loadAppDetails(appItem)}
                                style={{ padding: '3px 8px', fontSize: '11px', background: '#d97706', borderColor: '#d97706' }}
                              >
                                <span>Resolve</span>
                              </button>
                            )}

                            {appItem.status === 'READY_FOR_REVIEW' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSubmitToOfficer(appItem.application_id)}
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                              >
                                <Send size={12} />
                                <span>Submit</span>
                              </button>
                            )}

                            {((appItem.status || '').toUpperCase() === 'APPROVED' || (appItem.status || '').toUpperCase() === 'DECISION_RECORDED' || (appItem.final_decision || '').toUpperCase() === 'CLEARED' || (appItem.status || '').toUpperCase() === 'CLEARED' || Boolean(appItem.certificate_issued)) && (
                              <button
                                className="btn btn-sm"
                                onClick={() => {
                                  setCertificateApp(appItem);
                                  setShowCertificateModal(true);
                                }}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  background: 'linear-gradient(135deg, #059669, #047857)',
                                  color: '#ffffff',
                                  border: '1px solid #065f46',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Download Official AICTE Certificate"
                              >
                                <Award size={12} />
                                <span>Certificate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Application Deficiency & Resolution Drawer (Section 7) */}
          {selectedApp && (
            <div className="gov-card" style={{ marginTop: '20px', borderTop: '3px solid #1d4ed8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '700' }}>Active Application Focus</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    {selectedApp.application_id} — {selectedApp.category}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleValidateApplication(selectedApp.application_id)}
                    disabled={validatingAppId === selectedApp.application_id}
                  >
                    <RefreshCw size={13} className={validatingAppId === selectedApp.application_id ? 'animate-spin' : ''} />
                    <span>{validatingAppId === selectedApp.application_id ? 'Validating...' : 'Run AI Validation'}</span>
                  </button>

                  {selectedApp.status === 'READY_FOR_REVIEW' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubmitToOfficer(selectedApp.application_id)}
                    >
                      <Send size={13} />
                      <span>Submit to Scrutiny Officer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Alert Banner */}
              {selectedApp.status === 'ACTION_REQUIRED' && (
                <div style={{
                  padding: '16px',
                  background: '#fffbeb',
                  border: '1.5px solid #fcd34d',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <AlertTriangle size={18} color="#b45309" />
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#92400e' }}>
                      Action Required — Application Deficiencies Detected
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#78350f', margin: '0 0 12px 0', lineHeight: '1.45' }}>
                    AI Validation has identified missing certificates, anomalies, or validity issues. Please review the deficiency checklist and AICTE APH recommendations below, upload the corrected replacement documents, and re-validate before submission.
                  </p>

                  {/* Officer Directives Banner (if officer sent suggestions) */}
                  {selectedApp.officer_suggestions && (
                    <div style={{
                      padding: '12px 14px',
                      background: '#fdf4ff',
                      border: '1.5px solid #e879f9',
                      borderRadius: '6px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={15} color="#a21caf" />
                          <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#86198f' }}>
                            AICTE Approval Officer Directive ({selectedApp.officer_name || 'Dr. Priya Sharma'}):
                          </span>
                        </div>
                        {selectedApp.officer_reviewed_at && (
                          <span style={{ fontSize: '11px', color: '#a21caf' }}>
                            {new Date(selectedApp.officer_reviewed_at).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4a044e', lineHeight: '1.45', background: '#ffffff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #f5d0fe' }}>
                        {selectedApp.officer_suggestions}
                      </div>
                    </div>
                  )}

                  {/* List of open findings with AI suggestions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedApp.findings?.filter(f => f.status === 'open').map(f => (
                      <div
                        key={f.id}
                        style={{
                          padding: '12px',
                          background: '#ffffff',
                          border: '1px solid #fed7aa',
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                            {f.rule_description}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: f.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                            color: f.severity === 'critical' ? '#991b1b' : '#92400e'
                          }}>
                            {f.severity?.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>
                          <strong>Issue Detected:</strong> {f.detected_issue || f.finding_text}
                        </div>
                        {f.why_attention_needed && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>
                            <strong>Regulatory Impact:</strong> {f.why_attention_needed}
                          </div>
                        )}
                        <div style={{ fontSize: '11.5px', color: '#1d4ed8', fontWeight: '600', marginBottom: f.ai_suggestion ? '6px' : '0' }}>
                          <strong>Required Action:</strong> {f.recommended_action || 'Upload corrected document.'}
                        </div>

                        {/* AI remediation suggestion */}
                        {f.ai_suggestion && (
                          <div style={{
                            padding: '8px 10px',
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            color: '#166534',
                            lineHeight: '1.4'
                          }}>
                            <div style={{ fontWeight: '800', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🤖 AI Guidance (What to Change as per AICTE APH):</span>
                            </div>
                            <div>{f.ai_suggestion}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready for Review Banner */}
              {selectedApp.status === 'READY_FOR_REVIEW' && (
                <div style={{
                  padding: '16px',
                  background: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <CheckCircle2 size={18} color="#047857" />
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#065f46' }}>
                      AI Document Validation Passed 100% (Ready for Officer Approval)
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#065f46', margin: '0 0 10px 0' }}>
                    All statutory internal validation checks and document integrity checks have passed. You may now submit your application to the AICTE Approval Officer for statutory review and issuance of approval certificate.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSubmitToOfficer(selectedApp.application_id)}
                    style={{ background: '#059669', borderColor: '#047857', fontWeight: '700' }}
                  >
                    <Send size={13} />
                    <span>Submit Application to AICTE Approval Officer</span>
                  </button>
                </div>
              )}

              {/* Official Approval & Certificate Issued Banner */}
              {(selectedApp.status === 'APPROVED' || selectedApp.certificate_issued || selectedApp.status === 'DECISION_RECORDED') && (
                <div style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '2px solid #059669',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <CheckCircle2 size={20} color="#059669" />
                        <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#065f46' }}>
                          Official AICTE Approval Granted &bull; Academic Year 2026–2027
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#047857', margin: '0 0 4px 0' }}>
                        Certificate Number: <strong>{selectedApp.certificate_number || `AICTE/CERT/2026-27/${selectedApp.application_id}`}</strong> &bull;
                        Approval Authority: <strong>{selectedApp.officer_name || 'Dr. Priya Sharma'}</strong>
                      </p>
                      <div style={{ fontSize: '11.5px', color: '#334155' }}>
                        Statutory Approval Remarks: {selectedApp.officer_suggestions || selectedApp.decision_remarks || 'Extension of Approval granted following comprehensive scrutiny.'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setCertificateApp(selectedApp);
                          setShowCertificateModal(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          color: '#ffffff',
                          fontWeight: '700',
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                        }}
                      >
                        <Award size={15} />
                        <span>Download Approval Certificate</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Clarification Requested Banner */}
              {selectedApp.status === 'CLARIFICATION_REQUESTED' && (
                <div style={{
                  padding: '16px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <AlertTriangle size={18} color="#c2410c" />
                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#9a3412' }}>
                          Clarification Requested by Regulatory Officer
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#7c2d12', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                        <strong>Officer Query:</strong> {selectedApp.verification_remarks ||
                          selectedApp.review_actions?.find(a => a.action_type === 'CLARIFICATION_REQUESTED')?.comments ||
                          'Additional clarification required regarding institutional land/cadre norms.'}
                      </p>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowClarificationModal(true)}
                      style={{ background: '#c2410c', borderColor: '#c2410c', padding: '8px 14px' }}
                    >
                      <span>Furnish Clarification Reply</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Uploaded Documents with Version History */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                  Uploaded Supporting Clearances &amp; Upload Replacement
                </h4>

                <div className="table-responsive">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Document Type</th>
                        <th>Current File</th>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Upload Corrected Version</th>
                        <th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REQUIRED_DOCS_LIST.map(reqDoc => {
                        const uploaded = appDocs.find(d => d.doc_type?.toLowerCase().includes(reqDoc.doc_type.toLowerCase()) || reqDoc.doc_type.toLowerCase().includes(d.doc_type?.toLowerCase()));
                        return (
                          <tr key={reqDoc.doc_type}>
                            <td style={{ fontWeight: '600', color: '#0f172a' }}>
                              {reqDoc.doc_type}
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>{reqDoc.required_value}</div>
                            </td>
                            <td>
                              {uploaded ? (
                                <span style={{ fontSize: '11.5px', color: '#334155' }}>{uploaded.filename}</span>
                              ) : (
                                <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600' }}>Not Uploaded</span>
                              )}
                            </td>
                            <td>
                              {uploaded ? (
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: '700',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  background: (uploaded.version || 1) > 1 ? '#e0f2fe' : '#f1f5f9',
                                  color: (uploaded.version || 1) > 1 ? '#0369a1' : '#475569'
                                }}>
                                  v{uploaded.version || 1}
                                </span>
                              ) : '-'}
                            </td>
                            <td>
                              {uploaded ? (
                                <span className={`status-badge status-${uploaded.status?.toLowerCase()}`}>
                                  {uploaded.status}
                                </span>
                              ) : (
                                <span className="status-badge status-deficiency">Missing</span>
                              )}
                            </td>
                            <td>
                              <label
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', margin: 0 }}
                              >
                                <Upload size={12} />
                                <span>{uploadingDocType === reqDoc.doc_type ? 'Uploading...' : (uploaded ? 'Upload New v2' : 'Upload')}</span>
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  style={{ display: 'none' }}
                                  disabled={uploadingDocType === reqDoc.doc_type}
                                  onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleUploadReplacement(selectedApp.application_id, reqDoc.doc_type, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </td>
                            <td>
                              {uploaded ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setInspectingDoc(uploaded)}
                                    style={{ padding: '3px 8px', fontSize: '11px' }}
                                    title="Inspect Extracted OCR Key-Values"
                                  >
                                    <Eye size={12} />
                                    <span>OCR</span>
                                  </button>
                                  <a
                                    href={getDocumentDownloadUrl(uploaded.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '3px 8px', fontSize: '11px' }}
                                    title="Open Document File"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. APPLICATION CREATION WIZARD (Section 5) */}
      {/* ============================================================ */}
      {subPage === 'inst-create-app' && (
        <div className="gov-card">
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Create AICTE Regulatory Application (Academic Year 2026-27)
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Follow the 4-step wizard to file application and upload required statutory documents.
            </div>
          </div>

          {/* Wizard Step Indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['1. Institution Details', '2. Application Details', '3. Required Documents', '4. Review & Submit'].map((stLabel, idx) => {
              const stNum = idx + 1;
              const isCurrent = wizardStep === stNum;
              const isDone = wizardStep > stNum;
              return (
                <div
                  key={stLabel}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: isCurrent ? '#eff6ff' : (isDone ? '#ecfdf5' : '#f8fafc'),
                    border: `1px solid ${isCurrent ? '#3b82f6' : (isDone ? '#a7f3d0' : '#e2e8f0')}`,
                    fontSize: '11.5px',
                    fontWeight: isCurrent || isDone ? '700' : '500',
                    color: isCurrent ? '#1d4ed8' : (isDone ? '#047857' : '#64748b'),
                    textAlign: 'center'
                  }}
                >
                  {isDone ? '✓ ' : ''}{stLabel}
                </div>
              );
            })}
          </div>

          {/* STEP 1: INSTITUTION DETAILS */}
          {wizardStep === 1 && (
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
                Step 1: Verify Registered Institution Profile
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Institution Legal Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={wizardForm.institution_name}
                    onChange={e => setWizardForm({ ...wizardForm, institution_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Institution Type:</label>
                  <select
                    className="form-control"
                    value={wizardForm.institution_type}
                    onChange={e => setWizardForm({ ...wizardForm, institution_type: e.target.value })}
                  >
                    <option value="Engineering & Technology">Engineering &amp; Technology</option>
                    <option value="Polytechnic">Polytechnic / Diploma</option>
                    <option value="Management">Management (MBA/PGDM)</option>
                    <option value="Pharmacy">Pharmacy</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">State:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={wizardForm.state}
                    onChange={e => setWizardForm({ ...wizardForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">City / District:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={wizardForm.city}
                    onChange={e => setWizardForm({ ...wizardForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button className="btn btn-primary" onClick={() => setWizardStep(2)}>
                  Proceed to Step 2: Application Details <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: APPLICATION DETAILS */}
          {wizardStep === 2 && (
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
                Step 2: Enter Application Filing Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Application Category:</label>
                  <select
                    className="form-control"
                    value={wizardForm.category}
                    onChange={e => setWizardForm({ ...wizardForm, category: e.target.value })}
                  >
                    <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                    <option value="New Technical Course Addition">New Technical Course Addition</option>
                    <option value="Intake Capacity Expansion">Intake Capacity Expansion</option>
                    <option value="Closure / Conversion of Program">Closure / Conversion of Program</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Academic Year:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={wizardForm.academic_year}
                    readOnly
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Program &amp; Course Specifics Applied For:</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={wizardForm.applied_for}
                    onChange={e => setWizardForm({ ...wizardForm, applied_for: e.target.value })}
                    placeholder="Specify courses, proposed intake numbers, or expansion programs..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setWizardStep(1)}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={handleWizardSubmitStep2}>
                  Create Draft &amp; Proceed to Uploads <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REQUIRED SUPPORTING DOCUMENTS */}
          {wizardStep === 3 && wizardCreatedApp && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                    Step 3: Upload Mandatory Supporting Documents
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Application ID: <strong>{wizardCreatedApp.application_id}</strong> · Allowed formats: PDF, PNG, JPG (under 10MB)
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1d4ed8' }}>
                  {appDocs.length} / 5 Uploaded
                </span>
              </div>

              <div className="table-responsive" style={{ marginBottom: '20px' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>Category</th>
                      <th>Regulatory Standard</th>
                      <th>Current File</th>
                      <th>Upload File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REQUIRED_DOCS_LIST.map(reqDoc => {
                      const uploaded = appDocs.find(d => d.doc_type?.toLowerCase().includes(reqDoc.doc_type.toLowerCase()));
                      return (
                        <tr key={reqDoc.doc_type}>
                          <td style={{ fontWeight: '600', color: '#0f172a' }}>{reqDoc.doc_type}</td>
                          <td>{reqDoc.category}</td>
                          <td style={{ fontSize: '11px', color: '#64748b' }}>{reqDoc.required_value}</td>
                          <td>
                            {uploaded ? (
                              <span style={{ color: '#059669', fontWeight: '600', fontSize: '11.5px' }}>
                                ✓ {uploaded.filename}
                              </span>
                            ) : (
                              <span style={{ color: '#dc2626', fontSize: '11px' }}>Pending</span>
                            )}
                          </td>
                          <td>
                            <label
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', margin: 0 }}
                            >
                              <Upload size={12} />
                              <span>{uploadingDocType === reqDoc.doc_type ? 'Uploading...' : 'Upload'}</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                style={{ display: 'none' }}
                                disabled={uploadingDocType === reqDoc.doc_type}
                                onChange={e => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadReplacement(wizardCreatedApp.application_id, reqDoc.doc_type, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setWizardStep(2)}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={() => setWizardStep(4)}>
                  Review &amp; Submit for AI Validation <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT FOR VALIDATION */}
          {wizardStep === 4 && wizardCreatedApp && (
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
                Step 4: Review Dossier and Submit for AI Validation
              </h3>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                  Application Summary: {wizardCreatedApp.application_id}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                  ● <strong>Institution:</strong> {wizardCreatedApp.institution_name}<br />
                  ● <strong>Category:</strong> {wizardCreatedApp.category} (AY {wizardCreatedApp.academic_year})<br />
                  ● <strong>Applied For:</strong> {wizardCreatedApp.applied_for}<br />
                  ● <strong>Documents Attached:</strong> {appDocs.length} statutory clearance(s) uploaded.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setWizardStep(3)}>
                  Back to Documents
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await handleValidateApplication(wizardCreatedApp.application_id);
                    onNavigate('inst-dashboard');
                  }}
                  disabled={validatingAppId === wizardCreatedApp.application_id}
                >
                  <RefreshCw size={14} className={validatingAppId === wizardCreatedApp.application_id ? 'animate-spin' : ''} />
                  <span>{validatingAppId === wizardCreatedApp.application_id ? 'Validating...' : 'Submit Dossier for AI Validation'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MY APPLICATIONS (Section 11) */}
      {/* ============================================================ */}
      {subPage === 'inst-applications' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                My Regulatory Applications
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Complete archive of applications submitted by {profile?.name || user?.full_name}
              </span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setWizardStep(1);
                onNavigate('inst-create-app');
              }}
            >
              <Plus size={14} /> Create Application
            </button>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Category</th>
                  <th>Academic Year</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{a.application_id}</td>
                    <td style={{ fontWeight: '600' }}>{a.category}</td>
                    <td>{a.academic_year || '2026-27'}</td>
                    <td style={{ fontSize: '11.5px', color: '#475569' }}>
                      {new Date(a.submitted_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <span className={`status-badge status-${a.status?.toLowerCase()}`}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: a.scrutiny_score >= 80 ? '#059669' : '#b45309' }}>
                      {a.scrutiny_score}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            loadAppDetails(a);
                            onNavigate('inst-dashboard');
                          }}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          <Eye size={12} />
                          <span>Open</span>
                        </button>

                        {((a.status || '').toUpperCase() === 'APPROVED' || (a.status || '').toUpperCase() === 'DECISION_RECORDED' || (a.final_decision || '').toUpperCase() === 'CLEARED' || (a.status || '').toUpperCase() === 'CLEARED' || Boolean(a.certificate_issued)) && (
                          <button
                            className="btn btn-sm"
                            onClick={() => {
                              setCertificateApp(a);
                              setShowCertificateModal(true);
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              color: '#ffffff',
                              border: '1px solid #065f46',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Download AICTE Certificate of Approval"
                          >
                            <Award size={12} />
                            <span>Certificate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. INSTITUTION PROFILE (Section 11) */}
      {/* ============================================================ */}
      {subPage === 'inst-profile' && (
        <div className="gov-card">
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              Institution Regulatory Profile
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Manage registered institution records, accreditation coordinates, and contact details
            </div>
          </div>

          {profileSavedMsg && (
            <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', color: '#065f46', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
              {profileSavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">Institution Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileEditForm.name}
                  onChange={e => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">AICTE Permanent Identifier:</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileEditForm.aicte_id}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>

              <div>
                <label className="form-label">Affiliated University:</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileEditForm.university_affiliation}
                  onChange={e => setProfileEditForm({ ...profileEditForm, university_affiliation: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Contact Person (Principal/Dean):</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileEditForm.contact_person}
                  onChange={e => setProfileEditForm({ ...profileEditForm, contact_person: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Official Email:</label>
                <input
                  type="email"
                  className="form-control"
                  value={profileEditForm.email}
                  onChange={e => setProfileEditForm({ ...profileEditForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Contact Phone:</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileEditForm.phone}
                  onChange={e => setProfileEditForm({ ...profileEditForm, phone: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Official Campus Address:</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileEditForm.address}
                  onChange={e => setProfileEditForm({ ...profileEditForm, address: e.target.value })}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary">
                Save Institution Records
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. NOTIFICATIONS (Section 11) */}
      {/* ============================================================ */}
      {subPage === 'inst-notifications' && (
        <div className="gov-card">
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              Notifications &amp; Statutory Alerts
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Deficiency notices, status updates, and clarification requests from AICTE
            </div>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              No notifications at this time.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 14px',
                    background: n.type === 'DEFICIENCY_ALERT' ? '#fffbeb' : '#f8fafc',
                    border: `1px solid ${n.type === 'DEFICIENCY_ALERT' ? '#fde68a' : '#e2e8f0'}`,
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(n.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                    {n.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Side-by-side Document & OCR Inspection Modal */}
      {inspectingDoc && (
        <DocumentOcrModal
          document={inspectingDoc}
          findings={selectedApp?.findings || []}
          applicationId={selectedApp?.application_id || 'APP-2026'}
          institutionName={profile?.name || user?.full_name || 'Applicant Institution'}
          isOfficer={false}
          onClose={() => setInspectingDoc(null)}
        />
      )}

      {/* Official AICTE Regulatory Order Modal */}
      {showOrderModal && selectedApp && (
        <RegulatoryOrderModal
          application={selectedApp}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Official AICTE Certificate of Approval Modal */}
      {showCertificateModal && (certificateApp || selectedApp) && (
        <ApprovalCertificateModal
          application={certificateApp || selectedApp}
          onClose={() => {
            setShowCertificateModal(false);
            setCertificateApp(null);
          }}
        />
      )}

      {/* Institution Clarification Response Modal */}
      {showClarificationModal && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowClarificationModal(false)}>
          <div className="modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Furnish Statutory Clarification</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowClarificationModal(false)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Submit your formal institutional explanation in response to the regulatory officer query for Application #{selectedApp.application_id}.
            </div>

            <div style={{
              padding: '12px',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#7c2d12'
            }}>
              <strong>Officer Query:</strong> {selectedApp.verification_remarks ||
                selectedApp.review_actions?.find(a => a.action_type === 'CLARIFICATION_REQUESTED')?.comments ||
                'Clarification requested regarding uploaded documentation.'}
            </div>

            <div className="form-group">
              <label className="form-label">Official Clarification Statement:</label>
              <textarea
                className="form-control"
                placeholder="Enter detailed institutional explanation addressing the officer's specific query..."
                rows={5}
                value={clarificationReplyText}
                onChange={e => setClarificationReplyText(e.target.value)}
                style={{ fontSize: '12.5px', minHeight: '110px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowClarificationModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={!clarificationReplyText.trim() || submittingClarification}
                onClick={async () => {
                  setSubmittingClarification(true);
                  try {
                    const updated = await submitClarification(selectedApp.application_id, clarificationReplyText);
                    setSelectedApp(updated);
                    setShowClarificationModal(false);
                    setClarificationReplyText('');
                    setActionNotice('✓ Clarification response submitted successfully. Dossier returned to officer scrutiny.');
                    loadData();
                    setTimeout(() => setActionNotice(''), 5000);
                  } catch (e: any) {
                    alert(e?.response?.data?.detail || 'Failed to submit clarification.');
                  } finally {
                    setSubmittingClarification(false);
                  }
                }}
              >
                {submittingClarification ? 'Submitting...' : 'Submit Official Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

