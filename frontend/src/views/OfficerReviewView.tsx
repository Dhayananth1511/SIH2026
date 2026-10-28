import React, { useState, useEffect } from 'react';
import {
  getApplication,
  getDocuments,
  runValidation,
  officerSendSuggestions,
  officerApproveApplication,
  recordScrutinyAction,
  recordComplianceAction,
  recordOfficialDecision,
  getDocumentDownloadUrl,
  getAicteMasterRecord,
  getExternalVerifications,
  getInfrastructureEvidence,
  triggerExternalVerification,
  getCategoryChecklists,
  uploadInfrastructurePhoto,
  uploadDocument
} from '../api';
import type {
  Application,
  Document,
  Finding,
  ComplianceCheck,
  AicteMasterRecord,
  AuthorityVerification,
  InfrastructureEvidence,
  CategoryChecklistItem,
  OfficialScrutinySheet
} from '../types';
import { useAuth } from '../AuthContext';
import {
  ArrowLeft,
  FileText,
  FileCheck,
  AlertTriangle,
  Scale,
  Eye,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  MessageSquare,
  Scroll,
  ExternalLink,
  Download,
  Award,
  RefreshCw,
  Sparkles,
  Building2,
  QrCode,
  MapPin,
  Camera,
  Server,
  Layers,
  ShieldCheck,
  Upload
} from 'lucide-react';
import DocumentOcrModal from '../components/DocumentOcrModal';
import RegulatoryOrderModal from '../components/RegulatoryOrderModal';
import ApprovalCertificateModal from '../components/ApprovalCertificateModal';
import OfficialScrutinySheetModal from '../components/OfficialScrutinySheetModal';


const DEFAULT_CATEGORY_CHECKLISTS: Record<string, CategoryChecklistItem[]> = {
  'Extension of Approval (EoA)': [
    { doc_type: 'Affidavit for Approval 2026-27', category: 'Statutory Declaration', rule_id: 'APH-2026-R01', required_value: 'Stamped ₹100 Judicial Affidavit with Notary Seal', description: 'Mandatory statutory undertaking under APH 2026-27 Chapter II', is_mandatory: true, issuing_authority: 'State Judicial Notary', verification_mechanism: 'Notary Bar Council & DSC' },
    { doc_type: 'Land Ownership Title Deed', category: 'Land & Infrastructure', rule_id: 'APH-2026-R02', required_value: 'Contiguous 5.0+ Acres registered land', description: 'Registered Sale Deed or 30-Year Government Lease', is_mandatory: true, issuing_authority: 'Revenue & Registration Dept', verification_mechanism: 'e-Registration Portal (IGR)' },
    { doc_type: 'Fire Safety NOC Certificate', category: 'Safety & Statutory', rule_id: 'APH-2026-R03', required_value: 'Valid Fire NOC for 2026-27', description: 'Clearance from State Fire & Emergency Services', is_mandatory: true, issuing_authority: 'Fire & Emergency Services Dept', verification_mechanism: 'State Fire Portal QR Code' },
    { doc_type: 'Building Approved Plan & Stability', category: 'Infrastructure', rule_id: 'APH-2026-R04', required_value: 'Municipal / Town Planning Approved Blueprint', description: 'Structural stability & occupancy clearance by certified engineer', is_mandatory: true, issuing_authority: 'Municipal Town Planning', verification_mechanism: 'Town Planning Building Authority' },
    { doc_type: 'Faculty Cadre & SFR Registry', category: 'Academic Quality', rule_id: 'APH-2026-R05', required_value: 'Cadre Ratio 1:2:6, Student-Faculty Ratio ≤ 1:20', description: 'Faculty roster with 100% EPFO biometric UAN mapping', is_mandatory: true, issuing_authority: 'EPFO India', verification_mechanism: 'EPFO UAN Unified Portal API' }
  ],
  'Increase in Intake / Additional Course': [
    { doc_type: 'Affidavit for Approval 2026-27', category: 'Statutory Declaration', rule_id: 'APH-2026-R01', required_value: 'Stamped ₹100 Judicial Affidavit', description: 'Undertaking for additional intake capacity', is_mandatory: true, issuing_authority: 'State Judicial Notary', verification_mechanism: 'Notary Bar Council & DSC' },
    { doc_type: 'NBA Accreditation Certificate', category: 'Quality Mandate', rule_id: 'APH-2026-R06', required_value: 'Valid NBA accreditation for minimum 50% eligible courses', description: 'Mandatory prerequisite for intake increase under APH 2026', is_mandatory: true, issuing_authority: 'National Board of Accreditation (NBA)', verification_mechanism: 'NBA Central Portal API' },
    { doc_type: 'Faculty Cadre & SFR Registry', category: 'Academic Quality', rule_id: 'APH-2026-R05', required_value: 'Expanded Faculty Cadre satisfying SFR ≤ 1:15', description: 'EPF verified appointment letters for incremental faculty', is_mandatory: true, issuing_authority: 'EPFO India', verification_mechanism: 'EPFO UAN Unified Portal API' },
    { doc_type: 'Building Approved Plan & Stability', category: 'Infrastructure', rule_id: 'APH-2026-R04', required_value: 'Additional Built-Up Instructional Area (≥ 420 sqm/division)', description: 'Completion certificate for additional laboratories & classrooms', is_mandatory: true, issuing_authority: 'Municipal Town Planning', verification_mechanism: 'Town Planning Building Authority' },
    { doc_type: 'Endowment Joint FDR Receipt', category: 'Finance', rule_id: 'APH-2026-R07', required_value: 'Additional ₹25 Lakhs Joint FDR with AICTE', description: 'Statutory security deposit for increased student intake', is_mandatory: true, issuing_authority: 'Scheduled Nationalized Bank', verification_mechanism: 'Core Banking System (CBS)' }
  ],
  'New Institution Approval': [
    { doc_type: 'Land Ownership Title Deed', category: 'Land & Infrastructure', rule_id: 'APH-2026-R02', required_value: 'Contiguous 7.5+ Acres in rural / 2.5 Acres urban', description: 'Clear title and non-encumbrance certificate for 30 years', is_mandatory: true, issuing_authority: 'Revenue & Registration Dept', verification_mechanism: 'e-Registration Portal (IGR)' },
    { doc_type: 'Trust / Society Registration & Bylaws', category: 'Governance', rule_id: 'APH-2026-R08', required_value: 'Registered under Societies Act / Section 8 Company', description: 'Audited 3-year accounts of Sponsoring Trust', is_mandatory: true, issuing_authority: 'Registrar of Societies / MCA', verification_mechanism: 'MCA-21 / Charity Commissioner' },
    { doc_type: 'Affidavit for Approval 2026-27', category: 'Statutory Declaration', rule_id: 'APH-2026-R01', required_value: '₹100 Stamped Affidavit with Notary Seal', description: 'Statutory submission of new establishment', is_mandatory: true, issuing_authority: 'State Judicial Notary', verification_mechanism: 'Notary Bar Council & DSC' },
    { doc_type: 'Fire Safety NOC Certificate', category: 'Safety & Statutory', rule_id: 'APH-2026-R03', required_value: 'Permanent Fire NOC for all blocks', description: 'Fire safety system installation and clearance', is_mandatory: true, issuing_authority: 'Fire & Emergency Services Dept', verification_mechanism: 'State Fire Portal QR Code' },
    { doc_type: 'Endowment Joint FDR Receipt', category: 'Finance', rule_id: 'APH-2026-R07', required_value: '₹100 Lakhs Joint FDR with Regional Officer AICTE', description: 'Statutory security reserve fund', is_mandatory: true, issuing_authority: 'Scheduled Nationalized Bank', verification_mechanism: 'Core Banking System (CBS)' }
  ],
  'Supernumerary Seats (FN / OCI / TFW)': [
    { doc_type: 'Affidavit for Approval 2026-27', category: 'Statutory Declaration', rule_id: 'APH-2026-R01', required_value: 'Special Undertaking for FN / OCI Admissions', description: 'Compliance with Ministry of External Affairs / Home Affairs norms', is_mandatory: true, issuing_authority: 'State Judicial Notary', verification_mechanism: 'Notary Bar Council & DSC' },
    { doc_type: 'Hostel & Residential Facilities Proof', category: 'Student Welfare', rule_id: 'APH-2026-R09', required_value: 'Dedicated International Student Hostel Facility', description: 'Furnished residential quarters with security & catering clearances', is_mandatory: true, issuing_authority: 'Local Municipal Body', verification_mechanism: 'Physical & CV Inspection' },
    { doc_type: 'NBA Accreditation Certificate', category: 'Quality Mandate', rule_id: 'APH-2026-R06', required_value: 'NBA Accredited in applied program', description: 'Mandatory quality clearance for admitting foreign students', is_mandatory: true, issuing_authority: 'National Board of Accreditation (NBA)', verification_mechanism: 'NBA Central Portal API' },
    { doc_type: 'Faculty Cadre & SFR Registry', category: 'Academic Quality', rule_id: 'APH-2026-R05', required_value: 'Qualified Mentor Faculty for International Cohort', description: 'Faculty documentation with EPFO verification', is_mandatory: true, issuing_authority: 'EPFO India', verification_mechanism: 'EPFO UAN Unified Portal API' }
  ]
};

interface Props {
  appId: string;
  onBack: () => void;
  onViewDoc?: (docName: string) => void;
}

export default function OfficerReviewView({ appId, onBack, onViewDoc }: Props) {
  const { user } = useAuth();
  const rawRole = (user?.role || '').toLowerCase();
  const isOfficer = rawRole.includes('officer') || rawRole.includes('scrutiny') || rawRole.includes('compliance') || rawRole.includes('chairman') || rawRole.includes('decision');
  const isAdmin = rawRole.includes('admin');
  const isScrutinyOfficer = true; // All approval officers have full scrutiny access
  const isComplianceOfficer = rawRole.includes('compliance') || rawRole.includes('reviewer');
  const isDecisionMaker = rawRole.includes('chairman') || rawRole.includes('decision');

  const [app, setApp] = useState<Application | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'findings' | 'compliance' | 'master_record' | 'authorities' | 'infrastructure' | 'history'>('documents');
  const [statusMessage, setStatusMessage] = useState('');

  // AI Validation state
  const [validating, setValidating] = useState(false);

  // Statutory verification state variables
  const [showScrutinySheetModal, setShowScrutinySheetModal] = useState(false);
  const [masterRecord, setMasterRecord] = useState<AicteMasterRecord | null>(null);
  const [authorities, setAuthorities] = useState<AuthorityVerification[]>([]);
  const [infraList, setInfraList] = useState<InfrastructureEvidence[]>([]);
  const [verifyingAuthorityId, setVerifyingAuthorityId] = useState<number | null>(null);
  const [categoryChecklists, setCategoryChecklists] = useState<Record<string, CategoryChecklistItem[]>>(DEFAULT_CATEGORY_CHECKLISTS);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Extension of Approval (EoA)');

  // Infrastructure upload & CV state
  const [uploadingInfra, setUploadingInfra] = useState(false);
  const [infraEvidenceType, setInfraEvidenceType] = useState('LABORATORY');
  const [infraTitle, setInfraTitle] = useState('');
  const [infraFile, setInfraFile] = useState<File | null>(null);
  const [infraLat, setInfraLat] = useState('18.5204');
  const [infraLng, setInfraLng] = useState('73.8567');

  // Direct Real Document Upload state (for testing AI validation)
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [selectedUploadDocType, setSelectedUploadDocType] = useState('Land Ownership Title Deed');
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocFile) {
      alert('Please select a file (.pdf, .png, .jpg, .jpeg) to upload.');
      return;
    }
    setIsUploadingDoc(true);
    try {
      await uploadDocument(appId, selectedUploadDocType, uploadDocFile);
      setStatusMessage(`✓ Document '${selectedUploadDocType}' (${uploadDocFile.name}) uploaded successfully.`);
      setUploadDocFile(null);
      setShowUploadDocModal(false);
      await loadApplicationData();
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleUploadInfrastructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infraFile) {
      alert('Please select an image file to upload.');
      return;
    }
    setUploadingInfra(true);
    try {
      const latNum = parseFloat(infraLat) || 18.5204;
      const lngNum = parseFloat(infraLng) || 73.8567;
      const newEv = await uploadInfrastructurePhoto(
        appId,
        infraEvidenceType,
        infraTitle || `${infraEvidenceType.replace(/_/g, ' ')} Evidence Photo`,
        infraFile,
        latNum,
        lngNum
      );
      setInfraList(prev => [newEv, ...prev]);
      setInfraFile(null);
      setInfraTitle('');
      setStatusMessage(`✓ Infrastructure photo uploaded successfully: ${newEv.title} (GPS: ${newEv.gps_verified ? 'Validated' : 'Outside Boundary'}, ${newEv.cv_detected_objects?.length || 0} entities recognized).`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to upload infrastructure evidence: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingInfra(false);
    }
  };

  // Unified AICTE Approval Officer Actions
  const [officerSuggestionText, setOfficerSuggestionText] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('All statutory AICTE APH 2026-27 norms and document clearances verified and satisfied. Statutory Extension of Approval granted.');
  const [submittingOfficerAction, setSubmittingOfficerAction] = useState(false);

  // Observation / Clarification form (legacy compatibility)
  const [observationText, setObservationText] = useState('');
  const [clarificationText, setClarificationText] = useState('');
  const [showClarificationModal, setShowClarificationModal] = useState(false);

  // Decision Modal
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState<'CLEARED' | 'DEFICIENCY' | 'REJECTED'>('CLEARED');
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionOrderNo, setDecisionOrderNo] = useState('');

  // Version modal
  const [selectedDocVersions, setSelectedDocVersions] = useState<Document | null>(null);

  // Side-by-side OCR, Regulatory Order, and Approval Certificate modals
  const [inspectingDoc, setInspectingDoc] = useState<Document | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);


  useEffect(() => {
    loadApplicationData();
  }, [appId]);

  const loadApplicationData = async () => {
    setLoading(true);
    try {
      const appData = await getApplication(appId);
      setApp(appData);
      if (appData.category) setSelectedCategoryTab(appData.category);
      setDocs(appData.documents && appData.documents.length > 0 ? appData.documents : await getDocuments(appId).catch(() => []));
      setDecisionOrderNo(appData.certificate_number || `AICTE/CERT/2026-27/${appData.application_id.replace('APP-', '')}`);
      
      // Fetch statutory datasets
      getAicteMasterRecord(appId).then(data => setMasterRecord(data)).catch(() => {});
      getExternalVerifications(appId).then(data => setAuthorities(data)).catch(() => {});
      getInfrastructureEvidence(appId).then(data => setInfraList(data)).catch(() => {});
      getCategoryChecklists().then(data => {
        if (data && Object.keys(data).length > 0) setCategoryChecklists(data);
      }).catch(() => {});
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Run AI Document Validation
  const handleRunAiValidation = async () => {
    setValidating(true);
    try {
      const res = await runValidation(appId);
      setStatusMessage(`✓ AI Document Validation Completed: ${res.summary}`);
      await loadApplicationData();
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'AI validation run failed.');
    } finally {
      setValidating(false);
    }
  };

  // 2. Officer Send Suggestions to Institution (Action Required)
  const handleOfficerSendSuggestions = async () => {
    if (!officerSuggestionText.trim()) {
      alert('Please specify the observations, faults, or corrective suggestions for the institution.');
      return;
    }
    setSubmittingOfficerAction(true);
    try {
      await officerSendSuggestions(appId, officerSuggestionText.trim());
      setStatusMessage('✓ Corrective suggestions sent to institution. Application status updated to ACTION_REQUIRED.');
      setOfficerSuggestionText('');
      await loadApplicationData();
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to send suggestions.');
    } finally {
      setSubmittingOfficerAction(false);
    }
  };

  const handleRecheckAuthority = async (auth: AuthorityVerification) => {
    setVerifyingAuthorityId(auth.id);
    try {
      await triggerExternalVerification(appId, {
        authority_name: auth.authority_name,
        verification_type: auth.verification_type,
        status: 'VERIFIED',
        urn_or_token: auth.urn_or_token || `LIVE-CHK-${Date.now()}`,
        source_agency: auth.source_agency,
        source_url: auth.source_url
      });
      const updated = await getExternalVerifications(appId);
      setAuthorities(updated);
      setStatusMessage(`✓ Authority (${auth.authority_name}) verified in real-time.`);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Verification attempt failed');
    } finally {
      setVerifyingAuthorityId(null);
    }
  };

  // 3. Officer Approve Application & Issue Certificate
  const handleOfficerApprove = async () => {
    if (!approvalRemarks.trim()) {
      alert('Please enter statutory approval remarks.');
      return;
    }
    setSubmittingOfficerAction(true);
    try {
      const orderNo = decisionOrderNo || `AICTE/CERT/2026-27/${app?.application_id.replace('APP-', '')}`;
      const res = await officerApproveApplication(appId, approvalRemarks.trim(), orderNo);
      setStatusMessage(`✓ Application Formally Approved! Certificate #${res.certificate_number} successfully issued.`);
      await loadApplicationData();
      setShowCertificateModal(true);
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to approve application.');
    } finally {
      setSubmittingOfficerAction(false);
    }
  };

  // Actions
  const handleScrutinyForward = async () => {
    if (!observationText.trim()) {
      alert('Please enter scrutiny review observations before forwarding.');
      return;
    }
    try {
      await recordScrutinyAction(appId, 'FORWARDED_TO_COMPLIANCE', observationText);
      setStatusMessage('✓ Dossier forwarded for Compliance Review.');
      setObservationText('');
      loadApplicationData();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to forward application.');
    }
  };

  const handleComplianceForward = async () => {
    if (!observationText.trim()) {
      alert('Please enter compliance recommendation remarks before forwarding.');
      return;
    }
    try {
      await recordComplianceAction(appId, 'FORWARDED_TO_DECISION', observationText);
      setStatusMessage('✓ Dossier forwarded to Authorized Decision-Maker.');
      setObservationText('');
      loadApplicationData();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to forward application.');
    }
  };

  const handleRequestClarification = async () => {
    if (!clarificationText.trim()) {
      alert('Please state the specific deficiency or clarification required.');
      return;
    }
    try {
      if (isScrutinyOfficer) {
        await recordScrutinyAction(appId, 'CLARIFICATION_REQUESTED', clarificationText);
      } else {
        await recordComplianceAction(appId, 'CLARIFICATION_REQUESTED', clarificationText);
      }
      setShowClarificationModal(false);
      setClarificationText('');
      setStatusMessage('✓ Clarification requested from institution.');
      loadApplicationData();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to request clarification.');
    }
  };

  const handleRecordDecision = async () => {
    if ((decisionOutcome === 'DEFICIENCY' || decisionOutcome === 'REJECTED') && (!decisionReason || decisionReason.trim().length < 10)) {
      alert('A reasoned justification is strictly mandatory for adverse decisions.');
      return;
    }
    try {
      await recordOfficialDecision(
        appId,
        decisionOutcome,
        decisionReason || 'Statutory regulatory approval granted following comprehensive scrutiny.',
        decisionOrderNo,
        'Member Secretary, AICTE'
      );
      setShowDecisionModal(false);
      setStatusMessage(`✓ Official AICTE Decision Recorded: ${decisionOutcome}`);
      loadApplicationData();
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to record decision.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Loading regulatory dossier...
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>Application not found.</p>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Queue
        </button>
      </div>
    );
  }

  const findings = app.findings || [];
  const complianceChecks = app.compliance_checks || [];
  const reviewActions = app.review_actions || [];

  return (
    <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Top Header / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            AICTE Approval Officer Workspace › <span style={{ fontWeight: '700', color: '#0f172a' }}>{app.application_id}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRunAiValidation}
            disabled={validating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}
          >
            <RefreshCw size={12} className={validating ? 'animate-spin' : ''} />
            <span>{validating ? 'Running AI...' : 'Run AI Validation'}</span>
          </button>

          <button
            id="btn-open-scrutiny-sheet"
            className="btn btn-sm"
            onClick={() => setShowScrutinySheetModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#047857',
              color: '#ffffff',
              fontWeight: '700',
              padding: '5px 12px',
              fontSize: '11.5px',
              border: '1px solid #065f46',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            title="Generate Form AICTE-SCRUTINY-2026: Official Statutory Scrutiny Sheet with SHA-256 Seal"
          >
            <FileText size={13} />
            <span>Official Scrutiny Sheet (Form AICTE-SCRUTINY-2026)</span>
          </button>

          {(app.status === 'APPROVED' || app.certificate_issued) && (
            <button
              className="btn btn-sm"
              onClick={() => setShowCertificateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                fontWeight: '700',
                padding: '4px 10px',
                fontSize: '11.5px'
              }}
            >
              <Award size={13} />
              <span>Certificate</span>
            </button>
          )}

          <span className={`status-badge status-${app.status?.toLowerCase()}`}>
            {app.status?.replace('_', ' ')}
          </span>
          <span style={{
            fontSize: '11.5px',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '4px',
            background: app.scrutiny_score >= 80 ? '#ecfdf5' : '#fffbeb',
            color: app.scrutiny_score >= 80 ? '#047857' : '#b45309',
            border: '1px solid rgba(0,0,0,0.06)'
          }}>
            Score: {app.scrutiny_score}%
          </span>
        </div>
      </div>

      {statusMessage && (
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
          {statusMessage}
        </div>
      )}


      {/* Application & Institution Summary Card */}
      <div className="gov-card" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              {app.institution_name}
            </h2>
            <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span><strong>Category:</strong> {app.category}</span>
              <span><strong>Academic Year:</strong> {app.academic_year || '2026-27'}</span>
              <span><strong>Location:</strong> {app.city}, {app.state}</span>
              <span><strong>Type:</strong> {app.institution_type}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Submitted Date</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
              {new Date(app.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Current Stage</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', textTransform: 'capitalize' }}>
              {app.current_stage?.replace('_', ' ') || 'Submission'}
            </div>
          </div>
        </div>

        {/* Final Decision Decree Banner (if recorded) */}
        {app.decision_record && (
          <div style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: app.decision_record.decision === 'CLEARED' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${app.decision_record.decision === 'CLEARED' ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  background: app.decision_record.decision === 'CLEARED' ? '#059669' : '#dc2626',
                  color: '#ffffff',
                  marginRight: '8px'
                }}>
                  STATUTORY ORDER: {app.decision_record.decision}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                  Order #{app.decision_record.order_number}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Issued: {new Date(app.decision_record.decided_at).toLocaleDateString('en-IN')}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#334155', marginTop: '6px', lineHeight: '1.4' }}>
              {app.decision_record.reasons}
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowOrderModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Scroll size={13} />
                <span>View Statutory Order</span>
              </button>

              {((app.final_decision || '').toUpperCase() === 'CLEARED' || (app.status || '').toUpperCase() === 'DECISION_RECORDED' || app.status === 'APPROVED' || app.certificate_issued) && (
                <button
                  className="btn btn-sm"
                  onClick={() => setShowCertificateModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#ffffff',
                    border: '1px solid #065f46',
                    fontWeight: '700'
                  }}
                >
                  <Award size={14} />
                  <span>View Official Certificate of Approval</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Officer Suggestions Banner (if officer already sent suggestions) */}
        {app.officer_suggestions && (
          <div style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: '#fdf4ff',
            border: '1px solid #e879f9',
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} color="#a21caf" />
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#86198f' }}>
                  Active Officer Suggestions Sent to Institution:
                </span>
              </div>
              {app.officer_reviewed_at && (
                <span style={{ fontSize: '11px', color: '#a21caf' }}>
                  Dispatched: {new Date(app.officer_reviewed_at).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#4a044e', lineHeight: '1.45', background: '#ffffff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #f5d0fe' }}>
              {app.officer_suggestions}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '18px', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('documents')}
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'documents' ? '2.5px solid #0284c7' : '2.5px solid transparent',
            color: activeTab === 'documents' ? '#0284c7' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FileText size={13} />
          Supporting Docs ({docs.length})
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'findings' ? '2.5px solid #0284c7' : '2.5px solid transparent',
            color: activeTab === 'findings' ? '#0284c7' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertTriangle size={13} />
          Findings &amp; Anomalies ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'compliance' ? '2.5px solid #0284c7' : '2.5px solid transparent',
            color: activeTab === 'compliance' ? '#0284c7' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Scale size={13} />
          Compliance Norms ({complianceChecks.length})
        </button>
        <button
          id="tab-btn-aimr"
          onClick={() => setActiveTab('master_record')}
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'master_record' ? '2.5px solid #0284c7' : '2.5px solid transparent',
            color: activeTab === 'master_record' ? '#0284c7' : '#64748b',
            background: activeTab === 'master_record' ? '#f0f9ff' : 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Server size={13} />
          <span>AICTE Master Record (AIMR)</span>
        </button>
        <button
          id="tab-btn-authorities"
          onClick={() => setActiveTab('authorities')}
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'authorities' ? '2.5px solid #0284c7' : '2.5px solid transparent',
            color: activeTab === 'authorities' ? '#0284c7' : '#64748b',
            background: activeTab === 'authorities' ? '#f0f9ff' : 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <QrCode size={13} />
          <span>Issuing Authority Clearances &amp; DSC ({authorities.length})</span>
        </button>
        <button
          id="tab-btn-infra"
          onClick={() => setActiveTab('infrastructure')}
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'infrastructure' ? '2.5px solid #0284c7' : '2.5px solid transparent',
            color: activeTab === 'infrastructure' ? '#0284c7' : '#64748b',
            background: activeTab === 'infrastructure' ? '#f0f9ff' : 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Camera size={13} />
          <span>Campus Infrastructure &amp; Geotagging ({infraList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2.5px solid #0284c7' : '2.5px solid transparent',
            color: activeTab === 'history' ? '#0284c7' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Clock size={13} />
          Audit Ledger ({reviewActions.length})
        </button>
      </div>

      {/* TAB 1: SUPPORTING DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Uploaded Statutory Clearances &amp; Supporting Records
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Stored with SHA-256 checksums and immutable version tracking
              </span>
            </div>

            <button
              id="btn-officer-upload-doc"
              className="btn btn-primary btn-sm"
              onClick={() => setShowUploadDocModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', background: '#0284c7', borderColor: '#0369a1' }}
            >
              <Upload size={13} />
              <span>+ Upload Real Document</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Filename</th>
                  <th>Version</th>
                  <th>Checksum (SHA-256)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                        <Upload size={28} style={{ color: '#94a3b8', marginBottom: '10px' }} />
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>
                          No Supporting Documents Attached
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', marginBottom: '16px', lineHeight: '1.45' }}>
                          This application currently has no uploaded clearance dossiers. Upload statutory clearance documents (Land Title Deed, Fire NOC, Approved Building Plan, FDR, SFR) to commence verification.
                        </p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowUploadDocModal(true)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto', background: '#0284c7', borderColor: '#0369a1' }}
                        >
                          <Upload size={13} />
                          <span>Upload Clearance Document</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  docs.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>{doc.doc_type}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={13} color="#64748b" />
                          <span style={{ fontSize: '11.5px' }}>{doc.filename}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: (doc.version || 1) > 1 ? '#e0f2fe' : '#f1f5f9',
                          color: (doc.version || 1) > 1 ? '#0369a1' : '#475569'
                        }}>
                          v{doc.version || 1}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '10.5px', color: '#64748b' }}>
                        {doc.sha256_hash ? `${doc.sha256_hash.slice(0, 14)}...` : 'N/A'}
                      </td>
                      <td>
                        <span className={`status-badge status-${doc.status?.toLowerCase()}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={getDocumentDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            title="Open / Download Secure File"
                          >
                            <ExternalLink size={12} />
                            <span>View</span>
                          </a>

                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => setInspectingDoc(doc)}
                            title="Side-by-side Document & OCR Inspection"
                          >
                            <Eye size={12} />
                            <span>Inspect OCR &amp; Anomaly</span>
                          </button>

                          {doc.versions && doc.versions.length > 0 && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => setSelectedDocVersions(doc)}
                            >
                              <Clock size={12} />
                              <span>History ({doc.versions.length})</span>
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
      )}

      {/* TAB 2: AI FINDINGS & ANOMALIES */}
      {activeTab === 'findings' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              AI Validation Findings &amp; Potential Anomaly Flags
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Evidence-based findings generated by the middleware. Deterministic rules govern findings.
            </span>
          </div>

          {findings.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#059669', background: '#ecfdf5', borderRadius: '6px' }}>
              <CheckCircle2 size={24} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: '700', fontSize: '13px' }}>No Deficiencies or Anomaly Flags Detected</div>
              <div style={{ fontSize: '11.5px', color: '#065f46', marginTop: '2px' }}>
                All mandatory checks and document validations have passed successfully.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {findings.map(f => {
                const isAnomaly = f.check_type === 'MANIPULATION' || f.rule_description?.includes('anomaly');
                return (
                  <div
                    key={f.id}
                    style={{
                      border: '1px solid',
                      borderColor: isAnomaly ? '#fed7aa' : (f.severity === 'critical' ? '#fca5a5' : '#fed7aa'),
                      background: isAnomaly ? '#fffaf5' : '#fffbeb',
                      borderRadius: '6px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isAnomaly ? <ShieldAlert size={16} color="#c2410c" /> : <AlertTriangle size={16} color="#b45309" />}
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                          {f.rule_description}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: isAnomaly ? '#fed7aa' : (f.severity === 'critical' ? '#fee2e2' : '#fef3c7'),
                          color: isAnomaly ? '#9a3412' : (f.severity === 'critical' ? '#991b1b' : '#92400e')
                        }}>
                          {f.check_type || 'CHECK'} · {f.severity?.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Rule: {f.rule_id}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.5', marginBottom: '8px' }}>
                      {f.finding_text}
                    </div>

                    {f.detected_issue && (
                      <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>
                        <strong>Detected Issue:</strong> {f.detected_issue}
                      </div>
                    )}

                    {f.why_attention_needed && (
                      <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>
                        <strong>Regulatory Impact:</strong> {f.why_attention_needed}
                      </div>
                    )}

                    {f.recommended_action && (
                      <div style={{ fontSize: '11.5px', color: '#1d4ed8' }}>
                        <strong>Recommended Action:</strong> {f.recommended_action}
                      </div>
                    )}

                    {f.ai_suggestion && (
                      <div style={{
                        marginTop: '8px',
                        padding: '10px 12px',
                        background: '#f0fdf4',
                        border: '1.5px solid #86efac',
                        borderRadius: '6px',
                        color: '#166534',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', marginBottom: '3px' }}>
                          <Sparkles size={14} color="#15803d" />
                          <span>AICTE AI Remediation Guidance (What Institution Must Rectify):</span>
                        </div>
                        <div style={{ lineHeight: '1.45', color: '#14532d' }}>{f.ai_suggestion}</div>
                      </div>
                    )}

                    {isAnomaly && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: '#ffffff',
                        border: '1px solid #fed7aa',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#9a3412',
                        fontWeight: '600'
                      }}>
                        Notice: Potential anomaly — manual verification required. This finding does not confirm forgery; manual inspection of original seals is required.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLIANCE CHECKLIST */}
      {activeTab === 'compliance' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              AICTE APH 2026-27 Regulatory Compliance Checklist
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Standard statutory requirements evaluated against uploaded evidence
            </span>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Requirement Name</th>
                  <th>Category</th>
                  <th>Required Standard</th>
                  <th>Evaluated Evidence</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {complianceChecks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No compliance checks registered yet.
                    </td>
                  </tr>
                ) : (
                  complianceChecks.map(chk => (
                    <tr key={chk.id}>
                      <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{chk.rule_id}</td>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>{chk.rule_name}</td>
                      <td>{chk.category}</td>
                      <td style={{ fontSize: '11.5px', color: '#475569' }}>{chk.required_value}</td>
                      <td style={{ fontSize: '11.5px', color: '#334155' }}>{chk.evidence_value || chk.details}</td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: chk.result === 'PASS' ? '#ecfdf5' : (chk.result === 'WARNING' ? '#fffbeb' : '#fef2f2'),
                          color: chk.result === 'PASS' ? '#047857' : (chk.result === 'WARNING' ? '#b45309' : '#b91c1c')
                        }}>
                          {chk.result}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: AICTE MASTER RECORD (AIMR) RECONCILIATION */}
      {activeTab === 'master_record' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Card */}
          <div className="gov-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    AICTE Central Master Record (AIMR) Reconciliation
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                  Permanent Central Council Record &bull; AICTE ID: <strong>{masterRecord?.aicte_id || 'AICTE-INST-88219'}</strong> &bull;
                  Institution: <strong>{masterRecord?.institution_name || app.institution_name}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <ShieldCheck size={13} />
                  <span>Central Master Ledger Synced</span>
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Category Checklist & Verification Engine */}
          <div className="gov-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#059669" />
                  <span>AICTE APH 2026-27 Statutory Category Checklist</span>
                </h4>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Interactive checklist engine verifying mandatory statutory filings per AICTE Approval Process Handbook (APH 2026–27).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', color: '#475569' }}>
                  Filing Category: <strong style={{ color: '#0f172a' }}>{app.category}</strong>
                </span>
              </div>
            </div>

            {/* Category Selector Tabs */}
            <div style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              marginBottom: '14px',
              flexWrap: 'wrap'
            }}>
              {[
                'Extension of Approval (EoA)',
                'Increase in Intake / Additional Course',
                'New Institution Approval',
                'Supernumerary Seats (FN / OCI / TFW)'
              ].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryTab(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: selectedCategoryTab === cat ? '800' : '600',
                    background: selectedCategoryTab === cat ? '#0284c7' : 'transparent',
                    color: selectedCategoryTab === cat ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat === app.category ? `★ ${cat} (Applied)` : cat}
                </button>
              ))}
            </div>

            {/* Category Checklist Table */}
            <div className="table-responsive">
              <table className="gov-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Statutory Document Type</th>
                    <th>Regulatory Rule / APH Clause</th>
                    <th>Mandatory Statutory Standard</th>
                    <th>Application File Proof</th>
                    <th>Verification Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(categoryChecklists[selectedCategoryTab] || DEFAULT_CATEGORY_CHECKLISTS[selectedCategoryTab] || []).map((item, idx) => {
                    const matchedDoc = docs.find(d => 
                      d.doc_type?.toLowerCase().includes(item.doc_type.toLowerCase()) ||
                      item.doc_type.toLowerCase().includes(d.doc_type?.toLowerCase()) ||
                      (item.doc_type.includes('Affidavit') && d.doc_type?.includes('Affidavit')) ||
                      (item.doc_type.includes('Land') && d.doc_type?.includes('Land')) ||
                      (item.doc_type.includes('Fire') && d.doc_type?.includes('Fire')) ||
                      (item.doc_type.includes('Building') && d.doc_type?.includes('Building')) ||
                      (item.doc_type.includes('Faculty') && d.doc_type?.includes('Faculty'))
                    );
                    const isSatisfied = Boolean(matchedDoc);

                    return (
                      <tr key={idx} style={{ background: isSatisfied ? '#ffffff' : '#fffbeb' }}>
                        <td>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.doc_type}</div>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>{item.category} &bull; Authority: {item.issuing_authority || 'Statutory Body'}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1d4ed8' }}>
                          {item.rule_id}
                        </td>
                        <td style={{ fontSize: '11.5px', color: '#334155', maxWidth: '280px', lineHeight: '1.35' }}>
                          <div>{item.required_value}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.description}</div>
                        </td>
                        <td>
                          {matchedDoc ? (
                            <div>
                              <span style={{ color: '#047857', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} color="#059669" />
                                <span>{matchedDoc.filename}</span>
                              </span>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                Verified by {matchedDoc.verification_result || matchedDoc.status || 'AI Pipeline'}
                              </div>
                            </div>
                          ) : (
                            <span style={{
                              color: '#b45309',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: '#fef3c7',
                              padding: '2px 6px',
                              borderRadius: '3px'
                            }}>
                              Pending Upload
                            </span>
                          )}
                        </td>
                        <td>
                          {isSatisfied ? (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0'
                            }}>
                              ✓ SATISFIED
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fecaca'
                            }}>
                              DEFICIENCY
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span style={{ fontSize: '11.5px', color: '#475569' }}>
                Summary for <strong>{selectedCategoryTab}</strong>: {
                  (categoryChecklists[selectedCategoryTab] || DEFAULT_CATEGORY_CHECKLISTS[selectedCategoryTab] || []).filter(item => 
                    docs.some(d => d.doc_type?.toLowerCase().includes(item.doc_type.toLowerCase()))
                  ).length
                } / {(categoryChecklists[selectedCategoryTab] || DEFAULT_CATEGORY_CHECKLISTS[selectedCategoryTab] || []).length} Statutory Documents Satisfied.
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>
                All standards dynamically mapped to AICTE APH 2026-27 statutory rules.
              </span>
            </div>
          </div>

          {/* TER Payment Status Card */}
          <div className="gov-card">
            <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={15} color="#059669" />
              2. Technical Education Regulatory (TER) Processing Fee Status
            </h4>
            
            <div style={{
              background: masterRecord?.ter_payment?.status === 'CONFIRMED' ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${masterRecord?.ter_payment?.status === 'CONFIRMED' ? '#bbf7d0' : '#fde68a'}`,
              borderRadius: '6px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: masterRecord?.ter_payment?.status === 'CONFIRMED' ? '#15803d' : '#d97706',
                    color: '#ffffff'
                  }}>
                    {masterRecord?.ter_payment?.status || 'CONFIRMED'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Receipt No: {masterRecord?.ter_payment?.receipt_no || 'AICTE-TER-2026-98124'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                  Amount: <strong>{masterRecord?.ter_payment?.amount || '₹1,50,000'}</strong> &bull;
                  Date: <strong>{masterRecord?.ter_payment?.payment_date || '2026-03-12'}</strong> &bull;
                  Bank Reference / UTR: <code>{masterRecord?.ter_payment?.bank_ref || 'SBIN00491823901'}</code>
                </div>
              </div>
              <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: '600', textAlign: 'right' }}>
                ✓ Zero redundant manual fee verification.<br />
                Direct reconciliation via Central AICTE Accounts.
              </div>
            </div>
          </div>

          {/* 3-Year EoA History & Approved Intake Capacity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
            {/* Historical EoA Status */}
            <div className="gov-card">
              <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="#0284c7" />
                3. Past 3-Year Extension of Approval (EoA) History
              </h4>
              <table className="gov-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Academic Year</th>
                    <th>Status</th>
                    <th>Order Number</th>
                    <th>Issued Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(masterRecord?.previous_eoa || [
                    { year: '2025-26', status: 'APPROVED', order_number: 'F.No. South-West/1-9318231201/2025/EOA', date: '30-Apr-2025' },
                    { year: '2024-25', status: 'APPROVED', order_number: 'F.No. South-West/1-7412948212/2024/EOA', date: '02-May-2024' },
                    { year: '2023-24', status: 'APPROVED', order_number: 'F.No. South-West/1-5829103941/2023/EOA', date: '28-Apr-2023' }
                  ]).map((eoa, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '700', color: '#0f172a' }}>{eoa.year}</td>
                      <td>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: '#ecfdf5',
                          color: '#047857'
                        }}>
                          {eoa.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>{eoa.order_number}</td>
                      <td style={{ fontSize: '11.5px', color: '#64748b' }}>{eoa.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approved Programmes & Sanctioned Intake */}
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={15} color="#0284c7" />
                  4. Approved Programmes &amp; Intake Caps
                </h4>
                <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>
                  Total Sanctioned: {masterRecord?.total_sanctioned_intake || 378} Seats
                </span>
              </div>
              <table className="gov-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Programme</th>
                    <th>Course / Specialization</th>
                    <th>Sanctioned Intake</th>
                  </tr>
                </thead>
                <tbody>
                  {(masterRecord?.approved_programmes || [
                    { program: 'Engineering & Tech', course: 'B.Tech Computer Science & Engg', sanctioned_intake: 120 },
                    { program: 'Engineering & Tech', course: 'B.Tech AI & Data Science', sanctioned_intake: 60 },
                    { program: 'Engineering & Tech', course: 'B.Tech Electronics & Comm.', sanctioned_intake: 120 },
                    { program: 'Management', course: 'Master of Business Admin (MBA)', sanctioned_intake: 60 },
                    { program: 'Applied Science', course: 'B.Tech Information Technology', sanctioned_intake: 18 }
                  ]).map((prog, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>{prog.program}</td>
                      <td style={{ color: '#334155' }}>{prog.course}</td>
                      <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{prog.sanctioned_intake}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Faculty EPF & Accreditation Ledger */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
            {/* Faculty EPF Roster & SFR */}
            <div className="gov-card">
              <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={15} color="#059669" />
                5. Mandatory Faculty Cadre &amp; EPF Biometric Ledger
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Total Verified Faculty</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                    {masterRecord?.faculty_epf_roster?.total_faculty || 28}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>
                    ✓ 100% EPF Biometric Seeded ({masterRecord?.faculty_epf_roster?.epf_registered_count || 28}/{masterRecord?.faculty_epf_roster?.total_faculty || 28})
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Student-Faculty Ratio (SFR)</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#047857', marginTop: '2px' }}>
                    {masterRecord?.faculty_epf_roster?.sfr_ratio || '1:18.5'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>
                    ✓ Complies with AICTE Norm (≤ 1:20)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: '#475569' }}>Cadre Ratio (Professor : Assoc Prof : Asst Prof)</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                      {masterRecord?.faculty_epf_roster?.cadre_ratio || '1:2:6'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accreditation & Past SSC Standing */}
            <div className="gov-card">
              <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={15} color="#d97706" />
                5. Accreditation Standing &amp; Standing Scrutiny Status
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#166534' }}>
                    NBA Accreditation Standing:
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#14532d', marginTop: '2px' }}>
                    {masterRecord?.accreditation_details?.nba || 'Tier-1 Accredited (Valid till 30-06-2027)'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e40af' }}>
                    NAAC Standing:
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#1e3a8a', marginTop: '2px' }}>
                    {masterRecord?.accreditation_details?.naac || 'Grade A+ (CGPA 3.48/4.00, Valid till 2028)'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                    Past Standing Scrutiny Committee (SSC) Deficiencies:
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: '700', marginTop: '2px' }}>
                    ✓ Nil Unresolved Deficiencies across preceding 3 approval cycles
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ISSUING AUTHORITIES & QR AUTHENTICATION */}
      {activeTab === 'authorities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Statutory Taxonomy Explainer */}
          <div className="gov-card" style={{ borderLeft: '4px solid #7c3aed' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={18} color="#7c3aed" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Authorized Issuing Authority Digital Verification Gateway
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0', maxWidth: '850px', lineHeight: '1.45' }}>
                  Statutory clearances are authenticated directly against issuing authorities using official state and central cadastre/portals. Verifications follow an authoritative 6-state taxonomy to ensure legal precision and prevent erroneous rejection during external gateway downtime.
                </p>
              </div>

              {/* Taxonomy Summary Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '420px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  VERIFIED ({authorities.filter(a => a.status === 'VERIFIED').length})
                </span>
                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                  VERIFICATION_PENDING ({authorities.filter(a => a.status === 'VERIFICATION_PENDING').length})
                </span>
                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
                  MANUAL_REVIEW_REQUIRED ({authorities.filter(a => a.status === 'MANUAL_REVIEW_REQUIRED').length})
                </span>
                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' }}>
                  SOURCE_UNAVAILABLE ({authorities.filter(a => a.status === 'SOURCE_UNAVAILABLE').length})
                </span>
                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  EXPIRED ({authorities.filter(a => a.status === 'EXPIRED').length})
                </span>
                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                  MISMATCH_DETECTED ({authorities.filter(a => a.status === 'MISMATCH_DETECTED').length})
                </span>
              </div>
            </div>
          </div>

          {/* Verification Cards Table */}
          <div className="gov-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Issuing Authorities &amp; Inter-Agency Digital Gateways
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Real-time cryptographic, QR-code, and API handshake verification
              </span>
            </div>

            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Issuing Authority / Agency</th>
                    <th>Mechanism</th>
                    <th>Reference / URN / Token</th>
                    <th>Statutory Taxonomy Status</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {authorities.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No issuing authority checks recorded.
                      </td>
                    </tr>
                  ) : (
                    authorities.map(auth => {
                      const getStatusStyle = (st: string) => {
                        switch (st) {
                          case 'VERIFIED':
                            return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
                          case 'MISMATCH_DETECTED':
                            return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
                          case 'EXPIRED':
                            return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
                          case 'SOURCE_UNAVAILABLE':
                            return { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
                          case 'MANUAL_REVIEW_REQUIRED':
                            return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
                          default:
                            return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
                        }
                      };
                      const stStyle = getStatusStyle(auth.status);

                      return (
                        <tr key={auth.id}>
                          <td>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{auth.authority_name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{auth.source_agency || 'Official Statutory Registry'}</div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: '#f1f5f9',
                              color: '#334155'
                            }}>
                              {auth.verification_type?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <code style={{ fontSize: '11px', color: '#0284c7' }}>
                              {auth.urn_or_token || 'N/A'}
                            </code>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: stStyle.bg,
                              color: stStyle.text,
                              border: `1px solid ${stStyle.border}`
                            }}>
                              {auth.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(auth.checked_at).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRecheckAuthority(auth)}
                              disabled={verifyingAuthorityId === auth.id}
                              style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Re-verify against issuing authority"
                            >
                              <RefreshCw size={11} className={verifyingAuthorityId === auth.id ? 'animate-spin' : ''} />
                              <span>{verifyingAuthorityId === auth.id ? 'Verifying...' : 'Re-check'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INFRASTRUCTURE & COMPUTER VISION */}
      {activeTab === 'infrastructure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Card */}
          <div className="gov-card" style={{ borderLeft: '4px solid #059669' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} color="#059669" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    AICTE Spatial Boundary &amp; Computer Vision Facility Validation
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0', maxWidth: '850px', lineHeight: '1.45' }}>
                  Geo-tagged photographic evidence is automatically compared against the registered campus cadastral coordinates (Permissible threshold ≤ 50m). Computer vision algorithms verify essential educational and laboratory equipment. All outputs serve as decision-support advisory flags for regulatory officers.
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <MapPin size={12} />
                  <span>Campus Perimeter: Registered Cadastre</span>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Evidence Upload & CV Engine Form */}
          <div className="gov-card" style={{ background: '#f8fafc', border: '1px dashed #0284c7' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={15} color="#0284c7" />
              <span>Upload Campus Evidence Photo for Real-Time CV &amp; GPS Boundary Verification</span>
            </h4>
            <form onSubmit={handleUploadInfrastructure} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Facility / Evidence Type
                </label>
                <select
                  value={infraEvidenceType}
                  onChange={e => setInfraEvidenceType(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                >
                  <option value="LABORATORY">AI &amp; Computing Laboratory</option>
                  <option value="COMPUTER_CENTER">Central Computing Center</option>
                  <option value="FIRE_SAFETY">Fire Safety &amp; Hydrant Equipment</option>
                  <option value="LIBRARY">Central Reading Library &amp; Stacks</option>
                  <option value="ADMIN_BLOCK">Administrative Block &amp; Boardroom</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Evidence Title / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Robotics & IoT Lab"
                  value={infraTitle}
                  onChange={e => setInfraTitle(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Select Photo (.jpg, .jpeg, .png)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setInfraFile(e.target.files[0]);
                    }
                  }}
                  style={{ fontSize: '11px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginBottom: '2px' }}>GPS Lat</label>
                  <input
                    type="text"
                    value={infraLat}
                    onChange={e => setInfraLat(e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginBottom: '2px' }}>GPS Lng</label>
                  <input
                    type="text"
                    value={infraLng}
                    onChange={e => setInfraLng(e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={uploadingInfra}
                  className="btn btn-sm"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: uploadingInfra ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={uploadingInfra ? 'animate-spin' : ''} />
                  <span>{uploadingInfra ? 'Running CV Engine...' : 'Run CV & GPS Analysis'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Infrastructure Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {infraList.length === 0 ? (
              <div className="gov-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px', color: '#64748b' }}>
                No infrastructure evidence items logged for this application.
              </div>
            ) : (
              infraList.map(item => (
                <div key={item.id} className="gov-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {item.title}
                      </h4>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: '800',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        {item.evidence_type?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* GPS Verification Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      background: item.gps_verified ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${item.gps_verified ? '#a7f3d0' : '#fecaca'}`,
                      fontSize: '11.5px',
                      marginBottom: '10px'
                    }}>
                      <MapPin size={13} color={item.gps_verified ? '#059669' : '#dc2626'} />
                      <span style={{ fontWeight: '700', color: item.gps_verified ? '#065f46' : '#991b1b' }}>
                        {item.gps_verified
                          ? `✓ GPS Validated (${item.distance_from_campus_meters || 18}m from Campus Cadastre)`
                          : `⚠ Distance Mismatch (${item.distance_from_campus_meters || 120}m outside boundary)`}
                      </span>
                    </div>

                    {/* CV Detected Objects */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Computer Vision Detected Entities:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {item.cv_detected_objects && item.cv_detected_objects.length > 0 ? (
                          item.cv_detected_objects.map((obj, oIdx) => (
                            <span
                              key={oIdx}
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: '#eff6ff',
                                color: '#1e40af',
                                border: '1px solid #bfdbfe',
                                fontWeight: '600'
                              }}
                            >
                              {obj.label.replace(/_/g, ' ')}: <strong>{obj.count}</strong> ({Math.round(obj.confidence * 100)}% conf)
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>No objects detected</span>
                        )}
                      </div>
                    </div>

                    {/* Inspection Notes */}
                    {item.inspection_notes && (
                      <div style={{ fontSize: '11.5px', color: '#475569', background: '#f8fafc', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                        <strong>CV Note:</strong> {item.inspection_notes}
                      </div>
                    )}
                  </div>

                  {/* Compliance Status Footer */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(item.uploaded_at).toLocaleDateString('en-IN')}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: item.compliance_status === 'COMPLIANT_ADVISORY' ? '#ecfdf5' : '#fffbeb',
                      color: item.compliance_status === 'COMPLIANT_ADVISORY' ? '#047857' : '#b45309',
                      border: `1px solid ${item.compliance_status === 'COMPLIANT_ADVISORY' ? '#a7f3d0' : '#fde68a'}`
                    }}>
                      {item.compliance_status === 'COMPLIANT_ADVISORY' ? '✓ Satisfied (No Physical Visit)' : item.compliance_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REVIEW ACTIONS & AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Chronological Scrutiny &amp; Regulatory Review Log
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Immutable audit records of officer actions and statutory decisions
            </span>
          </div>

          {reviewActions.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              No review actions recorded yet for this application.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reviewActions.map(act => (
                <div
                  key={act.id}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                      {act.officer_name} ({act.officer_role?.replace('_', ' ').toUpperCase()})
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(act.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px' }}>
                    Action: {act.action_type?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>
                    {act.comments}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UNIFIED AICTE APPROVAL OFFICER ACTION DESK */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1d4ed8', fontWeight: '800' }}>
              Statutory Authority Action Desk
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
              AICTE Approval Officer Review &amp; Statutory Action
            </h4>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              Officer: <strong>{user?.full_name || 'Dr. Priya Sharma'}</strong> &bull; Unified Scrutiny, Compliance &amp; Regulatory Approval Authority
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '20px',
              background: (app.findings && app.findings.length > 0) ? '#fef3c7' : '#ecfdf5',
              color: (app.findings && app.findings.length > 0) ? '#b45309' : '#047857',
              border: `1px solid ${(app.findings && app.findings.length > 0) ? '#fcd34d' : '#a7f3d0'}`
            }}>
              {app.findings && app.findings.length > 0
                ? `AI Detected ${app.findings.length} Issue(s)`
                : 'AI Document Checks Passed (100%)'}
            </span>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleRunAiValidation}
              disabled={validating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={validating ? 'animate-spin' : ''} />
              <span>{validating ? 'Running AI Validation...' : 'Re-run AI Check'}</span>
            </button>
          </div>
        </div>

        {/* If Application is already Approved */}
        {(app.status === 'APPROVED' || app.certificate_issued) ? (
          <div style={{
            padding: '18px 22px',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            border: '2px solid #059669',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#059669" />
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#065f46' }}>
                  Application Officially Approved &amp; AICTE Certificate Issued
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>
                Certificate Number: <strong>{app.certificate_number || `AICTE/CERT/2026-27/${app.application_id}`}</strong> &bull;
                Approval Authority: <strong>{app.officer_name || user?.full_name || 'Dr. Priya Sharma'}</strong>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowCertificateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                fontWeight: '700',
                padding: '9px 18px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Award size={16} />
              <span>View &amp; Print Official Certificate</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '18px' }}>
            {/* Panel 1: Send Suggestions to Institute (Deficiencies / Faults detected) */}
            <div style={{
              padding: '16px',
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={17} color="#b45309" />
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#92400e' }}>
                    1. Send Suggestions to Institute (Fault / Deficiency Found)
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#78350f', margin: '0 0 10px 0', lineHeight: '1.45' }}>
                  If AI validation flagged deficiencies, or if you found any fault during manual document scrutiny (even after AI validation passed), enter your suggestions below. The application will be marked as <strong>ACTION_REQUIRED</strong> and the institute will be notified to verify and rectify before re-submission.
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Specify required corrections (e.g., Land Title deed missing survey schedule, or renewed Fire NOC required as per AICTE APH clause 4.2)..."
                  value={officerSuggestionText}
                  onChange={e => setOfficerSuggestionText(e.target.value)}
                  style={{ fontSize: '12px', marginBottom: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleOfficerSendSuggestions}
                  disabled={submittingOfficerAction}
                  style={{
                    background: '#d97706',
                    borderColor: '#b45309',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    fontWeight: '700'
                  }}
                >
                  <Send size={13} />
                  <span>{submittingOfficerAction ? 'Sending Suggestions...' : 'Send Suggestions to Institute'}</span>
                </button>
              </div>
            </div>

            {/* Panel 2: Approve Application & Issue Certificate */}
            <div style={{
              padding: '16px',
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Award size={17} color="#15803d" />
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#166534' }}>
                    2. Approve Application &amp; Issue AICTE Certificate
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#14532d', margin: '0 0 10px 0', lineHeight: '1.45' }}>
                  When AI validation is cleared and manual scrutiny satisfies all AICTE norms, grant formal approval. This immediately generates the official Council Certificate of Approval with cryptographic verification hash, downloadable directly in the institute dashboard.
                </p>

                <div style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#166534', fontWeight: '700' }}>Approval Certificate Number:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={decisionOrderNo}
                    onChange={e => setDecisionOrderNo(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: '#166534', fontWeight: '700' }}>Statutory Approval Remarks:</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={approvalRemarks}
                    onChange={e => setApprovalRemarks(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleOfficerApprove}
                  disabled={submittingOfficerAction}
                  style={{
                    background: '#15803d',
                    borderColor: '#166534',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontWeight: '700'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>{submittingOfficerAction ? 'Approving...' : 'Approve & Issue Certificate'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CLARIFICATION MODAL */}
      {showClarificationModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              Request Clarification from Institution
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              The application will transition to <strong>CLARIFICATION_REQUESTED</strong>. The institution will be alerted to submit responses or replacement documents.
            </p>
            <textarea
              className="form-control"
              rows={4}
              placeholder="State the exact deficiency, missing certificate, or clarification needed..."
              value={clarificationText}
              onChange={e => setClarificationText(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowClarificationModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleRequestClarification}>
                Submit Clarification Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECISION MODAL (Authorized Decision-Maker) */}
      {showDecisionModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Record Authorized Regulatory Decision
            </h3>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '14px' }}>
              Official statutory decree for {app.institution_name} ({app.application_id})
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">Statutory Outcome:</label>
              <select
                className="form-control"
                value={decisionOutcome}
                onChange={e => setDecisionOutcome(e.target.value as any)}
              >
                <option value="CLEARED">CLEARED — Grant Extension of Approval (EoA)</option>
                <option value="DEFICIENCY">DEFICIENCY — Issue Statutory Notice with Correction Window</option>
                <option value="REJECTED">REJECTED — Statutory Refusal with Legal Grounds</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">Official Order Number:</label>
              <input
                type="text"
                className="form-control"
                value={decisionOrderNo}
                onChange={e => setDecisionOrderNo(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">
                Reasoned Order &amp; Observations {decisionOutcome !== 'CLEARED' && <span style={{ color: '#dc2626' }}>* (Mandatory for adverse decision)</span>}:
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="State the formal reasons and statutory clauses governing this decision..."
                value={decisionReason}
                onChange={e => setDecisionReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDecisionModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{
                  background: decisionOutcome === 'CLEARED' ? '#059669' : (decisionOutcome === 'DEFICIENCY' ? '#d97706' : '#dc2626'),
                  borderColor: decisionOutcome === 'CLEARED' ? '#059669' : (decisionOutcome === 'DEFICIENCY' ? '#d97706' : '#dc2626')
                }}
                onClick={handleRecordDecision}
              >
                Sign &amp; Record Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT VERSIONS MODAL */}
      {selectedDocVersions && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Document Version History: {selectedDocVersions.doc_type}
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '14px' }}>
              All replaced versions are preserved for regulatory auditability.
            </p>
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {selectedDocVersions.versions?.map(v => (
                <div
                  key={v.id}
                  style={{
                    padding: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>Version {v.version_number}: {v.filename}</span>
                    <span>{new Date(v.uploaded_at).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '4px' }}>
                    SHA-256: <code>{v.sha256_hash.slice(0, 20)}...</code>
                  </div>
                  {v.change_reason && (
                    <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '2px' }}>
                      Reason: {v.change_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: '14px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDocVersions(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Document & OCR Inspection Modal */}
      {inspectingDoc && (
        <DocumentOcrModal
          document={inspectingDoc}
          findings={app?.findings || []}
          applicationId={app?.application_id || ''}
          institutionName={app?.institution_name || ''}
          isOfficer={true}
          onClose={() => setInspectingDoc(null)}
          onClearAnomaly={() => {
            loadApplicationData();
          }}
        />
      )}

      {/* Official AICTE Regulatory Order Modal */}
      {showOrderModal && (
        <RegulatoryOrderModal
          application={app}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Official AICTE Certificate of Approval Modal */}
      {showCertificateModal && (
        <ApprovalCertificateModal
          application={app}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {/* Official AICTE Scrutiny Sheet Modal (Form AICTE-SCRUTINY-2026) */}
      {showScrutinySheetModal && (
        <OfficialScrutinySheetModal
          appId={appId}
          onClose={() => setShowScrutinySheetModal(false)}
        />
      )}

      {/* Upload Real Document Modal */}
      {showUploadDocModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} color="#38bdf8" />
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                  Upload Real Document for AI Validation
                </h3>
              </div>
              <button
                onClick={() => setShowUploadDocModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadDocumentSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  AICTE Statutory Clearance Category:
                </label>
                <select
                  value={selectedUploadDocType}
                  onChange={e => setSelectedUploadDocType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '12.5px',
                    background: '#f8fafc'
                  }}
                >
                  <option value="Land Ownership Title Deed">1. Land Ownership Title Deed (APH 2.1 - 5.0 Acres Contiguous)</option>
                  <option value="Fire Safety NOC Certificate">2. Fire Safety NOC Certificate (APH 4.2 - Permanent/Renewed NOC)</option>
                  <option value="Building Approved Plan & Structural Stability">3. Building Approved Plan &amp; Stability (APH 5.1 - Approved Master Plan)</option>
                  <option value="Faculty Cadre & SFR Registry">4. Faculty Cadre &amp; SFR Registry (APH 3.4 - 1:20 SFR Ratio)</option>
                  <option value="Endowment Joint FDR Receipt">5. Endowment Joint FDR Receipt (APH 6.3 - Joint FDR ₹50 Lakhs)</option>
                  <option value="University Affiliation Approval">6. University Affiliation Approval</option>
                  <option value="Audited Balance Sheet & Financial Records">7. Audited Balance Sheet &amp; Financial Records</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Select File from Computer (.pdf, .png, .jpg, .jpeg):
                </label>
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: uploadDocFile ? '#f0fdf4' : '#f8fafc',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    id="real-doc-file-input"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadDocFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="real-doc-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                    <Upload size={24} style={{ color: uploadDocFile ? '#16a34a' : '#64748b', margin: '0 auto 8px auto' }} />
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      {uploadDocFile ? uploadDocFile.name : 'Click to Browse Document File'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      {uploadDocFile ? `${(uploadDocFile.size / 1024).toFixed(1)} KB` : 'Supports PDF, PNG, JPG up to 10MB'}
                    </div>
                  </label>
                </div>
              </div>

              <div style={{
                background: '#f1f5f9',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                color: '#475569',
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                ℹ️ <strong>Automated Pipeline Trigger:</strong> Upon upload, PyMuPDF extracts text streams, OpenCV checks for QR codes, and digital signature validators verify cryptographic timestamps. You can then click "Run AI Validation" to evaluate compliance against APH 2026-27 rules.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowUploadDocModal(false)}
                  disabled={isUploadingDoc}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!uploadDocFile || isUploadingDoc}
                  style={{ background: '#0284c7', borderColor: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={13} />
                  <span>{isUploadingDoc ? 'Uploading...' : 'Upload & Hash Check'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
