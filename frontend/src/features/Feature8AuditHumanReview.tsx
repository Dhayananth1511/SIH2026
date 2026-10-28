import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Send,
  History,
  Lock,
  Landmark,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Application, AuditEvent, Finding } from '../types';
import { getAuditLog, issueOfficialDecision } from '../api';

interface Props {
  application: Application | null;
  findings: Finding[];
  onRefresh: () => void;
}

export default function Feature8AuditHumanReview({
  application,
  findings,
  onRefresh
}: Props) {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Review Checklist state
  const [checkedLand, setCheckedLand] = useState(true);
  const [checkedFire, setCheckedFire] = useState(true);
  const [checkedFaculty, setCheckedFaculty] = useState(true);
  const [checkedFinance, setCheckedFinance] = useState(true);
  const [officerRemarks, setOfficerRemarks] = useState('');

  // Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<'CLEARED' | 'DEFICIENCY' | 'REJECTED'>('CLEARED');
  const [officerName, setOfficerName] = useState('Dr. Priya Sharma');
  const [officerDesignation, setOfficerDesignation] = useState('Senior Scrutiny Officer, AICTE Directorate');
  const [orderNumber, setOrderNumber] = useState(`AICTE/ORDER/2026/${application?.application_id || 'APP-2001'}`);
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  const fetchAudits = async () => {
    if (!application?.application_id) return;
    setLoadingAudits(true);
    try {
      const data = await getAuditLog(application.application_id);
      setAuditEvents(data);
    } catch (e) {
      console.error('Failed to load audit events', e);
    } finally {
      setLoadingAudits(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [application?.application_id]);

  const handleOpenDecision = (decision: 'CLEARED' | 'DEFICIENCY' | 'REJECTED') => {
    setSelectedDecision(decision);
    if (decision === 'CLEARED') {
      setDecisionReason('Statutory extension of approval granted upon comprehensive evidence-backed verification of land, building, safety, and faculty norms.');
    } else if (decision === 'DEFICIENCY') {
      setDecisionReason('Deficiency notice issued with 15 calendar days cure window to furnish missing Fire Safety NOC and rectify land acreage shortfall.');
    } else {
      setDecisionReason('Adverse regulatory refusal issued due to fraudulent FDR hash collision and digital tamper artifacts detected in statutory certificates.');
    }
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application?.application_id) return;

    setSubmitting(true);
    setDecisionSuccess(null);
    try {
      await issueOfficialDecision(
        application.application_id,
        selectedDecision,
        decisionReason,
        orderNumber,
        officerDesignation
      );
      setDecisionSuccess(`Official Statutory Decision (${selectedDecision}) recorded successfully under Order No: ${orderNumber}!`);
      setShowDecisionModal(false);
      onRefresh();
      fetchAudits();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit official decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#1e3a8a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              FEATURE 8 OF 8
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Maintain an Audit Trail and Require Human Review Before Adverse Regulatory Action
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Immutable statutory event log with mandatory Human-in-the-Loop (HITL) safeguard preventing autonomous adverse actions without human review.
          </p>
        </div>
      </div>

      {decisionSuccess && (
        <div style={{
          padding: '14px 20px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          color: '#065f46',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{decisionSuccess}</span>
        </div>
      )}

      {/* Mandatory Statutory Human-in-the-Loop Precondition Banner */}
      <div style={{
        background: '#fffbeb',
        border: '2px solid #f59e0b',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: '#fef3c7',
          color: '#b45309',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldAlert size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#92400e', margin: '0 0 4px 0' }}>
            Statutory Human Review Precondition (Adverse Action Safeguard)
          </h3>
          <p style={{ fontSize: '12.5px', color: '#78350f', margin: 0, lineHeight: '1.5' }}>
            Autonomous AI agents and OCR validation algorithms are legally restricted to finding generation and anomaly flagging. <strong>Automated adverse regulatory action (deficiency notice, refusal, or intake penalty) is strictly prohibited by law.</strong> Every decision requires an authorized human scrutiny officer review, written justification, and signed statutory decree.
          </p>
        </div>
      </div>

      {/* Grid: Left = Human Review Desk, Right = Immutable Audit Trail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Left: Human Review Officer Action Desk */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={16} color="#1e3a8a" />
                <span>Authorized Officer Scrutiny Inspection</span>
              </h3>
              <span className="badge badge-info">
                {findings.length} Open Flags
              </span>
            </div>

            {/* Officer Inspection Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={checkedLand}
                  onChange={e => setCheckedLand(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#1e3a8a' }}
                />
                <span style={{ color: '#334155', fontWeight: '500' }}>
                  Physically verified land ownership deed &amp; contiguous acreage with Sub-Registrar
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={checkedFire}
                  onChange={e => setCheckedFire(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#1e3a8a' }}
                />
                <span style={{ color: '#334155', fontWeight: '500' }}>
                  Examined Fire Safety NOC validity and forensic alteration flags
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={checkedFaculty}
                  onChange={e => setCheckedFaculty(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#1e3a8a' }}
                />
                <span style={{ color: '#334155', fontWeight: '500' }}>
                  Audited Faculty Master List, cadre ratio, and student intake numbers
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={checkedFinance}
                  onChange={e => setCheckedFinance(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#1e3a8a' }}
                />
                <span style={{ color: '#334155', fontWeight: '500' }}>
                  Validated Joint FDR deposit certificate and confirmed lien in favor of AICTE
                </span>
              </label>
            </div>

            {/* Officer Observation Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Scrutiny Officer Inspection Remarks:
              </label>
              <textarea
                value={officerRemarks}
                onChange={e => setOfficerRemarks(e.target.value)}
                placeholder="Enter official observations, hearing notes, or evidence justifications before issuing regulatory decree..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Official Regulatory Action Buttons */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              Execute Official Statutory Decision Decree:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <button
                onClick={() => handleOpenDecision('CLEARED')}
                className="btn btn-sm"
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12px',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={13} />
                <span>Issue Approval (EoA)</span>
              </button>

              <button
                onClick={() => handleOpenDecision('DEFICIENCY')}
                className="btn btn-sm"
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12px',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={13} />
                <span>Issue Deficiency Memo</span>
              </button>

              <button
                onClick={() => handleOpenDecision('REJECTED')}
                className="btn btn-sm"
                style={{
                  background: '#b91c1c',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12px',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={13} />
                <span>Adverse Action: Refusal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Immutable Statutory Audit Trail */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="#1e3a8a" />
                <span>Immutable Regulatory Audit Trail</span>
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Cryptographically tracked timeline of all system and officer actions.
              </p>
            </div>
            <button onClick={fetchAudits} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
              Refresh Log
            </button>
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {auditEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                <History size={32} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <span>No audit events recorded for this application.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {auditEvents.map((evt, idx) => (
                  <div
                    key={evt.id || idx}
                    style={{
                      borderLeft: '3px solid #1e3a8a',
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '12.5px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#0f172a' }}>{evt.action}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#1e3a8a' }}>{evt.actor_name || 'Autonomous Scrutiny Engine'}</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>{evt.entity_type}</span>
                    </div>
                    {evt.details && Object.keys(evt.details).length > 0 && (
                      <div style={{
                        marginTop: '6px',
                        background: '#ffffff',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        color: '#64748b',
                        fontFamily: 'monospace'
                      }}>
                        {JSON.stringify(evt.details)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Decision Modal */}
      {showDecisionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              background: selectedDecision === 'CLEARED' ? '#047857' : selectedDecision === 'DEFICIENCY' ? '#d97706' : '#b91c1c',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ fontSize: '15px' }}>Official AICTE Statutory Decree Signing</strong>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Decision Type: {selectedDecision}
                </div>
              </div>
              <button
                onClick={() => setShowDecisionModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '20px' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Statutory Order Number:
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Reviewing Officer Name:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Officer Designation:
                </label>
                <input
                  type="text"
                  value={officerDesignation}
                  onChange={e => setOfficerDesignation(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Legal Grounds &amp; Statutory Justification (Mandatory):
                </label>
                <textarea
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                  required
                />
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '11.5px',
                color: '#64748b'
              }}>
                By executing this decree, you confirm that human inspection of documents, findings, and evidence has been completed in compliance with AICTE statutory guidelines.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-sm"
                  style={{
                    background: selectedDecision === 'CLEARED' ? '#047857' : selectedDecision === 'DEFICIENCY' ? '#d97706' : '#b91c1c',
                    color: '#ffffff',
                    fontWeight: '700',
                    border: 'none',
                    padding: '8px 16px'
                  }}
                >
                  {submitting ? 'Committing Decree...' : 'Sign & Submit Official Decree'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
