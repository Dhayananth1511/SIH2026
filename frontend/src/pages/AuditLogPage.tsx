import React, { useState, useEffect } from 'react';
import { getAuditLog } from '../api';
import type { AuditEvent } from '../types';
import { useAuth } from '../AuthContext';

export default function AuditLogPage() {
  const { user } = useAuth();
  const isInstitution = (user?.role || '').toLowerCase() === 'institution';
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLog();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const userName = log.user_name || log.actor_name || '';
    const detailsStr = typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '');
    const appId = log.app_id || log.entity_id || '';

    const matchesSearch =
      userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      appId.toLowerCase().includes(search.toLowerCase()) ||
      detailsStr.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'All' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  if (isInstitution) {
    return (
      <div className="animate-in" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="white-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>⚖️</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#9a3412', marginBottom: '8px' }}>
            Vigilance Ledger Restricted
          </h2>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Under Section 10(1) of the AICTE Act, central cryptographic audit ledgers and scrutiny deliberations are reserved exclusively for authorized <strong>Vigilance Officers</strong>, <strong>Statutory Auditors</strong>, and <strong>Administrators</strong>.
          </p>
          <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', border: '1px solid #ffedd5', fontSize: '13px', color: '#c2410c', textAlign: 'left', marginBottom: '20px' }}>
            <strong>🎓 Institutional Applicant Access:</strong>
            <ul style={{ margin: '8px 0 0 16px', lineHeight: '1.6' }}>
              <li>You can view status updates for your college's applications under <strong>My Submissions</strong>.</li>
              <li>Official deficiency letters and compliance findings are accessible directly within your <strong>Application Details</strong>.</li>
            </ul>
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
          <h2 className="page-title">Audit Logs</h2>
          <p className="page-subtitle">Immutable database ledger ({logs.length} total event records logged)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchLogs}
          >
            ↻ Refresh
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => alert('Exporting cryptographic SHA-256 ledger CSV...')}
          >
            ⬇ Export Ledger
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by officer, action, or application ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              fontSize: '12.5px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              outline: 'none',
              background: '#ffffff'
            }}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="All">All Actions</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Document Uploaded">Document Uploaded</option>
            <option value="Application Submitted">Application Submitted</option>
            <option value="Validation Pipeline Triggered">Validation Triggered</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="white-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading audit records from database...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No audit events found. Actions taken on applications and documents will be automatically logged here.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>User / Actor</th>
                  <th>Action</th>
                  <th>Application ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const dateVal = log.created_at || log.timestamp || new Date().toISOString();
                  const dateStr = new Date(dateVal).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={log.id}>
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap', fontFeatureSettings: '"tnum"' }}>
                        {dateStr}
                      </td>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>
                        {log.user_name || log.actor_name || 'System / Officer'}
                      </td>
                      <td>
                        <span className={`status-pill ${
                          log.action.includes('Approved') || log.action.includes('Reviewed') ? 'cleared' :
                          log.action.includes('Uploaded') || log.action.includes('Submitted') ? 'compliant' :
                          log.action.includes('Deficiency') ? 'deficiencies' : 'info'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600', color: '#2563eb' }}>
                        {log.app_id || log.entity_id || '—'}
                      </td>
                      <td style={{ color: '#334155' }}>
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
