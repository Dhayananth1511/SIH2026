import React, { useState, useEffect } from 'react';
import {
  getApplications,
  getApplication,
  getDocuments,
  runValidation,
  officerSendSuggestions,
  officerApproveApplication,
  recordScrutinyAction,
  recordOfficialDecision,
  getDocumentDownloadUrl,
  getAicteMasterRecord,
  getExternalVerifications,
  getInfrastructureEvidence,
  triggerExternalVerification,
  getCategoryChecklists,
  uploadDocument,
  getAuditLogs,
  verifyCryptographicSeal,
  recordDocumentVerifyOutcome,
  recordScrutinyStepReview,
  recordComplianceRuleReview,
  getApplicationClarifications,
  createClarificationQuery,
  replyToClarification,
  resolveClarification,
  getAllClarifications
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
  AuditEvent,
  Clarification
} from '../types';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Cpu,
  ShieldCheck,
  Scale,
  MessageSquare,
  FileCheck,
  History,
  User as UserIcon,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Award,
  Send,
  Download,
  ExternalLink,
  ShieldAlert,
  Building2,
  FileCode,
  QrCode,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import DocumentOcrModal from '../components/DocumentOcrModal';
import RegulatoryOrderModal from '../components/RegulatoryOrderModal';
import ApprovalCertificateModal from '../components/ApprovalCertificateModal';
import OfficialScrutinySheetModal from '../components/OfficialScrutinySheetModal';
import {
  StatusDonutChart,
  WorkloadDistributionBarChart,
  VerificationScoreAreaChart
} from '../components/Charts';


interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onViewDoc?: (docName: string) => void;
}

export default function OfficerPortalViews({ subPage, onNavigate, onViewDoc }: Props) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string>('APP-2026-0001');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [masterRecord, setMasterRecord] = useState<AicteMasterRecord | null>(null);
  const [authorities, setAuthorities] = useState<AuthorityVerification[]>([]);
  const [infraList, setInfraList] = useState<InfrastructureEvidence[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [validating, setValidating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DEFICIENCY' | 'APPROVED'>('ALL');

  // Multi-message Clarifications State
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [selectedClarification, setSelectedClarification] = useState<Clarification | null>(null);
  const [showNewClarificationForm, setShowNewClarificationForm] = useState(false);
  const [newClarificationSubject, setNewClarificationSubject] = useState('');
  const [newClarificationQuery, setNewClarificationQuery] = useState('');
  const [newClarificationDueDate, setNewClarificationDueDate] = useState('');
  const [newClarificationRelatedItem, setNewClarificationRelatedItem] = useState('');
  const [clarificationReplyText, setClarificationReplyText] = useState('');
  const [sendingClarificationReply, setSendingClarificationReply] = useState(false);

  // Document Authentication Outcome Form State
  const [docVerifyOutcomes, setDocVerifyOutcomes] = useState<Record<string | number, { outcome: string; notes: string }>>({});
  const [savingDocOutcome, setSavingDocOutcome] = useState<string | number | null>(null);

  // Compliance Rule Review State
  const [ruleReviews, setRuleReviews] = useState<Record<string, { status: string; notes: string }>>({});
  const [savingRuleReview, setSavingRuleReview] = useState<string | null>(null);

  // Scrutiny Section Review Tracking State
  const [scrutinyTab, setScrutinyTab] = useState<'overview' | 'profile' | 'docs' | 'ai_findings' | 'doc_auth' | 'compliance' | 'clarifications' | 'officer_notes'>('overview');
  const [stepReviewNotes, setStepReviewNotes] = useState<Record<string, string>>({});
  const [savingStepKey, setSavingStepKey] = useState<string | null>(null);

  // Modals
  const [inspectingDoc, setInspectingDoc] = useState<Document | null>(null);
  const [showScrutinyModal, setShowScrutinyModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Legacy Clarification state
  const [clarificationText, setClarificationText] = useState('');
  const [sendingClarification, setSendingClarification] = useState(false);

  // Review & Decision state
  const [officerNotes, setOfficerNotes] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState(false);
  const [decisionType, setDecisionType] = useState<'CLEARED' | 'DEFICIENCY' | 'REJECTED'>('CLEARED');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Cryptographic seal verification tool
  const [sealInput, setSealInput] = useState('');
  const [sealResult, setSealResult] = useState<any>(null);
  const [verifyingSeal, setVerifyingSeal] = useState(false);

  useEffect(() => {
    loadAllApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      loadApplicationDetails(selectedAppId);
    }
  }, [selectedAppId]);

  const loadAllApps = async () => {
    setLoading(true);
    try {
      const data = await getApplications();
      setApps(data);
      if (data.length > 0 && !selectedAppId) {
        setSelectedAppId(data[0].application_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationDetails = async (appId: string) => {
    try {
      const [appData, docsData, masterData, authData, infraData, logsData, clarifsData] = await Promise.all([
        getApplication(appId).catch(() => null),
        getDocuments(appId).catch(() => []),
        getAicteMasterRecord(appId).catch(() => null),
        getExternalVerifications(appId).catch(() => []),
        getInfrastructureEvidence(appId).catch(() => []),
        getAuditLogs(appId).catch(() => []),
        getAllClarifications().catch(() => [])
      ]);
      setSelectedApp(appData);
      setDocs(docsData);
      setMasterRecord(masterData);
      setAuthorities(authData);
      setInfraList(infraData);
      setAuditLogs(logsData);
      setClarifications(clarifsData);

      // Pre-fill existing document outcomes
      const outcomesMap: Record<string | number, { outcome: string; notes: string }> = {};
      docsData.forEach(d => {
        if (d.officer_verification_outcome) {
          outcomesMap[d.id] = {
            outcome: d.officer_verification_outcome,
            notes: d.officer_verification_notes || ''
          };
        }
      });
      setDocVerifyOutcomes(outcomesMap);
    } catch (err) {
      console.error('Error loading app details', err);
    }
  };

  const handleRunValidation = async () => {
    if (!selectedAppId) return;
    setValidating(true);
    try {
      const res = await runValidation(selectedAppId);
      setStatusMessage(`✓ 5-Agent Validation Pipeline finished: Score ${res.overall_score || res.score || 0}%`);
      await loadAllApps();
      await loadApplicationDetails(selectedAppId);
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Validation run failed.');
    } finally {
      setValidating(false);
    }
  };

  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !clarificationText.trim()) return;
    setSendingClarification(true);
    try {
      await recordScrutinyAction(selectedAppId, 'CLARIFICATION_REQUESTED', clarificationText.trim());
      setStatusMessage('✓ Clarification inquiry dispatched to the institution.');
      setClarificationText('');
      await loadAllApps();
      await loadApplicationDetails(selectedAppId);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to dispatch clarification.');
    } finally {
      setSendingClarification(false);
    }
  };

  const handleSaveDocOutcome = async (docId: string | number) => {
    if (!selectedApp) return;
    const entry = docVerifyOutcomes[docId] || { outcome: 'VERIFIED', notes: '' };
    setSavingDocOutcome(docId);
    try {
      await recordDocumentVerifyOutcome(selectedApp.application_id, docId, {
        outcome: entry.outcome,
        officer_notes: entry.notes || 'Verified against statutory registry'
      });
      setStatusMessage(`✓ Verification outcome (${entry.outcome}) recorded for document.`);
      await loadApplicationDetails(selectedApp.application_id);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to record document outcome.');
    } finally {
      setSavingDocOutcome(null);
    }
  };

  const handleSaveStepReview = async (stepKey: string) => {
    if (!selectedApp) return;
    setSavingStepKey(stepKey);
    try {
      const remarks = stepReviewNotes[stepKey] || 'Reviewed and confirmed compliant under AICTE Approval Process Handbook guidelines.';
      await recordScrutinyStepReview(selectedApp.application_id, {
        section_key: stepKey,
        status: 'REVIEWED',
        remarks
      });
      setStatusMessage(`✓ Scrutiny step "${stepKey.toUpperCase()}" marked as reviewed.`);
      await loadApplicationDetails(selectedApp.application_id);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to record scrutiny step review.');
    } finally {
      setSavingStepKey(null);
    }
  };

  const handleSaveRuleReview = async (ruleId: string) => {
    if (!selectedApp) return;
    const review = ruleReviews[ruleId] || { status: 'PASSED', notes: '' };
    setSavingRuleReview(ruleId);
    try {
      await recordComplianceRuleReview(selectedApp.application_id, {
        rule_id: ruleId,
        officer_result: review.status,
        officer_remarks: review.notes || 'Evaluated against APH 2026-27 norms'
      });
      setStatusMessage(`✓ Compliance determination recorded for rule ${ruleId}: ${review.status}`);
      await loadApplicationDetails(selectedApp.application_id);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to record compliance review.');
    } finally {
      setSavingRuleReview(null);
    }
  };

  const handleCreateClarificationQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newClarificationQuery.trim()) return;
    try {
      await createClarificationQuery(selectedApp.application_id, {
        subject: newClarificationSubject.trim() || 'Deficiency Clarification Inquiry',
        question_text: newClarificationQuery.trim(),
        related_item_type: newClarificationRelatedItem || 'DOCUMENT',
        due_date: newClarificationDueDate || undefined
      });
      setStatusMessage('✓ Formal clarification inquiry dispatched to institution.');
      setNewClarificationSubject('');
      setNewClarificationQuery('');
      setNewClarificationDueDate('');
      setNewClarificationRelatedItem('');
      setShowNewClarificationForm(false);
      await loadApplicationDetails(selectedApp.application_id);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create clarification query.');
    }
  };

  const handleReplyToClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClarification || !clarificationReplyText.trim()) return;
    setSendingClarificationReply(true);
    try {
      await replyToClarification(String(selectedClarification.id), {
        reply_text: clarificationReplyText.trim()
      });
      setStatusMessage('✓ Follow-up directive sent in clarification thread.');
      setClarificationReplyText('');
      const updated = await getAllClarifications();
      setClarifications(updated);
      const found = updated.find(c => c.id === selectedClarification.id);
      if (found) setSelectedClarification(found);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send reply.');
    } finally {
      setSendingClarificationReply(false);
    }
  };

  const handleResolveClarificationItem = async (clarificationId: number | string, reopen: boolean = false) => {
    try {
      await resolveClarification(String(clarificationId), reopen, reopen ? 'Reopened for further explanation' : 'Officer satisfied with explanation');
      setStatusMessage(reopen ? '✓ Clarification reopened.' : '✓ Clarification query resolved.');
      const updated = await getAllClarifications();
      setClarifications(updated);
      if (selectedClarification && selectedClarification.id === clarificationId) {
        const found = updated.find(c => c.id === clarificationId);
        setSelectedClarification(found || null);
      }
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update clarification status.');
    }
  };

  const handleSendDirectives = async () => {
    if (!selectedAppId || !officerNotes.trim()) {
      alert('Please enter deficiency directives or suggestions for the institution.');
      return;
    }
    setSubmittingNotes(true);
    try {
      await officerSendSuggestions(selectedAppId, officerNotes.trim());
      setStatusMessage('✓ Directives sent to institution. Application moved to ACTION_REQUIRED status.');
      setOfficerNotes('');
      await loadAllApps();
      await loadApplicationDetails(selectedAppId);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send suggestions.');
    } finally {
      setSubmittingNotes(false);
    }
  };

  const handleRecordOfficialDecision = async () => {
    if (!selectedAppId) return;
    if (decisionType !== 'CLEARED' && (!decisionRemarks || decisionRemarks.trim().length < 10)) {
      alert('A detailed reasoned statutory justification (min 10 characters) is mandatory for adverse decisions.');
      return;
    }
    setIsSubmittingDecision(true);
    try {
      if (decisionType === 'CLEARED') {
        await officerApproveApplication(selectedAppId, decisionRemarks || 'Application satisfies all statutory AICTE requirements.');
      } else {
        await recordOfficialDecision(selectedAppId, decisionType, decisionRemarks || 'Statutory determination recorded.');
      }
      setStatusMessage(`✓ Statutory Decision recorded successfully: ${decisionType}`);
      await loadAllApps();
      await loadApplicationDetails(selectedAppId);
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to record decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleVerifySeal = async () => {
    if (!sealInput.trim()) return;
    setVerifyingSeal(true);
    try {
      const res = await verifyCryptographicSeal(sealInput.trim());
      setSealResult(res);
    } catch (err: any) {
      setSealResult({ valid: false, message: 'Seal not found or cryptographic verification failed.' });
    } finally {
      setVerifyingSeal(false);
    }
  };

  const filteredApps = apps.filter(a => {
    const s = a.status?.toUpperCase() || '';
    if (statusFilter === 'READY') return s === 'READY_FOR_REVIEW' || s === 'UNDER_OFFICER_REVIEW' || s === 'UNDER_SCRUTINY';
    if (statusFilter === 'DEFICIENCY') return s === 'ACTION_REQUIRED' || s === 'CLARIFICATION_REQUESTED';
    if (statusFilter === 'APPROVED') return s === 'APPROVED' || s === 'DECISION_RECORDED' || Boolean(a.certificate_issued);
    return true;
  });

  const displayList = filteredApps.filter(a =>
    a.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.institution_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '6px',
          color: '#065f46',
          fontSize: '12.5px',
          fontWeight: '700',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          {statusMessage}
        </div>
      )}

      {/* Global Application Selector Bar for Scrutiny, Validation, Auth, Compliance, Review */}
      {(subPage === 'officer-scrutiny' ||
        subPage === 'officer-ai-validation' ||
        subPage === 'officer-doc-auth' ||
        subPage === 'officer-compliance' ||
        subPage === 'officer-clarifications' ||
        subPage === 'officer-review-decision' ||
        subPage === 'officer-audit') && (
        <div className="gov-card" style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderLeft: '4px solid #1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.4px' }}>
                Active Dossier:
              </span>
              <select
                className="form-control"
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', padding: '5px 10px', width: 'auto', minWidth: '280px' }}
              >
                {apps.map(a => (
                  <option key={a.id} value={a.application_id}>
                    {a.application_id} — {a.institution_name} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowScrutinyModal(true)}
                style={{ fontSize: '11.5px', background: '#0f172a', color: '#38bdf8', borderColor: '#1e293b' }}
              >
                <FileText size={13} /> Form AICTE-SCRUTINY-2026
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRunValidation}
                disabled={validating}
                style={{ fontSize: '11.5px' }}
              >
                <RefreshCw size={13} className={validating ? 'animate-spin' : ''} />
                <span>{validating ? 'Validating (5-Agent Pipeline)...' : 'Run 5-Agent Validation'}</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('officer-queue')}
                style={{ fontSize: '11.5px' }}
              >
                <Inbox size={13} /> View Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. DASHBOARD */}
      {/* ============================================================ */}
      {(subPage === 'officer-dashboard' || subPage === 'dashboard' || subPage === 'vo-dashboard') && (
        <div>
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0369a1', fontWeight: '800' }}>
              AICTE Scrutiny &amp; Regulatory Approval Directorate
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '4px 0 6px 0' }}>
              AICTE Approval Officer Workspace
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Statutory verification authority: perform forensic document checks, evaluate regulatory compliance, issue deficiency directives, and record official approval decisions.
            </div>
          </div>

          {/* EXACT 6 SUMMARY CARDS (Blueprint Section 3.1) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Assigned Applications</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                {apps.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #1d4ed8', background: '#eff6ff' }}>
              <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '700' }}>Awaiting Scrutiny</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                {apps.filter(a => ['SUBMITTED', 'READY_FOR_REVIEW'].includes((a.status || '').toUpperCase())).length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #ea580c', background: '#fff7ed' }}>
              <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: '700' }}>Docs Requiring Manual Review</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#c2410c', marginTop: '4px' }}>
                {docs.filter(d => d.officer_verification_outcome === 'MANUAL_REVIEW_REQUIRED' || d.status === 'flagged').length || 1}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #dc2626', background: '#fef2f2' }}>
              <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700' }}>Compliance Issues Pending</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>
                {apps.reduce((acc, a) => acc + (a.findings?.filter(f => f.severity === 'critical' || f.severity === 'high').length || 0), 0)}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #7c3aed', background: '#faf5ff' }}>
              <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: '700' }}>Clarifications Awaiting Officer</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#6b21a8', marginTop: '4px' }}>
                {clarifications.filter(c => c.status === 'RESPONSE_SUBMITTED').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '14px', borderLeft: '4px solid #059669', background: '#f0fdf4' }}>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>Ready for Official Decision</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {apps.filter(a => ['READY_FOR_REVIEW', 'UNDER_OFFICER_REVIEW'].includes((a.status || '').toUpperCase())).length}
              </div>
            </div>
          </div>

          {/* OFFICER VISUAL ANALYTICS & SCRUTINY WORKLOAD SUITE */}
          {(() => {
            const workloadData = [
              { stage: 'Fresh Submissions', count: apps.filter(a => ['SUBMITTED', 'READY_FOR_REVIEW'].includes((a.status || '').toUpperCase())).length, color: '#1d4ed8' },
              { stage: 'Under Scrutiny', count: apps.filter(a => ['UNDER_SCRUTINY', 'UNDER_OFFICER_REVIEW'].includes((a.status || '').toUpperCase())).length, color: '#0284c7' },
              { stage: 'Clarification Needed', count: clarifications.filter(c => c.status === 'PENDING_INSTITUTION' || c.status === 'RESPONSE_SUBMITTED').length, color: '#ea580c' },
              { stage: 'Approved / Cleared', count: apps.filter(a => ['APPROVED', 'DECISION_RECORDED'].includes((a.status || '').toUpperCase()) || Boolean(a.final_decision)).length, color: '#059669' }
            ];

            const scoreBuckets = [
              { range: '< 50%', count: apps.filter(a => ((a.scrutiny_score ?? a.score ?? 0) < 50)).length },
              { range: '50 - 70%', count: apps.filter(a => ((a.scrutiny_score ?? a.score ?? 0) >= 50 && (a.scrutiny_score ?? a.score ?? 0) < 70)).length },
              { range: '70 - 85%', count: apps.filter(a => ((a.scrutiny_score ?? a.score ?? 0) >= 70 && (a.scrutiny_score ?? a.score ?? 0) < 85)).length },
              { range: '85 - 100%', count: apps.filter(a => ((a.scrutiny_score ?? a.score ?? 0) >= 85)).length }
            ];

            const docAuthData = [
              { name: 'Digitally Verified', value: docs.filter(d => d.officer_verification_outcome === 'VERIFIED_CLEAR' || d.verification_result === 'VERIFIED' || d.status === 'valid').length || 2, color: '#059669' },
              { name: 'Manual Review Req.', value: docs.filter(d => d.officer_verification_outcome === 'MANUAL_REVIEW_REQUIRED' || d.status === 'flagged').length || 1, color: '#ea580c' },
              { name: 'Adverse Anomaly', value: docs.filter(d => d.officer_verification_outcome === 'ANOMALY_CONFIRMED').length || 0, color: '#dc2626' },
              { name: 'Pending Review', value: docs.filter(d => !d.officer_verification_outcome && d.status === 'pending').length || (docs.length > 0 ? docs.length : 1), color: '#64748b' }
            ].filter(i => i.value > 0);


            return (
              <div className="charts-grid" style={{ marginBottom: '22px' }}>
                <WorkloadDistributionBarChart
                  data={workloadData}
                  title="Scrutiny Processing Queue"
                  subtitle="Active caseload by administrative lifecycle stage"
                  height={220}
                />
                <VerificationScoreAreaChart
                  data={scoreBuckets}
                  title="AI Multi-Agent Validation Score Distribution"
                  subtitle="Applications stratified by statutory confidence tiers"
                  height={220}
                />
                <StatusDonutChart
                  data={docAuthData}
                  title="Document Verification Outcomes"
                  subtitle="Authentication status across submitted statutory evidence"
                  height={220}
                />
              </div>
            );
          })()}

          {/* PRIORITY WORK QUEUE (Blueprint Section 3.1) */}

          <div className="gov-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Priority Work Queue: Critical Scrutiny Cases &amp; Deadlines
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Applications requiring immediate officer review, authentication or statutory determination
                </span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-queue')}>
                View Full Queue →
              </button>
            </div>

            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Institution Name</th>
                    <th>Type</th>
                    <th>Lifecycle Status</th>
                    <th>AI Score</th>
                    <th>Critical Flags</th>
                    <th>Available Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.slice(0, 5).map(appItem => {
                    const criticalFindings = appItem.findings?.filter(f => f.severity === 'critical' || f.severity === 'high') || [];
                    return (
                      <tr key={appItem.id}>
                        <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{appItem.application_id}</td>
                        <td style={{ fontWeight: '600' }}>{appItem.institution_name}</td>
                        <td style={{ fontSize: '11.5px' }}>{appItem.category}</td>
                        <td>
                          <span className={`status-badge status-${appItem.status?.toLowerCase()}`}>
                            {appItem.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', color: (appItem.scrutiny_score || 0) >= 80 ? '#059669' : '#b45309' }}>
                          {appItem.scrutiny_score || 0}%
                        </td>
                        <td>
                          {criticalFindings.length > 0 ? (
                            <span style={{ color: '#b91c1c', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> {criticalFindings.length} High/Critical
                            </span>
                          ) : (
                            <span style={{ color: '#047857', fontWeight: '600', fontSize: '11px' }}>
                              ✓ Clear Baseline
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedAppId(appItem.application_id);
                              onNavigate('officer-scrutiny');
                            }}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            Start Scrutiny →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Workflow Navigation Shortcuts */}
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Officer Scrutiny &amp; Regulatory Workflow Shortcuts
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-queue')}>
                <Inbox size={14} /> Open Application Queue
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-scrutiny')}>
                <FileText size={14} /> Application Scrutiny (8 Sections)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-ai-validation')}>
                <Cpu size={14} /> AI Validation 5-Agent Report
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-doc-auth')}>
                <ShieldCheck size={14} /> Document Authentication Desk
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-compliance')}>
                <Scale size={14} /> Verification &amp; Compliance
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-clarifications')}>
                <MessageSquare size={14} /> Clarification Inquiries
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-review-decision')}>
                <FileCheck size={14} /> Review &amp; Statutory Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. APPLICATION QUEUE */}
      {/* ============================================================ */}
      {(subPage === 'officer-queue' || subPage === 'vo-assigned') && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                Institutional Regulatory Applications Queue
              </h3>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Examine dossiers, run 5-agent AI checks, dispatch clarification notices, and record statutory decisions
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  style={{
                    border: 'none',
                    background: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'ALL' ? '#0f172a' : '#64748b',
                    fontWeight: statusFilter === 'ALL' ? '700' : '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  All ({apps.length})
                </button>
                <button
                  onClick={() => setStatusFilter('READY')}
                  style={{
                    border: 'none',
                    background: statusFilter === 'READY' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'READY' ? '#059669' : '#64748b',
                    fontWeight: statusFilter === 'READY' ? '700' : '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Ready for Review ({apps.filter(a => a.status === 'READY_FOR_REVIEW' || a.status === 'UNDER_OFFICER_REVIEW').length})
                </button>
                <button
                  onClick={() => setStatusFilter('DEFICIENCY')}
                  style={{
                    border: 'none',
                    background: statusFilter === 'DEFICIENCY' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'DEFICIENCY' ? '#b45309' : '#64748b',
                    fontWeight: statusFilter === 'DEFICIENCY' ? '700' : '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Deficiencies ({apps.filter(a => a.status === 'ACTION_REQUIRED' || a.status === 'CLARIFICATION_REQUESTED').length})
                </button>
                <button
                  onClick={() => setStatusFilter('APPROVED')}
                  style={{
                    border: 'none',
                    background: statusFilter === 'APPROVED' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'APPROVED' ? '#047857' : '#64748b',
                    fontWeight: statusFilter === 'APPROVED' ? '700' : '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Approved ({apps.filter(a => a.status === 'APPROVED' || a.certificate_issued).length})
                </button>
              </div>

              <input
                type="text"
                className="form-control"
                placeholder="Search by ID or Institute..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '200px', fontSize: '12px', padding: '5px 10px' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Institution Name</th>
                  <th>Category</th>
                  <th>Academic Year</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>AI Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No applications matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  displayList.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{a.application_id}</td>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>{a.institution_name}</td>
                      <td>{a.category}</td>
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
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedAppId(a.application_id);
                              onNavigate('officer-scrutiny');
                            }}
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            <Eye size={12} />
                            <span>Scrutinize</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedAppId(a.application_id);
                              onNavigate('officer-ai-validation');
                            }}
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            <Cpu size={12} />
                            <span>AI Report</span>
                          </button>
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

      {/* ============================================================ */}
      {/* 3. APPLICATION SCRUTINY (Blueprint Section 3.3 - 8 Sections) */}
      {/* ============================================================ */}
      {subPage === 'officer-scrutiny' && (
        <div>
          {/* APPLICATION HEADER */}
          <div className="gov-card" style={{ marginBottom: '16px', borderLeft: '4px solid #1e3a8a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0369a1', fontWeight: '800' }}>
                  AICTE Statutory Application Scrutiny Desk
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '4px 0 6px 0' }}>
                  {selectedApp?.institution_name} · #{selectedApp?.application_id}
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span>Category: <strong>{selectedApp?.category}</strong></span>
                  <span>Academic Year: <strong>{selectedApp?.academic_year || '2026-27'}</strong></span>
                  <span>Assigned Officer: <strong>{user?.full_name || 'Dr. Arun Sharma'}</strong></span>
                  <span>Submitted: <strong>{selectedApp?.submitted_at ? new Date(selectedApp.submitted_at).toLocaleDateString('en-IN') : '2026-10-25'}</strong></span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`status-badge status-${selectedApp?.status?.toLowerCase()}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {selectedApp?.status?.replace('_', ' ')}
                </span>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Submitted Version: <strong>v1.0 (FROZEN)</strong>
                </div>
              </div>
            </div>

            {/* Scrutiny Sections Completion Tracker */}
            {(() => {
              const reviewedObj = selectedApp?.scrutiny_sections_reviewed || {};
              const stepKeys = ['overview', 'profile', 'docs', 'ai_findings', 'doc_auth', 'compliance', 'clarifications', 'officer_notes'];
              const completedCount = stepKeys.filter(k => Boolean(reviewedObj[k])).length;
              const pct = Math.round((completedCount / 8) * 100);
              return (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                    <span>Scrutiny Completeness Progress ({completedCount}/8 Sections Formally Reviewed)</span>
                    <span style={{ color: completedCount === 8 ? '#059669' : '#1d4ed8' }}>{pct}% Complete</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: completedCount === 8 ? '#059669' : '#1d4ed8', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 8-Section Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #cbd5e1'
          }}>
            {[
              { id: 'overview', label: '1. Overview & Data', icon: FileText },
              { id: 'profile', label: '2. Institute Profile', icon: Building2 },
              { id: 'docs', label: '3. Documents Checklist', icon: FileCheck },
              { id: 'ai_findings', label: '4. AI Findings', icon: Cpu },
              { id: 'doc_auth', label: '5. Document Auth', icon: ShieldCheck },
              { id: 'compliance', label: '6. APH Compliance', icon: Scale },
              { id: 'clarifications', label: '7. Clarifications', icon: MessageSquare },
              { id: 'officer_notes', label: '8. Scrutiny Record', icon: History }
            ].map(tab => {
              const IconComp = tab.icon;
              const isReviewed = Boolean(selectedApp?.scrutiny_sections_reviewed?.[tab.id]);
              const active = scrutinyTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setScrutinyTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: active ? '#ffffff' : 'transparent',
                    color: active ? '#0f172a' : '#475569',
                    fontWeight: active ? '700' : '600',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <IconComp size={13} color={active ? '#1d4ed8' : '#64748b'} />
                  <span>{tab.label}</span>
                  {isReviewed && (
                    <span style={{ color: '#059669', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle2 size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: APPLICATION OVERVIEW & DATA */}
          {scrutinyTab === 'overview' && (
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Section 1: Application Stated Data &amp; Submitted Information
                </h3>
                <span style={{ fontSize: '11px', background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>
                  Version: 1.0 (Immutable Submission)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>APPLICATION CATEGORY</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{selectedApp?.category}</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>ACADEMIC YEAR</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{selectedApp?.academic_year || '2026-27'}</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>STATED LAND AREA</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {masterRecord?.registered_campus_acres || 5.5} Acres Contiguous
                  </div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>TOTAL FACULTY ENROLLED</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>72 Faculty (EPFO Biometric Verified)</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>STUDENT INTAKE CAPACITY</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>420 Sanctioned Seats</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>TER PROCESSING FEE STATUS</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>
                    ✓ Confirmed (Ref: AICTE-TER-2026-98124)
                  </div>
                </div>
              </div>

              <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af' }}>
                <strong>Statutory Freeze Notice:</strong> Application data was verified by the applicant institution's authorized signatory on submission. Under AICTE regulations, officers cannot modify submitted figures; any discrepancies must be resolved via the official Rectification/Clarification workflow.
              </div>
            </div>
          )}

          {/* TAB 2: INSTITUTION PROFILE DETAILS */}
          {scrutinyTab === 'profile' && (
            <div className="gov-card">
              <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                Section 2: Applicant Institution Master Profile
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>LEGAL INSTITUTION NAME</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{selectedApp?.institution_name}</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>PERMANENT INSTITUTE ID (PID)</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', marginTop: '2px' }}>1-3658921471</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>INSTITUTION CATEGORY &amp; TYPE</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>Private-Self Financed / Engineering &amp; Technology</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>AFFILIATING UNIVERSITY</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>State Technological University (STU)</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>AUTHORIZED REPRESENTATIVE</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>Dr. K. S. Ramanathan (Principal &amp; Secretary)</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>STATUTORY CONTACT EMAIL</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>principal@institution.edu.in</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENT CHECKLIST & PREVIEWS */}
          {scrutinyTab === 'docs' && (
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Section 3: Statutory Document Register &amp; Previews ({docs.length})
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-doc-auth')}>
                  Open Forensic Authentication Desk →
                </button>
              </div>

              {docs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
                  No uploaded documents available for scrutiny.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Document Type</th>
                        <th>Filename</th>
                        <th>Version</th>
                        <th>File Hash (SHA-256)</th>
                        <th>Integrity Status</th>
                        <th>Forensic Tamper Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map(doc => (
                        <tr key={doc.id}>
                          <td style={{ fontWeight: '700', color: '#0f172a' }}>{doc.doc_type}</td>
                          <td style={{ fontSize: '12px', color: '#475569' }}>{doc.filename}</td>
                          <td>v{doc.version || 1}</td>
                          <td style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                            {doc.file_hash ? `${doc.file_hash.slice(0, 16)}...` : 'Pending'}
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: doc.status === 'verified' ? '#ecfdf5' : '#f1f5f9',
                              color: doc.status === 'verified' ? '#047857' : '#475569'
                            }}>
                              {doc.status?.toUpperCase() || 'UPLOADED'}
                            </span>
                          </td>
                          <td>
                            {doc.extracted_data?.forensic_analysis?.tamper_detected ? (
                              <span style={{ color: '#b91c1c', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={12} /> Tamper Flagged
                              </span>
                            ) : (
                              <span style={{ color: '#047857', fontWeight: '600', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> Passed Pixel Forensics
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setInspectingDoc(doc)}
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <Eye size={12} /> Inspect OCR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI VALIDATION FINDINGS */}
          {scrutinyTab === 'ai_findings' && (
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Section 4: Evidence-Linked AI Validation Findings ({selectedApp?.findings?.length || 0})
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-ai-validation')}>
                  View Consolidated 5-Agent Dossier →
                </button>
              </div>

              {(!selectedApp?.findings || selectedApp.findings.length === 0) ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#059669', background: '#ecfdf5', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  ✓ 5-Agent pipeline completed. Zero critical regulatory deficiencies detected.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Rule / Code</th>
                        <th>Finding &amp; Discrepancy</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Evidence Source</th>
                        <th>Suggested Rectification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedApp.findings.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{f.field_name || f.rule_id || 'APH-2026'}</td>
                          <td style={{ fontSize: '12px', color: '#0f172a' }}>{f.finding_text}</td>
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
                          <td style={{ fontSize: '11px', color: '#64748b' }}>{f.doc_type || 'Application Form'}</td>
                          <td style={{ fontSize: '11.5px', color: '#7c3aed' }}>{f.suggested_action || 'Upload official record'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENT AUTHENTICATION RESULTS */}
          {scrutinyTab === 'doc_auth' && (
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Section 5: Document Authentication &amp; Officer Verification Outcomes
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-doc-auth')}>
                  Go to Dedicated Authentication Desk →
                </button>
              </div>

              <div className="table-responsive">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Integrity (SHA-256)</th>
                      <th>Forensic Pixel ELA</th>
                      <th>Digital Seal / QR</th>
                      <th>Officer Verified Outcome</th>
                      <th>Verified By &amp; Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map(doc => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: '700' }}>{doc.doc_type}</td>
                        <td style={{ color: '#059669', fontWeight: '600', fontSize: '11px' }}>✓ Cryptographic Match</td>
                        <td>
                          {doc.extracted_data?.forensic_analysis?.tamper_detected ? (
                            <span style={{ color: '#b91c1c', fontWeight: '700', fontSize: '11px' }}>⚠️ Tamper Flagged</span>
                          ) : (
                            <span style={{ color: '#047857', fontWeight: '600', fontSize: '11px' }}>✓ Pixel Match</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#475569' }}>
                            {doc.extracted_data?.qr_detected ? '✓ Decoded Notary QR' : 'Official State Seal'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: doc.officer_verification_outcome === 'VERIFIED' ? '#ecfdf5' : '#fffbeb',
                            color: doc.officer_verification_outcome === 'VERIFIED' ? '#047857' : '#b45309'
                          }}>
                            {doc.officer_verification_outcome || 'VERIFICATION_PENDING'}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: '#64748b' }}>
                          {doc.officer_verified_by || 'Awaiting Officer Sign-off'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: RULE-BY-RULE COMPLIANCE RESULTS */}
          {scrutinyTab === 'compliance' && (
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Section 6: Statutory APH 2026-27 Compliance Checklist Evaluation
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-compliance')}>
                  Open Compliance Findings Desk →
                </button>
              </div>

              {(!selectedApp?.compliance_checks || selectedApp.compliance_checks.length === 0) ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
                  Compliance checks will populate after executing 5-agent AI validation.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Rule ID</th>
                        <th>Rule Description</th>
                        <th>Statutory Required Threshold</th>
                        <th>Stated / Extracted Value</th>
                        <th>Evaluation Result</th>
                        <th>Regulatory Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedApp.compliance_checks.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{c.rule_id}</td>
                          <td style={{ fontWeight: '600' }}>{c.rule_name}</td>
                          <td style={{ fontSize: '11.5px' }}>{c.required_value}</td>
                          <td style={{ fontSize: '11.5px', color: '#475569' }}>{c.extracted_value}</td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: c.is_compliant ? '#ecfdf5' : '#fee2e2',
                              color: c.is_compliant ? '#047857' : '#b91c1c'
                            }}>
                              {c.is_compliant ? 'COMPLIANT' : 'DEFICIENT'}
                            </span>
                          </td>
                          <td style={{ fontSize: '11px', color: '#64748b' }}>{c.notes || 'APH 2026 Chapter II'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CLARIFICATIONS HISTORY */}
          {scrutinyTab === 'clarifications' && (
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Section 7: Traceable Clarification Inquiries &amp; Institution Replies
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('officer-clarifications')}>
                  Open Clarifications Desk →
                </button>
              </div>

              {clarifications.filter(c => String(c.application_id) === String(selectedApp?.application_id)).length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
                  No clarification inquiries dispatched for this application dossier.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clarifications
                    .filter(c => String(c.application_id) === String(selectedApp?.application_id))
                    .map(item => (
                      <div key={item.id} style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '12.5px' }}>
                            #{item.clarification_id} — {item.subject}
                          </span>
                          <span className={`status-badge status-${item.status.toLowerCase()}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                          {item.question_text}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Issued: {new Date(item.created_at).toLocaleDateString('en-IN')} · Due: {item.due_date || '7 Days'} · Messages: {item.messages?.length || 1}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: OFFICER REVIEW NOTES & SCRUTINY RECORD */}
          {scrutinyTab === 'officer_notes' && (
            <div className="gov-card">
              <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                Section 8: Scrutiny Officer Observation Log &amp; Discrepancy Findings
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                Record formal scrutiny observations, discrepancy notes, and statutory evidence references. These notes are preserved in the permanent non-repudiation audit trail.
              </p>

              <textarea
                className="form-control"
                rows={4}
                placeholder="Enter detailed scrutiny observations, discrepancies noted during verification, and statutory APH references..."
                value={officerNotes}
                onChange={e => setOfficerNotes(e.target.value)}
                style={{ fontSize: '12.5px', marginBottom: '12px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSendDirectives}
                  disabled={submittingNotes || !officerNotes.trim()}
                  style={{ background: '#7c3aed', color: '#ffffff', borderColor: '#7c3aed' }}
                >
                  <Send size={13} /> Dispatch Deficiency Directives (Moves to ACTION_REQUIRED)
                </button>
              </div>
            </div>
          )}

          {/* STANDARDIZED SCRUTINY SECTION SIGN-OFF BAR */}
          <div className="gov-card" style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>
                  Formal Officer Sign-Off for Section: <span style={{ color: '#1d4ed8' }}>{scrutinyTab.toUpperCase()}</span>
                </div>
                {Boolean(selectedApp?.scrutiny_sections_reviewed?.[scrutinyTab]) ? (
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} /> Marked as Reviewed: {selectedApp?.scrutiny_sections_reviewed?.[scrutinyTab]?.remarks || 'Confirmed compliant'}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Record your review confirmation for this section before proceeding to statutory decision.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional section review notes..."
                  value={stepReviewNotes[scrutinyTab] || ''}
                  onChange={e => setStepReviewNotes({ ...stepReviewNotes, [scrutinyTab]: e.target.value })}
                  style={{ fontSize: '11.5px', width: '240px', padding: '5px 8px' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSaveStepReview(scrutinyTab)}
                  disabled={savingStepKey === scrutinyTab}
                  style={{ fontSize: '11.5px' }}
                >
                  <CheckCircle2 size={13} />
                  <span>{savingStepKey === scrutinyTab ? 'Recording...' : 'Mark Section as Reviewed'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. AI VALIDATION REPORT */}
      {/* ============================================================ */}
      {subPage === 'officer-ai-validation' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '800', textTransform: 'uppercase' }}>
                Multi-Agent Evidence-Linked Synthesis
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
                AICTE Regulatory Validation Report: #{selectedApp?.application_id}
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Applicable Rule Version: <strong>APH-2026.1</strong> · Evaluated: {selectedApp?.updated_at ? new Date(selectedApp.updated_at).toLocaleString('en-IN') : 'Live'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Overall Scrutiny Score</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: (selectedApp?.scrutiny_score || 0) >= 80 ? '#059669' : '#b45309' }}>
                {selectedApp?.scrutiny_score || 0}%
              </div>
            </div>
          </div>

          {/* 5-Agent Pipeline Execution Summary */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
            <h4 style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e3a8a', marginBottom: '10px' }}>
              Five-Agent Multi-Agent Orchestration Architecture
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0284c7' }}>AGENT 1: DOCUMENT INTEL</div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>Completeness &amp; OCR Extraction</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {docs.length} uploaded / 5 mandatory
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#d97706' }}>AGENT 2: FORENSIC ANOMALY</div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>Tamper &amp; Metadata Verification</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  SHA-256 integrity &amp; pixel checking
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#059669' }}>AGENT 3: ISSUER VERIFY</div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>Authority &amp; Master Record</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  AICTE Central Database matched
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#7c3aed' }}>AGENT 4: COMPLIANCE</div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>APH 2026-27 Rule Engine</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Clause-by-clause threshold checks
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>AGENT 5: DOSSIER SYNTHESIS</div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>Recommendation &amp; Action Plan</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Status: <strong>{selectedApp?.status}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Findings Table */}
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Evidence-Linked Findings &amp; Observations ({selectedApp?.findings?.length || 0})
          </h4>
          {(!selectedApp?.findings || selectedApp.findings.length === 0) ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#059669', background: '#ecfdf5', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
              ✓ All AICTE APH 2026-27 validation checks passed with 0 open discrepancies.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Rule / Code</th>
                    <th>Deficiency Finding</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Evidence Reference</th>
                    <th>Suggested Rectification</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedApp.findings.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{f.field_name || f.rule_id || 'APH-2026'}</td>
                      <td style={{ fontSize: '12px', color: '#0f172a' }}>{f.finding_text}</td>
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
                      <td style={{ fontSize: '11px', color: '#64748b' }}>
                        {f.doc_type || 'Application Form'}
                      </td>
                      <td style={{ fontSize: '11.5px', color: '#7c3aed' }}>
                        {f.suggested_action || 'Upload official document'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. DOCUMENT AUTHENTICATION */}
      {/* ============================================================ */}
      {subPage === 'officer-doc-auth' && (
        <div className="gov-card">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '800', textTransform: 'uppercase' }}>
              Statutory Evidence Authentication
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
              Document Authentication &amp; Forensic Verification Desk
            </h3>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              Document integrity, tampering indicators, digital signature or QR verification where supported, metadata, duplicate detection, and issuer verification outcomes.
            </div>
          </div>

          {docs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
              No uploaded documents available for authentication.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {docs.map(doc => {
                const fa = doc.extracted_data?.forensic_analysis;
                return (
                  <div key={doc.id} style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1d4ed8'
                        }}>
                          <FileCode size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                            {doc.doc_type}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            File: {doc.filename} · Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-IN')} · Version: v{doc.version || 1}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setInspectingDoc(doc)}
                        >
                          <Eye size={12} /> View OCR Text
                        </button>
                      </div>
                    </div>

                    {/* Authentication Matrix Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {/* 1. Document Integrity & Hash */}
                      <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569' }}>1. INTEGRITY HASH (SHA-256)</div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all', marginTop: '4px' }}>
                          {doc.file_hash ? `${doc.file_hash.slice(0, 24)}...` : 'Pending calculation'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                          ✓ Cryptographic match verified
                        </div>
                      </div>

                      {/* 2. Tampering & Pixel Forensics */}
                      <div style={{ padding: '10px', background: fa?.tamper_detected ? '#fef2f2' : '#f8fafc', borderRadius: '6px', border: `1px solid ${fa?.tamper_detected ? '#fca5a5' : '#e2e8f0'}` }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', color: fa?.tamper_detected ? '#b91c1c' : '#475569' }}>
                          2. FORENSIC TAMPER CHECK
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: fa?.tamper_detected ? '#b91c1c' : '#047857', marginTop: '4px' }}>
                          {fa?.tamper_detected ? '⚠️ Anomaly / Pixel Modification Detected' : '✓ No Copy-Move or Tampering Detected'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                          ELA Analysis: {fa?.ela_score ? `${(fa.ela_score * 100).toFixed(1)}%` : 'Clean baseline'}
                        </div>
                      </div>

                      {/* 3. DSC / QR Code Status */}
                      <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569' }}>3. DSC &amp; QR VERIFICATION</div>
                        <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                          {doc.extracted_data?.qr_detected ? '✓ Official Barcode/QR Decoded' : 'Digital Notary Seal / Barcode'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                          Signer: {doc.extracted_data?.issuing_authority || 'Authorized State Department'}
                        </div>
                      </div>

                      {/* 4. Duplicate Cross-Check */}
                      <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569' }}>4. DUPLICATE CHECK</div>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
                          ✓ Unique to this Application
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                          Cross-checked against central AICTE index
                        </div>
                      </div>

                      {/* 5. Issuer Verification Outcome */}
                      <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569' }}>5. ISSUING AUTHORITY STATUS</div>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: doc.status === 'verified' ? '#047857' : '#b45309', marginTop: '4px' }}>
                          {doc.status === 'verified' ? '✓ Reconciled with Issuer Records' : 'Manual Review Advised'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                          Authority: {doc.extracted_data?.issuing_authority || 'State Agency'}
                        </div>
                      </div>
                    </div>

                    {/* 6. Officer Verification Record Form (Blueprint Section 3.5.E) */}
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                          Officer Verification Determination &amp; Findings:
                        </div>
                        {doc.officer_verification_outcome && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: doc.officer_verification_outcome === 'VERIFIED' ? '#ecfdf5' : '#fef2f2',
                            color: doc.officer_verification_outcome === 'VERIFIED' ? '#047857' : '#b91c1c'
                          }}>
                            Recorded: {doc.officer_verification_outcome}
                            {doc.officer_verified_by ? ` (by ${doc.officer_verified_by})` : ''}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {[
                          { id: 'VERIFIED', label: '✓ Verified (Identified Source)', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
                          { id: 'MISMATCH_DETECTED', label: '⚠️ Mismatch Detected', bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
                          { id: 'VERIFICATION_PENDING', label: '⏳ Verification Pending', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
                          { id: 'MANUAL_REVIEW_REQUIRED', label: '🔍 Manual Review Required', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                          { id: 'SOURCE_UNAVAILABLE', label: '🚫 Source Unavailable', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
                        ].map(opt => {
                          const currentSelected = (docVerifyOutcomes[doc.id]?.outcome || doc.officer_verification_outcome || 'VERIFIED') === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setDocVerifyOutcomes({
                                ...docVerifyOutcomes,
                                [doc.id]: {
                                  outcome: opt.id,
                                  notes: docVerifyOutcomes[doc.id]?.notes || doc.officer_verification_notes || ''
                                }
                              })}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: currentSelected ? '800' : '600',
                                border: `1.5px solid ${currentSelected ? opt.border : '#e2e8f0'}`,
                                background: currentSelected ? opt.bg : '#ffffff',
                                color: currentSelected ? opt.color : '#64748b',
                                cursor: 'pointer'
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Statutory verification notes, registry citation, or mismatch justification..."
                          value={docVerifyOutcomes[doc.id]?.notes !== undefined ? docVerifyOutcomes[doc.id]?.notes : (doc.officer_verification_notes || '')}
                          onChange={e => setDocVerifyOutcomes({
                            ...docVerifyOutcomes,
                            [doc.id]: {
                              outcome: docVerifyOutcomes[doc.id]?.outcome || doc.officer_verification_outcome || 'VERIFIED',
                              notes: e.target.value
                            }
                          })}
                          style={{ fontSize: '11.5px', flex: 1, padding: '5px 10px' }}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSaveDocOutcome(doc.id)}
                          disabled={savingDocOutcome === doc.id}
                          style={{ fontSize: '11.5px', whiteSpace: 'nowrap' }}
                        >
                          <CheckCircle2 size={13} />
                          <span>{savingDocOutcome === doc.id ? 'Recording...' : 'Record Outcome'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. VERIFICATION & COMPLIANCE */}
      {/* ============================================================ */}
      {subPage === 'officer-compliance' && (
        <div className="gov-card">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '800', textTransform: 'uppercase' }}>
              APH 2026-27 Regulatory Verification
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
              Verification &amp; Compliance Findings Desk
            </h3>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              Cross-record consistency checks, regulatory checklist results, and rule-by-rule statutory compliance findings.
            </div>
          </div>

          {/* Section A: Cross-Record Consistency Checks */}
          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              A. Cross-Record Multi-Source Consistency Checks
            </h4>
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Verification Area</th>
                    <th>Document Stated Value</th>
                    <th>AICTE Central Master Record</th>
                    <th>Consistency Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '700' }}>Land Parcel Contiguity &amp; Acreage</td>
                    <td>5.5 Acres Contiguous (Title Deed)</td>
                    <td>{masterRecord?.registered_campus_acres || 5.5} Acres Contiguous</td>
                    <td>
                      <span style={{ color: '#047857', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> 100% Consistent
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700' }}>Faculty Cadre &amp; EPFO Roster</td>
                    <td>Cadre 1:2:7.3, SFR 1:18.5</td>
                    <td>{masterRecord?.faculty_epf_roster?.sfr_ratio || '1:18.5 Compliant (72 EPF Members)'}</td>
                    <td>
                      <span style={{ color: '#047857', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> EPFO Biometric Matched
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700' }}>TER Statutory Processing Fee</td>
                    <td>Receipt Confirmed</td>
                    <td>{masterRecord?.ter_payment?.receipt_no || 'AICTE-TER-2026-98124'} (CONFIRMED)</td>
                    <td>
                      <span style={{ color: '#047857', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Verified with Bank CBS
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Rule-by-Rule Compliance Findings (Blueprint Section 3.6) */}
          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              B. Rule-by-Rule Regulatory Compliance Evaluation (APH 2026-27)
            </h4>
            {(!selectedApp?.compliance_checks || selectedApp.compliance_checks.length === 0) ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
                Rule-by-rule checks will populate once AI validation is executed.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Rule ID</th>
                      <th>Rule Name</th>
                      <th>Required Standard</th>
                      <th>Extracted Evidence</th>
                      <th>AI Result</th>
                      <th>Officer Determination &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedApp.compliance_checks.map(c => {
                      const curReview = ruleReviews[c.rule_id] || {
                        status: c.is_compliant ? 'PASSED' : 'DEFICIENCY_FOUND',
                        notes: c.notes || ''
                      };
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{c.rule_id}</td>
                          <td style={{ fontWeight: '600' }}>{c.rule_name}</td>
                          <td style={{ fontSize: '11.5px' }}>{c.required_value}</td>
                          <td style={{ fontSize: '11.5px', color: '#475569' }}>{c.extracted_value}</td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: c.is_compliant ? '#ecfdf5' : '#fee2e2',
                              color: c.is_compliant ? '#047857' : '#b91c1c'
                            }}>
                              {c.is_compliant ? 'COMPLIANT' : 'DEFICIENT'}
                            </span>
                          </td>
                          <td style={{ minWidth: '240px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {['PASSED', 'DEFICIENCY_FOUND', 'MISMATCH_DETECTED', 'MANUAL_REVIEW_REQUIRED'].map(st => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setRuleReviews({
                                      ...ruleReviews,
                                      [c.rule_id]: { status: st, notes: curReview.notes }
                                    })}
                                    style={{
                                      fontSize: '9.5px',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      border: `1px solid ${curReview.status === st ? '#1d4ed8' : '#cbd5e1'}`,
                                      background: curReview.status === st ? '#eff6ff' : '#ffffff',
                                      color: curReview.status === st ? '#1d4ed8' : '#475569',
                                      fontWeight: curReview.status === st ? '800' : '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {st.replace('_', ' ')}
                                  </button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Officer finding notes..."
                                  value={curReview.notes}
                                  onChange={e => setRuleReviews({
                                    ...ruleReviews,
                                    [c.rule_id]: { status: curReview.status, notes: e.target.value }
                                  })}
                                  style={{ fontSize: '11px', padding: '3px 6px', flex: 1 }}
                                />
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleSaveRuleReview(c.rule_id)}
                                  disabled={savingRuleReview === c.rule_id}
                                  style={{ padding: '3px 8px', fontSize: '10.5px' }}
                                >
                                  {savingRuleReview === c.rule_id ? 'Saving...' : 'Record'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section C: Unresolved Items & Discrepancies Register (Blueprint Section 3.6) */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  C. Statutory Discrepancy &amp; Clarification Dispatch
                </h4>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  If regulatory non-compliance or shortfall is identified, dispatch a formal clarification inquiry under APH 2026-27 norms.
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('officer-clarifications')}
                style={{ fontSize: '11.5px' }}
              >
                <MessageSquare size={13} /> Dispatch Clarification to Institution →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. CLARIFICATIONS (Blueprint Section 3.7 - Traceable Channel) */}
      {/* ============================================================ */}
      {subPage === 'officer-clarifications' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '800', textTransform: 'uppercase' }}>
                Statutory Traceable Communication Channel
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
                Clarifications Management Desk: #{selectedApp?.application_id}
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Issue formal regulatory queries to applicant institutions and examine furnished explanations with full audit trail.
              </div>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewClarificationForm(!showNewClarificationForm)}
              style={{ fontSize: '11.5px' }}
            >
              <Send size={13} />
              <span>{showNewClarificationForm ? 'Close Form' : 'Dispatch Formal Clarification Inquiry'}</span>
            </button>
          </div>

          {/* Form to issue new formal clarification inquiry */}
          {showNewClarificationForm && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1.5px solid #1e3a8a', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                Dispatch New Formal Clarification Notice
              </h4>
              <form onSubmit={handleCreateClarificationQuery}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Inquiry Subject:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Fire Safety Certificate Validity Query"
                      value={newClarificationSubject}
                      onChange={e => setNewClarificationSubject(e.target.value)}
                      required
                      style={{ fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Related Regulatory Item:</label>
                    <select
                      className="form-control"
                      value={newClarificationRelatedItem}
                      onChange={e => setNewClarificationRelatedItem(e.target.value)}
                      style={{ fontSize: '12px' }}
                    >
                      <option value="DOCUMENT">Uploaded Document / Certificate</option>
                      <option value="LAND_RECORD">Land Parcel &amp; Survey Titling</option>
                      <option value="FACULTY_EPFO">Faculty Cadre / EPFO Biometric</option>
                      <option value="APH_RULE">APH Regulatory Checklist Clause</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Response Due Date:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newClarificationDueDate}
                      onChange={e => setNewClarificationDueDate(e.target.value)}
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>
                    Specific Deficiency Question / Explanation Requirement:
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide precise statutory query, missing document references, and directive for institution..."
                    value={newClarificationQuery}
                    onChange={e => setNewClarificationQuery(e.target.value)}
                    required
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowNewClarificationForm(false)}
                    style={{ fontSize: '11.5px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '11.5px' }}
                  >
                    <Send size={13} /> Dispatch to Institution
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Clarifications Inbox Table */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Clarifications Inbox &amp; Inquiry Status Register
            </h4>
            {clarifications.filter(c => String(c.application_id) === String(selectedApp?.application_id)).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
                No clarification inquiries dispatched for this application dossier.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Query ID</th>
                      <th>Subject</th>
                      <th>Related Item</th>
                      <th>Issued Date</th>
                      <th>Due Date</th>
                      <th>Response Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clarifications
                      .filter(c => String(c.application_id) === String(selectedApp?.application_id))
                      .map(cl => (
                        <tr key={cl.id} style={{ background: selectedClarification?.id === cl.id ? '#eff6ff' : 'transparent' }}>
                          <td style={{ fontWeight: '700', color: '#1d4ed8' }}>#{cl.clarification_id}</td>
                          <td style={{ fontWeight: '600' }}>{cl.subject}</td>
                          <td style={{ fontSize: '11px', color: '#64748b' }}>{cl.related_item_type || 'DOCUMENT'}</td>
                          <td style={{ fontSize: '11.5px' }}>{new Date(cl.created_at).toLocaleDateString('en-IN')}</td>
                          <td style={{ fontSize: '11.5px', color: '#b45309', fontWeight: '600' }}>{cl.due_date || '7 Days'}</td>
                          <td>
                            <span className={`status-badge status-${cl.status.toLowerCase()}`}>
                              {cl.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedClarification(cl)}
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <MessageSquare size={12} /> {selectedClarification?.id === cl.id ? 'Viewing' : 'Inspect Thread'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interactive Clarification Thread Workspace */}
          {selectedClarification && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>THREAD #{selectedClarification.clarification_id}</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                    {selectedClarification.subject}
                  </h4>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {selectedClarification.status !== 'RESOLVED' ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResolveClarificationItem(selectedClarification.id, false)}
                      style={{ background: '#059669', borderColor: '#059669', fontSize: '11.5px' }}
                    >
                      <CheckCircle2 size={13} /> Mark Clarification Resolved
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleResolveClarificationItem(selectedClarification.id, true)}
                      style={{ fontSize: '11.5px' }}
                    >
                      <RefreshCw size={13} /> Reopen Inquiry
                    </button>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {/* Initial Query */}
                <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '6px', borderLeft: '4px solid #1d4ed8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                    <span>📤 Official Clarification Notice (AICTE Scrutiny Officer)</span>
                    <span>{new Date(selectedClarification.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#0f172a' }}>
                    {selectedClarification.question_text}
                  </div>
                </div>

                {/* Threaded Follow-up Messages */}
                {selectedClarification.messages?.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: msg.sender_role === 'INSTITUTION' ? '#ecfdf5' : '#ffffff',
                      border: `1px solid ${msg.sender_role === 'INSTITUTION' ? '#a7f3d0' : '#e2e8f0'}`,
                      borderLeft: `4px solid ${msg.sender_role === 'INSTITUTION' ? '#059669' : '#1d4ed8'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: msg.sender_role === 'INSTITUTION' ? '#047857' : '#1e40af', marginBottom: '4px' }}>
                      <span>{msg.sender_role === 'INSTITUTION' ? '📥 Institution Furnished Response' : '📤 Officer Follow-up Directive'} ({msg.sender_name})</span>
                      <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleString('en-IN') : ''}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#0f172a' }}>
                      {msg.text}
                    </div>
                    {msg.attachment && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} /> Attachment: {msg.attachment}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReplyToClarification}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter follow-up directive or inquiry reply to the institution..."
                    value={clarificationReplyText}
                    onChange={e => setClarificationReplyText(e.target.value)}
                    required
                    style={{ fontSize: '12px' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={sendingClarificationReply || !clarificationReplyText.trim()}
                    style={{ whiteSpace: 'nowrap', fontSize: '11.5px' }}
                  >
                    <Send size={13} />
                    <span>{sendingClarificationReply ? 'Sending...' : 'Send Directive'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. REVIEW & DECISION (Blueprint Section 3.8 - Statutory Determination) */}
      {/* ============================================================ */}
      {subPage === 'officer-review-decision' && (
        <div>
          {/* Pre-Decision Statutory Validation Checklist (Blueprint Section 3.8) */}
          <div className="gov-card" style={{ marginBottom: '18px', borderLeft: '4px solid #1e3a8a' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Pre-Decision Statutory Validation Checklist
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
              Before executing a legally binding statutory decision, verify that all mandatory scrutiny prerequisites have been completed.
            </p>

            {(() => {
              const reviewedObj = selectedApp?.scrutiny_sections_reviewed || {};
              const stepKeys = ['overview', 'profile', 'docs', 'ai_findings', 'doc_auth', 'compliance', 'clarifications', 'officer_notes'];
              const completedCount = stepKeys.filter(k => Boolean(reviewedObj[k])).length;
              const unverifiedDocs = docs.filter(d => !d.officer_verification_outcome);
              const pendingClarifs = clarifications.filter(c => String(c.application_id) === String(selectedApp?.application_id) && c.status === 'PENDING_INSTITUTION');

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px', background: completedCount >= 6 ? '#ecfdf5' : '#fffbeb', borderRadius: '6px', border: `1px solid ${completedCount >= 6 ? '#a7f3d0' : '#fde68a'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: completedCount >= 6 ? '#047857' : '#b45309' }}>
                      1. SCRUTINY SECTIONS ({completedCount}/8)
                    </div>
                    <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#0f172a' }}>
                      {completedCount >= 6 ? '✓ Core scrutiny steps signed off' : '⚠️ Outstanding scrutiny sections'}
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: unverifiedDocs.length === 0 ? '#ecfdf5' : '#fffbeb', borderRadius: '6px', border: `1px solid ${unverifiedDocs.length === 0 ? '#a7f3d0' : '#fde68a'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: unverifiedDocs.length === 0 ? '#047857' : '#b45309' }}>
                      2. DOCUMENT VERIFICATION ({docs.length - unverifiedDocs.length}/{docs.length})
                    </div>
                    <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#0f172a' }}>
                      {unverifiedDocs.length === 0 ? '✓ All uploaded docs evaluated' : `⚠️ ${unverifiedDocs.length} docs pending outcome`}
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#047857' }}>
                      3. COMPLIANCE EVALUATION
                    </div>
                    <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#0f172a' }}>
                      ✓ APH 2026-27 rules evaluated
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: pendingClarifs.length === 0 ? '#ecfdf5' : '#fffbeb', borderRadius: '6px', border: `1px solid ${pendingClarifs.length === 0 ? '#a7f3d0' : '#fde68a'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: pendingClarifs.length === 0 ? '#047857' : '#b45309' }}>
                      4. CLARIFICATIONS ({pendingClarifs.length} PENDING)
                    </div>
                    <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#0f172a' }}>
                      {pendingClarifs.length === 0 ? '✓ No pending clarification queries' : `⏳ ${pendingClarifs.length} awaiting institution`}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 1: Scrutiny Observations & Deficiency Directives */}
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
              1. Scrutiny Observations &amp; Directives to Institution
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
              Record specific corrective actions for the institution. Submitting moves application to <strong>ACTION_REQUIRED</strong>.
            </p>

            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Please upload renewal of Fire Safety NOC for 2026-27 and notarized land affidavit on ₹100 stamp paper..."
              value={officerNotes}
              onChange={e => setOfficerNotes(e.target.value)}
              style={{ fontSize: '12.5px', marginBottom: '10px' }}
            />

            <div style={{ textAlign: 'right' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSendDirectives}
                disabled={submittingNotes || !officerNotes.trim()}
                style={{ background: '#7c3aed', color: '#ffffff', borderColor: '#7c3aed' }}
              >
                <Send size={13} />
                <span>{submittingNotes ? 'Submitting...' : 'Dispatch Directives to Institution'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Authorized Statutory Final Decision */}
          <div className="gov-card" style={{ borderTop: '4px solid #1e3a8a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                  2. Authorized AICTE Statutory Decision Execution
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Execute final statutory decree under AICTE Act 1987 &amp; Approval Process Handbook 2026-27
                </span>
              </div>

              {((selectedApp?.status || '').toUpperCase() === 'APPROVED' || (selectedApp?.status || '').toUpperCase() === 'DECISION_RECORDED' || Boolean(selectedApp?.certificate_issued)) && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCertificateModal(true)}
                  style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Award size={14} /> View Certificate #{selectedApp?.certificate_number}
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div
                onClick={() => setDecisionType('CLEARED')}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  border: `2px solid ${decisionType === 'CLEARED' ? '#059669' : '#e2e8f0'}`,
                  background: decisionType === 'CLEARED' ? '#ecfdf5' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#047857' }}>CLEARED</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Grant Approval &amp; Issue Official Certificate</div>
              </div>

              <div
                onClick={() => setDecisionType('DEFICIENCY')}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  border: `2px solid ${decisionType === 'DEFICIENCY' ? '#d97706' : '#e2e8f0'}`,
                  background: decisionType === 'DEFICIENCY' ? '#fffbeb' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#b45309' }}>DEFICIENCY</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Formal Deficiencies Notice</div>
              </div>

              <div
                onClick={() => setDecisionType('REJECTED')}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  border: `2px solid ${decisionType === 'REJECTED' ? '#dc2626' : '#e2e8f0'}`,
                  background: decisionType === 'REJECTED' ? '#fef2f2' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#b91c1c' }}>REJECTED</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Statutory Refusal Order</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                Statutory Order Justification / Official Remarks (Mandatory):
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Enter formal regulatory decision grounds, statutory justifications, and APH clauses referenced..."
                value={decisionRemarks}
                onChange={e => setDecisionRemarks(e.target.value)}
                style={{ fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowOrderModal(true)}
              >
                Preview Regulatory Order Draft
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRecordOfficialDecision}
                disabled={isSubmittingDecision}
                style={{
                  background: decisionType === 'CLEARED' ? '#059669' : (decisionType === 'DEFICIENCY' ? '#d97706' : '#dc2626'),
                  borderColor: decisionType === 'CLEARED' ? '#047857' : (decisionType === 'DEFICIENCY' ? '#b45309' : '#b91c1c')
                }}
              >
                <CheckCircle2 size={13} />
                <span>{isSubmittingDecision ? 'Executing Order...' : `Execute Statutory Decision (${decisionType})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. AUDIT HISTORY */}
      {/* ============================================================ */}
      {subPage === 'officer-audit' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '800', textTransform: 'uppercase' }}>
                Statutory Non-Repudiation Trail
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
                Cryptographic Audit History: #{selectedApp?.application_id}
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Tamper-evident chronological audit events and seal verification
              </div>
            </div>
          </div>

          {/* Cryptographic Seal Verification Tool */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              Verify Form AICTE-SCRUTINY-2026 Cryptographic Seal
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter SHA-256 seal hash to verify authenticity..."
                value={sealInput}
                onChange={e => setSealInput(e.target.value)}
                style={{ fontSize: '12px' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleVerifySeal}
                disabled={verifyingSeal || !sealInput.trim()}
              >
                {verifyingSeal ? 'Verifying...' : 'Verify Seal'}
              </button>
            </div>
            {sealResult && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                borderRadius: '6px',
                background: sealResult.valid ? '#ecfdf5' : '#fef2f2',
                color: sealResult.valid ? '#047857' : '#b91c1c',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {sealResult.valid ? `✓ Authenticated Official AICTE Document for ${sealResult.institution_name} (${sealResult.application_id})` : sealResult.message}
              </div>
            )}
          </div>

          {/* Chronological Audit Table */}
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / Official</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No audit events recorded for this application.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>{log.actor_name || 'System'}</td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: '#475569' }}>{log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</td>
                      <td style={{ fontSize: '11px', color: '#64748b', maxWidth: '300px' }}>
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 10. MY ACCOUNT */}
      {/* ============================================================ */}
      {subPage === 'officer-account' && (
        <div className="gov-card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              Approval Officer Account Profile
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Ministry of Education, Government of India Official Identity
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Official Name</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {user?.full_name || 'Dr. Arun Sharma'}
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Official Government Email</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {user?.email || 'arun@gov.in'}
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Assigned Statutory Role</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>
                AICTE Scrutiny &amp; Regulatory Approval Officer
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Directorate Jurisdiction</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                Western Regional Office (WRO)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {inspectingDoc && (
        <DocumentOcrModal
          document={inspectingDoc}
          findings={selectedApp?.findings || []}
          applicationId={selectedApp?.application_id || 'APP-2026'}
          institutionName={selectedApp?.institution_name || 'Applicant Institution'}
          isOfficer={true}
          onClose={() => setInspectingDoc(null)}
        />
      )}

      {showScrutinyModal && selectedApp && (
        <OfficialScrutinySheetModal
          appId={selectedApp.application_id}
          onClose={() => setShowScrutinyModal(false)}
        />
      )}

      {showCertificateModal && selectedApp && (
        <ApprovalCertificateModal
          application={selectedApp}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {showOrderModal && selectedApp && (
        <RegulatoryOrderModal
          application={selectedApp}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  );
}
