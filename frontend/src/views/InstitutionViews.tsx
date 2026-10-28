import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  Building2,
  ClipboardList,
  FileEdit,
  Send,
  Hourglass,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  getApplications,
  createApplication,
  getDocuments,
  uploadDocument,
  getFindings,
  getCompliance,
  getDashboardStats,
  getApplicationPipeline,
  updateProfile,
  respondToDeficiency,
  runValidation
} from '../api';
import type { Application, Document, Finding, ComplianceCheck, DashboardStats, PipelineInfo } from '../types';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function InstitutionViews({ subPage, onNavigate, onSelectApp, onViewDoc }: Props) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Profile State
  const [profile, setProfile] = useState({
    institution_name: 'ABC Institute of Engineering & Technology',
    institution_id: '1-33245561',
    institution_type: 'Engineering',
    category: 'Private-Self-Financed',
    address: 'Sector 62, Institutional Area, Knowledge Park',
    state: 'Maharashtra',
    district: 'Pune',
    pincode: '411057',
    contact_person: 'Dr. Ramesh Kulkarni (Principal)',
    email: 'principal@abcinstitute.edu.in',
    phone: '+91 98765 43210',
    university: 'Savitribai Phule Pune University',
    est_year: '2004',
    campus_acres: '10.5 Acres (Contiguous)',
    total_intake: '720 Seats'
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Wizard state for Create Application
  const [wizardStep, setWizardStep] = useState(1);
  const [appForm, setAppForm] = useState({
    category: 'Extension of Approval (EoA)',
    academic_year: '2026-27',
    institution_name: user?.full_name || 'ABC Institute of Engineering & Technology',
    institution_type: 'Engineering',
    region: 'Western',
    state: 'Maharashtra',
    city: 'Pune',
    applied_for: 'Continuation of B.Tech CSE, AI&ML, ECE + New Course M.Tech Data Science',
    faculty_count: '64',
    total_carpet_area: '18500 sq.m',
    declaration_accepted: false
  });
  const [createdSuccessId, setCreatedSuccessId] = useState<string | null>(null);

  // Documents state
  const [selectedAppForDocs, setSelectedAppForDocs] = useState<string>('');
  const [docsList, setDocsList] = useState<Document[]>([]);
  const [uploadDocType, setUploadDocType] = useState('Land Ownership Deed');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Deficiencies state
  const [deficiencies, setDeficiencies] = useState<Finding[]>([]);
  const [respondingTo, setRespondingTo] = useState<Finding | null>(null);
  const [deficiencyResponseText, setDeficiencyResponseText] = useState('');
  const [deficiencyRespSuccess, setDeficiencyRespSuccess] = useState('');

  // Timeline state
  const [timelineData, setTimelineData] = useState<PipelineInfo | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, statsData] = await Promise.all([
        getApplications().catch(() => []),
        getDashboardStats().catch(() => null)
      ]);
      setApps(appsData);
      setStats(statsData);

      if (appsData.length > 0) {
        const firstAppId = appsData[0].application_id || String(appsData[0].id);
        setSelectedAppForDocs(firstAppId);
        loadAppDocs(firstAppId);
        loadFindings(firstAppId);
        loadTimeline(firstAppId);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAppDocs = async (appId: string) => {
    try {
      const d = await getDocuments(appId);
      setDocsList(d);
    } catch {
      setDocsList([]);
    }
  };

  const loadFindings = async (appId: string) => {
    try {
      const f = await getFindings(appId);
      setDeficiencies(f);
    } catch {
      setDeficiencies([]);
    }
  };

  const loadTimeline = async (appId: string) => {
    try {
      const p = await getApplicationPipeline(appId);
      setTimelineData(p);
    } catch {
      setTimelineData(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newApp = await createApplication({
        institution_name: appForm.institution_name,
        institution_type: appForm.institution_type,
        category: appForm.category,
        region: appForm.region,
        state: appForm.state,
        city: appForm.city,
        applied_for: appForm.applied_for
      });
      setCreatedSuccessId(newApp.application_id || String(newApp.id));
      await loadData();
    } catch (err: any) {
      alert('Error creating application: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForDocs || !selectedFile) {
      alert('Please select an application and a file to upload.');
      return;
    }
    try {
      await uploadDocument(selectedAppForDocs, uploadDocType, selectedFile);
      setUploadSuccess(`Successfully uploaded ${uploadDocType} (${selectedFile.name})`);
      setSelectedFile(null);
      await loadAppDocs(selectedAppForDocs);
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err: any) {
      alert('Upload failed: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const handleTriggerAiValidation = async (appId: string) => {
    setAiRunning(true);
    try {
      const res = await runValidation(appId);
      setAiResult(res);
      await loadData();
      if (selectedAppForDocs) {
        await loadAppDocs(selectedAppForDocs);
        await loadFindings(selectedAppForDocs);
        await loadTimeline(selectedAppForDocs);
      }
    } catch (err: any) {
      alert('AI Validation error: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setAiRunning(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        institution_name: profile.institution_name,
        contact_person: profile.contact_person,
        phone: profile.phone,
        address: profile.address
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      alert('Profile update error: ' + (err?.response?.data?.detail || err.message));
    }
  };

  const handleDeficiencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingTo) return;
    try {
      await respondToDeficiency(respondingTo.id, deficiencyResponseText);
      setDeficiencyRespSuccess('✓ Deficiency response recorded in audit ledger. Evidence version created and application returned to verification review.');
      setRespondingTo(null);
      setDeficiencyResponseText('');
      await loadData();
      if (selectedAppForDocs) await loadFindings(selectedAppForDocs);
      setTimeout(() => setDeficiencyRespSuccess(''), 5000);
    } catch (err: any) {
      alert('Deficiency response error: ' + (err?.response?.data?.detail || err.message));
    }
  };

  // Filtered applications
  const filteredApps = apps.filter(a => {
    const matchSearch =
      (a.application_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.institution_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'all') return matchSearch;
    if (statusFilter === 'draft') return matchSearch && a.status === 'draft';
    if (statusFilter === 'submitted') return matchSearch && a.status === 'submitted';
    if (statusFilter === 'under_review') return matchSearch && (a.status === 'under_review' || a.status === 'doc_verified' || a.status === 'compliance_review');
    if (statusFilter === 'deficiency') return matchSearch && a.status === 'deficiency';
    if (statusFilter === 'cleared') return matchSearch && a.status === 'cleared';
    return matchSearch;
  });

  const totalCount = apps.length;
  const draftCount = apps.filter(a => a.status === 'draft').length;
  const submittedCount = apps.filter(a => a.status === 'submitted').length;
  const underReviewCount = apps.filter(a => a.status === 'under_review' || a.status === 'doc_verified' || a.status === 'compliance_review').length;
  const deficiencyCount = apps.filter(a => a.status === 'deficiency').length;
  const clearedCount = apps.filter(a => a.status === 'cleared').length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '8px 16px' }}>
      {/* ============================================================
          1. DASHBOARD
          ============================================================ */}
      {(subPage === 'inst-dashboard' || subPage === 'dashboard') && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="black-logo-badge">
                <Building2 size={15} />
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#09090b', margin: 0 }}>
                Institution Dashboard
              </h1>
              <span style={{
                background: '#f1f5f9',
                color: '#334155',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                ACADEMIC YEAR 2026-27
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Track institutional approval applications, upload mandatory regulatory documents, resolve deficiencies, and monitor AICTE scrutiny milestones.
            </p>
          </div>

          {/* Metric Summary Cards - Clicking filters table! */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
          }}>
            {[
              { key: 'all', label: 'Total Applications', count: totalCount, color: '#09090b', bg: '#eff6ff', icon: <ClipboardList size={14} /> },
              { key: 'draft', label: 'Drafts in Progress', count: draftCount, color: '#64748b', bg: '#f8fafc', icon: <FileEdit size={14} /> },
              { key: 'submitted', label: 'Submitted (Intake)', count: submittedCount, color: '#0284c7', bg: '#f0f9ff', icon: <Send size={14} /> },
              { key: 'under_review', label: 'Under Review', count: underReviewCount, color: '#8b5cf6', bg: '#f5f3ff', icon: <Hourglass size={14} /> },
              { key: 'deficiency', label: 'Correction Required', count: deficiencyCount, color: '#dc2626', bg: '#fef2f2', icon: <AlertTriangle size={14} /> },
              { key: 'cleared', label: 'Decisions Approved', count: clearedCount, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={14} /> },
            ].map(card => {
              const active = statusFilter === card.key;
              return (
                <div
                  key={card.key}
                  onClick={() => setStatusFilter(card.key)}
                  style={{
                    background: '#ffffff',
                    border: active ? '2px solid #09090b' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: active ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{card.label}</span>
                    <span className="black-logo-badge-sm">{card.icon}</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: card.color }}>
                    {card.count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Notice Banner & Deadlines */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>📢</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>
                  AICTE Approval Process Handbook (APH 2026-27) Notification
                </div>
                <div style={{ fontSize: '12px', color: '#b45309' }}>
                  Institutions with open deficiency notices must submit rectifications within 15 calendar days from the date of issue.
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inst-create-app')}
              style={{
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              + Create New Application
            </button>
          </div>

          {/* Filtered Application List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Active Institutional Applications
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Showing {filteredApps.length} of {apps.length} records (Filter: {statusFilter.toUpperCase()})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search application ID or category..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    width: '260px'
                  }}
                />
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                No applications found matching the current filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px 14px' }}>Application ID</th>
                      <th style={{ padding: '10px 14px' }}>Category</th>
                      <th style={{ padding: '10px 14px' }}>Academic Year</th>
                      <th style={{ padding: '10px 14px' }}>Submission Date</th>
                      <th style={{ padding: '10px 14px' }}>Current Stage</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map(a => {
                      const appId = a.application_id || String(a.id);
                      return (
                        <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e3a8a' }}>
                            {appId}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {a.category || a.application_type || 'Extension of Approval (EoA)'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            2026-27
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b' }}>
                            {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : 'Draft'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: '#eff6ff',
                              color: '#1d4ed8'
                            }}>
                              {(a.current_stage || 'Submission').replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background:
                                a.status === 'cleared' ? '#dcfce7' :
                                a.status === 'deficiency' ? '#fee2e2' :
                                a.status === 'draft' ? '#f1f5f9' : '#e0f2fe',
                              color:
                                a.status === 'cleared' ? '#15803d' :
                                a.status === 'deficiency' ? '#b91c1c' :
                                a.status === 'draft' ? '#475569' : '#0369a1'
                            }}>
                              {(a.status || 'Draft').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleTriggerAiValidation(appId)}
                                disabled={aiRunning}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                                title="Execute Document Intelligence, Anomaly, Issuer & Compliance Agents"
                              >
                                {aiRunning ? '⚙️ AI Processing...' : '🤖 Run AI Checks'}
                              </button>
                              <button
                                onClick={() => onSelectApp(appId)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '11.5px',
                                  background: '#1e3a8a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                View Dossier
                              </button>
                              {a.status === 'deficiency' && (
                                <button
                                  onClick={() => onNavigate('inst-deficiencies')}
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '11.5px',
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  Rectify
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI Agent Execution Visual Telemetry */}
            {aiResult && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #bfdbfe',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-pulse-dot"></span>
                    <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>
                      5-Agent Autonomous AI Validation Completed
                    </strong>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                    Scrutiny Score: {aiResult.scrutiny_score}%
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
          2. INSTITUTION PROFILE
          ============================================================ */}
      {subPage === 'inst-profile' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🏛️ Institution Profile &amp; Governance Details
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Authorized institution metadata validated against the AICTE Permanent Institution Registry.
            </p>
          </div>

          {profileSaved && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px' }}>
              ✓ Institutional profile details updated and synced with regulatory registry.
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Institution Name *
                </label>
                <input
                  type="text"
                  value={profile.institution_name}
                  onChange={e => setProfile({ ...profile, institution_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  AICTE Permanent ID (Locked)
                </label>
                <input
                  type="text"
                  value={profile.institution_id}
                  disabled
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px', color: '#64748b' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Institution Type
                </label>
                <select
                  value={profile.institution_type}
                  onChange={e => setProfile({ ...profile, institution_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Engineering">Engineering &amp; Technology</option>
                  <option value="Polytechnic">Polytechnic Diploma</option>
                  <option value="Management">Management (MBA/PGDM)</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Architecture">Architecture &amp; Planning</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Institutional Category
                </label>
                <input
                  type="text"
                  value={profile.category}
                  onChange={e => setProfile({ ...profile, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  State
                </label>
                <input
                  type="text"
                  value={profile.state}
                  onChange={e => setProfile({ ...profile, state: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  District
                </label>
                <input
                  type="text"
                  value={profile.district}
                  onChange={e => setProfile({ ...profile, district: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Campus Street Address
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Authorized Representative (Principal / Director)
                </label>
                <input
                  type="text"
                  value={profile.contact_person}
                  onChange={e => setProfile({ ...profile, contact_person: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Official Contact Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Affiliating University
                </label>
                <input
                  type="text"
                  value={profile.university}
                  onChange={e => setProfile({ ...profile, university: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Campus Contiguous Land Area
                </label>
                <input
                  type="text"
                  value={profile.campus_acres}
                  onChange={e => setProfile({ ...profile, campus_acres: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="submit"
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          3. MY APPLICATIONS
          ============================================================ */}
      {subPage === 'inst-applications' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                📋 My Submissions Dossier
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                Comprehensive ledger of all applications submitted under your institutional account.
              </p>
            </div>
            <button
              onClick={() => onNavigate('inst-create-app')}
              style={{
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Create Application
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Application ID</th>
                <th style={{ padding: '10px 14px' }}>Category</th>
                <th style={{ padding: '10px 14px' }}>Applied Scope</th>
                <th style={{ padding: '10px 14px' }}>Submission Date</th>
                <th style={{ padding: '10px 14px' }}>Pipeline Stage</th>
                <th style={{ padding: '10px 14px' }}>Regulatory Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => {
                const appId = a.application_id || String(a.id);
                return (
                  <tr key={appId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e3a8a' }}>
                      {appId}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {a.category || a.application_type || 'Extension of Approval'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {a.applied_for || 'B.Tech Regular Programs'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : 'Draft'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#1d4ed8' }}>
                        {(a.current_stage || 'submission').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: a.status === 'cleared' ? '#dcfce7' : a.status === 'deficiency' ? '#fee2e2' : '#e0f2fe',
                        color: a.status === 'cleared' ? '#15803d' : a.status === 'deficiency' ? '#b91c1c' : '#0369a1'
                      }}>
                        {(a.status || 'Draft').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectApp(appId)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '11.5px',
                          background: '#1e3a8a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Open Dossier
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
          4. CREATE APPLICATION (Guided 8-Step Wizard)
          ============================================================ */}
      {subPage === 'inst-create-app' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ➕ Guided Application Submission Wizard (APH 2026-27)
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Follow the guided 8-step workflow to submit institutional proposals for AICTE approval scrutiny.
            </p>
          </div>

          {/* Stepper Navigation */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '8px' }}>
            {[
              '1. Category',
              '2. Academic Year',
              '3. Campus Details',
              '4. Programs & Intake',
              '5. Infrastructure',
              '6. Declarations',
              '7. Required Checklist',
              '8. Submit Scrutiny'
            ].map((stepName, idx) => {
              const stepNum = idx + 1;
              const isActive = wizardStep === stepNum;
              const isPast = wizardStep > stepNum;
              return (
                <div
                  key={stepName}
                  onClick={() => setWizardStep(stepNum)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: isActive ? '700' : '500',
                    background: isActive ? '#1e3a8a' : isPast ? '#dcfce7' : '#f1f5f9',
                    color: isActive ? '#ffffff' : isPast ? '#15803d' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isPast ? '✓ ' : ''}{stepName}
                </div>
              );
            })}
          </div>

          {createdSuccessId && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '700' }}>
                🎉 Application Successfully Created: {createdSuccessId}
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '12.5px' }}>
                Your proposal has entered Stage 2 (Automated 5-Agent Scrutiny Pipeline). You can now track verification and upload evidence in Document Center.
              </p>
              <button
                onClick={() => onSelectApp(createdSuccessId)}
                style={{ background: '#15803d', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                Open Submitted Dossier
              </button>
            </div>
          )}

          {/* Step 1: Category */}
          {wizardStep === 1 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>
                Step 1: Select Application Category
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {[
                  { title: 'Extension of Approval (EoA)', desc: 'Continuation of existing approved technical courses for Academic Year 2026-27' },
                  { title: 'Increase in Intake / Additional Course', desc: 'Addition of emergent domains (AI, ML, Data Science) or seat intake expansion' },
                  { title: 'Setup New Technical Institution', desc: 'Fresh establishment of Engineering, Polytechnic or Management institute' },
                  { title: 'Closure / Reduction of Intake', desc: 'Voluntary reduction of unviable courses or campus restructuring' }
                ].map(cat => (
                  <div
                    key={cat.title}
                    onClick={() => setAppForm({ ...appForm, category: cat.title })}
                    style={{
                      border: appForm.category === cat.title ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
                      background: appForm.category === cat.title ? '#eff6ff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      {cat.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {cat.desc}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button
                  onClick={() => setWizardStep(2)}
                  style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Continue to Step 2 →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Academic Year & Institution */}
          {wizardStep === 2 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>
                Step 2: Academic Year &amp; Institution Particulars
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Academic Year</label>
                  <input type="text" value={appForm.academic_year} disabled style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Institution Name</label>
                  <input type="text" value={appForm.institution_name} onChange={e => setAppForm({ ...appForm, institution_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Discipline / Type</label>
                  <select value={appForm.institution_type} onChange={e => setAppForm({ ...appForm, institution_type: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="Engineering">Engineering &amp; Technology</option>
                    <option value="Management">Management (MBA/PGDM)</option>
                    <option value="Polytechnic">Polytechnic</option>
                    <option value="Pharmacy">Pharmacy</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Regional Jurisdiction</label>
                  <select value={appForm.region} onChange={e => setAppForm({ ...appForm, region: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="Western">Western Regional Office (Mumbai)</option>
                    <option value="Northern">Northern Regional Office (Kanpur)</option>
                    <option value="Southern">Southern Regional Office (Chennai)</option>
                    <option value="South-Western">South-Western Regional Office (Bengaluru)</option>
                    <option value="Central">Central Regional Office (Bhopal)</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setWizardStep(1)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setWizardStep(3)} style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>Continue to Step 3 →</button>
              </div>
            </div>
          )}

          {/* Step 3: Campus Details */}
          {wizardStep === 3 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>Step 3: Campus &amp; Location Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>State</label>
                  <input type="text" value={appForm.state} onChange={e => setAppForm({ ...appForm, state: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>City / Town</label>
                  <input type="text" value={appForm.city} onChange={e => setAppForm({ ...appForm, city: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Scope of Approval Requested</label>
                  <textarea rows={3} value={appForm.applied_for} onChange={e => setAppForm({ ...appForm, applied_for: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setWizardStep(2)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setWizardStep(4)} style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>Continue to Step 4 →</button>
              </div>
            </div>
          )}

          {/* Step 4: Programs & Intake */}
          {wizardStep === 4 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>Step 4: Proposed Programs &amp; Approved Intake</h3>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '6px' }}>Program / Level</th>
                      <th style={{ padding: '6px' }}>Course Title</th>
                      <th style={{ padding: '6px' }}>Existing Intake</th>
                      <th style={{ padding: '6px' }}>Requested Intake</th>
                      <th style={{ padding: '6px' }}>Affiliation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 6px' }}>UG / B.Tech</td>
                      <td style={{ padding: '8px 6px', fontWeight: '600' }}>Computer Science &amp; Engineering</td>
                      <td style={{ padding: '8px 6px' }}>180 Seats</td>
                      <td style={{ padding: '8px 6px' }}>180 Seats (EoA)</td>
                      <td style={{ padding: '8px 6px', color: '#15803d' }}>Affiliated</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 6px' }}>UG / B.Tech</td>
                      <td style={{ padding: '8px 6px', fontWeight: '600' }}>Artificial Intelligence &amp; Data Science</td>
                      <td style={{ padding: '8px 6px' }}>120 Seats</td>
                      <td style={{ padding: '8px 6px' }}>120 Seats (EoA)</td>
                      <td style={{ padding: '8px 6px', color: '#15803d' }}>Affiliated</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 6px' }}>PG / M.Tech</td>
                      <td style={{ padding: '8px 6px', fontWeight: '600' }}>Data Science &amp; Analytics</td>
                      <td style={{ padding: '8px 6px' }}>0 (New)</td>
                      <td style={{ padding: '8px 6px', color: '#1e3a8a', fontWeight: '700' }}>+24 Seats</td>
                      <td style={{ padding: '8px 6px', color: '#0369a1' }}>NOC Attached</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setWizardStep(3)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setWizardStep(5)} style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>Continue to Step 5 →</button>
              </div>
            </div>
          )}

          {/* Step 5: Infrastructure & Faculty */}
          {wizardStep === 5 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>Step 5: Faculty, Infrastructure &amp; Facilities</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Full-time Regular Faculty Count</label>
                  <input type="text" value={appForm.faculty_count} onChange={e => setAppForm({ ...appForm, faculty_count: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Total Built-up Instructional Carpet Area</label>
                  <input type="text" value={appForm.total_carpet_area} onChange={e => setAppForm({ ...appForm, total_carpet_area: e.target.value })} style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setWizardStep(4)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setWizardStep(6)} style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>Continue to Step 6 →</button>
              </div>
            </div>
          )}

          {/* Step 6: Declarations */}
          {wizardStep === 6 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>Step 6: Statutory Declarations</h3>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '12.5px', lineHeight: '1.6', marginBottom: '16px' }}>
                <p>1. I hereby solemnly affirm that the information furnished in this proposal is authentic and based on genuine records.</p>
                <p>2. The institution complies with AICTE Land, Building, Cadre Ratio, and Fire Safety Regulations as prescribed in APH 2026-27.</p>
                <p>3. Anti-ragging committee and internal complaints committee (ICC) have been duly constituted.</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginTop: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={appForm.declaration_accepted} onChange={e => setAppForm({ ...appForm, declaration_accepted: e.target.checked })} />
                  I accept and confirm all statutory declarations above
                </label>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setWizardStep(5)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', cursor: 'pointer' }}>← Back</button>
                <button disabled={!appForm.declaration_accepted} onClick={() => setWizardStep(7)} style={{ background: appForm.declaration_accepted ? '#1e3a8a' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>Continue to Step 7 →</button>
              </div>
            </div>
          )}

          {/* Step 7: Required Document Checklist */}
          {wizardStep === 7 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>Step 7: Required Document Checklist Verification</h3>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Documents required by AICTE Approval Process Handbook (upload can also be done in Document Center):</div>
                <ul style={{ fontSize: '12.5px', listStyle: 'none', padding: 0 }}>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>📁 <strong>Land Ownership Title Deed:</strong> Registered non-encumbered contiguous land parcel</li>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>🚒 <strong>Fire Safety NOC:</strong> Issued by State Fire Services Directorate</li>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>🏛️ <strong>Approved Building Layout Plan:</strong> Approved by competent Municipal / Town Planning authority</li>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>👥 <strong>Faculty Cadre &amp; Qualification Register:</strong> Verified against 1:20 SFR norms</li>
                  <li style={{ padding: '6px 0' }}>💰 <strong>Endowment Joint FDR Receipt:</strong> Created in name of AICTE and Society</li>
                </ul>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setWizardStep(6)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setWizardStep(8)} style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>Final Review &amp; Submit →</button>
              </div>
            </div>
          )}

          {/* Step 8: Final Review & Submit */}
          {wizardStep === 8 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '14px' }}>Step 8: Final Submission to AICTE Scrutiny</h3>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '12.5px' }}>
                <div style={{ fontWeight: '700', color: '#1e3a8a', marginBottom: '6px' }}>Ready for Submission:</div>
                <div>Category: <strong>{appForm.category}</strong></div>
                <div>Institution: <strong>{appForm.institution_name}</strong></div>
                <div>Scope: <strong>{appForm.applied_for}</strong></div>
                <div>Region: <strong>{appForm.region} ({appForm.city}, {appForm.state})</strong></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setWizardStep(7)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 18px', fontSize: '12.5px', cursor: 'pointer' }}>← Back</button>
                <button onClick={handleCreateSubmit} style={{ background: '#15803d', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  🚀 Submit Application for Scrutiny
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          5. DOCUMENT CENTER
          ============================================================ */}
      {subPage === 'inst-docs' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                📁 Document Center &amp; Evidence Repository
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                Upload and version PDF/image files. OCR extraction and integrity hash validation run automatically.
              </p>
            </div>
            {apps.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Dossier:</label>
                <select
                  value={selectedAppForDocs}
                  onChange={e => { setSelectedAppForDocs(e.target.value); loadAppDocs(e.target.value); }}
                  style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  {apps.map(a => (
                    <option key={a.application_id || a.id} value={a.application_id || a.id}>
                      {a.application_id || a.id} - {a.institution_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Upload Form Box */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', margin: '0 0 12px 0' }}>
              Upload New Document Evidence
            </h4>
            {uploadSuccess && (
              <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                ✓ {uploadSuccess}
              </div>
            )}
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={uploadDocType}
                onChange={e => setUploadDocType(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: '220px' }}
              >
                <option value="Land Ownership Deed">Land Ownership Title Deed</option>
                <option value="Fire Safety NOC">Fire &amp; Life Safety NOC</option>
                <option value="Approved Building Plan">Approved Building Layout Plan</option>
                <option value="Faculty List">Faculty Cadre &amp; Qualification Register</option>
                <option value="FDR Receipt">Joint AICTE-Society FDR Receipt</option>
                <option value="University Affiliation NOC">University Affiliation NOC</option>
              </select>

              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                style={{ fontSize: '12px' }}
                required
              />

              <button
                type="submit"
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📤 Upload &amp; Run OCR
              </button>
            </form>
          </div>

          {/* Document Inventory Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Document Name</th>
                <th style={{ padding: '10px 14px' }}>File &amp; Hash</th>
                <th style={{ padding: '10px 14px' }}>Upload Date</th>
                <th style={{ padding: '10px 14px' }}>OCR Status</th>
                <th style={{ padding: '10px 14px' }}>Verification Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {docsList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No documents uploaded for this application yet.
                  </td>
                </tr>
              ) : (
                docsList.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>
                      {d.doc_type}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      <div>{d.filename}</div>
                      <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#94a3b8' }}>
                        {d.sha256_hash ? d.sha256_hash.substring(0, 16) + '...' : 'SHA-256 Validated'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#e0f2fe',
                        color: '#0369a1'
                      }}>
                        {d.status === 'flagged' ? '⚠️ Duplicate Flag' : '✓ OCR Extracted'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: d.status === 'verified' ? '#dcfce7' : d.status === 'flagged' ? '#fee2e2' : '#fef3c7',
                        color: d.status === 'verified' ? '#15803d' : d.status === 'flagged' ? '#b91c1c' : '#b45309'
                      }}>
                        {(d.status || 'Pending').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => onViewDoc(d.filename)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ Preview
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
          6. REQUIREMENTS CHECKLIST
          ============================================================ */}
      {subPage === 'inst-checklist' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ✅ Mandatory Regulatory Requirements Checklist
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Grouped statutory requirements per AICTE Approval Process Handbook (APH 2026-27).
            </p>
          </div>

          {[
            {
              category: '1. Land & Campus Infrastructure',
              items: [
                { id: 'APH-2.1', title: 'Contiguous Land Parcel', norm: 'Minimum 5.0 Acres in Rural / 2.5 Acres in Urban', status: 'Complete' },
                { id: 'APH-2.2', title: 'Barrier-Free Divyangjan Accessibility', norm: 'Lifts, ramps, accessible toilets on all floors', status: 'Complete' },
                { id: 'APH-2.3', title: 'Instructional Carpet Area', norm: 'Prescribed sq.m based on approved division count', status: 'Under verification' }
              ]
            },
            {
              category: '2. Statutory Safety & Life Protection',
              items: [
                { id: 'APH-4.2', title: 'State Fire Safety NOC', norm: 'Valid unexpired NOC from Chief Fire Officer', status: 'Complete' },
                { id: 'APH-4.3', title: 'Structural Stability Certificate', norm: 'Issued by licensed structural engineer/PWD', status: 'Complete' },
                { id: 'APH-4.4', title: 'Potable Drinking Water & Sanitary Certificate', norm: 'Municipal health authority inspection certificate', status: 'Complete' }
              ]
            },
            {
              category: '3. Human Resources & Faculty',
              items: [
                { id: 'APH-3.4', title: 'Student-to-Faculty Ratio (SFR)', norm: '1:20 for B.Tech Engineering courses', status: 'Under verification' },
                { id: 'APH-3.5', title: 'Cadre Ratio (Professor : Associate : Assistant)', norm: '1 : 2 : 6 Cadre distribution', status: 'Needs correction' },
                { id: 'APH-3.6', title: 'Principal / Director Qualification', norm: 'Ph.D with minimum 15 years experience & API score', status: 'Complete' }
              ]
            },
            {
              category: '4. Financial & Corpus Deposit',
              items: [
                { id: 'APH-6.3', title: 'Joint Endowment FDR', norm: 'Fixed Deposit Receipt created in joint name of AICTE & Society', status: 'Complete' },
                { id: 'APH-6.4', title: 'Audited Financial Statements', norm: 'Preceding 3 financial years audited balance sheets', status: 'Complete' }
              ]
            }
          ].map(section => (
            <div key={section.category} style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a', marginBottom: '10px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                {section.category}
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {section.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      border: '1px solid #f1f5f9',
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginRight: '8px' }}>{item.id}</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.title}</strong>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{item.norm}</div>
                    </div>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background:
                        item.status === 'Complete' ? '#dcfce7' :
                        item.status === 'Needs correction' ? '#fee2e2' : '#eff6ff',
                      color:
                        item.status === 'Complete' ? '#15803d' :
                        item.status === 'Needs correction' ? '#b91c1c' : '#1d4ed8'
                    }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================
          7. CLARIFICATIONS & DEFICIENCIES
          ============================================================ */}
      {subPage === 'inst-deficiencies' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ⚠️ Deficiency &amp; Clarification Resolution Desk
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Review discrepancies raised by Verification Officers or Compliance Reviewers, upload corrective evidence, and resubmit for evaluation.
            </p>
          </div>

          {deficiencyRespSuccess && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px' }}>
              ✓ {deficiencyRespSuccess}
            </div>
          )}

          {/* Active Deficiencies */}
          <div style={{ marginBottom: '24px' }}>
            {deficiencies.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                🎉 No active deficiencies! All institutional checks are compliant or under standard review.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {deficiencies.map(f => (
                  <div
                    key={f.id}
                    style={{
                      border: '1px solid #fecaca',
                      background: '#fffbfb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', marginRight: '8px' }}>
                          SEVERITY: {f.severity?.toUpperCase()}
                        </span>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                          {f.rule_description || f.rule_id || 'Discrepancy Notice'}
                        </strong>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Issued on: {new Date(f.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '12.5px', color: '#334155', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                      {f.finding_text}
                    </p>

                    {f.officer_remark && (
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#1e3a8a', marginBottom: '12px' }}>
                        <strong>Officer Instruction:</strong> {f.officer_remark}
                      </div>
                    )}

                    <button
                      onClick={() => setRespondingTo(f)}
                      style={{
                        background: '#1e3a8a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Respond &amp; Upload Corrective Evidence
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response Modal / Drawer */}
          {respondingTo && (
            <div style={{
              background: '#f8fafc',
              border: '2px solid #1e3a8a',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a', margin: '0 0 10px 0' }}>
                Responding to Deficiency: {respondingTo.rule_id}
              </h3>
              <form onSubmit={handleDeficiencySubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Institutional Clarification / Statement *
                  </label>
                  <textarea
                    rows={4}
                    value={deficiencyResponseText}
                    onChange={e => setDeficiencyResponseText(e.target.value)}
                    placeholder="Explain how the deficiency has been rectified and describe the uploaded corrective document..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Attach Replacement Document Evidence
                  </label>
                  <input type="file" accept=".pdf,.png,.jpg" style={{ fontSize: '12px' }} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 18px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Submit Response &amp; Resubmit to Scrutiny
                  </button>
                  <button
                    type="button"
                    onClick={() => setRespondingTo(null)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          8. NOTIFICATIONS
          ============================================================ */}
      {subPage === 'inst-notifications' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              🔔 Regulatory Notifications &amp; Alerts
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Chronological feed of status changes, officer assignments, and statutory deadlines.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              {
                title: 'AICTE APH 2026-27 Application Intake Active',
                desc: 'Portal is accepting EoA and New Course applications for the upcoming academic cycle.',
                date: 'Oct 28, 2026',
                type: 'info'
              },
              {
                title: 'Document Intelligence OCR Completed',
                desc: 'Automatic field extraction completed for uploaded Land Deed and Building Layout.',
                date: 'Oct 27, 2026',
                type: 'success'
              },
              {
                title: 'Verification Officer Assigned',
                desc: 'Dossier routed to authorized officer for human-in-the-loop certificate inspection.',
                date: 'Oct 26, 2026',
                type: 'info'
              }
            ].map((n, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {n.desc}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {n.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          9. APPLICATION TIMELINE
          ============================================================ */}
      {subPage === 'inst-timeline' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              ⏱️ End-to-End Application Workflow Timeline
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Traceable milestone chronology reflecting actual backend events and authorized human interventions.
            </p>
          </div>

          {timelineData && (
            <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>Application:</strong> {timelineData.application_id} ({timelineData.institution_name})
              </div>
              <div>
                <strong>Current Stage:</strong> {timelineData.current_stage.toUpperCase()} | <strong>Score:</strong> {timelineData.scrutiny_score}%
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '16px', position: 'relative' }}>
            {[
              { step: 1, title: 'Draft Created', desc: 'Institution initiates application and prepares institutional details', done: true, date: 'Oct 26, 2026' },
              { step: 2, title: 'Application Submitted', desc: 'Final declarations confirmed and uploaded evidence locked for review', done: true, date: 'Oct 26, 2026' },
              { step: 3, title: 'AI 5-Agent Validation Pipeline', desc: 'OCR extraction, tamper check, public issuer registry & APH rule matching', done: true, date: 'Oct 27, 2026' },
              { step: 4, title: 'Verification Officer Review', desc: 'Split-screen human inspection of certificates, OCR correction & anomaly audit', done: true, date: 'Oct 28, 2026' },
              { step: 5, title: 'Compliance Reviewer Scrutiny', desc: 'Regulatory checklist evaluation, infrastructure assessment & recommendation', done: false, date: 'In Progress' },
              { step: 6, title: 'Statutory AICTE Decision Pending', desc: 'Directorate reviews complete evidence dossier for official decree issuance', done: false, date: 'Pending' },
              { step: 7, title: 'Official Order Signed & Recorded', desc: 'Immutable decree issued (CLEARED / DEFICIENCY / REJECTED) with order number', done: false, date: 'Pending' }
            ].map(stage => (
              <div
                key={stage.step}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: stage.done ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  background: stage.done ? '#f0fdf4' : '#ffffff'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: stage.done ? '#15803d' : '#e2e8f0',
                  color: stage.done ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px'
                }}>
                  {stage.done ? '✓' : stage.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: stage.done ? '#15803d' : '#0f172a' }}>
                      {stage.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{stage.date}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    {stage.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          10. MY ACCOUNT
          ============================================================ */}
      {subPage === 'inst-account' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              👤 Institution Representative Account
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Authorized user credentials, contact parameters, and security session info.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Full Name
              </label>
              <input type="text" value={user?.full_name || 'Institution Applicant'} disabled style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Login Email
              </label>
              <input type="text" value={user?.email || 'institution@example.com'} disabled style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                System Role
              </label>
              <input type="text" value="INSTITUTION_USER" disabled style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Security Scope
              </label>
              <input type="text" value="Restricted to Own Submissions" disabled style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
