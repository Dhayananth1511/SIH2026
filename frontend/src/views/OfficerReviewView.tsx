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
  getDocumentDownloadUrl
} from '../api';
import type { Application, Document, Finding, ComplianceCheck } from '../types';
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
  Sparkles
} from 'lucide-react';
import DocumentOcrModal from '../components/DocumentOcrModal';
import RegulatoryOrderModal from '../components/RegulatoryOrderModal';
import ApprovalCertificateModal from '../components/ApprovalCertificateModal';


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
  const isScrutinyOfficer = rawRole.includes('scrutiny') || rawRole.includes('verification');
  const isComplianceOfficer = rawRole.includes('compliance') || rawRole.includes('reviewer');
  const isDecisionMaker = rawRole.includes('chairman') || rawRole.includes('decision');

  const [app, setApp] = useState<Application | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'findings' | 'compliance' | 'history'>('documents');
  const [statusMessage, setStatusMessage] = useState('');

  // AI Validation state
  const [validating, setValidating] = useState(false);

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
      const [appData, docsData] = await Promise.all([
        getApplication(appId),
        getDocuments(appId).catch(() => [])
      ]);
      setApp(appData);
      setDocs(docsData);
      setDecisionOrderNo(appData.certificate_number || `AICTE/CERT/2026-27/${appData.application_id.replace('APP-', '')}`);
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
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '18px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('documents')}
          style={{
            padding: '8px 16px',
            fontSize: '12.5px',
            fontWeight: '600',
            border: 'none',
            borderBottom: activeTab === 'documents' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'documents' ? '#1d4ed8' : '#64748b',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          Supporting Documents ({docs.length})
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          style={{
            padding: '8px 16px',
            fontSize: '12.5px',
            fontWeight: '600',
            border: 'none',
            borderBottom: activeTab === 'findings' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'findings' ? '#1d4ed8' : '#64748b',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          AI Findings &amp; Anomalies ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          style={{
            padding: '8px 16px',
            fontSize: '12.5px',
            fontWeight: '600',
            border: 'none',
            borderBottom: activeTab === 'compliance' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'compliance' ? '#1d4ed8' : '#64748b',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          Compliance Checklist ({complianceChecks.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 16px',
            fontSize: '12.5px',
            fontWeight: '600',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'history' ? '#1d4ed8' : '#64748b',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          Review Actions &amp; Audit History ({reviewActions.length})
        </button>
      </div>

      {/* TAB 1: SUPPORTING DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Uploaded Statutory Clearances &amp; Supporting Records
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Stored with SHA-256 checksums and immutable version tracking
            </span>
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No supporting documents uploaded yet.
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
    </div>
  );
}
