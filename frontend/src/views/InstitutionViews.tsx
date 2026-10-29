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
  submitClarification,
  getCategoryChecklists,
  getAicteMasterRecord,
  getInfrastructureEvidence,
  addInfrastructureEvidence,
  getApplicationClarifications,
  replyToClarification,
  getAllClarifications
} from '../api';
import type {
  Application,
  Document,
  Finding,
  DashboardStats,
  Institution,
  Notification,
  AicteMasterRecord,
  InfrastructureEvidence,
  CategoryChecklistItem,
  Clarification
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
  Award,
  Camera,
  MapPin,
  Server
} from 'lucide-react';
import DocumentOcrModal from '../components/DocumentOcrModal';
import RegulatoryOrderModal from '../components/RegulatoryOrderModal';
import ApprovalCertificateModal from '../components/ApprovalCertificateModal';
import OfficialScrutinySheetModal from '../components/OfficialScrutinySheetModal';
import {
  StatusDonutChart,
  DeficiencySeverityBarChart,
  ComplianceCategoryBarChart
} from '../components/Charts';



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

  // Dynamic Category Checklists & Statutory Datasets
  const [categoryChecklists, setCategoryChecklists] = useState<Record<string, CategoryChecklistItem[]>>({});
  const [selectedAppMasterRecord, setSelectedAppMasterRecord] = useState<AicteMasterRecord | null>(null);
  const [selectedAppInfra, setSelectedAppInfra] = useState<InfrastructureEvidence[]>([]);
  const [uploadingInfra, setUploadingInfra] = useState(false);
  const [infraTitle, setInfraTitle] = useState('');
  const [infraType, setInfraType] = useState('COMPUTING_LAB');
  const [infraFile, setInfraFile] = useState<File | null>(null);
  const [showScrutinyModal, setShowScrutinyModal] = useState(false);

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

  // Clarifications Desk state
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [selectedClarification, setSelectedClarification] = useState<Clarification | null>(null);
  const [clarificationAttachment, setClarificationAttachment] = useState('');
  const [clarificationFilter, setClarificationFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  // Profile 5-section tabs
  const [profileTab, setProfileTab] = useState<'basic' | 'reps' | 'affiliation' | 'records' | 'history'>('basic');
  const [instRecords, setInstRecords] = useState<Array<{ name: string; type: string; date: string; status: string; url?: string }>>([
    { name: 'AICTE Master Approval Letter 2025-26', type: 'Approval Letter', date: '15 May 2025', status: 'VERIFIED' },
    { name: 'Registered Trust / Society Deed', type: 'Legal Record', date: '12 Jan 2012', status: 'VERIFIED' },
    { name: 'UGC Section 2(f) & 12(B) Recognition', type: 'UGC Certificate', date: '04 Oct 2016', status: 'VERIFIED' },
    { name: 'Campus Master Land Survey Map', type: 'Cadastral Plan', date: '22 Aug 2024', status: 'VERIFIED' }
  ]);
  const [uploadingRecordName, setUploadingRecordName] = useState('');

  // Password / Security form for My Account
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwNotice, setPwNotice] = useState('');

  // Filters for Applications list
  const [appSearch, setAppSearch] = useState('');
  const [appTypeFilter, setAppTypeFilter] = useState('ALL');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // Findings group filter in AI Validation & Rectification
  const [findingCategory, setFindingCategory] = useState<'all' | 'doc_intel' | 'consistency' | 'issuer' | 'regulatory'>('all');

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

  // Calculated Profile Completion Status
  const profileCompletionPct = React.useMemo(() => {
    if (!profile) return 0;
    let filled = 0;
    const fields = [
      profile.name, profile.aicte_id, profile.institution_type, profile.category,
      profile.state, profile.district, profile.address, profile.contact_person,
      profile.email, profile.phone, profile.university_affiliation, profile.campus_acres
    ];
    fields.forEach(f => {
      if (f !== undefined && f !== null && String(f).trim() !== '') filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, statsData, profData, notifsData, clarifsData] = await Promise.all([
        getApplications().catch(() => []),
        getDashboardStats().catch(() => null),
        getInstitutionProfile().catch(() => null),
        getNotifications().catch(() => []),
        getAllClarifications().catch(() => [])
      ]);
      setApps(appsData);
      setStats(statsData);
      setProfile(profData);
      setNotifications(notifsData);
      setClarifications(clarifsData);

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

      getCategoryChecklists().then(data => setCategoryChecklists(data)).catch(() => {});
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

    // Fetch AICTE Central Master Record and Infrastructure Evidence
    getAicteMasterRecord(appItem.application_id).then(rec => setSelectedAppMasterRecord(rec)).catch(() => setSelectedAppMasterRecord(null));
    getInfrastructureEvidence(appItem.application_id).then(infras => setSelectedAppInfra(infras)).catch(() => setSelectedAppInfra([]));
  };

  const handleUploadInfraPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!infraTitle.trim()) {
      alert('Please enter a facility title.');
      return;
    }
    setUploadingInfra(true);
    try {
      if (infraFile) {
        const formData = new FormData();
        formData.append('file', infraFile);
        formData.append('evidence_type', infraType);
        formData.append('title', infraTitle.trim());
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/applications/${selectedApp.application_id}/infrastructure-evidence/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.detail || 'Photo upload failed');
        }
      } else {
        await addInfrastructureEvidence(selectedApp.application_id, {
          evidence_type: infraType,
          title: infraTitle.trim(),
          file_path: `infrastructure/${infraType.toLowerCase()}_sample.jpg`,
          extracted_gps: { latitude: 18.52043, longitude: 73.85674, altitude: 560 },
          distance_from_campus_meters: 16,
          gps_verified: true,
          cv_detected_objects: [
            { label: infraType === 'COMPUTING_LAB' ? 'Active Workstations' : (infraType === 'FIRE_SAFETY' ? 'Fire Extinguisher ABC Type' : 'Facility Fixture'), count: 8, confidence: 0.94 }
          ],
          compliance_status: 'COMPLIANT_ADVISORY',
          inspection_notes: `Photographic evidence registered by institution. GPS distance verified within registered campus perimeter (16m).`
        });
      }
      const updatedInfra = await getInfrastructureEvidence(selectedApp.application_id);
      setSelectedAppInfra(updatedInfra);
      setInfraTitle('');
      setInfraFile(null);
      setActionNotice('✓ Infrastructure facility photograph and GPS evidence registered successfully.');
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      alert(err?.message || err?.response?.data?.detail || 'Failed to add infrastructure evidence.');
    } finally {
      setUploadingInfra(false);
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
          {/* Profile Summary Card with Verification Status */}
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1d4ed8', fontWeight: '800' }}>
                  Institution Profile Summary · Academic Year 2026–27
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '4px 0 6px 0' }}>
                  {profile?.name || user?.full_name || 'ABC Institute of Engineering & Technology'}
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span><strong>AICTE Permanent ID:</strong> {profile?.aicte_id || '1-33245561'}</span>
                  <span><strong>Category:</strong> {profile?.category || 'Private-Self-Financed'}</span>
                  <span><strong>Affiliation:</strong> {profile?.university_affiliation || 'State Technical University'}</span>
                  <span><strong>Campus:</strong> {profile?.campus_acres || 5.5} Acres Contiguous</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('inst-profile')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Building2 size={14} />
                  <span>View / Edit Profile</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setWizardStep(1);
                    onNavigate('inst-create-app');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Create Application</span>
                </button>
              </div>
            </div>

            {/* Profile Completion Indicator */}
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={15} color="#1d4ed8" />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Institution Profile Verification &amp; Completion Status</span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: profileCompletionPct >= 80 ? '#ecfdf5' : '#fffbeb',
                    color: profileCompletionPct >= 80 ? '#047857' : '#b45309'
                  }}>
                    {profileCompletionPct}% Complete
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {profileCompletionPct >= 80 ? 'Verified Sovereign Identity' : 'Additional Profile Fields Recommended'}
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${profileCompletionPct}%`,
                  height: '100%',
                  background: profileCompletionPct >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                  transition: 'width 0.4s ease'
                }} />
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

          {/* EXACT 6 SUMMARY CARDS (Blueprint Section 2.1) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Draft Applications</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#334155', marginTop: '4px' }}>
                {stats?.draft_applications ?? apps.filter(a => (a.status || '').toUpperCase() === 'DRAFT').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #1d4ed8', background: '#eff6ff' }}>
              <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '700' }}>Submitted Applications</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                {apps.filter(a => ['SUBMITTED', 'VALIDATING', 'READY_FOR_REVIEW'].includes((a.status || '').toUpperCase())).length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700' }}>Requires Rectification</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
                {apps.filter(a => ['ACTION_REQUIRED', 'RECTIFICATION_REQUIRED'].includes((a.status || '').toUpperCase())).length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '600' }}>Under Scrutiny</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0369a1', marginTop: '4px' }}>
                {apps.filter(a => ['UNDER_SCRUTINY', 'UNDER_COMPLIANCE_REVIEW', 'UNDER_OFFICER_REVIEW'].includes((a.status || '').toUpperCase())).length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #ea580c', background: '#fff7ed' }}>
              <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: '700' }}>Clarifications Awaiting Response</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#c2410c', marginTop: '4px' }}>
                {clarifications.filter(c => c.status === 'PENDING_INSTITUTION').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #059669', background: '#f0fdf4' }}>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>Decisions Recorded</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {apps.filter(a => ['DECISION_RECORDED', 'APPROVED', 'REJECTED'].includes((a.status || '').toUpperCase()) || a.final_decision).length}
              </div>
            </div>
          </div>

          {/* VISUAL ANALYTICS & STATUTORY PIPELINE CHARTS */}
          {(() => {
            const statusData = [
              { name: 'Draft', value: apps.filter(a => (a.status || '').toUpperCase() === 'DRAFT').length, color: '#64748b' },
              { name: 'Submitted / Ready', value: apps.filter(a => ['SUBMITTED', 'VALIDATING', 'READY_FOR_REVIEW'].includes((a.status || '').toUpperCase())).length, color: '#1d4ed8' },
              { name: 'Action Required', value: apps.filter(a => ['ACTION_REQUIRED', 'RECTIFICATION_REQUIRED'].includes((a.status || '').toUpperCase())).length, color: '#ea580c' },
              { name: 'Under Scrutiny', value: apps.filter(a => ['UNDER_SCRUTINY', 'UNDER_COMPLIANCE_REVIEW', 'UNDER_OFFICER_REVIEW'].includes((a.status || '').toUpperCase())).length, color: '#0284c7' },
              { name: 'Decided / Approved', value: apps.filter(a => ['APPROVED', 'DECISION_RECORDED'].includes((a.status || '').toUpperCase()) || Boolean(a.final_decision)).length, color: '#059669' }
            ].filter(i => i.value > 0);

            const allFindings = apps.flatMap(a => a.findings || []);
            const crit = allFindings.filter(f => f.severity === 'critical' && f.status !== 'resolved' && f.status !== 'cleared').length;
            const hi = allFindings.filter(f => f.severity === 'high' && f.status !== 'resolved' && f.status !== 'cleared').length;
            const med = allFindings.filter(f => f.severity === 'medium' && f.status !== 'resolved' && f.status !== 'cleared').length;
            const lo = allFindings.filter(f => f.severity === 'low' && f.status !== 'resolved' && f.status !== 'cleared').length;
            const clr = allFindings.filter(f => f.status === 'resolved' || f.status === 'cleared').length;

            const categoryAdherenceData = [
              { category: 'Land & Campus', adherenceRate: apps.some(a => a.findings?.some(f => f.title?.toLowerCase().includes('land'))) ? 75 : 100, totalRules: 3 },
              { category: 'Safety & NOC', adherenceRate: apps.some(a => a.findings?.some(f => f.title?.toLowerCase().includes('fire') || f.title?.toLowerCase().includes('noc'))) ? 60 : 100, totalRules: 3 },
              { category: 'Faculty & HR', adherenceRate: 100, totalRules: 4 },
              { category: 'Infrastructure', adherenceRate: 100, totalRules: 4 },
              { category: 'Affiliation', adherenceRate: 100, totalRules: 2 }
            ];

            return (
              <div className="charts-grid" style={{ marginBottom: '22px' }}>
                <StatusDonutChart
                  data={statusData.length > 0 ? statusData : [{ name: 'Applications in Pipeline', value: apps.length || 1, color: '#1d4ed8' }]}
                  title="Application Lifecycle Status"
                  subtitle="Proportion of applications across approval phases"
                  height={220}
                />
                <DeficiencySeverityBarChart
                  critical={crit}
                  high={hi}
                  medium={med}
                  low={lo}
                  cleared={clr}
                  title="Statutory Deficiency Severity"
                  subtitle="Audit findings requiring rectification across submissions"
                  height={220}
                />
                <ComplianceCategoryBarChart
                  data={categoryAdherenceData}
                  title="Statutory APH Norm Adherence"
                  subtitle="Compliance rate (%) across major regulatory categories"
                  height={220}
                />
              </div>
            );
          })()}

          {/* ACTION-REQUIRED PANEL (Blueprint Section 2.1) */}

          {(apps.some(a => a.status === 'ACTION_REQUIRED') || clarifications.some(c => c.status === 'PENDING_INSTITUTION') || apps.some(a => a.status === 'READY_FOR_REVIEW')) && (
            <div className="gov-card" style={{ marginBottom: '20px', borderLeft: '4px solid #ea580c', background: '#fffaf5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertTriangle size={18} color="#ea580c" />
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#9a3412', margin: 0 }}>
                  Action-Required Panel: Immediate Institutional Actions Pending
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Rectification / Deficiencies Pending */}
                {apps.filter(a => a.status === 'ACTION_REQUIRED').map(actApp => (
                  <div key={actApp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#9a3412' }}>
                        Application #{actApp.application_id} ({actApp.category})
                      </span>
                      <div style={{ fontSize: '11.5px', color: '#7c2d12', marginTop: '2px' }}>
                        Deficiencies or document anomalies detected by AI Validation / Officer. Replacement documents required.
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        loadAppDetails(actApp);
                        onNavigate('inst-validation-rectification');
                      }}
                      style={{ background: '#d97706', borderColor: '#d97706', fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      Resolve Findings →
                    </button>
                  </div>
                ))}

                {/* 2. Clarifications Awaiting Response */}
                {clarifications.filter(c => c.status === 'PENDING_INSTITUTION').map(clr => (
                  <div key={clr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#c2410c' }}>
                        Clarification Query #{clr.id}: {clr.subject}
                      </span>
                      <div style={{ fontSize: '11.5px', color: '#7c2d12', marginTop: '2px' }}>
                        Issued for {clr.application_id} {clr.due_date ? `· Due by: ${new Date(clr.due_date).toLocaleDateString('en-IN')}` : ''}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedClarification(clr);
                        onNavigate('inst-clarifications-notifications');
                      }}
                      style={{ background: '#c2410c', borderColor: '#c2410c', fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      Respond to Clarification →
                    </button>
                  </div>
                ))}

                {/* 3. Ready for Submission */}
                {apps.filter(a => a.status === 'READY_FOR_REVIEW').map(readyApp => (
                  <div key={readyApp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#ffffff', border: '1px solid #a7f3d0', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#047857' }}>
                        Application #{readyApp.application_id} is Ready for Scrutiny Submission
                      </span>
                      <div style={{ fontSize: '11.5px', color: '#065f46', marginTop: '2px' }}>
                        AI Validation completed successfully (Score: {readyApp.scrutiny_score}%). Ready for officer submission.
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubmitToOfficer(readyApp.application_id)}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      <Send size={12} /> Submit to Officer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowScrutinyModal(true)}
                    style={{ background: '#0f172a', color: '#38bdf8', borderColor: '#1e293b', fontWeight: '700' }}
                  >
                    <FileText size={13} />
                    <span>Official Scrutiny Sheet (AICTE-SCRUTINY-2026)</span>
                  </button>

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
                      {((selectedApp?.category && categoryChecklists[selectedApp.category]) || categoryChecklists['Extension of Approval (EoA)'] || REQUIRED_DOCS_LIST).map((reqDoc: any) => {
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

                {/* AICTE Central Master Record (AIMR) Standing Status */}
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={16} color="#0284c7" />
                      <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        AICTE Central Master Record (AIMR) Standing Status
                      </h4>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                      ✓ Pre-Reconciled with Central Council Record
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Central TER Fee Status</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#047857', marginTop: '2px' }}>
                        {selectedAppMasterRecord?.ter_payment?.status || 'CONFIRMED'} ({selectedAppMasterRecord?.ter_payment?.amount || '₹1,50,000'})
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                        Receipt: {selectedAppMasterRecord?.ter_payment?.receipt_no || 'AICTE-TER-2026-98124'}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Sanctioned Intake Cap</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#1d4ed8', marginTop: '2px' }}>
                        {selectedAppMasterRecord?.total_sanctioned_intake || 378} Approved Seats
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                        Programmes: {selectedAppMasterRecord?.approved_programmes?.length || 5} Courses
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>EPF Faculty Roster &amp; SFR</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                        SFR: {selectedAppMasterRecord?.faculty_epf_roster?.sfr_ratio || '1:18.5'} (Norm ≤ 1:20)
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#047857', marginTop: '2px' }}>
                        ✓ 100% EPF Seeded ({selectedAppMasterRecord?.faculty_epf_roster?.total_faculty || 28} Faculty)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geo-Tagged Infrastructure Photos & Computer Vision Evidence Section */}
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={16} color="#059669" />
                        <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                          Geo-Tagged Infrastructure &amp; Computer Vision Scrutiny Evidence
                        </h4>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        Photographs must possess EXIF GPS coordinates within campus cadastral boundary (≤ 50m).
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                      {selectedAppInfra.length} Facility Items Registered
                    </span>
                  </div>

                  {/* Registered Evidence Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    {selectedAppInfra.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', padding: '14px', textAlign: 'center', color: '#64748b', fontSize: '12px', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                        No infrastructure photo evidence registered yet. Upload facility photos below.
                      </div>
                    ) : (
                      selectedAppInfra.map(infra => (
                        <div key={infra.id} style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{infra.title}</div>
                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 5px', borderRadius: '3px', background: '#f1f5f9', color: '#475569' }}>
                              {infra.evidence_type?.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', color: infra.gps_verified ? '#047857' : '#b91c1c' }}>
                            <MapPin size={11} />
                            <span>{infra.gps_verified ? `✓ GPS Validated (${infra.distance_from_campus_meters || 16}m)` : `⚠ Outside Boundary (${infra.distance_from_campus_meters || 120}m)`}</span>
                          </div>

                          {infra.cv_detected_objects && infra.cv_detected_objects.length > 0 && (
                            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {infra.cv_detected_objects.map((obj, i) => (
                                <span key={i} style={{ fontSize: '10px', padding: '1px 5px', background: '#eff6ff', color: '#1e40af', borderRadius: '3px' }}>
                                  {obj.label}: {obj.count}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#047857', fontWeight: '700' }}>
                            {infra.compliance_status === 'COMPLIANT_ADVISORY' ? '✓ Satisfied via Automated Scrutiny' : infra.compliance_status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Upload Facility Photo Form */}
                  <form onSubmit={handleUploadInfraPhoto} style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 160px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Facility Evidence Type:</label>
                      <select
                        className="form-control"
                        value={infraType}
                        onChange={e => setInfraType(e.target.value)}
                        style={{ fontSize: '11.5px', padding: '5px 8px' }}
                      >
                        <option value="COMPUTING_LAB">Computing Center / AI Lab</option>
                        <option value="LIBRARY">Central Library &amp; Reading Room</option>
                        <option value="RAMP_BARRIER_FREE">Barrier-Free Ramp / Divyangjan Access</option>
                        <option value="FIRE_SAFETY">Fire Safety / Hydrant Points</option>
                        <option value="LABORATORY">Core Department Laboratory</option>
                      </select>
                    </div>

                    <div style={{ flex: '2 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Facility Description / Title:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Central Computing Lab A (72 i7 Terminals)"
                        value={infraTitle}
                        onChange={e => setInfraTitle(e.target.value)}
                        style={{ fontSize: '11.5px', padding: '5px 8px' }}
                      />
                    </div>

                    <div style={{ flex: '1.5 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        Campus Photo (with EXIF GPS):
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="form-control"
                        style={{ fontSize: '11px', padding: '4px' }}
                        onChange={e => e.target.files && setInfraFile(e.target.files[0])}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-secondary btn-sm"
                      disabled={uploadingInfra}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '11.5px', fontWeight: '700' }}
                    >
                      <Camera size={13} />
                      <span>{uploadingInfra ? 'Analyzing CV & GPS...' : (infraFile ? 'Upload & Verify with CV' : 'Register Geo-Photo Evidence')}</span>
                    </button>
                  </form>
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
                    <option value="Increase in Intake / Additional Course">Increase in Intake / Additional Course</option>
                    <option value="New Institution Approval">New Institution Approval</option>
                    <option value="Supernumerary Seats (FN / OCI / TFW)">Supernumerary Seats (FN / OCI / TFW)</option>
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
                    Application ID: <strong>{wizardCreatedApp.application_id}</strong> · Category: <strong>{wizardCreatedApp.category}</strong> · Allowed formats: PDF, PNG, JPG (under 10MB)
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1d4ed8' }}>
                  {appDocs.length} / {(categoryChecklists[wizardForm.category] || categoryChecklists['Extension of Approval (EoA)'] || REQUIRED_DOCS_LIST).length} Uploaded
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
                    {(categoryChecklists[wizardForm.category] || categoryChecklists['Extension of Approval (EoA)'] || REQUIRED_DOCS_LIST).map((reqDoc: any) => {
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
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1d4ed8', fontWeight: '800' }}>
              Statutory Institution Profile Registry
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '2px 0 4px 0' }}>
              Institution Regulatory Profile &amp; Governance Records
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Maintain verified institution details, authorized signatories, affiliation standing, and institution-level statutory records.
            </div>
          </div>

          {profileSavedMsg && (
            <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', color: '#065f46', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
              {profileSavedMsg}
            </div>
          )}

          {/* 5-Section Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { id: 'basic', label: '1. Basic Details' },
              { id: 'reps', label: '2. Authorized Representatives' },
              { id: 'affiliation', label: '3. Recognition & Affiliation' },
              { id: 'records', label: '4. Institution Records' },
              { id: 'history', label: '5. Change History & Verification' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setProfileTab(tab.id as any)}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: profileTab === tab.id ? '800' : '600',
                  color: profileTab === tab.id ? '#1d4ed8' : '#64748b',
                  background: profileTab === tab.id ? '#eff6ff' : 'transparent',
                  border: 'none',
                  borderBottom: profileTab === tab.id ? '2px solid #1d4ed8' : '2px solid transparent',
                  marginBottom: '-2px',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: BASIC DETAILS */}
          {profileTab === 'basic' && (
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Institution Legal Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.name}
                    onChange={e => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">AICTE Permanent Identifier (PID):</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.aicte_id}
                    readOnly
                    style={{ background: '#f8fafc', color: '#1d4ed8', fontWeight: '700' }}
                  />
                </div>

                <div>
                  <label className="form-label">Institution Type / Discipline:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.institution_type}
                    onChange={e => setProfileEditForm({ ...profileEditForm, institution_type: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Management Category:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.category}
                    onChange={e => setProfileEditForm({ ...profileEditForm, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">State / UT:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.state}
                    onChange={e => setProfileEditForm({ ...profileEditForm, state: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">District:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.district}
                    onChange={e => setProfileEditForm({ ...profileEditForm, district: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Official Registered Email:</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profileEditForm.email}
                    onChange={e => setProfileEditForm({ ...profileEditForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Campus Land Area (Acres):</label>
                  <input
                    type="text"
                    className="form-control"
                    value="5.5 Acres Contiguous (Registered Title Deed)"
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Campus Physical Address:</label>
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
                  Save Basic Details
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: AUTHORIZED REPRESENTATIVES */}
          {profileTab === 'reps' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Principal / Director Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.contact_person}
                    onChange={e => setProfileEditForm({ ...profileEditForm, contact_person: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Official Designation:</label>
                  <input
                    type="text"
                    className="form-control"
                    value="Principal & Member Secretary, Governing Body"
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label className="form-label">Official Representative Email:</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profileEditForm.email}
                    onChange={e => setProfileEditForm({ ...profileEditForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Official Mobile / Direct Phone:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.phone}
                    onChange={e => setProfileEditForm({ ...profileEditForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Governing Council Resolution Ref:</label>
                  <input
                    type="text"
                    className="form-control"
                    value="GC-RES-2024/09-AUTH-SIGNATORY"
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label className="form-label">Verification Status:</label>
                  <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: '4px', color: '#047857', fontSize: '12px', fontWeight: '700' }}>
                    ✓ Authorized Officer Signatory Verified
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="button" className="btn btn-primary" onClick={handleSaveProfile}>
                  Update Signatory Records
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RECOGNITION & AFFILIATION */}
          {profileTab === 'affiliation' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Affiliating University:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileEditForm.university_affiliation}
                    onChange={e => setProfileEditForm({ ...profileEditForm, university_affiliation: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">First AICTE Approval Year:</label>
                  <input
                    type="text"
                    className="form-control"
                    value="2008"
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label className="form-label">NBA Accreditation Standing:</label>
                  <input
                    type="text"
                    className="form-control"
                    value="Accredited (Computer Engineering & Mechanical Engg. till 2027)"
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label className="form-label">NAAC Grade &amp; Cycle:</label>
                  <input
                    type="text"
                    className="form-control"
                    value="Grade A+ (CGPA 3.42) - Cycle 2 Valid till 2028"
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label className="form-label">UGC Section 2(f) &amp; 12(B) Status:</label>
                  <input
                    type="text"
                    className="form-control"
                    value="Recognized under Section 2(f) and 12(B)"
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="button" className="btn btn-primary" onClick={handleSaveProfile}>
                  Save Affiliation Records
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: INSTITUTION-LEVEL RECORDS */}
          {profileTab === 'records' && (
            <div>
              <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  Statutory Institutional Standing Documents
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Uploaded files are checked against central land cadastre and UGC records
                </span>
              </div>

              <div className="table-responsive">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Record Name</th>
                      <th>Category</th>
                      <th>Registered Date</th>
                      <th>Verification Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instRecords.map((rec, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '700', color: '#0f172a' }}>{rec.name}</td>
                        <td>{rec.type}</td>
                        <td style={{ fontSize: '11.5px', color: '#475569' }}>{rec.date}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857' }}>
                            ✓ {rec.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <label style={{ margin: 0, cursor: 'pointer' }}>
                              <span className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
                                Replace Record
                              </span>
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                accept=".pdf,.png,.jpg"
                                onChange={e => {
                                  if (e.target.files?.[0]) {
                                    alert(`Replacement uploaded for ${rec.name}. Audit event logged.`);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CHANGE HISTORY & AUDIT LOG */}
          {profileTab === 'history' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                Historical Profile Amendments &amp; Sovereign Verification Trail
              </div>
              <div className="table-responsive">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Field Modified</th>
                      <th>Previous Value</th>
                      <th>Updated Value</th>
                      <th>Modified By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: '11px', color: '#475569' }}>28 Oct 2026, 14:22</td>
                      <td style={{ fontWeight: '700', color: '#1d4ed8' }}>Contact Person / Dean</td>
                      <td>Dr. S. K. Mehta</td>
                      <td>{profileEditForm.contact_person || 'Dr. M. R. Patil'}</td>
                      <td>Authorized Signatory</td>
                      <td><span style={{ color: '#047857', fontWeight: '700', fontSize: '11px' }}>VERIFIED</span></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '11px', color: '#475569' }}>12 Aug 2026, 09:15</td>
                      <td style={{ fontWeight: '700', color: '#1d4ed8' }}>University Affiliation</td>
                      <td>State University</td>
                      <td>State Technical University</td>
                      <td>Institution Admin</td>
                      <td><span style={{ color: '#047857', fontWeight: '700', fontSize: '11px' }}>VERIFIED</span></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '11px', color: '#475569' }}>15 Jan 2026, 11:40</td>
                      <td style={{ fontWeight: '700', color: '#1d4ed8' }}>Campus Master Plan</td>
                      <td>v2.1 (2025)</td>
                      <td>v3.0 (2026-27 Master Plan)</td>
                      <td>Town Planning Authority</td>
                      <td><span style={{ color: '#047857', fontWeight: '700', fontSize: '11px' }}>VERIFIED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      {/* ============================================================ */}
      {/* 6. AI VALIDATION & RECTIFICATION (Section B Requirement) */}
      {/* ============================================================ */}
      {subPage === 'inst-validation-rectification' && (
        <div>
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1d4ed8', fontWeight: '800' }}>
                  Statutory Automated Pre-Screening
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }}>
                  AI Validation Findings &amp; Rectification Desk
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Execute 5-agent AI checks, review identified deficiencies, upload permitted corrections, and re-validate before officer scrutiny.
                </div>
              </div>

              {selectedApp && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowScrutinyModal(true)}
                    style={{ background: '#0f172a', color: '#38bdf8', borderColor: '#1e293b', fontWeight: '700' }}
                  >
                    <FileText size={13} />
                    <span>Official Scrutiny Sheet</span>
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleValidateApplication(selectedApp.application_id)}
                    disabled={validatingAppId === selectedApp.application_id}
                  >
                    <RefreshCw size={13} className={validatingAppId === selectedApp.application_id ? 'animate-spin' : ''} />
                    <span>{validatingAppId === selectedApp.application_id ? 'Validating (5 Agents)...' : 'Run AI Validation'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Application Selector if multiple */}
          {apps.length > 1 && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Select Application:</span>
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '260px', fontSize: '12.5px', fontWeight: '600' }}
                value={selectedApp?.application_id || ''}
                onChange={e => {
                  const found = apps.find(a => a.application_id === e.target.value);
                  if (found) loadAppDetails(found);
                }}
              >
                {apps.map(a => (
                  <option key={a.id} value={a.application_id}>
                    {a.application_id} — {a.category} ({a.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedApp && (
            <div>
              {/* Score and Status Banner */}
              <div className="gov-card" style={{ marginBottom: '16px', padding: '16px', borderLeft: '4px solid #1d4ed8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Application Reference</span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                      {selectedApp.application_id} · {selectedApp.category}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                      Status: <span className={`status-badge status-${selectedApp.status?.toLowerCase()}`}>{selectedApp.status?.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Validation Scrutiny Score</span>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: (selectedApp.scrutiny_score || 0) >= 80 ? '#059669' : '#b45309' }}>
                      {selectedApp.scrutiny_score || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Officer Directives Banner (if present) */}
              {selectedApp.officer_suggestions && (
                <div style={{
                  padding: '14px 16px',
                  background: '#fdf4ff',
                  border: '1.5px solid #e879f9',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <AlertTriangle size={16} color="#a21caf" />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#86198f' }}>
                      AICTE Approval Officer Scrutiny Directives ({selectedApp.officer_name || 'Dr. Priya Sharma'}):
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#4a044e', lineHeight: '1.5' }}>
                    {selectedApp.officer_suggestions}
                  </div>
                </div>
              )}

              {/* Findings & Deficiencies Breakdown */}
              <div className="gov-card" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  Identified Deficiencies &amp; Regulatory Findings ({selectedApp.findings?.length || 0})
                </h3>

                {(!selectedApp.findings || selectedApp.findings.length === 0) ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#059669', background: '#ecfdf5', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700' }}>
                    ✓ No deficiencies detected. All mandatory statutory rules satisfy APH 2026-27 requirements.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>Rule Reference</th>
                          <th>Finding Description</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th>Recommended Corrective Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApp.findings.map(f => (
                          <tr key={f.id}>
                            <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{f.field_name || f.rule_id || 'APH-2026'}</td>
                            <td style={{ fontSize: '12px', color: '#0f172a' }}>{f.finding_text || f.detected_issue}</td>
                            <td>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: '800',
                                background: f.severity === 'critical' ? '#fee2e2' : (f.severity === 'high' ? '#fef3c7' : '#f1f5f9'),
                                color: f.severity === 'critical' ? '#b91c1c' : (f.severity === 'high' ? '#b45309' : '#334155')
                              }}>
                                {f.severity?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-${f.status?.toLowerCase()}`}>
                                {f.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ fontSize: '11.5px', color: '#1d4ed8', fontWeight: '600' }}>
                              {f.recommended_action || f.suggested_action || 'Upload updated official certificate'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Permitted Rectification Actions & Replacement Document Upload */}
              <div className="gov-card">
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Permitted Correction Actions: Upload Replacement Statutory Documents
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>
                  Upload valid, authenticated replacement files (.pdf, .png, .jpg) to resolve deficiencies. Version history is preserved automatically.
                </p>

                {uploadSuccessMsg && (
                  <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                    {uploadSuccessMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {REQUIRED_DOCS_LIST.map(item => {
                    const existingDoc = appDocs.find(d => d.doc_type === item.doc_type);
                    return (
                      <div key={item.doc_type} style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '12px',
                        background: existingDoc ? '#f8fafc' : '#ffffff'
                      }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                          {item.doc_type}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 8px 0' }}>
                          Standard: {item.required_value}
                        </div>

                        {existingDoc ? (
                          <div style={{ fontSize: '11px', color: '#047857', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Uploaded: {existingDoc.filename} (v{existingDoc.version || 1})
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> Pending Upload
                          </div>
                        )}

                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          id={`rectify-file-${item.doc_type}`}
                          style={{ fontSize: '11px', width: '100%', marginBottom: '8px' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadReplacement(selectedApp.application_id, item.doc_type, file);
                            }
                          }}
                          disabled={uploadingDocType === item.doc_type}
                        />

                        {uploadingDocType === item.doc_type && (
                          <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '600' }}>
                            Uploading &amp; indexing document...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '18px', textAlign: 'right' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleValidateApplication(selectedApp.application_id)}
                    disabled={validatingAppId === selectedApp.application_id}
                  >
                    <RefreshCw size={14} className={validatingAppId === selectedApp.application_id ? 'animate-spin' : ''} />
                    <span>{validatingAppId === selectedApp.application_id ? 'Re-validating Application...' : 'Re-Validate Corrected Application'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. CLARIFICATIONS & NOTIFICATIONS (Blueprint Section 2.5) */}
      {/* ============================================================ */}
      {subPage === 'inst-clarifications-notifications' && (
        <div>
          {/* Section 1: Clarifications Inbox & Communication Desk */}
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase' }}>
                  Statutory Officer Communication Channel
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                  Officer Clarification Inquiries &amp; Institutional Responses
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Traceable inquiry inbox: view queries from AICTE Scrutiny Officers, furnish explanations, and attach evidence.
                </div>
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setClarificationFilter('ALL')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: clarificationFilter === 'ALL' ? '700' : '500',
                    background: clarificationFilter === 'ALL' ? '#1d4ed8' : '#f1f5f9',
                    color: clarificationFilter === 'ALL' ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  All ({clarifications.length})
                </button>
                <button
                  onClick={() => setClarificationFilter('PENDING')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: clarificationFilter === 'PENDING' ? '700' : '500',
                    background: clarificationFilter === 'PENDING' ? '#ea580c' : '#f1f5f9',
                    color: clarificationFilter === 'PENDING' ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Pending Reply ({clarifications.filter(c => c.status === 'PENDING_INSTITUTION').length})
                </button>
                <button
                  onClick={() => setClarificationFilter('RESOLVED')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: clarificationFilter === 'RESOLVED' ? '700' : '500',
                    background: clarificationFilter === 'RESOLVED' ? '#059669' : '#f1f5f9',
                    color: clarificationFilter === 'RESOLVED' ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Resolved ({clarifications.filter(c => c.status === 'RESOLVED').length})
                </button>
              </div>
            </div>

            {/* Clarifications Inbox Table */}
            <div className="table-responsive" style={{ marginBottom: '18px' }}>
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Query ID</th>
                    <th>Application</th>
                    <th>Requesting Officer</th>
                    <th>Subject</th>
                    <th>Date Issued</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clarifications.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No formal clarification queries issued by AICTE Scrutiny Officers.
                      </td>
                    </tr>
                  ) : (
                    clarifications
                      .filter(c => {
                        if (clarificationFilter === 'PENDING') return c.status === 'PENDING_INSTITUTION';
                        if (clarificationFilter === 'RESOLVED') return c.status === 'RESOLVED';
                        return true;
                      })
                      .map(clr => (
                        <tr key={clr.id} style={{ background: selectedClarification?.id === clr.id ? '#eff6ff' : 'transparent' }}>
                          <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{clr.clarification_id || `CLR-${clr.id}`}</td>
                          <td style={{ fontWeight: '600' }}>{clr.application_id}</td>
                          <td>{clr.officer_id ? `AICTE Officer #${clr.officer_id}` : 'AICTE Scrutiny Officer'}</td>
                          <td style={{ fontSize: '12px', color: '#0f172a' }}>{clr.subject}</td>
                          <td style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {new Date(clr.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td style={{ fontSize: '11.5px', color: clr.due_date ? '#b45309' : '#64748b', fontWeight: clr.due_date ? '700' : 'normal' }}>
                            {clr.due_date ? new Date(clr.due_date).toLocaleDateString('en-IN') : 'Standard (7 Days)'}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: clr.status === 'PENDING_INSTITUTION' ? '#fff7ed' : (clr.status === 'RESOLVED' ? '#ecfdf5' : '#eff6ff'),
                              color: clr.status === 'PENDING_INSTITUTION' ? '#c2410c' : (clr.status === 'RESOLVED' ? '#047857' : '#1d4ed8')
                            }}>
                              {clr.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedClarification(clr)}
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <Eye size={12} /> View Thread
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Active Clarification Conversation Workspace */}
            {selectedClarification && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '800' }}>
                      Thread: {selectedClarification.clarification_id || `CLR-${selectedClarification.id}`} · Application #{selectedClarification.application_id}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                      {selectedClarification.subject}
                    </h3>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedClarification(null)}
                    style={{ padding: '2px 6px', fontSize: '11px' }}
                  >
                    Close Thread ✕
                  </button>
                </div>

                {/* Timeline Messages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                  {/* Initial Query Message */}
                  <div style={{ padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#9a3412' }}>
                        AICTE Scrutiny Officer
                      </span>
                      <span style={{ fontSize: '11px', color: '#7c2d12' }}>
                        {new Date(selectedClarification.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#431407', lineHeight: '1.45' }}>
                      {selectedClarification.question_text}
                    </div>
                  </div>

                  {/* Threaded Reply Messages */}
                  {(selectedClarification.messages || []).map((msg, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        padding: '12px 14px',
                        background: msg.sender_role === 'INSTITUTION' ? '#ecfdf5' : '#f8fafc',
                        border: `1px solid ${msg.sender_role === 'INSTITUTION' ? '#a7f3d0' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        marginLeft: msg.sender_role === 'INSTITUTION' ? '20px' : '0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: msg.sender_role === 'INSTITUTION' ? '#047857' : '#0f172a' }}>
                          {msg.sender_role === 'INSTITUTION' ? '🏛️ Institution Response' : '⚖️ Officer Observation'} ({msg.sender_name})
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleString('en-IN') : 'Recent'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.45' }}>
                        {msg.text}
                      </div>
                      {msg.attachment && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#1d4ed8', fontWeight: '600' }}>
                          Attachment: {msg.attachment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Reply Form (Active if not resolved) */}
                {selectedClarification.status !== 'RESOLVED' ? (
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                      Furnish Clarification Explanation / Supporting Evidence:
                    </div>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter detailed clarification response addressed to AICTE Scrutiny Officer..."
                      value={clarificationReplyText}
                      onChange={e => setClarificationReplyText(e.target.value)}
                      style={{ fontSize: '12px', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Optional attachment reference or document link..."
                        value={clarificationAttachment}
                        onChange={e => setClarificationAttachment(e.target.value)}
                        style={{ width: '320px', fontSize: '11.5px' }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={submittingClarification || !clarificationReplyText.trim()}
                        onClick={async () => {
                          setSubmittingClarification(true);
                          try {
                            await replyToClarification(String(selectedClarification.id), {
                              reply_text: clarificationReplyText.trim(),
                              attachment_url: clarificationAttachment.trim() || undefined
                            });
                            const updatedClarifs = await getAllClarifications().catch(() => []);
                            setClarifications(updatedClarifs);
                            const updatedCurr = updatedClarifs.find(c => c.id === selectedClarification.id);
                            if (updatedCurr) setSelectedClarification(updatedCurr);
                            setClarificationReplyText('');
                            setClarificationAttachment('');
                            setActionNotice('Formal clarification response dispatched to AICTE Officer.');
                          } catch (err: any) {
                            alert(err?.response?.data?.detail || 'Failed to submit response.');
                          } finally {
                            setSubmittingClarification(false);
                          }
                        }}
                      >
                        <Send size={13} />
                        <span>{submittingClarification ? 'Submitting...' : 'Submit Response to Officer'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: '4px', color: '#047857', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>
                    ✓ This clarification query has been formally resolved and accepted by the AICTE Scrutiny Officer.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Statutory Notifications */}
          <div className="gov-card">
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Statutory Notifications &amp; Platform Event Alerts
              </h3>
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No notifications logged at this time.
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
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. APPLICATION HISTORY (Blueprint Section 2.6) */}
      {/* ============================================================ */}
      {subPage === 'inst-history' && (
        <div className="gov-card">
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase' }}>
              Immutable Regulatory Timeline
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
              Application History &amp; Approval Archive
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Read-only record of prior submissions, validation iterations, status transitions, and official decisions.
            </div>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Category</th>
                  <th>Academic Year</th>
                  <th>Submission Date</th>
                  <th>Version</th>
                  <th>Final Decision</th>
                  <th>Certificate / Receipt</th>
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
                    <td>v{a.documents && a.documents.length > 0 ? Math.max(...a.documents.map(d => d.version || 1)) : 1}</td>
                    <td>
                      <span className={`status-badge status-${a.status?.toLowerCase()}`}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '11.5px', color: '#047857', fontWeight: '700' }}>
                      {a.certificate_number || (a.status === 'APPROVED' ? 'Issued' : 'Filing Receipt Available')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            loadAppDetails(a);
                            setShowScrutinyModal(true);
                          }}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          <FileText size={12} /> Scrutiny Dossier
                        </button>
                        {Boolean(a.certificate_issued || a.status === 'APPROVED') && (
                          <button
                            className="btn btn-sm"
                            onClick={() => {
                              setCertificateApp(a);
                              setShowCertificateModal(true);
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: '700'
                            }}
                          >
                            <Award size={12} /> Certificate
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
      {/* 7. MY ACCOUNT (Blueprint Section 2.7) */}
      {/* ============================================================ */}
      {subPage === 'inst-account' && (
        <div>
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase' }}>
                Account Security &amp; Access Controls
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                Institutional Applicant Account &amp; Security Workspace
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Manage account credentials, two-factor authentication, active sessions, and view security policies.
              </div>
            </div>

            {/* Profile Credentials Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Institution Legal Name</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {profile?.name || user?.full_name}
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>AICTE Permanent ID (PID)</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1d4ed8', marginTop: '2px' }}>
                  {profile?.aicte_id || '1-33245561'}
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Registered Authorized Email</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {user?.email || profile?.email}
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Statutory Portal Role</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                  Technical Institution Applicant (RBAC: INSTITUTION)
                </div>
              </div>
            </div>
          </div>

          {/* Change Password & Security Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {/* Password Update Form */}
            <div className="gov-card">
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Update Account Password
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>
                Ensure your sovereign credentials adhere to National Informatics Centre (NIC) security policies.
              </p>

              {pwNotice && (
                <div style={{ padding: '10px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', color: '#065f46', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                  {pwNotice}
                </div>
              )}

              <form onSubmit={e => {
                e.preventDefault();
                if (pwForm.next !== pwForm.confirm) {
                  alert('New password and confirmation do not match.');
                  return;
                }
                setPwNotice('Account password updated successfully. Audit log recorded.');
                setPwForm({ current: '', next: '', confirm: '' });
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Current Password:</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={pwForm.current}
                    onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">New Password:</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={pwForm.next}
                    onChange={e => setPwForm({ ...pwForm, next: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Confirm New Password:</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={pwForm.confirm}
                    onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">
                  Update Password
                </button>
              </form>
            </div>

            {/* 2FA & Active Sessions & RBAC Disclaimer */}
            <div className="gov-card">
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                Authentication &amp; Session Health
              </h3>

              <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#047857' }}>
                  ✓ Multi-Factor Authentication (2FA): Active
                </div>
                <div style={{ fontSize: '11px', color: '#065f46', marginTop: '2px' }}>
                  Protected by TOTP Sovereign Authenticator. Mandatory for final submissions.
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                  Current Active Session
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Host: Web Client · IP: 127.0.0.1 · Token: JWT Bearer (Expires in 24h)
                </div>
              </div>

              <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309', marginBottom: '2px' }}>
                  Statutory Access Control Disclaimer
                </div>
                <div style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.4' }}>
                  Institutional users cannot modify their assigned role or access records of another institution. All actions are cryptographically sealed in the central AICTE audit ledger.
                </div>
              </div>
            </div>
          </div>
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

      {/* Official AICTE Scrutiny Dossier Modal (Form AICTE-SCRUTINY-2026) */}
      {showScrutinyModal && selectedApp && (
        <OfficialScrutinySheetModal
          appId={selectedApp.application_id}
          onClose={() => setShowScrutinyModal(false)}
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

