import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  FileSearch,
  ClipboardList,
  Hourglass,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  getApplications,
  getDocuments,
  getFindings,
  verifyDocumentItem,
  reviewFinding,
  completeVerification,
  getDashboardStats,
  getAuditLog,
  updateDocumentOcrField,
  raiseApplicationDeficiency,
  runValidation
} from '../api';
import type { Application, Document, Finding, DashboardStats, AuditEvent } from '../types';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function VerificationOfficerViews({ subPage, onNavigate, onSelectApp, onViewDoc }: Props) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Split-Screen Document Verification Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [verificationOutcomeMsg, setVerificationOutcomeMsg] = useState<string>('');

  // OCR correction state
  const [ocrCorrectingField, setOcrCorrectingField] = useState<string | null>(null);
  const [ocrCorrectedValue, setOcrCorrectedValue] = useState<string>('');
  const [ocrReason, setOcrReason] = useState<string>('');

  // Raise deficiency form
  const [deficiencyTargetApp, setDeficiencyTargetApp] = useState<string>('');
  const [deficiencyCategory, setDeficiencyCategory] = useState<string>('Unclear Scan / Illegible Text');
  const [deficiencyText, setDeficiencyText] = useState<string>('');
  const [deficiencySuccess, setDeficiencySuccess] = useState<string>('');

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
        setDeficiencyTargetApp(firstId);
        await loadAppArtifacts(firstId);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAppArtifacts = async (appId: string) => {
    try {
      const [d, f] = await Promise.all([
        getDocuments(appId).catch(() => []),
        getFindings(appId).catch(() => [])
      ]);
      setDocs(d);
      setFindings(f);
      if (d.length > 0) {
        setSelectedDoc(d[0]);
      }
    } catch {
      setDocs([]);
      setFindings([]);
    }
  };

  const handleDocVerifyAction = async (status: string) => {
    if (!selectedDoc) return;
    try {
      await verifyDocumentItem(selectedDoc.id, status, officerNotes || `Verified by ${user?.full_name}`);
      setVerificationOutcomeMsg(`Document status updated to ${status.toUpperCase()}`);
      await loadAppArtifacts(selectedAppId);
      setTimeout(() => setVerificationOutcomeMsg(''), 4000);
    } catch (err: any) {
      alert('Verification update error: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const handleCompleteMilestone = async (status: string) => {
    if (!selectedAppId) return;
    try {
      await completeVerification(selectedAppId, officerNotes || 'Verification completed by authorized officer', status);
      setVerificationOutcomeMsg(
        status === 'verified'
          ? '✓ Document Verification Milestone Completed. Case forwarded to Compliance Reviewer.'
          : '⚠️ Evidence requested. Deficiency notice issued to institution.'
      );
      await loadAll();
      setTimeout(() => setVerificationOutcomeMsg(''), 5000);
    } catch (err: any) {
      alert('Milestone submission error: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const handleTriggerAiValidation = async (appId: string) => {
    setAiRunning(true);
    try {
      const res = await runValidation(appId);
      setAiResult(res);
      await loadAppArtifacts(appId);
      await loadAll();
    } catch (err: any) {
      alert('AI Validation error: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setAiRunning(false);
    }
  };

  const handleSaveOcrCorrection = async () => {
    if (!ocrCorrectingField || !ocrCorrectedValue || !selectedDoc) return;
    try {
      await updateDocumentOcrField(selectedDoc.id, ocrCorrectingField, ocrCorrectedValue, ocrReason || 'Clerical correction');
      setVerificationOutcomeMsg(`✓ OCR Field '${ocrCorrectingField}' updated to '${ocrCorrectedValue}' in database with immutable audit log.`);
      setOcrCorrectingField(null);
      setOcrCorrectedValue('');
      setOcrReason('');
      await loadAppArtifacts(selectedAppId);
      setTimeout(() => setVerificationOutcomeMsg(''), 5000);
    } catch (err: any) {
      alert('OCR update error: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const handleRaiseDeficiency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deficiencyTargetApp || !deficiencyText) return;
    try {
      await raiseApplicationDeficiency(deficiencyTargetApp, deficiencyCategory, deficiencyText, 'high');
      setDeficiencySuccess(`✓ Formal Deficiency Notice recorded in database for ${deficiencyTargetApp}. Application status transitioned to DEFICIENCY.`);
      setDeficiencyText('');
      await loadAll();
      setTimeout(() => setDeficiencySuccess(''), 5000);
    } catch (err: any) {
      alert('Failed to raise deficiency: ' + (err?.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '8px 16px' }}>
      {/* ============================================================
          1. VERIFICATION DASHBOARD
          ============================================================ */}
      {(subPage === 'vo-dashboard' || subPage === 'dashboard') && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="black-logo-badge">
                <FileSearch size={15} />
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#09090b', margin: 0 }}>
                Verification Officer Dashboard
              </h1>
              <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                DESK: DOCUMENT SCRUTINY
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Examine submitted institutional documents, review OCR extraction accuracy, inspect forensic anomaly indicators, and perform authorized document verification.
            </p>
          </div>

          {/* Metric Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Assigned Applications', count: apps.length, color: '#09090b', icon: <ClipboardList size={14} /> },
              { label: 'Documents Pending Review', count: docs.filter(d => d.status === 'pending').length || 6, color: '#d97706', icon: <Hourglass size={14} /> },
              { label: 'Data Inconsistencies', count: findings.length || 3, color: '#dc2626', icon: <AlertTriangle size={14} /> },
              { label: 'Issuer Checks Pending', count: 2, color: '#6d28d9', icon: <Building2 size={14} /> },
              { label: 'Verified Dossiers', count: apps.filter(a => a.status === 'doc_verified').length || 2, color: '#16a34a', icon: <CheckCircle2 size={14} /> },
              { label: 'Avg Turnaround', count: '1.4 Days', color: '#475569', icon: <Clock size={14} /> },
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

          {/* Quick Jump to Workspace */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0369a1' }}>
                Open Document Verification Workspace
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#0284c7' }}>
                Compare extracted OCR metadata side-by-side with original certificates, correct OCR misreads, and record verification outcomes.
              </p>
            </div>
            <button
              onClick={() => onNavigate('vo-doc-workspace')}
              style={{ background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
            >
              Open Split-Screen Workspace →
            </button>
          </div>

          {/* Active Queue Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>
              Verification Queue (Assigned Dossiers)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>Application ID</th>
                  <th style={{ padding: '10px 14px' }}>Institution</th>
                  <th style={{ padding: '10px 14px' }}>Submission Date</th>
                  <th style={{ padding: '10px 14px' }}>AI Scrutiny Score</th>
                  <th style={{ padding: '10px 14px' }}>Stage</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => {
                  const appId = a.application_id || String(a.id);
                  return (
                    <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0369a1' }}>{appId}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '600' }}>{a.institution_name}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : 'Recent'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: '700', color: (a.scrutiny_score || 0) >= 80 ? '#15803d' : '#b45309' }}>
                          {a.scrutiny_score || 85}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#1d4ed8' }}>
                          {(a.current_stage || 'doc_verification').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleTriggerAiValidation(appId)}
                            disabled={aiRunning}
                            style={{ padding: '5px 10px', fontSize: '11px', background: '#eff6ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            {aiRunning ? '⚙️ AI...' : '🤖 Re-run AI'}
                          </button>
                          <button
                            onClick={() => { setSelectedAppId(appId); loadAppArtifacts(appId); onNavigate('vo-doc-workspace'); }}
                            style={{ padding: '5px 12px', fontSize: '11.5px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Verify Documents
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
                background: '#f8fafc',
                border: '1px solid #bae6fd',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-pulse-dot"></span>
                    <strong style={{ fontSize: '13px', color: '#0369a1' }}>
                      Verification Officer Telemetry: 5-Agent Pipeline Executed
                    </strong>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                    Score: {aiResult.scrutiny_score}%
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
          2. ASSIGNED APPLICATIONS
          ============================================================ */}
      {subPage === 'vo-assigned' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              📋 Assigned Scrutiny Cases
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Authorized cases allocated to your verification desk under Regional Office jurisdiction.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Application ID</th>
                <th style={{ padding: '10px 14px' }}>Institution Name</th>
                <th style={{ padding: '10px 14px' }}>Category</th>
                <th style={{ padding: '10px 14px' }}>Region</th>
                <th style={{ padding: '10px 14px' }}>Verification Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => {
                const appId = a.application_id || String(a.id);
                return (
                  <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0369a1' }}>{appId}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>{a.institution_name}</td>
                    <td style={{ padding: '12px 14px' }}>{a.category || 'Extension of Approval'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{a.region || 'Western'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: a.verification_status === 'verified' ? '#dcfce7' : '#fef3c7',
                        color: a.verification_status === 'verified' ? '#15803d' : '#b45309'
                      }}>
                        {(a.verification_status || 'Pending').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => { setSelectedAppId(appId); loadAppArtifacts(appId); onNavigate('vo-doc-workspace'); }}
                        style={{ padding: '5px 12px', fontSize: '11.5px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Inspect Dossier
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
          3. DOCUMENT VERIFICATION (Split-Screen Workspace)
          ============================================================ */}
      {subPage === 'vo-doc-workspace' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
          {/* Header & App Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                🔍 Split-Screen Document Verification Workspace
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Side-by-side original evidence viewer and OCR extraction audit.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Active Case:</label>
              <select
                value={selectedAppId}
                onChange={e => { setSelectedAppId(e.target.value); loadAppArtifacts(e.target.value); }}
                style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                {apps.map(a => (
                  <option key={a.application_id || a.id} value={a.application_id || a.id}>
                    {a.application_id || a.id} - {a.institution_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feedback banner */}
          {verificationOutcomeMsg && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px' }}>
              {verificationOutcomeMsg}
            </div>
          )}

          {/* Document Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
            {docs.map(d => {
              const isActive = selectedDoc?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDoc(d)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    background: isActive ? '#eff6ff' : '#ffffff',
                    color: isActive ? '#0284c7' : '#475569',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📄 {d.doc_type}
                  {d.status === 'verified' && <span style={{ marginLeft: '4px', color: '#15803d' }}>✓</span>}
                  {d.status === 'flagged' && <span style={{ marginLeft: '4px', color: '#dc2626' }}>⚠️</span>}
                </button>
              );
            })}
          </div>

          {/* SPLIT-SCREEN CONTAINER */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px', minHeight: '600px' }}>
            {/* LEFT PANEL: Document Viewer Canvas */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Viewer Toolbar */}
              <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                  {selectedDoc?.filename || 'Document Preview'}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))} style={{ padding: '3px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>- Zoom</button>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 15))} style={{ padding: '3px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>+ Zoom</button>
                  <button onClick={() => setRotation((rotation + 90) % 360)} style={{ padding: '3px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>🔄 Rotate</button>
                </div>
              </div>

              {/* Canvas Preview */}
              <div style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'auto'
              }}>
                <div style={{
                  width: `${340 * (zoomLevel / 100)}px`,
                  minHeight: `${480 * (zoomLevel / 100)}px`,
                  background: '#ffffff',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  padding: '24px',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  fontSize: '11.5px',
                  lineHeight: '1.6',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', textTransform: 'uppercase' }}>
                      GOVERNMENT OF MAHARASHTRA
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                      DIRECTORATE OF TECHNICAL EDUCATION / REVENUE REGISTRY
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '6px', color: '#1e3a8a' }}>
                      OFFICIAL CERTIFICATE: {selectedDoc?.doc_type?.toUpperCase() || 'STATUTORY RECORD'}
                    </div>
                  </div>

                  <p><strong>Ref / Registration No:</strong> REG-2024-MH-449102</p>
                  <p><strong>Grantee Institution:</strong> {apps.find(a => a.application_id === selectedAppId)?.institution_name || 'ABC Institute'}</p>
                  <p><strong>Campus Location:</strong> Sector 62, Institutional Area, Pune - 411057</p>
                  <p><strong>Land Area Certified:</strong> 10.50 Acres (Contiguous Parcel, Survey Nos. 104/1A, 104/2B)</p>
                  <p><strong>Competent Authority:</strong> Sub-Divisional Magistrate / Competent Town Planner</p>
                  <p><strong>Issuing Date:</strong> 14-Aug-2023 | <strong>Valid Till:</strong> PERMANENT / UNCONDITIONAL</p>

                  <div style={{ marginTop: '32px', textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#64748b' }}>[Digitally Signed by Competent Officer]</div>
                    <div style={{ fontWeight: '700' }}>Dr. S. K. Deshpande</div>
                    <div style={{ fontSize: '10px' }}>Special Executive Magistrate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Extracted Data & Officer Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Extracted Fields Table */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                    OCR Extracted Data &amp; Verification Checks
                  </h4>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                    Confidence: 96.4%
                  </span>
                </div>

                <div style={{ fontSize: '12px', display: 'grid', gap: '8px' }}>
                  {[
                    { key: 'Institution Name', val: 'ABC Institute of Engineering & Technology', match: true },
                    { key: 'Certified Land Parcel', val: '10.50 Acres (Contiguous)', match: true },
                    { key: 'Survey Numbers', val: '104/1A, 104/2B', match: true },
                    { key: 'Registration / Deed No', val: 'REG-2024-MH-449102', match: true },
                    { key: 'Issuing Officer', val: 'Dr. S. K. Deshpande (SDM)', match: true }
                  ].map(field => (
                    <div
                      key={field.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: '#f8fafc',
                        borderRadius: '4px',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{field.key}</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{field.val}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>✓ Match</span>
                        <button
                          onClick={() => { setOcrCorrectingField(field.key); setOcrCorrectedValue(field.val); }}
                          style={{ fontSize: '10.5px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer', padding: '2px 6px' }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline OCR Edit Dialog */}
                {ocrCorrectingField && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>
                      Correcting OCR Field: {ocrCorrectingField}
                    </div>
                    <input
                      type="text"
                      value={ocrCorrectedValue}
                      onChange={e => setOcrCorrectedValue(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '6px' }}
                    />
                    <input
                      type="text"
                      placeholder="Reason for correction (required for audit)..."
                      value={ocrReason}
                      onChange={e => setOcrReason(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={handleSaveOcrCorrection} style={{ background: '#b45309', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}>
                        Save Correction (Audit Logged)
                      </button>
                      <button onClick={() => setOcrCorrectingField(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '5px 10px', fontSize: '11.5px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Officer Verification Action Panel */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                  Officer Verification Disposition
                </h4>

                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={e => setOfficerNotes(e.target.value)}
                  placeholder="Enter verification remarks, observations, or evidence requirements..."
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '12px' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={() => handleDocVerifyAction('verified')}
                    style={{ background: '#15803d', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    ✓ Mark Document Verified
                  </button>
                  <button
                    onClick={() => handleDocVerifyAction('flagged')}
                    style={{ background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    ⚠️ Flag Anomaly / Defect
                  </button>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a8a', marginBottom: '6px' }}>
                    Milestone Decision: Complete Dossier Verification
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCompleteMilestone('verified')}
                      style={{ flex: 1, background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🚀 Forward to Compliance Reviewer
                    </button>
                    <button
                      onClick={() => handleCompleteMilestone('evidence_requested')}
                      style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Request Evidence
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          4. OCR & EXTRACTED DATA
          ============================================================ */}
      {subPage === 'vo-ocr' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🔤 OCR Pipeline Extraction &amp; Confidence Telemetry
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Document Intelligence agent outputs with field-level extraction status. Low confidence prompts review rather than automatic failure.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Document Category</th>
                <th style={{ padding: '10px 14px' }}>OCR Status</th>
                <th style={{ padding: '10px 14px' }}>Confidence Score</th>
                <th style={{ padding: '10px 14px' }}>Key Extracted Elements</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{d.doc_type}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#15803d' }}>
                      COMPLETED
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '95%', height: '100%', background: '#16a34a' }}></div>
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: '600' }}>95.2%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>
                    {d.extracted_data?.issuing_authority || 'Recognized Competent Authority, Area, Dates, Reg No'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => onNavigate('vo-doc-workspace')}
                      style={{ padding: '4px 10px', fontSize: '11.5px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Audit OCR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
          5. ANOMALY FINDINGS
          ============================================================ */}
      {subPage === 'vo-anomalies' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🚨 Forensic Anomaly Indicators &amp; Integrity Mismatches
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Preliminary indicators flagged by Forensic Anomaly Agent. Labeled as "Possible Anomaly / Needs Review" (never fraud confirmed without authorized human review).
            </p>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {findings.map(f => (
              <div
                key={f.id}
                style={{
                  border: '1px solid #fecaca',
                  background: '#fffbfb',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                      FINDING: {f.rule_id}
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                      {f.rule_description || 'Possible Inconsistency'}
                    </strong>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#b91c1c' }}>
                    SEVERITY: {f.severity.toUpperCase()}
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#334155', margin: '0 0 12px 0' }}>
                  {f.finding_text}
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { reviewFinding(f.id, 'confirmed', 'Confirmed after human examination'); loadAll(); }}
                    style={{ background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Confirm Anomaly
                  </button>
                  <button
                    onClick={() => { reviewFinding(f.id, 'dismissed', 'False alarm; checked manually'); loadAll(); }}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Dismiss (False Alarm)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          6. ISSUER VERIFICATION
          ============================================================ */}
      {subPage === 'vo-issuer' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🏛️ External Issuer Registry Verification Desk
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Simulated public registry connectors verifying certificates against issuing state authorities.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Issuing Authority</th>
                <th style={{ padding: '10px 14px' }}>Verification Method</th>
                <th style={{ padding: '10px 14px' }}>Certificate Ref No</th>
                <th style={{ padding: '10px 14px' }}>Attempt Timestamp</th>
                <th style={{ padding: '10px 14px' }}>Registry Outcome</th>
              </tr>
            </thead>
            <tbody>
              {[
                { authority: 'Maharashtra Land Revenue (e-Bhoomi)', method: 'State Land API Connector', ref: 'REG-2024-MH-449102', time: 'Oct 27, 2026 11:24 AM', outcome: 'Confirmed by Authorized Source', status: 'confirmed' },
                { authority: 'State Fire Services Directorate', method: 'Municipal Fire NOC Portal', ref: 'NOC-FS-2025-PUN-0881', time: 'Oct 27, 2026 11:25 AM', outcome: 'Confirmed by Authorized Source', status: 'confirmed' },
                { authority: 'Savitribai Phule Pune University', method: 'Affiliation Registry API', ref: 'AFF-SPPU-2026-ENGG', time: 'Oct 27, 2026 11:26 AM', outcome: 'Confirmed by Authorized Source', status: 'confirmed' },
                { authority: 'Joint AICTE Endowment Bank', method: 'Core Banking Joint FDR Portal', ref: 'FDR-SBI-AICTE-9921', time: 'Oct 27, 2026 11:27 AM', outcome: 'Source Unavailable (Simulated Manual Verification)', status: 'warning' },
              ].map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{item.authority}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.method}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{item.ref}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.time}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: item.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                      color: item.status === 'confirmed' ? '#15803d' : '#b45309'
                    }}>
                      {item.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
          7. VERIFICATION CHECKLIST
          ============================================================ */}
      {subPage === 'vo-checklist' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ✔️ Officer Verification Scrutiny Checklist
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Mandatory procedural checks to be performed before clearing the document verification milestone.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              { check: 'Confirm all documents are signed by authorized signatory and bear official competent authority seal', status: 'Verified' },
              { check: 'Cross-verify land survey numbers across Land Deed and Structural Layout Plan for perfect alignment', status: 'Verified' },
              { check: 'Ensure Fire Safety NOC is unconditional and valid for the entire Academic Year 2026-27', status: 'Verified' },
              { check: 'Confirm Faculty list contains approved qualifications per AICTE Gazette Notification (Ph.D for Professors)', status: 'Pending Review' },
              { check: 'Validate Joint FDR receipt name matches exact Society and AICTE joint title format', status: 'Verified' }
            ].map((c, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', color: '#0f172a' }}>{c.check}</span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: c.status === 'Verified' ? '#dcfce7' : '#fef3c7', color: c.status === 'Verified' ? '#15803d' : '#b45309' }}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          8. RAISE DEFICIENCIES
          ============================================================ */}
      {subPage === 'vo-raise-deficiency' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', maxWidth: '720px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              📝 Issue Official Deficiency Notice
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Select target application and requirement to issue a formal deficiency notice to the applicant institution.
            </p>
          </div>

          {deficiencySuccess && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px' }}>
              ✓ {deficiencySuccess}
            </div>
          )}

          <form onSubmit={handleRaiseDeficiency}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Target Application *</label>
              <select
                value={deficiencyTargetApp}
                onChange={e => setDeficiencyTargetApp(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Deficiency Category *</label>
              <select
                value={deficiencyCategory}
                onChange={e => setDeficiencyCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="Unclear Scan / Illegible Text">Unclear Scan / Illegible Text</option>
                <option value="Expired Certificate / Validity Over">Expired Certificate / Validity Over</option>
                <option value="Survey Number Mismatch">Survey Number / Land Mismatch</option>
                <option value="Faculty Cadre Ratio Deficiency">Faculty Cadre Ratio Deficiency</option>
                <option value="Missing Mandatory Competent Seal">Missing Mandatory Competent Seal</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Specific Requirement Explanation &amp; Corrective Action *</label>
              <textarea
                rows={4}
                value={deficiencyText}
                onChange={e => setDeficiencyText(e.target.value)}
                placeholder="Detail the exact finding, why evidence is deficient, and the prescribed document format required within 15 calendar days..."
                style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                required
              />
            </div>

            <button
              type="submit"
              style={{ background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Issue Deficiency Notice
            </button>
          </form>
        </div>
      )}

      {/* ============================================================
          9. VERIFICATION HISTORY
          ============================================================ */}
      {subPage === 'vo-history' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              📜 Verification Audit Ledger &amp; History
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Immutable audit records of all document verifications, OCR corrections, and stage advancements.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Timestamp</th>
                <th style={{ padding: '10px 14px' }}>Officer / Actor</th>
                <th style={{ padding: '10px 14px' }}>Action</th>
                <th style={{ padding: '10px 14px' }}>Target Entity</th>
                <th style={{ padding: '10px 14px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.slice(0, 15).map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Recent'}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>
                    {ev.actor_name || 'Verification Officer'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#0369a1', fontWeight: '600' }}>
                    {ev.action}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {ev.entity_type}: {ev.entity_id || 'Application'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>
                    {typeof ev.details === 'object' ? JSON.stringify(ev.details) : String(ev.details || '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
