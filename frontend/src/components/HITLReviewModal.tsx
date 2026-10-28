import React, { useState } from 'react';
import { reviewFinding } from '../api';
import type { Finding } from '../types';

interface Props {
  finding: Finding;
  onClose: () => void;
  onSave: () => void;
}

export default function HITLReviewModal({ finding, onClose, onSave }: Props) {
  const [action, setAction] = useState<string>('confirmed');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!remark.trim()) { setError('Statutory remark is mandatory for HITL review.'); return; }
    setLoading(true);
    try {
      await reviewFinding(finding.id, action, remark);
      onSave();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Review submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>⚖️ HITL Officer Review</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Mandatory Statutory Review · All actions are permanently audited
            </div>
          </div>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Finding Summary */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>AI Finding ({finding.rule_id})</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{finding.rule_description}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{finding.finding_text}</div>
            <div style={{ marginTop: 8 }}>
              <span className={`severity-badge ${finding.severity}`}>{finding.severity.toUpperCase()}</span>
            </div>
          </div>

          {/* Action Selection */}
          <div className="form-group">
            <label className="form-label">Officer Decision</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { value: 'confirmed', label: '✅ Confirm Deficiency', desc: 'Issue formal deficiency notice', color: 'var(--status-success)' },
                { value: 'dismissed', label: '🚫 Dismiss Finding', desc: 'Override with statutory reason', color: 'var(--text-muted)' },
                { value: 'escalated', label: '🔺 Escalate to SSC', desc: 'Refer to Standing Scrutiny Committee', color: 'var(--status-danger)' },
                { value: 'open', label: '⏸ Defer Review', desc: 'Request additional information', color: 'var(--status-warning)' },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setAction(opt.value)}
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${action === opt.value ? opt.color : 'var(--border-secondary)'}`,
                    background: action === opt.value ? `${opt.color}10` : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: action === opt.value ? opt.color : 'var(--text-primary)' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Remark */}
          <div className="form-group">
            <label className="form-label">
              Statutory Justification <span style={{ color: 'var(--status-danger)' }}>* Required</span>
            </label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Provide mandatory statutory justification for this decision (e.g., 'Accepted under APH clause 4.2(a) — state government exemption verified via portal reference #...')"
              value={remark}
              onChange={e => setRemark(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div style={{ fontSize: 11, color: 'var(--text-disabled)', background: 'rgba(33,150,243,0.05)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)' }}>
            🔒 This decision will be permanently recorded in the cryptographic audit trail with your Officer ID, timestamp, and digital signature hash. It cannot be deleted or modified post-submission.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Submitting...' : '🔐 Submit Signed Decision'}
          </button>
        </div>
      </div>
    </div>
  );
}
