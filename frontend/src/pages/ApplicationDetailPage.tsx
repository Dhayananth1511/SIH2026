import React, { useState, useEffect } from 'react';
import {
  getApplication,
  getFindings,
  runValidation,
  completeVerification,
  submitComplianceRecommendation,
  issueOfficialDecision,
  getApplicationPipeline
} from '../api';
import type { Application, Finding, PipelineInfo } from '../types';
import { useAuth } from '../AuthContext';

interface Props {
  appId?: string;
  onBack: () => void;
  onNavigateTab?: (targetPage: string) => void;
}

export default function ApplicationDetailPage({ appId = '', onBack, onNavigateTab }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'findings' | 'compliance' | 'audit'>('overview');
  const [app, setApp] = useState<Application | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [pipeline, setPipeline] = useState<PipelineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  // Action Modals State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('verified');

  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceRec, setComplianceRec] = useState('RECOMMENDED_APPROVAL');
  const [complianceRemarks, setComplianceRemarks] = useState('');
  const [inspectionReq, setInspectionReq] = useState(false);

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState('CLEARED');
  const [decisionReasons, setDecisionReasons] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [authorityDesignation, setAuthorityDesignation] = useState('Member Secretary, AICTE');

  const role = (user?.role || 'institution').toLowerCase();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getApplication(appId).catch(() => null),
      getFindings(appId).catch(() => []),
      getApplicationPipeline(appId).catch(() => null)
    ]).then(([appData, findingsData, pipeData]) => {
      setApp(appData);
      setFindings(findingsData || []);
      setPipeline(pipeData);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [appId]);

  const handleTabClick = (tab: 'overview' | 'documents' | 'findings' | 'compliance' | 'audit') => {
    setActiveTab(tab);
    if (tab === 'documents' && onNavigateTab) onNavigateTab('doc-verification');
    if (tab === 'compliance' && onNavigateTab) onNavigateTab('compliance-check');
    if (tab === 'findings' && onNavigateTab) onNavigateTab('hitl-review');
    if (tab === 'audit' && onNavigateTab) onNavigateTab('audit-logs');
  };

  const handleRunValidation = async () => {
    setValidating(true);
    try {
      const res = await runValidation(appId);
      setStatusNotice(`✓ 5-Agent Validation Pipeline finished: ${res.message || 'Scrutiny pipeline completed'}`);
      loadData();
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Validation run triggered');
    } finally {
      setValidating(false);
    }
  };

  const handleCompleteVerification = async () => {
    try {
      await completeVerification(appId, verifyRemarks || 'All certificates verified against OCR standards.', verifyStatus);
      setShowVerifyModal(false);
      setStatusNotice('✓ Document verification milestone completed. Dossier forwarded to Compliance Reviewer.');
      loadData();
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to complete verification.');
    }
  };

  const handleSubmitCompliance = async () => {
    try {
      await submitComplianceRecommendation(appId, complianceRec, complianceRemarks || 'Statutory review completed against APH norms.', inspectionReq);
      setShowComplianceModal(false);
      setStatusNotice('✓ Compliance recommendation submitted. Forwarded to Authorized AICTE Decision-Maker.');
      loadData();
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit compliance recommendation.');
    }
  };

  const handleIssueDecision = async () => {
    try {
      await issueOfficialDecision(
        appId,
        decisionChoice,
        decisionReasons || 'Statutory regulatory order issued following comprehensive multi-tier scrutiny.',
        orderNo || `AICTE/ORDER/${new Date().getFullYear()}/${appId}`,
        authorityDesignation
      );
      setShowDecisionModal(false);
      setStatusNotice(`✓ AICTE Official Order Issued: ${decisionChoice}`);
      loadData();
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to issue decision.');
    }
  };

  const criticalCount = findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;

  return (
    <div className="animate-in">
      {/* Breadcrumb Trail */}
      <div className="breadcrumb-trail">
        <span className="link" onClick={onBack}>Applications</span>
        <span>›</span>
        <span className="current">{appId}</span>
      </div>

      {statusNotice && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
          {statusNotice}
        </div>
      )}

      {/* Title & Action Header */}
      <div className="page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="page-title">
            {app ? `${app.application_id || appId} - ${app.institution_name}` : (appId ? `Application ${appId}` : 'Application Dossier')}
          </h2>
          {app?.applied_for && (
            <span className="status-pill eoa">
              {app.applied_for}
            </span>
          )}
          <span className={`status-pill ${app?.status === 'cleared' ? 'cleared' : app?.status === 'under_review' ? 'under-review' : app?.status === 'deficiency' ? 'deficiencies' : 'info'}`}>
            {app?.status ? app.status.replace('_', ' ').toUpperCase() : 'SUBMITTED'}
          </span>
        </div>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigateTab ? onNavigateTab('verification-results') : alert('Opening Scrutiny Dossier')}
          >
            📊 View Scrutiny Report
          </button>
        </div>
      </div>

      {/* 5-Stage Interactive Pipeline Progress Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Application Regulatory Pipeline
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Current Stage: <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{(app?.current_stage || 'submission').replace('_', ' ')}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {[
            {
              num: 1,
              title: '1. Submission',
              sub: 'Institution User',
              done: true,
              actor: app?.institution_name || 'Applicant'
            },
            {
              num: 2,
              title: '2. AI Validation',
              sub: '5 Internal Agents',
              done: (app?.scrutiny_score || 0) > 0 || (pipeline?.stages?.[1]?.status === 'COMPLETED'),
              actor: 'AI Forensic Engine'
            },
            {
              num: 3,
              title: '3. Verification',
              sub: 'Verification Officer',
              done: app?.verification_status === 'verified',
              actor: app?.verification_officer_id ? 'Officer Verified' : 'Pending Verification'
            },
            {
              num: 4,
              title: '4. Compliance',
              sub: 'Compliance Reviewer',
              done: app?.compliance_status === 'completed',
              actor: app?.compliance_recommendation || 'Pending Review'
            },
            {
              num: 5,
              title: '5. Official Decision',
              sub: 'AICTE Decision-Maker',
              done: app?.final_decision !== undefined && app?.final_decision !== null,
              actor: app?.decision_order_no || 'Pending Decree'
            }
          ].map(s => (
            <div
              key={s.num}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: s.done ? '#ecfdf5' : '#f8fafc',
                border: s.done ? '1.5px solid #10b981' : '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: s.done ? '#065f46' : '#64748b' }}>
                  {s.title}
                </span>
                <span style={{ fontSize: '12px' }}>{s.done ? '✓' : '○'}</span>
              </div>
              <div style={{ fontSize: '10.5px', color: s.done ? '#047857' : '#94a3b8', marginTop: '2px', fontWeight: '600' }}>
                {s.sub}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.actor}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role-Specific Action Bar */}
      <div style={{
        background: '#eff6ff',
        border: '1.5px solid #93c5fd',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase' }}>
            Actions Permitted For: <span style={{ textDecoration: 'underline' }}>{role.replace('_', ' ')}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
            {role === 'institution' && 'Upload additional evidence, trigger AI validation, or view deficiency findings.'}
            {(role === 'verification_officer' || role === 'officer') && 'Verify documents against OCR findings and complete Document Verification milestone.'}
            {role === 'compliance_reviewer' && 'Scrutinize APH statutory rules and forward official compliance recommendation to Directorate.'}
            {role === 'decision_maker' && 'Statutory Authority: Issue official AICTE Approval (EoA), Deficiency Notice, or Refusal decree.'}
            {role === 'admin' && 'System Administrator: Manage rule thresholds and audit ledger. (Cannot sign regulatory orders).'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Institution Action */}
          {role === 'institution' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRunValidation}
              disabled={validating}
            >
              {validating ? 'Running AI Engine...' : '⚡ Trigger 5-Agent Validation'}
            </button>
          )}

          {/* Verification Officer Action */}
          {(role === 'verification_officer' || role === 'officer' || role === 'admin') && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowVerifyModal(true)}
              style={{ background: '#0284c7' }}
            >
              🔍 Complete Verification Milestone
            </button>
          )}

          {/* Compliance Reviewer Action */}
          {(role === 'compliance_reviewer' || role === 'admin') && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowComplianceModal(true)}
              style={{ background: '#7c3aed' }}
            >
              ⚖️ Submit Scrutiny Recommendation
            </button>
          )}

          {/* AICTE Decision Maker Action */}
          {role === 'decision_maker' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowDecisionModal(true)}
              style={{ background: '#b45309' }}
            >
              🏛️ Issue Official AICTE Order
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="sub-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabClick('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => handleTabClick('documents')}
        >
          Documents
        </button>
        <button
          className={`tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
          onClick={() => handleTabClick('findings')}
        >
          Validation Findings ({findings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => handleTabClick('compliance')}
        >
          Compliance Check
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => handleTabClick('audit')}
        >
          Audit Trail
        </button>
      </div>

      {/* Two Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Application Summary */}
        <div className="white-card" style={{ marginBottom: 0 }}>
          <div className="white-card-header">
            <span className="white-card-title">Application Summary</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Stage: {app?.current_stage || 'submission'}</span>
          </div>
          <div className="white-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: '12px', fontSize: '12.5px' }}>
              <div style={{ color: '#64748b', fontWeight: '500' }}>Application ID</div>
              <div style={{ fontWeight: '700', color: '#1e293b' }}>{app?.application_id || appId}</div>

              <div style={{ color: '#64748b', fontWeight: '500' }}>Institution Name</div>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>{app?.institution_name || '—'}</div>

              <div style={{ color: '#64748b', fontWeight: '500' }}>Institution Type</div>
              <div style={{ color: '#334155' }}>{app?.institution_type || '—'}</div>

              <div style={{ color: '#64748b', fontWeight: '500' }}>Location</div>
              <div style={{ color: '#334155' }}>{app?.city ? `${app.city}, ` : ''}{app?.state || app?.region || '—'}</div>

              <div style={{ color: '#64748b', fontWeight: '500' }}>Applied For</div>
              <div style={{ color: '#334155' }}>{app?.applied_for || '—'}</div>

              <div style={{ color: '#64748b', fontWeight: '500' }}>Scrutiny Score</div>
              <div>
                <strong style={{ color: (app?.scrutiny_score || 0) >= 80 ? '#16a34a' : '#d97706', fontSize: '14px' }}>
                  {app?.scrutiny_score ? `${app.scrutiny_score}%` : 'Pending Scoring'}
                </strong>
              </div>

              {app?.decision_order_no && (
                <>
                  <div style={{ color: '#64748b', fontWeight: '500' }}>AICTE Order #</div>
                  <div style={{ fontWeight: '700', color: '#1e3a8a' }}>{app.decision_order_no}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="white-card" style={{ marginBottom: 0 }}>
          <div className="white-card-header">
            <span className="white-card-title">Quick Actions</span>
          </div>
          <div className="white-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px' }}
              onClick={() => onNavigateTab ? onNavigateTab('doc-verification') : alert('View Documents')}
            >
              📄 <span style={{ marginLeft: '6px' }}>View / Upload Documents</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px' }}
              onClick={handleRunValidation}
              disabled={validating}
            >
              ⚡ <span style={{ marginLeft: '6px' }}>{validating ? 'Running AI Engine...' : 'Run 5-Agent Validation Pipeline'}</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px' }}
              onClick={() => onNavigateTab ? onNavigateTab('compliance-check') : alert('View Compliance')}
            >
              ⚖️ <span style={{ marginLeft: '6px' }}>Check APH Compliance Norms</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
              onClick={() => onNavigateTab ? onNavigateTab('hitl-review') : alert('Open HITL Queue')}
            >
              📥 <span style={{ marginLeft: '6px', fontWeight: '600' }}>Open Review Queue (HITL Adjudication)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Key Findings */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
          Key Findings from Database ({findings.length} detected)
        </div>
        <div className="key-findings-grid">
          <div className="finding-counter-card red" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab && onNavigateTab('hitl-review')}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Deficiencies / Missing Proofs
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '600' }}>
              Requires resolution
            </div>
          </div>

          <div className="finding-counter-card yellow" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab && onNavigateTab('hitl-review')}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Inconsistencies
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
              {mediumCount}
            </div>
            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px', fontWeight: '600' }}>
              Data mismatch flagged
            </div>
          </div>

          <div className="finding-counter-card blue" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab && onNavigateTab('hitl-review')}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Anomalies
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#3b82f6', marginTop: '4px' }}>
              {lowCount}
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px', fontWeight: '600' }}>
              Cryptographic integrity checks
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: VERIFICATION OFFICER MILESTONE */}
      {showVerifyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Complete Document Verification Milestone
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
              As Verification Officer, record your OCR examination findings and advance the dossier to Compliance Scrutiny.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Verification Outcome
              </label>
              <select
                value={verifyStatus}
                onChange={e => setVerifyStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="verified">Verified &amp; Certified (Proceed to Compliance Review)</option>
                <option value="evidence_requested">Deficiency Flagged (Request Additional Evidence)</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Officer Verification Remarks
              </label>
              <textarea
                value={verifyRemarks}
                onChange={e => setVerifyRemarks(e.target.value)}
                placeholder="e.g. Land certificate, Fire NOC and Building plans verified against municipal issuing records."
                rows={4}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCompleteVerification} style={{ background: '#0284c7' }}>
                Submit &amp; Advance Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLIANCE REVIEWER RECOMMENDATION */}
      {showComplianceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Submit Statutory Compliance Recommendation
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
              Record regulatory scrutiny findings against APH 2026-27 norms and submit formal recommendation to the AICTE Decision-Maker.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Statutory Recommendation
              </label>
              <select
                value={complianceRec}
                onChange={e => setComplianceRec(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="RECOMMENDED_APPROVAL">Recommend Full Approval (Meets All Norms)</option>
                <option value="RECOMMENDED_DEFICIENCY">Recommend Deficiency Notice (Rectification Required)</option>
                <option value="RECOMMENDED_INSPECTION">Recommend Physical Expert Inspection Committee</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Scrutiny Observations &amp; Evidence Remarks
              </label>
              <textarea
                value={complianceRemarks}
                onChange={e => setComplianceRemarks(e.target.value)}
                placeholder="e.g. Built-up area satisfies APH clause 2.1; cadre ratio compliance verified."
                rows={4}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inspectionReq}
                  onChange={e => setInspectionReq(e.target.checked)}
                />
                Require Expert Physical Inspection Committee (EVC) on campus
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowComplianceModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmitCompliance} style={{ background: '#7c3aed' }}>
                Forward to AICTE Decision-Maker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUTHORIZED AICTE DECISION-MAKER OFFICIAL ORDER */}
      {showDecisionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>
              🏛️ Issue Official AICTE Regulatory Decree
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Statutory final determination pursuant to Section 10 of AICTE Act, 1987.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Official Regulatory Determination
              </label>
              <select
                value={decisionChoice}
                onChange={e => setDecisionChoice(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '700' }}
              >
                <option value="CLEARED">CLEARED — Grant Extension of Approval (EoA 2026-27)</option>
                <option value="DEFICIENCY">DEFICIENCY — Serve Formal Deficiency Rectification Notice</option>
                <option value="REJECTED">REJECTED — Statutory Refusal with Justification</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Order Number (AICTE Official Reference)
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={e => setOrderNo(e.target.value)}
                placeholder={`AICTE/ORDER/${new Date().getFullYear()}/${appId}`}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Official Determination Reasons &amp; Directive
              </label>
              <textarea
                value={decisionReasons}
                onChange={e => setDecisionReasons(e.target.value)}
                placeholder="State the statutory findings, verification corroboration, and formal directive."
                rows={4}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Authorized Signatory Authority
              </label>
              <input
                type="text"
                value={authorityDesignation}
                onChange={e => setAuthorityDesignation(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDecisionModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleIssueDecision} style={{ background: '#b45309' }}>
                Sign &amp; Seal Official Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
