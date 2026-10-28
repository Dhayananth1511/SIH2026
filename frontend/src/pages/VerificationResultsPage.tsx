import React, { useState, useEffect } from 'react';
import { getFindings, getApplication } from '../api';
import type { Finding, Application } from '../types';

interface Props {
  appId?: string;
  onNavigateTab?: (targetPage: string) => void;
  onViewFindingDetail?: (findingType: string) => void;
}

export default function VerificationResultsPage({ appId = '', onNavigateTab }: Props) {
  const [activeTab, setActiveTab] = useState<'summary' | 'documents' | 'anomalies' | 'compliance' | 'audit'>('summary');
  const [app, setApp] = useState<Application | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!appId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getApplication(appId).catch(() => null),
      getFindings(appId).catch(() => [])
    ]).then(([appData, findingsData]) => {
      setApp(appData);
      setFindings(findingsData || []);
    }).finally(() => setLoading(false));
  }, [appId]);

  const criticalFindings = findings.filter(f => f.severity === 'critical' || f.severity === 'high');
  const inconsistencyFindings = findings.filter(f => f.severity === 'medium');
  const anomalyFindings = findings.filter(f => f.severity === 'low');

  const findingsList = [
    {
      title: 'Missing Documents & Endorsements',
      count: criticalFindings.length,
      color: '#ef4444',
      desc: criticalFindings.length > 0 ? criticalFindings[0].title || criticalFindings[0].finding_text || 'Statutory proof required' : 'All required statutory forms uploaded'
    },
    {
      title: 'Inconsistencies & Mismatches',
      count: inconsistencyFindings.length,
      color: '#f59e0b',
      desc: inconsistencyFindings.length > 0 ? inconsistencyFindings[0].title || inconsistencyFindings[0].finding_text || 'Registry discrepancy flagged' : 'No cross-referencing contradictions detected'
    },
    {
      title: 'Document Forensic Anomalies',
      count: anomalyFindings.length,
      color: '#3b82f6',
      desc: anomalyFindings.length > 0 ? anomalyFindings[0].title || anomalyFindings[0].finding_text || 'Secondary compression artifact' : 'Zero pixel or metadata tampering detected'
    },
    {
      title: 'Statutory Compliance Deficiencies',
      count: findings.length > 0 ? 1 : 0,
      color: '#ef4444',
      desc: 'Evaluation against APH 2025-27 chapters'
    }
  ];

  const score = app?.scrutiny_score ? Math.round(app.scrutiny_score) : 0;

  return (
    <div className="animate-in">
      {/* Title */}
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Verification Results - {appId}</h2>
          <p className="page-subtitle">Real-time multi-agent validation outcome and deficiency report</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="sub-nav-tabs">
        {(['summary', 'documents', 'anomalies', 'compliance', 'audit'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'documents' && onNavigateTab) onNavigateTab('doc-verification');
              if (tab === 'compliance' && onNavigateTab) onNavigateTab('compliance-check');
              if (tab === 'audit' && onNavigateTab) onNavigateTab('audit-logs');
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overall Status Banner with Confidence Score */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${findings.length > 0 ? '#fee2e2' : '#bbf7d0'}`,
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: findings.length > 0 ? '#fee2e2' : '#dcfce7',
            color: findings.length > 0 ? '#b91c1c' : '#15803d',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            ● {findings.length > 0 ? 'Requires Attention' : 'Cleared & Verified'}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
            Overall Status: {findings.length > 0 ? 'Requires Attention' : 'Compliance Verified'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            {findings.length > 0
              ? `${findings.length} findings require officer adjudication for ${app?.institution_name || appId}.`
              : `All statutory requirements satisfied for ${app?.institution_name || appId}.`
            }
          </p>
        </div>

        {/* Circular Confidence Score Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Confidence Score</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Multi-agent consensus</div>
          </div>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: `conic-gradient(#10b981 0% ${score}%, #e2e8f0 ${score}% 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '16px',
              color: '#0f172a'
            }}>
              {score}%
            </div>
          </div>
        </div>
      </div>

      {/* Key Findings List */}
      <div className="white-card">
        <div className="white-card-header">
          <span className="white-card-title">Key Findings from Database</span>
        </div>
        <div>
          {findingsList.map((item, idx) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: idx < findingsList.length - 1 ? '1px solid #e2e8f0' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: item.count > 0 ? (item.color === '#ef4444' ? '#fee2e2' : '#fef3c7') : '#e0f2fe',
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '14px'
                }}>
                  {item.count}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                    {item.title}: <span style={{ color: item.color }}>{item.count}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {item.desc}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigateTab ? onNavigateTab('hitl-review') : alert(`Details for ${item.title}`)}
                style={{ color: '#2563eb', borderColor: '#bfdbfe', fontWeight: '600' }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
