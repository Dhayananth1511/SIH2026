import React, { useState, useEffect } from 'react';
import { getApplications, getCompliance, runValidation } from '../api';
import type { Application, ComplianceCheck } from '../types';

interface Props {
  appId?: string;
  onRunAnalysis?: () => void;
  onViewResults?: () => void;
}

export default function ComplianceCheckPage({ appId = '', onRunAnalysis, onViewResults }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>(appId);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchChecks = async (targetId: string) => {
    if (!targetId) {
      setComplianceChecks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCompliance(targetId);
      setComplianceChecks(data || []);
    } catch (err) {
      console.error(err);
      setComplianceChecks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getApplications().then(all => {
      setApps(all);
      if (all.length > 0) {
        const found = all.find(a => String(a.application_id || a.id) === selectedApp);
        if (!found) {
          const firstId = String(all[0].application_id || all[0].id);
          setSelectedApp(firstId);
        }
      } else {
        setSelectedApp('');
        setLoading(false);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedApp) {
      fetchChecks(selectedApp);
    }
  }, [selectedApp]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRunAnalysis = async () => {
    if (!selectedApp) {
      alert('Please create or select an application first.');
      return;
    }
    setAnalyzing(true);
    setNotice(null);
    try {
      const res = await runValidation(selectedApp);
      setNotice(`✓ ${res.message || 'Validation evaluation completed.'} Scrutiny score: ${res.scrutiny_score}%`);
      await fetchChecks(selectedApp);
      if (onViewResults) {
        setTimeout(() => onViewResults(), 1200);
      }
    } catch (err: any) {
      setNotice(`Validation error: ${err?.response?.data?.detail || err?.message || 'Server error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="animate-in">
      {/* Title */}
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Compliance Check {selectedApp ? `— ${selectedApp}` : ''}</h2>
          <p className="page-subtitle">Real-time evaluation against AICTE Approval Process Handbook (APH 2025-27) norms</p>
        </div>

        {apps.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Select Application:</span>
            <select
              className="filter-select"
              value={selectedApp}
              onChange={e => setSelectedApp(e.target.value)}
            >
              {apps.map(a => {
                const id = String(a.application_id || a.id);
                return (
                  <option key={id} value={id}>
                    {id} - {a.institution_name}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Regulatory Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', color: '#2563eb' }}>⚙️</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a' }}>
              Statutory Regulatory Engine (APH 2025-27)
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              Automated multi-agent verification for Land Title, Fire NOC, Faculty Cadre, Building Plan & Endowment FDRs
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => alert('AICTE Approval Process Handbook (APH 2025-27) statutory norm evaluation active.')}
        >
          View Norms
        </button>
      </div>

      {notice && (
        <div style={{
          padding: '12px 18px',
          background: notice.includes('error') ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${notice.includes('error') ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '8px',
          color: notice.includes('error') ? '#b91c1c' : '#15803d',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          {notice}
        </div>
      )}

      {/* Compliance Requirement Items */}
      {loading ? (
        <div className="white-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          Loading compliance evaluations from database...
        </div>
      ) : apps.length === 0 ? (
        <div className="white-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📑</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            No Applications in Database
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
            Create an application first in the Applications tab to run compliance checks and view statutory evaluations.
          </p>
        </div>
      ) : complianceChecks.length === 0 ? (
        <div className="white-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚖️</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            No Compliance Analysis Run Yet for {selectedApp}
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
            Click the button below to run the AI compliance verification pipeline against AICTE Approval Process Handbook standards.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleRunAnalysis}
            disabled={analyzing}
            style={{ padding: '10px 24px', fontWeight: '700' }}
          >
            {analyzing ? 'Evaluating Regulatory Norms...' : '▶ Run Compliance Analysis Now'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {complianceChecks.map(item => {
            const isPass = item.result === 'pass';
            const isWarning = item.result === 'warning';
            const isFail = item.result === 'fail';

            const statusClass = isPass ? 'compliant' : isWarning ? 'partial' : 'non-compliant';
            const statusText = isPass ? 'Compliant (Pass)' : isWarning ? 'Pending Document (Warning)' : 'Deficiency (Fail)';
            const icon = isPass ? '✓' : isWarning ? '!' : '✕';
            const iconColor = isPass ? '#16a34a' : isWarning ? '#d97706' : '#dc2626';
            const iconBg = isPass ? '#dcfce7' : isWarning ? '#fef3c7' : '#fee2e2';

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <div
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: iconBg,
                      color: iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '13px'
                    }}>
                      {icon}
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {item.rule_name}
                      </span>
                      <span style={{ marginLeft: '12px', fontSize: '11px', color: '#94a3b8' }}>
                        {item.rule_id} · {item.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span className={`status-pill ${statusClass}`}>
                      {statusText}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '14px', transform: expandedId === item.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div style={{
                    padding: '14px 20px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    color: '#475569'
                  }}>
                    <div style={{ marginBottom: '6px', fontWeight: '600', color: '#1e293b' }}>
                      Statutory Rule {item.rule_id}: {item.rule_name} ({item.category})
                    </div>
                    <p style={{ marginBottom: '8px' }}>{item.details}</p>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '11.5px', color: '#64748b' }}>
                      {item.required_value && <div><strong>Requirement:</strong> {item.required_value}</div>}
                      {item.evidence_value && <div><strong>Evidence:</strong> {item.evidence_value}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Action Button if checks already present */}
      {complianceChecks.length > 0 && (
        <div>
          <button
            className="btn btn-primary"
            onClick={handleRunAnalysis}
            disabled={analyzing}
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700' }}
          >
            {analyzing ? 'Re-evaluating Regulatory Norms...' : '↻ Re-Run Statutory Compliance Evaluation'}
          </button>
        </div>
      )}
    </div>
  );
}
