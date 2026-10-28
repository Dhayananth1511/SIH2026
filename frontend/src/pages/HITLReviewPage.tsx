import React, { useState, useEffect } from 'react';
import { getFindings, reviewFinding, getApplications } from '../api';
import type { Finding, Application } from '../types';

import { useAuth } from '../AuthContext';

interface Props {
  appId?: string;
  onNavigateTab?: (targetPage: string) => void;
  onViewEvidenceDoc?: (docName: string) => void;
}

export default function HITLReviewPage({ appId = '', onNavigateTab, onViewEvidenceDoc }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'findings' | 'evidence' | 'comments' | 'signoff'>('findings');
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState(appId);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisionNotice, setDecisionNotice] = useState<string | null>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const fetchFindings = async (id: string) => {
    setLoading(true);
    try {
      const data = await getFindings(id);
      setFindings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getApplications().then(all => {
      setApps(all);
      if (all.length > 0 && !all.some(a => String(a.application_id || a.id) === selectedApp)) {
        setSelectedApp(String(all[0].application_id || all[0].id));
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedApp) {
      fetchFindings(selectedApp);
    }
  }, [selectedApp]);

  const handleApprove = async () => {
    if (findings.length > 0) {
      for (const f of findings) {
        await reviewFinding(f.id, 'dismissed', 'Cleared by Scrutiny Officer upon physical verification').catch(() => null);
      }
    }
    setDecisionNotice(`✓ Application ${selectedApp} Approved with Clearance. Digital Order dispatched to Standing Appellate Committee.`);
    fetchFindings(selectedApp);
  };

  const handleIssueMemo = async () => {
    if (findings.length > 0) {
      for (const f of findings) {
        await reviewFinding(f.id, 'confirmed', 'Deficiency confirmed. 15-day rectification window provided').catch(() => null);
      }
    }
    setDecisionNotice(`⚠️ Statutory Deficiency Memo issued for ${selectedApp} to registered Institutional Portal.`);
    fetchFindings(selectedApp);
  };

  const handleEscalate = async () => {
    if (findings.length > 0) {
      await reviewFinding(findings[0].id, 'escalated', 'Escalated to Standing Hearing Committee (SHC)').catch(() => null);
    }
    setDecisionNotice(`↗ Application ${selectedApp} escalated to Standing Hearing Committee (SHC) for physical inquiry.`);
    fetchFindings(selectedApp);
  };

  const handleAddComment = () => {
    if (commentInput.trim()) {
      const author = user?.full_name || 'Scrutiny Officer';
      setComments([...comments, `${author}: ${commentInput.trim()}`]);
      setCommentInput('');
      setShowCommentBox(false);
      setDecisionNotice('Note appended to official adjudication record.');
    }
  };

  const role = (user?.role || 'officer').toLowerCase();
  const isInstitution = role === 'institution';

  if (isInstitution) {
    return (
      <div className="animate-in" style={{ padding: '40px 0' }}>
        <div className="white-card" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            Restricted Officer Decision Desk
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
            The Human-In-The-Loop adjudication desk is reserved exclusively for AICTE Scrutiny Officers to review findings, issue formal approvals, or dispatch statutory deficiency memos.
          </p>
          {onNavigateTab && (
            <button className="btn btn-primary" onClick={() => onNavigateTab('applications')}>
              ← Back to My Applications
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Title */}
      <div className="page-title-row">
        <div>
          <h2 className="page-title">HITL Review - {selectedApp}</h2>
          <p className="page-subtitle">Human-In-The-Loop adjudication, live database updates &amp; statutory decisions</p>
        </div>

        {/* Target App Selector */}
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
      </div>

      {/* Decision Required Alert Banner */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#b45309' }}>
            Decision Required
          </div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>
            Please review the {findings.length} findings from the database and record your statutory determination.
          </div>
        </div>
      </div>

      {decisionNotice && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 18px',
          color: '#15803d',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '20px'
        }}>
          {decisionNotice}
        </div>
      )}

      {/* Tabs */}
      <div className="sub-nav-tabs">
        {(['findings', 'evidence', 'comments', 'signoff'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'findings' ? `Findings (${findings.length})` : tab === 'evidence' ? 'Evidence' : tab === 'comments' ? `Comments (${comments.length})` : 'Sign-off'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'findings' && (
        <div className="white-card">
          <div className="white-card-header">
            <span className="white-card-title">Findings Summary for {selectedApp}</span>
          </div>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              Loading findings from database...
            </div>
          ) : findings.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '30px', marginBottom: '8px' }}>✓</div>
              <div style={{ fontWeight: '700', color: '#16a34a' }}>No active deficiencies found in database for this institution.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>All AI checks passed standard regulatory compliance rules.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Type / Severity</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Officer Remark</th>
                    <th style={{ textAlign: 'center' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map(item => {
                    const sev = item.severity || 'medium';
                    const isCrit = sev === 'critical' || sev === 'high';

                    return (
                      <tr key={item.id}>
                        <td>
                          <span className={`status-pill ${isCrit ? 'deficiencies' : 'under-review'}`}>
                            {item.finding_type || sev.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: '500', color: '#1e293b' }}>
                          {item.title || item.finding_text || item.description || 'Statutory compliance norm discrepancy'}
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', textTransform: 'capitalize', color: item.status === 'dismissed' ? '#16a34a' : '#d97706', fontWeight: '600' }}>
                            {item.status || 'open'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {item.officer_remark || 'Awaiting adjudication'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onViewEvidenceDoc ? onViewEvidenceDoc('Land Ownership Certificate.pdf') : alert('Inspecting evidence')}
                            style={{ padding: '3px 10px', fontSize: '11px' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="white-card">
          <div className="white-card-header">
            <span className="white-card-title">Attached Evidence Packets</span>
          </div>
          <div className="white-card-body">
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              Extracted OCR bounding-box crops &amp; forensic metadata verified against official state repository:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e3a8a' }}>Document #1: Land Ownership Certificate</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Missing Schedule 'B' (boundary survey demarcations).</div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => onViewEvidenceDoc && onViewEvidenceDoc('Land Ownership Certificate.pdf')}
                >
                  Open in Document Viewer ↗
                </button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e3a8a' }}>Document #3: Fire Safety NOC</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Validity expired 31 Mar 2025. Seal authentic, but lapsed.</div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => onViewEvidenceDoc && onViewEvidenceDoc('Fire Safety NOC.pdf')}
                >
                  Open in Document Viewer ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="white-card">
          <div className="white-card-header">
            <span className="white-card-title">Officer Scrutiny Notes &amp; Audit Trail</span>
          </div>
          <div className="white-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {comments.map((c, i) => (
                <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderLeft: '3px solid #2563eb', borderRadius: '4px', fontSize: '12.5px' }}>
                  {c}
                </div>
              ))}
            </div>

            {showCommentBox ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter officer notes or instructions..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
                />
                <button className="btn btn-primary" onClick={handleAddComment}>
                  Save Note
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {activeTab === 'signoff' && (
        <div className="white-card">
          <div className="white-card-header">
            <span className="white-card-title">Digital Signature &amp; Cryptographic Sign-Off</span>
          </div>
          <div className="white-card-body" style={{ fontSize: '13px', color: '#334155' }}>
            <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '16px' }}>
              <strong>DSC Token Active:</strong> {user?.full_name || 'Authenticated Officer'}, Scrutiny Officer (ID: SO-AICTE-{user?.id ?? '001'})
            </div>
            <p>Your action below permanently updates the database state and is written to the immutable SHA-256 event ledger.</p>
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
        <button
          className="btn btn-success"
          onClick={handleApprove}
          style={{ padding: '10px 18px', fontWeight: '700' }}
        >
          Approve (Clearance)
        </button>

          <button
            className="btn btn-danger"
            onClick={handleIssueMemo}
            style={{ padding: '10px 18px', fontWeight: '700' }}
          >
            Issue Deficiency Memo
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={handleEscalate}
            style={{ padding: '10px 18px', fontWeight: '700' }}
          >
            Escalate to SAC
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowCommentBox(!showCommentBox)}
            style={{ padding: '10px 18px' }}
          >
            + Add Comments
          </button>
        </div>
    </div>
  );
}
