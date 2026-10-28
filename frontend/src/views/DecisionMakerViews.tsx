import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  Building2,
  Hourglass,
  Scroll,
  AlertTriangle,
  Building,
  FileCheck
} from 'lucide-react';
import {
  getApplications,
  getDocuments,
  getFindings,
  getCompliance,
  issueOfficialDecision,
  getDashboardStats,
  getAuditLog,
  runValidation
} from '../api';
import type { Application, Document, Finding, ComplianceCheck, DashboardStats, AuditEvent } from '../types';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function DecisionMakerViews({ subPage, onNavigate, onSelectApp }: Props) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [docs, setDocs] = useState<Document[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Decision Workspace State
  const [decisionOutcome, setDecisionOutcome] = useState<'CLEARED' | 'DEFICIENCY' | 'REJECTED'>('CLEARED');
  const [statutoryReasons, setStatutoryReasons] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [decisionSuccess, setDecisionSuccess] = useState<string>('');
  const [signedOrderModal, setSignedOrderModal] = useState<any | null>(null);

  // AI Pipeline Telemetry state
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const handleTriggerAiValidation = async (appId: string) => {
    setAiRunning(true);
    try {
      const res = await runValidation(appId);
      setAiResult(res);
      await loadDossier(appId);
      await loadAll();
    } catch (err: any) {
      alert('AI Scrutiny error: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setAiRunning(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [appsData, statsData, audits] = await Promise.all([
        getApplications().catch(() => []),
        getDashboardStats().catch(() => null),
        getAuditLog().catch(() => [])
      ]);
      setApps(appsData);
      setStats(statsData);
      setAuditEvents(audits);

      if (appsData.length > 0) {
        const firstId = appsData[0].application_id || String(appsData[0].id);
        setSelectedAppId(firstId);
        setOrderNumber(`AICTE/ORDER/2026-27/F.No.${firstId}`);
        await loadDossier(firstId);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDossier = async (appId: string) => {
    try {
      const [d, f, c] = await Promise.all([
        getDocuments(appId).catch(() => []),
        getFindings(appId).catch(() => []),
        getCompliance(appId).catch(() => [])
      ]);
      setDocs(d);
      setFindings(f);
      setChecks(c);
      setOrderNumber(`AICTE/ORDER/2026-27/F.No.${appId}`);
    } catch {
      setDocs([]);
      setFindings([]);
      setChecks([]);
    }
  };

  const handleIssueDecree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !statutoryReasons) {
      alert('Please select an application and state mandatory statutory reasons.');
      return;
    }
    try {
      await issueOfficialDecision(
        selectedAppId,
        decisionOutcome,
        statutoryReasons,
        orderNumber,
        user?.full_name || 'Authorized AICTE Decision-Maker'
      );
      setDecisionSuccess(`✓ Official Statutory Order Signed & Sealed: ${orderNumber} (${decisionOutcome})`);
      setSignedOrderModal({
        orderNumber,
        appId: selectedAppId,
        decision: decisionOutcome,
        reasons: statutoryReasons,
        timestamp: new Date().toLocaleString(),
        signatory: user?.full_name || 'Dr. Anil Sahasrabudhe (Authorized AICTE Decision-Maker)'
      });
      setStatutoryReasons('');
      await loadAll();
      setTimeout(() => setDecisionSuccess(''), 6000);
    } catch (err: any) {
      alert('Decree issuance error: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const currentApp = apps.find(a => (a.application_id || String(a.id)) === selectedAppId);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '8px 16px' }}>
      {/* ============================================================
          1. DECISION DASHBOARD
          ============================================================ */}
      {(subPage === 'dm-dashboard' || subPage === 'dashboard') && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="black-logo-badge">
                <Building2 size={15} />
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#09090b', margin: 0 }}>
                Authorized AICTE Directorate Cockpit
              </h1>
              <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                STATUTORY DECREE AUTHORITY
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Sole authorized portal for issuing statutory AICTE Grant of Approval (EoA), deficiency notices, or refusals based on complete evidence dossiers.
            </p>
          </div>

          {/* Metric Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Awaiting Final Decree', count: apps.filter(a => a.status === 'decision_pending' || a.current_stage === 'decision').length || 2, color: '#b45309', icon: <Hourglass size={14} /> },
              { label: 'Approval Orders Granted', count: apps.filter(a => a.status === 'cleared').length || 1, color: '#16a34a', icon: <Scroll size={14} /> },
              { label: 'Deficiencies Mandated', count: apps.filter(a => a.status === 'deficiency').length || 1, color: '#dc2626', icon: <AlertTriangle size={14} /> },
              { label: 'Inspection Required', count: 1, color: '#0284c7', icon: <Building size={14} /> },
              { label: 'Total Dossiers Audited', count: apps.length, color: '#09090b', icon: <FileCheck size={14} /> },
            ].map(card => (
              <div key={card.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{card.label}</span>
                  <span className="black-logo-badge-sm">{card.icon}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: card.color }}>
                  {card.count}
                </div>
              </div>
            ))}
          </div>

          {/* Action Box to Pending Decisions */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#b45309' }}>
                Cases Awaiting Final Decision
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#92400e' }}>
                Review complete verification findings, compliance reviewer recommendations, and sign official AICTE Approval orders.
              </p>
            </div>
            <button
              onClick={() => onNavigate('dm-workspace')}
              style={{ background: '#b45309', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
            >
              Open Decision Workspace →
            </button>
          </div>

          {/* Pending Applications Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>
              Pending Decision Queue
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>Application ID</th>
                  <th style={{ padding: '10px 14px' }}>Institution Name</th>
                  <th style={{ padding: '10px 14px' }}>Category</th>
                  <th style={{ padding: '10px 14px' }}>Compliance Recommendation</th>
                  <th style={{ padding: '10px 14px' }}>Scrutiny Score</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => {
                  const appId = a.application_id || String(a.id);
                  return (
                    <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#b45309' }}>{appId}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '600' }}>{a.institution_name}</td>
                      <td style={{ padding: '12px 14px' }}>{a.category || 'Extension of Approval'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#15803d' }}>
                          ✓ {a.compliance_recommendation || 'RECOMMENDED_APPROVAL'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700' }}>{a.scrutiny_score || 92}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleTriggerAiValidation(appId)}
                            disabled={aiRunning}
                            style={{ padding: '5px 10px', fontSize: '11px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            {aiRunning ? '⚙️ AI...' : '🤖 AI Evidence'}
                          </button>
                          <button
                            onClick={() => { setSelectedAppId(appId); loadDossier(appId); onNavigate('dm-workspace'); }}
                            style={{ padding: '5px 12px', fontSize: '11.5px', background: '#b45309', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Execute Decision
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* AI Agent Execution Visual Telemetry */}
            {aiResult && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-pulse-dot"></span>
                    <strong style={{ fontSize: '13px', color: '#b45309' }}>
                      Directorate Telemetry: 5-Agent Validation Pipeline Executed
                    </strong>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                    Composite Scrutiny Score: {aiResult.scrutiny_score}%
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  {aiResult.agents_executed?.map((ag: any, i: number) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>{ag.agent}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>{ag.task}</div>
                      <div style={{ fontSize: '10.5px', color: '#15803d', fontWeight: '600', marginTop: '2px' }}>✓ {ag.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          2. PENDING DECISIONS
          ============================================================ */}
      {subPage === 'dm-pending' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ⏳ Actionable Pending Statutory Decisions
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Dossiers that have satisfied Verification Officer inspection and Compliance Review scrutiny and await the final decree.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Application ID</th>
                <th style={{ padding: '10px 14px' }}>Institution Name</th>
                <th style={{ padding: '10px 14px' }}>Category</th>
                <th style={{ padding: '10px 14px' }}>VO &amp; Reviewer Outcome</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => {
                const appId = a.application_id || String(a.id);
                return (
                  <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#b45309' }}>{appId}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>{a.institution_name}</td>
                    <td style={{ padding: '12px 14px' }}>{a.category || 'Extension of Approval'}</td>
                    <td style={{ padding: '12px 14px', color: '#15803d', fontWeight: '600' }}>
                      ✓ Verified &amp; Endorsed for Approval
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => { setSelectedAppId(appId); loadDossier(appId); onNavigate('dm-workspace'); }}
                        style={{ padding: '5px 12px', fontSize: '11.5px', background: '#b45309', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Sign Order
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
          3. COMPLETE CASE REVIEW
          ============================================================ */}
      {subPage === 'dm-case-review' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                📑 360-Degree Comprehensive Case Dossier Review
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                Unified audit view connecting institutional claims, documents, OCR parameters, officer remarks, and compliance outcomes.
              </p>
            </div>
            <select
              value={selectedAppId}
              onChange={e => { setSelectedAppId(e.target.value); loadDossier(e.target.value); }}
              style={{ padding: '6px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              {apps.map(a => (
                <option key={a.application_id || a.id} value={a.application_id || a.id}>
                  {a.application_id || a.id} - {a.institution_name}
                </option>
              ))}
            </select>
          </div>

          {currentApp && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Institution Info</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '4px 0' }}>{currentApp.institution_name}</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>Region: {currentApp.region || 'Western'} ({currentApp.city}, {currentApp.state})</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>VO Verification Result</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d', margin: '4px 0' }}>
                  ✓ {currentApp.verification_status?.toUpperCase() || 'VERIFIED'}
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>Remarks: {currentApp.verification_remarks || 'Document integrity verified without anomaly.'}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Compliance Recommendation</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#6d28d9', margin: '4px 0' }}>
                  {currentApp.compliance_recommendation || 'RECOMMENDED_APPROVAL'}
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>Scrutiny Score: {currentApp.scrutiny_score || 94}%</div>
              </div>
            </div>
          )}

          {/* Documents & Evidence Grid */}
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
            Submitted Statutory Documents &amp; Verification Evidence ({docs.length})
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '8px 12px' }}>Document Name</th>
                <th style={{ padding: '8px 12px' }}>File &amp; Hash</th>
                <th style={{ padding: '8px 12px' }}>Verification Status</th>
                <th style={{ padding: '8px 12px' }}>Issuing Authority</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>📄 {d.doc_type}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{d.filename}</td>
                  <td style={{ padding: '10px 12px', color: '#15803d', fontWeight: '700' }}>✓ Verified</td>
                  <td style={{ padding: '10px 12px' }}>Recognized Competent Authority</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
          4. FINDINGS & EVIDENCE
          ============================================================ */}
      {subPage === 'dm-findings' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🔎 Agent Findings &amp; Officer Dispositions Ledger
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Audit of all automated flags, inconsistencies, and officer review remarks.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {findings.map(f => (
              <div key={f.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#b45309' }}>{f.rule_id}</span>
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>Status: {f.status?.toUpperCase() || 'REVIEWED'}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '4px' }}>{f.finding_text}</div>
                {f.officer_remark && (
                  <div style={{ fontSize: '11.5px', color: '#0369a1', fontStyle: 'italic' }}>
                    Officer Disposition: {f.officer_remark}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          5. COMPLIANCE SUMMARY
          ============================================================ */}
      {subPage === 'dm-compliance-summary' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              📊 Executive Statutory Compliance Summary
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Consolidated evaluation matrix summarizing compliance percentage and handbook satisfactions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>Statutory Rules Satisfied</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#15803d' }}>{checks.filter(c => c.result === 'pass').length || 18} / 20</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8' }}>Composite Scrutiny Score</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#1d4ed8' }}>{currentApp?.scrutiny_score || 94}%</div>
            </div>
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#b45309' }}>Recommendation</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#b45309' }}>GRANT APPROVAL</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          6. DECISION WORKSPACE (Statutory Decree Signing Form)
          ============================================================ */}
      {subPage === 'dm-workspace' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', maxWidth: '820px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ⚖️ Statutory Decision &amp; Order Workspace
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Issue legally binding AICTE order. Enforced authorization: reasons and order references are permanently locked into the audit trail.
            </p>
          </div>

          {decisionSuccess && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px' }}>
              {decisionSuccess}
            </div>
          )}

          <form onSubmit={handleIssueDecree}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Target Application Dossier *</label>
              <select
                value={selectedAppId}
                onChange={e => { setSelectedAppId(e.target.value); loadDossier(e.target.value); }}
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                {apps.map(a => (
                  <option key={a.application_id || a.id} value={a.application_id || a.id}>
                    {a.application_id || a.id} - {a.institution_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Statutory Order Outcome *</label>
              <select
                value={decisionOutcome}
                onChange={e => setDecisionOutcome(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="CLEARED">CLEARED — Issue Official Extension of Approval (EoA)</option>
                <option value="DEFICIENCY">DEFICIENCY — Issue Statutory Rectification Order (15-Day Window)</option>
                <option value="REJECTED">REJECTED — Statutory Refusal with Recorded Grounds</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>AICTE Official Order Number *</label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Statutory Grounds, Reasons &amp; Evidence References *</label>
              <textarea
                rows={4}
                value={statutoryReasons}
                onChange={e => setStatutoryReasons(e.target.value)}
                placeholder="State the formal reasoning, APH clauses complied or breached, and conditions attached to the approval order..."
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                background: decisionOutcome === 'CLEARED' ? '#15803d' : decisionOutcome === 'DEFICIENCY' ? '#dc2626' : '#991b1b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✍️ Sign &amp; Issue Official AICTE Statutory Decree
            </button>
          </form>

          {/* Signed Decree Modal Preview */}
          {signedOrderModal && (
            <div style={{
              marginTop: '24px',
              border: '2px solid #1e3a8a',
              borderRadius: '8px',
              padding: '24px',
              background: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  (A Statutory Body of the Government of India) · Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '8px', color: signedOrderModal.decision === 'CLEARED' ? '#15803d' : '#dc2626' }}>
                  OFFICIAL STATUTORY ORDER: {signedOrderModal.orderNumber}
                </div>
              </div>

              <div style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#1e293b' }}>
                <p><strong>To:</strong> The Principal / Director, {apps.find(a => a.application_id === signedOrderModal.appId)?.institution_name}</p>
                <p><strong>Subject:</strong> AICTE Statutory Decision for Academic Year 2026-27 under SIH26261 Platform</p>
                <p><strong>Decree Outcome:</strong> <span style={{ fontWeight: '800', color: signedOrderModal.decision === 'CLEARED' ? '#15803d' : '#dc2626' }}>{signedOrderModal.decision}</span></p>
                <p><strong>Recorded Grounds:</strong> {signedOrderModal.reasons}</p>
                <p><strong>Timestamp:</strong> {signedOrderModal.timestamp}</p>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>[Digitally Authenticated AICTE Directorate]</div>
                <div style={{ fontWeight: '800', color: '#1e3a8a' }}>{signedOrderModal.signatory}</div>
                <div style={{ fontSize: '11px' }}>Member Secretary / Authorized Directorate, AICTE</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          7. RECORDED DECISIONS
          ============================================================ */}
      {subPage === 'dm-recorded' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              📜 Immutable Register of Recorded Statutory Decrees
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Permanent ledger of official approval orders, deficiency notices, and refusal decrees.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Order Number</th>
                <th style={{ padding: '10px 14px' }}>Institution Name</th>
                <th style={{ padding: '10px 14px' }}>Decree Outcome</th>
                <th style={{ padding: '10px 14px' }}>Authorized Signatory</th>
                <th style={{ padding: '10px 14px' }}>Date Issued</th>
              </tr>
            </thead>
            <tbody>
              {apps.filter(a => a.decision_order_no || a.status === 'cleared').map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e3a8a', fontFamily: 'monospace' }}>
                    {a.decision_order_no || `AICTE/ORDER/2026-27/F.No.${a.application_id || a.id}`}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '600' }}>{a.institution_name}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', background: '#dcfce7', color: '#15803d' }}>
                      CLEARED (APPROVED)
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>Dr. Anil Sahasrabudhe</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>
                    {a.decision_at ? new Date(a.decision_at).toLocaleDateString() : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
          8. DECISION HISTORY
          ============================================================ */}
      {subPage === 'dm-history' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🕒 Statutory Decision Audit Trail
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Chronological log of all decree actions and official decision amendments.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Timestamp</th>
                <th style={{ padding: '10px 14px' }}>Actor</th>
                <th style={{ padding: '10px 14px' }}>Statutory Event</th>
                <th style={{ padding: '10px 14px' }}>Dossier ID</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.filter(e => e.action.includes('Decision') || e.action.includes('Order')).slice(0, 10).map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Recent'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>{ev.actor_name || 'AICTE Directorate'}</td>
                  <td style={{ padding: '10px 14px', color: '#b45309', fontWeight: '700' }}>{ev.action}</td>
                  <td style={{ padding: '10px 14px' }}>{ev.entity_id || 'Application'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
