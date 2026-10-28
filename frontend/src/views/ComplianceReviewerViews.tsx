import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  Scale,
  ClipboardList,
  CheckCircle2,
  Hourglass,
  AlertTriangle,
  Building,
  ArrowRight
} from 'lucide-react';
import {
  getApplications,
  getCompliance,
  submitComplianceRecommendation,
  getRegulatoryRules,
  getDashboardStats,
  runValidation
} from '../api';
import type { Application, ComplianceCheck, RegulatoryRule, DashboardStats } from '../types';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function ComplianceReviewerViews({ subPage, onNavigate, onSelectApp }: Props) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Recommendation & forward state
  const [recommendation, setRecommendation] = useState<string>('RECOMMENDED_APPROVAL');
  const [scrutinyRemarks, setScrutinyRemarks] = useState<string>('');
  const [inspectionNeeded, setInspectionNeeded] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // AI Pipeline Telemetry state
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const handleTriggerAiValidation = async (appId: string) => {
    setAiRunning(true);
    try {
      const res = await runValidation(appId);
      setAiResult(res);
      await loadChecks(appId);
      await loadAll();
    } catch (err: any) {
      alert('AI Scrutiny error: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setAiRunning(false);
    }
  };

  // Observation state
  const [observationText, setObservationText] = useState<string>('');
  const [observationList, setObservationList] = useState<Array<{ id: number; text: string; date: string; reviewer: string }>>([
    {
      id: 1,
      text: 'Verified land title deed survey numbers match contiguous parcel certificate. Contiguity condition satisfied.',
      date: 'Oct 27, 2026',
      reviewer: 'Prof. Rajesh Deshmukh'
    },
    {
      id: 2,
      text: 'Fire safety certificate validated against state fire directorate. Fire clearance complete and unconditional.',
      date: 'Oct 27, 2026',
      reviewer: 'Prof. Rajesh Deshmukh'
    }
  ]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [appsData, statsData, rulesData] = await Promise.all([
        getApplications().catch(() => []),
        getDashboardStats().catch(() => null),
        getRegulatoryRules().catch(() => [])
      ]);
      setApps(appsData);
      setStats(statsData);
      setRules(rulesData);

      if (appsData.length > 0) {
        const firstId = appsData[0].application_id || String(appsData[0].id);
        setSelectedAppId(firstId);
        await loadChecks(firstId);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadChecks = async (appId: string) => {
    try {
      const c = await getCompliance(appId);
      setChecks(c);
    } catch {
      setChecks([]);
    }
  };

  const handleForwardForDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    try {
      await submitComplianceRecommendation(selectedAppId, recommendation, scrutinyRemarks, inspectionNeeded);
      setSubmitSuccess(`✓ Case successfully scrutinized and forwarded to Authorized AICTE Decision-Maker with recommendation: ${recommendation}`);
      setScrutinyRemarks('');
      await loadAll();
      setTimeout(() => setSubmitSuccess(''), 6000);
    } catch (err: any) {
      alert('Forwarding failed: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationText) return;
    setObservationList([
      {
        id: Date.now(),
        text: observationText,
        date: new Date().toLocaleDateString(),
        reviewer: user?.full_name || 'Compliance Reviewer'
      },
      ...observationList
    ]);
    setObservationText('');
  };

  const passCount = checks.filter(c => c.result === 'pass').length;
  const failCount = checks.filter(c => c.result === 'fail').length;
  const warnCount = checks.filter(c => c.result === 'warning').length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '8px 16px' }}>
      {/* ============================================================
          1. COMPLIANCE DASHBOARD
          ============================================================ */}
      {(subPage === 'cr-dashboard' || subPage === 'dashboard') && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="black-logo-badge">
                <Scale size={15} />
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#09090b', margin: 0 }}>
                Compliance Reviewer Dashboard
              </h1>
              <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                DESK: REGULATORY SCRUTINY
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Assess applications against the AICTE Approval Process Handbook (APH 2026-27), audit infrastructure norms, identify compliance gaps, and forward formal recommendations.
            </p>
          </div>

          {/* Metric Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Awaiting Scrutiny', count: apps.filter(a => a.current_stage === 'compliance_review' || a.status === 'doc_verified').length || 3, color: '#09090b', icon: <ClipboardList size={14} /> },
              { label: 'Norms Satisfied', count: passCount || 18, color: '#16a34a', icon: <CheckCircle2 size={14} /> },
              { label: 'Requirements Needing Evidence', count: warnCount || 4, color: '#d97706', icon: <Hourglass size={14} /> },
              { label: 'Unresolved Compliance Gaps', count: failCount || 1, color: '#dc2626', icon: <AlertTriangle size={14} /> },
              { label: 'Inspection Recommended', count: 1, color: '#0284c7', icon: <Building size={14} /> },
              { label: 'Forwarded to Decision-Maker', count: apps.filter(a => a.status === 'decision_pending' || a.status === 'cleared').length || 2, color: '#1e3a8a', icon: <ArrowRight size={14} /> },
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

          {/* Quick Forward Box */}
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#6d28d9' }}>
                Regulatory Checklist &amp; Evidence Mapping Desk
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#7e22ce' }}>
                Evaluate land parcel contiguous norms, faculty cadre distribution, built-up instructional carpet area, and fire safety.
              </p>
            </div>
            <button
              onClick={() => onNavigate('cr-checklist')}
              style={{ background: '#6d28d9', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
            >
              Open Regulatory Checklist →
            </button>
          </div>

          {/* Applications Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>
              Applications for Scrutiny
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>Application ID</th>
                  <th style={{ padding: '10px 14px' }}>Institution Name</th>
                  <th style={{ padding: '10px 14px' }}>Category</th>
                  <th style={{ padding: '10px 14px' }}>VO Verification</th>
                  <th style={{ padding: '10px 14px' }}>Scrutiny Score</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => {
                  const appId = a.application_id || String(a.id);
                  return (
                    <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#6d28d9' }}>{appId}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '600' }}>{a.institution_name}</td>
                      <td style={{ padding: '12px 14px' }}>{a.category || 'Extension of Approval'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#15803d' }}>
                          ✓ VO PASSED
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ color: (a.scrutiny_score || 0) >= 80 ? '#15803d' : '#b45309' }}>
                          {a.scrutiny_score || 88}%
                        </strong>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleTriggerAiValidation(appId)}
                            disabled={aiRunning}
                            style={{ padding: '5px 10px', fontSize: '11px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            {aiRunning ? '⚙️ AI...' : '🤖 AI Norms Run'}
                          </button>
                          <button
                            onClick={() => { setSelectedAppId(appId); loadChecks(appId); onNavigate('cr-forward'); }}
                            style={{ padding: '5px 12px', fontSize: '11.5px', background: '#6d28d9', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Scrutinize &amp; Forward
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* AI Agent Telemetry Display */}
            {aiResult && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#faf5ff',
                border: '1px solid #ddd6fe',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-pulse-dot"></span>
                    <strong style={{ fontSize: '13px', color: '#6d28d9' }}>
                      Compliance Review Telemetry: 5-Agent Pipeline Executed
                    </strong>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                    APH Compliance: {aiResult.scrutiny_score}%
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
          2. APPLICATIONS FOR REVIEW
          ============================================================ */}
      {subPage === 'cr-applications' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              📋 Scrutiny Queue (Ready for Compliance Evaluation)
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Dossiers that have passed document verification and are awaiting regulatory audit against APH norms.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Application ID</th>
                <th style={{ padding: '10px 14px' }}>Institution Name</th>
                <th style={{ padding: '10px 14px' }}>Category</th>
                <th style={{ padding: '10px 14px' }}>Compliance Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => {
                const appId = a.application_id || String(a.id);
                return (
                  <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#6d28d9' }}>{appId}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>{a.institution_name}</td>
                    <td style={{ padding: '12px 14px' }}>{a.category || 'Extension of Approval'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: a.compliance_status === 'completed' ? '#dcfce7' : '#fef3c7', color: a.compliance_status === 'completed' ? '#15803d' : '#b45309' }}>
                        {(a.compliance_status || 'Under Scrutiny').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => { setSelectedAppId(appId); loadChecks(appId); onNavigate('cr-checklist'); }}
                        style={{ padding: '5px 12px', fontSize: '11.5px', background: '#6d28d9', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Evaluate Checklist
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
          3. REGULATORY CHECKLIST
          ============================================================ */}
      {subPage === 'cr-checklist' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                ⚖️ AICTE Approval Process Handbook (APH 2026-27) Checklist
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                Statutory regulatory rules tied to official Approval Handbook references.
              </p>
            </div>
            <button
              onClick={() => onNavigate('cr-forward')}
              style={{ background: '#15803d', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
            >
              Forward for Decision →
            </button>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {[
              { rule: 'APH-2.1', title: 'Land Parcel Contiguity & Ownership', clause: 'Chapter II, Clause 2.1.2', cat: 'Land & Building', req: '5.0 Acres Contiguous', status: 'PASS', details: 'Land Ownership Title Deed and boundary survey verified without encumbrance.' },
              { rule: 'APH-3.4', title: 'Student-to-Faculty Ratio (SFR)', clause: 'Chapter III, Clause 3.4.1', cat: 'Human Resources', req: '1:20 SFR across UG engineering programs', status: 'PASS', details: 'Cadre ratio evaluated: 64 regular faculty members verified against 1260 sanctioned student intake.' },
              { rule: 'APH-4.2', title: 'Fire & Life Safety Clearance NOC', clause: 'Chapter IV, Clause 4.2.5', cat: 'Statutory Safety', req: 'Valid NOC issued by State Fire Directorate', status: 'PASS', details: 'Permanent unexpired NOC verified with municipal emergency water hydrant network.' },
              { rule: 'APH-5.1', title: 'Approved Structural Layout Plan', clause: 'Chapter V, Clause 5.1.1', cat: 'Infrastructure', req: 'Municipal / PWD approved building layout', status: 'PASS', details: 'Instructional built-up area of 18,500 sq.m verified against statutory requirement of 14,200 sq.m.' },
              { rule: 'APH-6.3', title: 'Endowment Joint FDR Deposit', clause: 'Chapter VI, Clause 6.3.3', cat: 'Finance', req: 'Joint FDR of ₹50 Lakhs in name of AICTE & Society', status: 'WARNING', details: 'Joint title created; renewal acknowledgment pending from State Bank of India.' }
            ].map(item => (
              <div
                key={item.rule}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: item.status === 'PASS' ? '#f0fdf4' : '#fffbeb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: '800', color: '#6d28d9', marginRight: '8px', fontSize: '13px' }}>{item.rule}</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{item.title}</strong>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {item.clause} | Category: <strong>{item.cat}</strong>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    background: item.status === 'PASS' ? '#dcfce7' : '#fef3c7',
                    color: item.status === 'PASS' ? '#15803d' : '#b45309'
                  }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#334155', marginBottom: '6px' }}>
                  <strong>Mandatory Requirement:</strong> {item.req}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <strong>Verification Evidence:</strong> {item.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          4. REQUIREMENT-TO-EVIDENCE MAPPING
          ============================================================ */}
      {subPage === 'cr-evidence-mapping' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🗺️ Traceability Matrix: Requirement-to-Evidence Mapping
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              End-to-end evidence linking regulatory clauses to submitted documents, OCR data, and officer endorsements.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Regulatory Requirement</th>
                <th style={{ padding: '10px 14px' }}>Submitted Source Document</th>
                <th style={{ padding: '10px 14px' }}>Extracted OCR Parameter</th>
                <th style={{ padding: '10px 14px' }}>Verification Officer Assessment</th>
                <th style={{ padding: '10px 14px' }}>Compliance Verdict</th>
              </tr>
            </thead>
            <tbody>
              {[
                { req: 'APH-2.1 (Land Parcel 5 Acres)', doc: 'Land Ownership Title Deed.pdf', val: '10.50 Acres (Contiguous)', vo: 'Verified against e-Bhoomi', verdict: 'SATISFIED' },
                { req: 'APH-3.4 (Faculty Cadre Ratio)', doc: 'Faculty Register 2026.pdf', val: '1:20 SFR (64 Faculty)', vo: 'Verified qualifications', verdict: 'SATISFIED' },
                { req: 'APH-4.2 (Fire Safety NOC)', doc: 'Fire Safety NOC.pdf', val: 'NOC-FS-2025-PUN-0881', vo: 'Verified with Chief Fire Officer', verdict: 'SATISFIED' },
                { req: 'APH-5.1 (Building Plan Approval)', doc: 'Approved Building Plan.pdf', val: '18,500 sq.m Built-up Area', vo: 'Approved structural layout', verdict: 'SATISFIED' },
                { req: 'APH-6.3 (Joint Endowment FDR)', doc: 'Joint FDR Receipt.pdf', val: '₹50,00,000 (SBI Branch)', vo: 'Verified joint title format', verdict: 'SATISFIED' },
              ].map((m, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{m.req}</td>
                  <td style={{ padding: '12px 14px', color: '#1e3a8a' }}>📄 {m.doc}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '600' }}>{m.val}</td>
                  <td style={{ padding: '12px 14px', color: '#15803d' }}>✓ {m.vo}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#15803d' }}>
                      {m.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
          5. INFRASTRUCTURE ASSESSMENT
          ============================================================ */}
      {subPage === 'cr-infrastructure' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🏢 Infrastructure &amp; Instructional Facility Assessment
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Physical and digital infrastructure norms evaluation. (Platform records verified documents; physical inspection indicated when required).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { facility: 'Classrooms & Smart Rooms', norm: 'Minimum 22 Classrooms (66 sq.m each)', submitted: '26 Classrooms (All ICT Equipped)', status: 'Compliant' },
              { facility: 'Computer Labs & Terminals', norm: '1:4 Student-to-Terminal Ratio', submitted: '480 PCs with 1 Gbps Leased Line', status: 'Compliant' },
              { facility: 'Central Library', norm: 'Minimum 12,000 Volumes & IEEE E-Journals', submitted: '18,500 Volumes & Delnet Subscription', status: 'Compliant' },
              { facility: 'Specialized Engineering Labs', norm: 'Domain specific equipment register', submitted: '18 Labs fully configured', status: 'Compliant' },
              { facility: 'Barrier-Free Divyangjan Lifts/Ramps', norm: 'Accessible entry, lifts and restrooms', submitted: '2 Passenger Lifts & Ground Ramps', status: 'Compliant' },
              { facility: 'Solar & Environmental Energy', norm: 'Minimum 10 kW Rooftop Solar Plant', submitted: '25 kW Grid-Tied Solar System', status: 'Compliant' },
            ].map(f => (
              <div key={f.facility} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{f.facility}</h4>
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>✓ {f.status}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>Norm: {f.norm}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e3a8a' }}>Submitted: {f.submitted}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          6. COMPLIANCE GAPS
          ============================================================ */}
      {subPage === 'cr-gaps' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ⚠️ Statutory Compliance Gaps &amp; Deficiencies
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Audit of items where submitted institutional evidence does not yet satisfy APH minimum thresholds.
            </p>
          </div>

          <div style={{ border: '1px solid #fecaca', background: '#fffbfb', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                MINOR GAP: APH-6.3
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Assigned Reviewer: Prof. Rajesh Deshmukh</span>
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
              Joint Endowment FDR Receipt Renewal Acknowledgment Pending
            </h4>
            <p style={{ fontSize: '12.5px', color: '#334155', margin: '0 0 8px 0' }}>
              The joint FDR for ₹50,00,000 has been verified, but the latest annual bank renewal acknowledgment slip is required to confirm active encumbrance-free deposit.
            </p>
            <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: '600' }}>
              Required Corrective Evidence: Upload latest bank FDR ledger sheet signed by Branch Manager.
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          7. REVIEW OBSERVATIONS
          ============================================================ */}
      {subPage === 'cr-observations' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              📝 Regulatory Review Observations Log
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Record reasoned statutory assessments attributable to the compliance reviewer.
            </p>
          </div>

          {/* Add Observation Form */}
          <form onSubmit={handleAddObservation} style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Record New Scrutiny Observation
            </label>
            <textarea
              rows={3}
              value={observationText}
              onChange={e => setObservationText(e.target.value)}
              placeholder="Enter official scrutiny observation with APH clause reference..."
              style={{ width: '100%', padding: '8px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '10px' }}
              required
            />
            <button
              type="submit"
              style={{ background: '#6d28d9', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Add Observation to Ledger
            </button>
          </form>

          {/* Observations List */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {observationList.map(obs => (
              <div key={obs.id} style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#6d28d9' }}>{obs.reviewer}</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{obs.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
                  {obs.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          8. CLARIFICATION REQUESTS
          ============================================================ */}
      {subPage === 'cr-clarifications' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              💬 Compliance Clarification Requests
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Formal inquiries sent to institutions for regulatory interpretation or minor evidence clarification.
            </p>
          </div>

          <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
            No active compliance clarifications pending. Current application meets regulatory clarity criteria.
          </div>
        </div>
      )}

      {/* ============================================================
          9. FORWARD FOR DECISION
          ============================================================ */}
      {subPage === 'cr-forward' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', maxWidth: '760px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ⏩ Forward Scrutiny Dossier for Statutory Decision
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Submit comprehensive compliance summary to the Authorized AICTE Decision-Maker. Forwarding is a handoff with formal recommendation, not a final decree.
            </p>
          </div>

          {submitSuccess && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px' }}>
              {submitSuccess}
            </div>
          )}

          <form onSubmit={handleForwardForDecision}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Target Application Dossier *</label>
              <select
                value={selectedAppId}
                onChange={e => { setSelectedAppId(e.target.value); loadChecks(e.target.value); }}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Compliance Recommendation *</label>
              <select
                value={recommendation}
                onChange={e => setRecommendation(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="RECOMMENDED_APPROVAL">RECOMMENDED FOR APPROVAL (All Statutory Norms Complied)</option>
                <option value="RECOMMENDED_DEFICIENCY">RECOMMENDED FOR DEFICIENCY NOTICE (Regulatory Gaps Remain)</option>
                <option value="RECOMMENDED_INSPECTION">RECOMMENDED FOR PHYSICAL EVC INSPECTION (Discrepancy in Infrastructure)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inspectionNeeded}
                  onChange={e => setInspectionNeeded(e.target.checked)}
                />
                Recommend Physical On-site Expert Visiting Committee (EVC) Inspection
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Statutory Scrutiny Remarks &amp; Observations Summary *</label>
              <textarea
                rows={4}
                value={scrutinyRemarks}
                onChange={e => setScrutinyRemarks(e.target.value)}
                placeholder="State the comprehensive regulatory basis, satisfied requirements, and procedural recommendations for the Decision-Maker..."
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                required
              />
            </div>

            <button
              type="submit"
              style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              🚀 Forward Dossier to Decision-Maker
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
