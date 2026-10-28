import React, { useState, useEffect } from 'react';
import {
  getAdminUsers,
  updateAdminUserRole,
  getAdminRules,
  createAdminRule,
  updateAdminRule,
  deleteAdminRule,
  getAuditLogs
} from '../api';
import type { User, RegulatoryRule, AuditEvent } from '../types';
import {
  Users,
  Settings,
  Scroll,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Shield,
  Activity,
  Search
} from 'lucide-react';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function AdminViews({ subPage, onNavigate }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Rule Create / Edit Modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    rule_id: '',
    rule_name: '',
    category: 'Statutory Safety',
    description: '',
    required_value: '',
    severity: 'high',
    is_mandatory: true
  });

  useEffect(() => {
    loadAdminData();
  }, [subPage]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, rulesData, auditData] = await Promise.all([
        getAdminUsers().catch(() => []),
        getAdminRules().catch(() => []),
        getAuditLogs().catch(() => [])
      ]);
      setUsers(usersData);
      setRules(rulesData);
      setAuditLogs(auditData);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateAdminUserRole(userId, newRole);
      setFeedbackMsg(`✓ User role updated to ${newRole}`);
      loadAdminData();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to update user role.');
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRuleId) {
        await updateAdminRule(editingRuleId, ruleForm);
        setFeedbackMsg(`✓ Rule ${editingRuleId} updated successfully.`);
      } else {
        await createAdminRule(ruleForm);
        setFeedbackMsg(`✓ New Rule ${ruleForm.rule_id} created successfully.`);
      }
      setShowRuleModal(false);
      setEditingRuleId(null);
      loadAdminData();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to save rule.');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(`Are you sure you want to delete rule ${ruleId}?`)) return;
    try {
      await deleteAdminRule(ruleId);
      setFeedbackMsg(`✓ Rule ${ruleId} deleted.`);
      loadAdminData();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to delete rule.');
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {feedbackMsg && (
        <div style={{
          padding: '10px 14px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '4px',
          color: '#065f46',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          {feedbackMsg}
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. ADMIN DASHBOARD */}
      {/* ============================================================ */}
      {(subPage === 'admin-dashboard' || subPage === 'dashboard') && (
        <div>
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              System Administration &amp; Regulatory Oversight
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Platform governance: manage accounts, statutory compliance rules, and system audit logs. Administrator accounts do not hold regulatory approval powers.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="gov-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Active User Accounts</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                {users.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Regulatory Rules Active</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                {rules.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Audit Trail Entries</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {auditLogs.length}
              </div>
            </div>
          </div>

          <div className="gov-card">
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Quick Administration Shortcuts
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('admin-users')}>
                <Users size={14} /> Manage Users &amp; Roles
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('admin-rules')}>
                <Settings size={14} /> Configure Compliance Rules
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('admin-audit')}>
                <Scroll size={14} /> Inspect System Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. USERS AND INSTITUTIONS */}
      {/* ============================================================ */}
      {subPage === 'admin-users' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                User &amp; Institution Account Management
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Role assignment across the 5 official regulatory roles
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name / Entity</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Reassign Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`status-badge status-${u.role?.toLowerCase()}`}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: u.is_active ? '#059669' : '#dc2626', fontWeight: '600' }}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        style={{ fontSize: '11px', padding: '3px 8px', width: 'auto' }}
                        value={u.role}
                        onChange={e => handleRoleChange(Number(u.id), e.target.value)}
                      >
                        <option value="institution">Institution</option>
                        <option value="scrutiny_officer">Scrutiny Officer</option>
                        <option value="compliance_officer">Compliance Officer</option>
                        <option value="chairman">Authorized Decision-Maker</option>
                        <option value="admin">System Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. DOCUMENT AND COMPLIANCE RULES */}
      {/* ============================================================ */}
      {subPage === 'admin-rules' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                Configurable Document &amp; Compliance Rules
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Statutory rules evaluated by the AI Validation Middleware and Compliance Officers
              </span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingRuleId(null);
                setRuleForm({
                  rule_id: `APH-${(rules.length + 1).toFixed(1)}`,
                  rule_name: '',
                  category: 'Infrastructure',
                  description: '',
                  required_value: '',
                  severity: 'high',
                  is_mandatory: true
                });
                setShowRuleModal(true);
              }}
            >
              <Plus size={14} /> Add Regulatory Rule
            </button>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Rule Name</th>
                  <th>Category</th>
                  <th>Required Standard</th>
                  <th>Severity</th>
                  <th>Mandatory</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{r.rule_id}</td>
                    <td style={{ fontWeight: '600' }}>{r.rule_name}</td>
                    <td>{r.category}</td>
                    <td style={{ fontSize: '11.5px', color: '#475569' }}>{r.required_value}</td>
                    <td>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: r.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                        color: r.severity === 'critical' ? '#991b1b' : '#92400e'
                      }}>
                        {r.severity?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: r.is_mandatory ? '#059669' : '#64748b', fontWeight: '600', fontSize: '11px' }}>
                        {r.is_mandatory ? 'Yes' : 'Optional'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px' }}
                          onClick={() => {
                            setEditingRuleId(r.rule_id);
                            setRuleForm({
                              rule_id: r.rule_id,
                              rule_name: r.rule_name,
                              category: r.category,
                              description: r.description || '',
                              required_value: r.required_value || '',
                              severity: r.severity || 'high',
                              is_mandatory: r.is_mandatory
                            });
                            setShowRuleModal(true);
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px', color: '#dc2626' }}
                          onClick={() => handleDeleteRule(r.rule_id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. AUDIT LOGS */}
      {/* ============================================================ */}
      {subPage === 'admin-audit' && (
        <div className="gov-card">
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              System Audit Logs &amp; Regulatory Ledger
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Immutable audit history: logins, document uploads, replacements, validation runs, and recorded decisions
            </div>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity Identifier</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>
                        {log.actor_name || 'System'}
                      </td>
                      <td style={{ fontWeight: '600', color: '#1d4ed8' }}>
                        {log.action}
                      </td>
                      <td style={{ fontSize: '11.5px', textTransform: 'capitalize' }}>
                        {log.entity_type}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {log.entity_id || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      {showRuleModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
              {editingRuleId ? `Edit Rule: ${editingRuleId}` : 'Add Regulatory Compliance Rule'}
            </h3>
            <form onSubmit={handleSaveRule}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">Rule Identifier:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ruleForm.rule_id}
                    onChange={e => setRuleForm({ ...ruleForm, rule_id: e.target.value })}
                    readOnly={!!editingRuleId}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Category:</label>
                  <select
                    className="form-control"
                    value={ruleForm.category}
                    onChange={e => setRuleForm({ ...ruleForm, category: e.target.value })}
                  >
                    <option value="Land & Infrastructure">Land &amp; Infrastructure</option>
                    <option value="Statutory Safety">Statutory Safety</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Rule Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={ruleForm.rule_name}
                  onChange={e => setRuleForm({ ...ruleForm, rule_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Required Standard / Threshold:</label>
                <input
                  type="text"
                  className="form-control"
                  value={ruleForm.required_value}
                  onChange={e => setRuleForm({ ...ruleForm, required_value: e.target.value })}
                  placeholder="e.g. 5.0 Acres Contiguous or 1:20 SFR"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Description &amp; APH Clause:</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={ruleForm.description}
                  onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRuleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
