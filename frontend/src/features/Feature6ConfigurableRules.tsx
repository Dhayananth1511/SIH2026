import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  RefreshCw,
  Scale
} from 'lucide-react';
import { Application, RegulatoryRule, ComplianceCheck } from '../types';
import {
  getRegulatoryRules,
  createRegulatoryRule,
  updateRegulatoryRule,
  deleteRegulatoryRule,
  runValidation
} from '../api';

interface Props {
  application: Application | null;
  complianceChecks: ComplianceCheck[];
  onRefresh: () => void;
  onNext: () => void;
}

export default function Feature6ConfigurableRules({
  application,
  complianceChecks,
  onRefresh,
  onNext
}: Props) {
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [reEvaluating, setReEvaluating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_id: 'APH-7.1',
    rule_name: 'AI & Emerging Tech Laboratory Norms',
    category: 'Laboratory Infrastructure',
    required_value: 'Min 60 High-Compute AI Terminals',
    severity: 'high',
    is_active: true
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await getRegulatoryRules();
      setRules(data);
    } catch (e) {
      console.error('Failed to load rules', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (rule: RegulatoryRule) => {
    try {
      await updateRegulatoryRule(rule.rule_id, { is_active: !rule.is_active });
      setStatusMsg(`Rule ${rule.rule_id} ${!rule.is_active ? 'enabled' : 'disabled'}. Click "Re-Evaluate" to update results.`);
      fetchRules();
    } catch (e) {
      setStatusMsg('Failed to update rule status.');
    }
  };

  const handleStartEdit = (rule: RegulatoryRule) => {
    setEditingRuleId(rule.rule_id);
    setEditValue(rule.required_value || '');
  };

  const handleSaveEdit = async (ruleId: string) => {
    try {
      await updateRegulatoryRule(ruleId, { required_value: editValue });
      setStatusMsg(`Updated benchmark threshold for ${ruleId} to "${editValue}". Click "Re-Evaluate" to test.`);
      setEditingRuleId(null);
      fetchRules();
    } catch (e) {
      setStatusMsg('Failed to update rule threshold.');
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteRegulatoryRule(ruleId);
      setStatusMsg(`Rule ${ruleId} deleted.`);
      fetchRules();
    } catch (e) {
      setStatusMsg('Failed to delete rule.');
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRegulatoryRule(newRule);
      setStatusMsg(`Added custom compliance rule ${newRule.rule_id}.`);
      setShowAddModal(false);
      fetchRules();
    } catch (err: any) {
      setStatusMsg(err?.response?.data?.detail || 'Failed to add rule.');
    }
  };

  const handleReEvaluate = async () => {
    if (!application?.application_id) return;
    setReEvaluating(true);
    setStatusMsg(null);
    try {
      await runValidation(application.application_id);
      setStatusMsg('Compliance engine executed successfully! Scrutiny score and checks recalculated.');
      onRefresh();
    } catch (e) {
      setStatusMsg('Validation re-evaluation failed.');
    } finally {
      setReEvaluating(false);
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
              FEATURE 6 OF 8
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Check Application Information Against Configurable Compliance Rules
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Dynamic APH 2026-27 statutory rules engine. Configure benchmarks, toggle policies, or add custom rules and evaluate in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleReEvaluate}
            disabled={reEvaluating}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000000',
              fontWeight: '700',
              fontSize: '12px',
              padding: '8px 14px',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: reEvaluating ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={13} fill="#000000" />
            <span>{reEvaluating ? 'Re-Evaluating Rules...' : '⚡ Re-Evaluate Compliance'}</span>
          </button>
          <button
            onClick={onNext}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Feature 7: Evidence Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          color: '#1e3a8a',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          {statusMsg}
        </div>
      )}

      {/* Rules Engine Control Table */}
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
              <Scale size={16} color="#1e3a8a" />
              <span>Configurable Statutory Rules (AICTE APH 2026-27)</span>
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Edit benchmarks below (e.g. adjust land from 5.0 to 4.0 acres) to observe immediate impact on compliance results.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={13} />
            <span>Add Custom Rule</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Rule ID</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Category &amp; Norm Name</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Required Benchmark</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Current Check Result</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Active</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => {
                const check = complianceChecks.find(c => c.rule_id === r.rule_id);
                const isEditing = editingRuleId === r.rule_id;

                return (
                  <tr key={r.rule_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#1e3a8a', fontFamily: 'monospace' }}>
                      {r.rule_id}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{r.rule_name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{r.category}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #3b82f6',
                              fontSize: '12px'
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(r.rule_id)}
                            className="btn btn-sm btn-primary"
                            style={{ padding: '4px 8px' }}
                          >
                            <Save size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '600', color: '#334155' }}>{r.required_value}</span>
                          <button
                            onClick={() => handleStartEdit(r)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                            title="Edit Required Threshold"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {check ? (
                        check.result === 'pass' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> PASS
                          </span>
                        ) : check.result === 'fail' ? (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={11} /> FAIL
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={11} /> WARNING
                          </span>
                        )
                      ) : (
                        <span className="badge badge-info">PENDING</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleToggleRule(r)}
                        style={{
                          background: r.is_active ? '#ecfdf5' : '#f1f5f9',
                          color: r.is_active ? '#047857' : '#64748b',
                          border: `1px solid ${r.is_active ? '#a7f3d0' : '#cbd5e1'}`,
                          borderRadius: '14px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {r.is_active ? 'ON' : 'OFF'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(r.rule_id)}
                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        title="Delete Rule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Rule Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <strong style={{ fontSize: '14px' }}>Add Configurable Statutory Compliance Rule</strong>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddRule} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Rule ID:
                </label>
                <input
                  type="text"
                  value={newRule.rule_id}
                  onChange={e => setNewRule({ ...newRule, rule_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Rule Name:
                </label>
                <input
                  type="text"
                  value={newRule.rule_name}
                  onChange={e => setNewRule({ ...newRule, rule_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Norm Category:
                </label>
                <input
                  type="text"
                  value={newRule.category}
                  onChange={e => setNewRule({ ...newRule, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Required Benchmark Threshold:
                </label>
                <input
                  type="text"
                  value={newRule.required_value}
                  onChange={e => setNewRule({ ...newRule, required_value: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
