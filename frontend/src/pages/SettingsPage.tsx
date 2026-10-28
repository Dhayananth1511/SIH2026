import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { getAdminUsers, updateUserRole, getRegulatoryRules, createRegulatoryRule, updateRegulatoryRule } from '../api';
import type { User, RegulatoryRule, UserRole } from '../types';

export default function SettingsPage() {
  const { user } = useAuth();
  const role = (user?.role || 'institution').toLowerCase();
  const isAdmin = role === 'admin';
  const isOfficerOrAdmin = ['admin', 'verification_officer', 'compliance_reviewer', 'decision_maker', 'officer'].includes(role);

  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'database'>('users');
  
  // Users state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  // Rules state
  const [rulesList, setRulesList] = useState<RegulatoryRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleId, setNewRuleId] = useState('');
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCat, setNewRuleCat] = useState('Land & Building');
  const [newRuleReq, setNewRuleReq] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleSev, setNewRuleSev] = useState('high');

  // DB Info state
  const [dbInfo, setDbInfo] = useState<{
    status: string;
    engine: string;
    database_url_masked: string;
    counts?: { applications: number; documents: number; users: number; rules: number };
  } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoadingUsers(true);
    getAdminUsers()
      .then(u => setUsersList(u))
      .catch(() => setUsersList([]))
      .finally(() => setLoadingUsers(false));
  };

  const fetchRules = () => {
    setLoadingRules(true);
    getRegulatoryRules()
      .then(r => setRulesList(r))
      .catch(() => setRulesList([]))
      .finally(() => setLoadingRules(false));
  };

  const refreshDbInfo = () => {
    axios.get('http://localhost:8000/system/db-info')
      .then(r => setDbInfo(r.data))
      .catch(() => setDbInfo({
        status: 'online',
        engine: 'PostgreSQL (Supabase)',
        database_url_masked: 'postgresql://...'
      }));
  };

  useEffect(() => {
    if (isOfficerOrAdmin) {
      refreshDbInfo();
      fetchUsers();
      fetchRules();
    }
  }, [isOfficerOrAdmin]);

  const handleRoleChange = async (targetUserId: number | string, newRole: string) => {
    try {
      await updateUserRole(targetUserId, newRole);
      setUserMsg(`✓ Role updated to ${newRole}`);
      fetchUsers();
      setTimeout(() => setUserMsg(''), 3500);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRegulatoryRule({
        rule_id: newRuleId,
        rule_name: newRuleName,
        category: newRuleCat,
        required_value: newRuleReq,
        description: newRuleDesc,
        severity: newRuleSev,
        is_active: true
      });
      setShowAddRule(false);
      setNewRuleId('');
      setNewRuleName('');
      setNewRuleReq('');
      setNewRuleDesc('');
      fetchRules();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create regulatory rule');
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm("Are you sure you want to wipe applications & findings data to clean state?")) {
      return;
    }
    setResetting(true);
    setResetStatus(null);
    try {
      await axios.post('http://localhost:8000/system/reset-db?wipe_users=false');
      setResetStatus('Applications and findings reset successfully! Demo users preserved.');
      refreshDbInfo();
    } catch (err: any) {
      setResetStatus('Failed to reset: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setResetting(false);
    }
  };

  if (!isOfficerOrAdmin) {
    return (
      <div className="animate-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="white-card" style={{ maxWidth: '580px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            System Settings Restricted
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
            System Configuration, User Management, and Regulatory Checklist configurations are strictly restricted to System Administrators and Scrutiny Officers.
          </p>
          <div style={{ padding: '10px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', fontWeight: '600' }}>
            Access Denied · Statutory Role Policy Active (APH 2026-27)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Title */}
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
              background: '#f1f5f9',
              color: '#334155'
            }}>
              ⚙️ Role 5: System Administrator Cockpit
            </span>
          </div>
          <h2 className="page-title">Platform Administration &amp; Settings</h2>
          <p className="page-subtitle">Manage user accounts, assign the 5 roles, configure regulatory checklist rules, and monitor system health</p>
        </div>
      </div>

      {userMsg && (
        <div style={{ padding: '10px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '12.5px', fontWeight: '600', marginBottom: '16px' }}>
          {userMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="sub-nav-tabs" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Accounts &amp; Roles ({usersList.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          📋 APH Regulatory Rules Engine ({rulesList.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          🗄️ Database &amp; System Health
        </button>
      </div>

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="panel-card">
          <div className="panel-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 className="panel-card-title">Registered Platform Users &amp; Role Assignments</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Assign RBAC authority across the 5 official roles. Admin cannot approve applications.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>
              ↻ Refresh Users
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name / Designation</th>
                  <th>Email ID</th>
                  <th>Current Assigned Role</th>
                  <th>Role Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Loading user directory...</td></tr>
                ) : (
                  usersList.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '700', color: '#1e3a8a' }}>#{u.id}</td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.full_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Registered: {new Date(u.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ color: '#334155' }}>{u.email}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          background:
                            u.role === 'institution' ? '#d1fae5' :
                            u.role === 'verification_officer' ? '#e0f2fe' :
                            u.role === 'compliance_reviewer' ? '#ede9fe' :
                            u.role === 'decision_maker' ? '#fef3c7' : '#f1f5f9',
                          color:
                            u.role === 'institution' ? '#065f46' :
                            u.role === 'verification_officer' ? '#0369a1' :
                            u.role === 'compliance_reviewer' ? '#6d28d9' :
                            u.role === 'decision_maker' ? '#b45309' : '#334155'
                        }}>
                          {String(u.role).replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {isAdmin ? (
                          <select
                            value={String(u.role).toLowerCase()}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '11.5px',
                              background: '#ffffff',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="institution">Institution User</option>
                            <option value="verification_officer">Verification Officer</option>
                            <option value="compliance_reviewer">Compliance Reviewer</option>
                            <option value="decision_maker">AICTE Decision-Maker</option>
                            <option value="admin">System Administrator</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Admin Only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RULES ENGINE */}
      {activeTab === 'rules' && (
        <div className="panel-card">
          <div className="panel-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 className="panel-card-title">AICTE Approval Process Handbook (APH 2026-27) Rule Engine</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Statutory criteria evaluated by the automated compliance engine &amp; Compliance Reviewers.
              </p>
            </div>
            {isAdmin && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddRule(!showAddRule)}
              >
                {showAddRule ? '✕ Cancel' : '+ Add Statutory Rule'}
              </button>
            )}
          </div>

          {showAddRule && (
            <form onSubmit={handleCreateRule} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e3a8a', marginBottom: '12px' }}>
                Create New Regulatory Rule
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Rule ID</label>
                  <input
                    type="text"
                    value={newRuleId}
                    onChange={e => setNewRuleId(e.target.value)}
                    placeholder="e.g. APH-7.1"
                    required
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Rule Title</label>
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={e => setNewRuleName(e.target.value)}
                    placeholder="e.g. Anti-Ragging Committee"
                    required
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Category</label>
                  <select
                    value={newRuleCat}
                    onChange={e => setNewRuleCat(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="Land & Building">Land &amp; Building</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Statutory Safety">Statutory Safety</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Required Statutory Threshold</label>
                  <input
                    type="text"
                    value={newRuleReq}
                    onChange={e => setNewRuleReq(e.target.value)}
                    placeholder="e.g. Annual Notification & Squad Constitution"
                    required
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Severity</label>
                  <select
                    value={newRuleSev}
                    onChange={e => setNewRuleSev(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={newRuleDesc}
                  onChange={e => setNewRuleDesc(e.target.value)}
                  placeholder="Official APH norm description and verification guidelines"
                  rows={2}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Statutory Rule
              </button>
            </form>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Clause Name</th>
                  <th>Category</th>
                  <th>Mandatory Requirement</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rulesList.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '800', color: '#1e3a8a' }}>{r.rule_id}</td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{r.rule_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{r.description}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: '#475569' }}>{r.category}</span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>
                      {r.required_value || '—'}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: r.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                        color: r.severity === 'critical' ? '#b91c1c' : '#b45309'
                      }}>
                        {r.severity}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill cleared" style={{ fontSize: '10px' }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE & SYSTEM HEALTH */}
      {activeTab === 'database' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="panel-card">
            <h3 className="panel-card-title" style={{ marginBottom: '14px' }}>Database Engine &amp; Connectivity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Active Connection:</span>
                <span className="status-pill cleared">{dbInfo?.engine || 'PostgreSQL (Supabase)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Endpoint:</span>
                <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                  {dbInfo?.database_url_masked || 'postgresql://...'}
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Registered Users:</span>
                <strong>{dbInfo?.counts?.users ?? usersList.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Active Rules:</span>
                <strong>{dbInfo?.counts?.rules ?? rulesList.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Applications in Pipeline:</span>
                <strong>{dbInfo?.counts?.applications ?? 0}</strong>
              </div>
            </div>
          </div>

          <div className="panel-card" style={{ border: '1px solid #fecaca', background: '#fffafa' }}>
            <h3 className="panel-card-title" style={{ color: '#b91c1c', marginBottom: '10px' }}>
              ⚠️ Administrative Data Reset
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', marginBottom: '16px' }}>
              Wipes submitted test applications and findings to test the clean multi-role lifecycle. Preserves users and statutory rules.
            </p>

            {resetStatus && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '11.5px', marginBottom: '14px' }}>
                {resetStatus}
              </div>
            )}

            {isAdmin ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResetDb}
                disabled={resetting}
                style={{ color: '#b91c1c', borderColor: '#fca5a5', background: '#ffffff' }}
              >
                {resetting ? 'Wiping Test Records...' : '🗑️ Reset Test Applications Data'}
              </button>
            ) : (
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Requires System Administrator role to trigger reset.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
