import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getApplications } from '../api';
import type { DashboardStats, Application, UserRole } from '../types';
import { useAuth } from '../AuthContext';

interface Props {
  onSelectApp?: (appId: string) => void;
  onNavigatePage?: (page: string) => void;
}

export default function DashboardPage({ onSelectApp, onNavigatePage }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const role = (user?.role || 'institution').toLowerCase();

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      getApplications().catch(() => [])
    ]).then(([statsData, appsData]) => {
      setStats(statsData);
      setRecentApps(appsData.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const totalApps = stats?.total_applications ?? recentApps.length ?? 0;
  const clearedCount = stats?.cleared ?? 0;
  const underReviewCount = stats?.under_review ?? 0;
  const deficiencyCount = stats?.deficiencies ?? 0;

  const chartData = totalApps > 0 ? [
    {
      name: 'Cleared',
      value: clearedCount,
      color: '#16a34a',
      percent: `${((clearedCount / totalApps) * 100).toFixed(1)}%`
    },
    {
      name: 'Under Review',
      value: underReviewCount,
      color: '#0284c7',
      percent: `${((underReviewCount / totalApps) * 100).toFixed(1)}%`
    },
    {
      name: 'Deficiencies',
      value: deficiencyCount,
      color: '#dc2626',
      percent: `${((deficiencyCount / totalApps) * 100).toFixed(1)}%`
    }
  ] : [
    { name: 'Empty Platform', value: 1, color: '#e2e8f0', percent: '0%' }
  ];

  // Role-tailored metrics & descriptions
  let roleTitle = 'AICTE Regulatory Platform';
  let roleBadge = 'Authorized User';
  let roleBadgeColor = '#1e3a8a';
  let roleBadgeBg = '#dbeafe';
  let roleSubtitle = 'Statutory compliance tracking and multi-agent validation';
  let card1 = { label: 'Total Applications', val: totalApps, trend: '↑ Live database sync', color: '#1e3a8a' };
  let card2 = { label: 'Under Review', val: underReviewCount, trend: 'In regulatory pipeline', color: '#0284c7' };
  let card3 = { label: 'Deficiencies Flagged', val: deficiencyCount, trend: '⚠️ Requires rectification', color: '#dc2626' };
  let card4 = { label: 'Cleared (Approved)', val: clearedCount, trend: '✓ Compliant EoA', color: '#16a34a' };

  if (role === 'institution') {
    roleTitle = `Welcome, ${user?.full_name || 'Institute Applicant'}`;
    roleBadge = 'Institution User Desk';
    roleBadgeColor = '#065f46';
    roleBadgeBg = '#d1fae5';
    roleSubtitle = 'Submit applications, upload regulatory documents, track OCR findings, and resolve deficiencies (APH 2026-27)';
    card1 = { label: 'My Submissions', val: totalApps, trend: 'All institutional applications', color: '#1e3a8a' };
    card2 = { label: 'In Review / Pipeline', val: underReviewCount, trend: 'Under AICTE scrutiny', color: '#0284c7' };
    card3 = { label: 'Action Required', val: deficiencyCount, trend: '⚠️ Rectification needed', color: '#dc2626' };
    card4 = { label: 'Approved Clearances', val: clearedCount, trend: '✓ EoA Approval Granted', color: '#16a34a' };
  } else if (role === 'verification_officer' || role === 'officer') {
    roleTitle = 'Document Verification Desk';
    roleBadge = 'Verification Officer';
    roleBadgeColor = '#0369a1';
    roleBadgeBg = '#e0f2fe';
    roleSubtitle = 'Review OCR-extracted certificates, examine anomaly flags, and complete document verification milestone';
    card1 = { label: 'Verification Queue', val: totalApps, trend: 'Assigned dossiers', color: '#0369a1' };
    card2 = { label: 'Awaiting Doc Review', val: underReviewCount, trend: 'OCR & Tamper checks', color: '#0284c7' };
    card3 = { label: 'Flagged Anomalies', val: deficiencyCount, trend: 'Hash collisions / expired', color: '#dc2626' };
    card4 = { label: 'Verified Dossiers', val: clearedCount, trend: '✓ Passed to compliance', color: '#16a34a' };
  } else if (role === 'compliance_reviewer') {
    roleTitle = 'Regulatory Scrutiny Desk';
    roleBadge = 'Compliance Reviewer';
    roleBadgeColor = '#6d28d9';
    roleBadgeBg = '#ede9fe';
    roleSubtitle = 'Review checklist-based compliance results, examine infrastructure evidence, and recommend statutory actions';
    card1 = { label: 'Scrutiny Queue', val: totalApps, trend: 'Active applications', color: '#6d28d9' };
    card2 = { label: 'Norms Under Review', val: underReviewCount, trend: 'APH 2026-27 evaluation', color: '#0284c7' };
    card3 = { label: 'Gaps / Inspection Recommended', val: deficiencyCount, trend: 'Physical scrutiny needed', color: '#dc2626' };
    card4 = { label: 'Recommended for Approval', val: clearedCount, trend: '✓ Forwarded to Decision-Maker', color: '#16a34a' };
  } else if (role === 'decision_maker') {
    roleTitle = 'Authorized AICTE Directorate';
    roleBadge = 'AICTE Decision-Maker';
    roleBadgeColor = '#b45309';
    roleBadgeBg = '#fef3c7';
    roleSubtitle = 'Executive regulatory decision authority: review complete dossiers and issue official approval or deficiency decrees';
    card1 = { label: 'Executive Queue', val: totalApps, trend: 'Total docket records', color: '#b45309' };
    card2 = { label: 'Pending Decree', val: underReviewCount, trend: 'Awaiting official signature', color: '#0284c7' };
    card3 = { label: 'Deficiencies Issued', val: deficiencyCount, trend: 'Formal notices served', color: '#dc2626' };
    card4 = { label: 'Signed Approvals (EoA)', val: clearedCount, trend: '✓ Official orders issued', color: '#16a34a' };
  } else if (role === 'admin') {
    roleTitle = 'System Administration & RBAC Cockpit';
    roleBadge = 'System Administrator';
    roleBadgeColor = '#334155';
    roleBadgeBg = '#f1f5f9';
    roleSubtitle = 'User accounts management, regulatory checklist rule engine configuration, and audit ledger monitoring';
    card1 = { label: 'Platform Applications', val: totalApps, trend: 'Active in system', color: '#334155' };
    card2 = { label: 'Active Pipeline Dossiers', val: underReviewCount, trend: 'Across all 5 roles', color: '#0284c7' };
    card3 = { label: 'Deficiency Ledger', val: deficiencyCount, trend: 'Statutory gap records', color: '#dc2626' };
    card4 = { label: 'Approved Records', val: clearedCount, trend: '✓ Clean clearance ledger', color: '#16a34a' };
  }

  return (
    <div className="animate-in">
      {/* Role-Specific Page Header */}
      <div className="page-title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: roleBadgeBg,
              color: roleBadgeColor
            }}>
              ● {roleBadge}
            </span>
          </div>
          <h2 className="page-title">
            {roleTitle}
          </h2>
          <p className="page-subtitle">
            {roleSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {role === 'institution' && onNavigatePage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigatePage('applications')}
            >
              + Submit New Application
            </button>
          )}
          {(role === 'verification_officer' || role === 'officer') && onNavigatePage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigatePage('doc-verification')}
            >
              🔍 Document Verification
            </button>
          )}
          {role === 'compliance_reviewer' && onNavigatePage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigatePage('hitl-review')}
            >
              🎯 Scrutiny Desk &amp; Remarks
            </button>
          )}
          {role === 'decision_maker' && onNavigatePage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigatePage('applications')}
            >
              🏛️ Decision Queue (Sign Orders)
            </button>
          )}
          {role === 'admin' && onNavigatePage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigatePage('settings')}
            >
              ⚙️ Manage Users &amp; Rules
            </button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.reload()}
            title="Refresh Database Data"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* 5-Stage Recommended Workflow Pipeline Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(30, 58, 138, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'uppercase', color: '#93c5fd' }}>
            5-Stage Statutory Access Flow · Backend RBAC Enforced
          </div>
          <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
            AI Findings Never Auto-Reject
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {[
            { step: '1. Institution', desc: 'Submit application & documents', active: role === 'institution', icon: '🎓' },
            { step: '2. AI Pipeline', desc: '5 internal agents generate findings', active: false, icon: '🤖' },
            { step: '3. Verification', desc: 'Officer audits OCR & tampering', active: role === 'verification_officer' || role === 'officer', icon: '🔍' },
            { step: '4. Compliance', desc: 'Reviewer scrutinizes APH gaps', active: role === 'compliance_reviewer', icon: '⚖️' },
            { step: '5. Decision-Maker', desc: 'Authorized decree & official orders', active: role === 'decision_maker', icon: '🏛️' }
          ].map((st, idx) => (
            <div
              key={idx}
              style={{
                background: st.active ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                color: st.active ? '#1e3a8a' : '#ffffff',
                borderRadius: '8px',
                padding: '10px 12px',
                border: st.active ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{st.icon}</span>
                <span>{st.step}</span>
              </div>
              <div style={{ fontSize: '10px', marginTop: '3px', opacity: st.active ? 0.9 : 0.75, lineHeight: '1.3' }}>
                {st.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Role-Tailored Metric Cards */}
      <div className="metrics-grid-4">
        <div className="metric-stat-card">
          <div className="metric-stat-label">{card1.label}</div>
          <div className="metric-stat-val" style={{ color: card1.color }}>{card1.val}</div>
          <div className="metric-stat-trend trend-green">{card1.trend}</div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-label">{card2.label}</div>
          <div className="metric-stat-val" style={{ color: card2.color }}>{card2.val}</div>
          <div className="metric-stat-trend trend-blue">{card2.trend}</div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-label">{card3.label}</div>
          <div className="metric-stat-val" style={{ color: card3.val > 0 ? '#dc2626' : undefined }}>{card3.val}</div>
          <div className="metric-stat-trend trend-red">{card3.trend}</div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-label">{card4.label}</div>
          <div className="metric-stat-val" style={{ color: '#16a34a' }}>{card4.val}</div>
          <div className="metric-stat-trend trend-green">{card4.trend}</div>
        </div>
      </div>

      {/* Dashboard Main Grid: Chart + Recent Applications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', marginTop: '24px' }}>
        {/* Left Column: Recent Applications in Queue */}
        <div className="panel-card">
          <div className="panel-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="panel-card-title">
              {role === 'institution' ? 'My Recent Applications' : 'Live Applications Queue'}
            </h3>
            {onNavigatePage && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigatePage('applications')}
              >
                View Full Queue →
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Institution Name</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                      No applications found in the active queue.
                    </td>
                  </tr>
                ) : (
                  recentApps.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: '700', color: '#1e3a8a' }}>
                        {app.application_id || `APP-${app.id}`}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{app.institution_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{app.city}, {app.state}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#f1f5f9',
                          color: '#475569',
                          textTransform: 'capitalize'
                        }}>
                          {(app.current_stage || 'submission').replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${app.status}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectApp && onSelectApp(app.application_id || String(app.id))}
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Status Breakdown Chart */}
        <div className="panel-card">
          <div className="panel-card-header">
            <h3 className="panel-card-title">Status Breakdown</h3>
          </div>
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            {chartData.map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                  <span>{item.name}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {item.value} ({item.percent})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
