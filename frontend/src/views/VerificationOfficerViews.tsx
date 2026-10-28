import React, { useState, useEffect } from 'react';
import { getApplications } from '../api';
import type { Application } from '../types';
import OfficerReviewView from './OfficerReviewView';
import {
  ClipboardList,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter
} from 'lucide-react';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function VerificationOfficerViews({ subPage, onNavigate, onSelectApp, onViewDoc }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(() => {
    const p = window.location.pathname;
    if (p.includes('/officer/')) {
      const parts = p.split('/officer/');
      return parts[1]?.replace('/', '') || 'APP-2026-0001';
    }
    return null;
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadApplications();
  }, [subPage]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await getApplications();
      setApps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If officer opened an application dossier
  if (selectedAppId) {
    return (
      <OfficerReviewView
        appId={selectedAppId}
        onBack={() => {
          setSelectedAppId(null);
          loadApplications();
        }}
        onViewDoc={onViewDoc}
      />
    );
  }

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DEFICIENCY' | 'APPROVED'>('ALL');

  // Filter scrutiny queue based on tab
  const filteredApps = apps.filter(a => {
    const s = a.status?.toUpperCase() || '';
    if (statusFilter === 'READY') {
      return s === 'READY_FOR_REVIEW' || s === 'UNDER_OFFICER_REVIEW' || s === 'UNDER_SCRUTINY';
    }
    if (statusFilter === 'DEFICIENCY') {
      return s === 'ACTION_REQUIRED' || s === 'CLARIFICATION_REQUESTED';
    }
    if (statusFilter === 'APPROVED') {
      return s === 'APPROVED' || s === 'DECISION_RECORDED' || Boolean(a.certificate_issued);
    }
    return true;
  });

  const displayList = filteredApps.filter(a =>
    a.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.institution_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ============================================================ */}
      {/* 1. AICTE APPROVAL OFFICER DASHBOARD */}
      {/* ============================================================ */}
      {(subPage === 'vo-dashboard' || subPage === 'dashboard') && (
        <div>
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0369a1', fontWeight: '800' }}>
              Consolidated Statutory Desk
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '4px 0 6px 0' }}>
              AICTE Approval Officer Workspace
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Unified statutory authority for AI document validation, anomaly inspection, deficiency directives, and issuance of official AICTE Certificates of Approval.
            </div>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Total Assigned Dossiers</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                {apps.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #10b981', background: '#ecfdf5' }}>
              <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: '700' }}>Ready for Officer Approval</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {apps.filter(a => a.status === 'READY_FOR_REVIEW' || a.status === 'UNDER_OFFICER_REVIEW').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: '700' }}>Deficiencies / Action Required</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
                {apps.filter(a => a.status === 'ACTION_REQUIRED' || a.status === 'CLARIFICATION_REQUESTED').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #059669', background: '#f0fdf4' }}>
              <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: '700' }}>Approved &amp; Certified</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {apps.filter(a => a.status === 'APPROVED' || a.status === 'DECISION_RECORDED' || a.certificate_issued).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ASSIGNED APPLICATIONS QUEUE */}
      {/* ============================================================ */}
      <div className="gov-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              Institutional Regulatory Applications Queue
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Review evidence, run AI checks, dispatch suggestions to institutions, and issue statutory certificates
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Filter buttons */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
              <button
                onClick={() => setStatusFilter('ALL')}
                style={{
                  border: 'none',
                  background: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'ALL' ? '#0f172a' : '#64748b',
                  fontWeight: statusFilter === 'ALL' ? '700' : '500',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                All ({apps.length})
              </button>
              <button
                onClick={() => setStatusFilter('READY')}
                style={{
                  border: 'none',
                  background: statusFilter === 'READY' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'READY' ? '#059669' : '#64748b',
                  fontWeight: statusFilter === 'READY' ? '700' : '500',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Ready for Approval ({apps.filter(a => a.status === 'READY_FOR_REVIEW' || a.status === 'UNDER_OFFICER_REVIEW').length})
              </button>
              <button
                onClick={() => setStatusFilter('DEFICIENCY')}
                style={{
                  border: 'none',
                  background: statusFilter === 'DEFICIENCY' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'DEFICIENCY' ? '#b45309' : '#64748b',
                  fontWeight: statusFilter === 'DEFICIENCY' ? '700' : '500',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Deficiencies ({apps.filter(a => a.status === 'ACTION_REQUIRED' || a.status === 'CLARIFICATION_REQUESTED').length})
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                style={{
                  border: 'none',
                  background: statusFilter === 'APPROVED' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'APPROVED' ? '#047857' : '#64748b',
                  fontWeight: statusFilter === 'APPROVED' ? '700' : '500',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Approved ({apps.filter(a => a.status === 'APPROVED' || a.certificate_issued).length})
              </button>
            </div>

            <input
              type="text"
              className="form-control"
              placeholder="Search by ID or Institute..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '200px', fontSize: '12px', padding: '5px 10px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Institution Name</th>
                <th>Category</th>
                <th>Academic Year</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>AI Score</th>
                <th>Officer Directives</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No applications matching the current filter.
                  </td>
                </tr>
              ) : (
                displayList.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{a.application_id}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{a.institution_name}</td>
                    <td>{a.category}</td>
                    <td>{a.academic_year || '2026-27'}</td>
                    <td style={{ fontSize: '11.5px', color: '#475569' }}>
                      {new Date(a.submitted_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <span className={`status-badge status-${a.status?.toLowerCase()}`}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: a.scrutiny_score >= 80 ? '#059669' : '#b45309' }}>
                      {a.scrutiny_score}%
                    </td>
                    <td style={{ fontSize: '11px', maxWidth: '220px' }}>
                      {a.officer_suggestions ? (
                        <span style={{ color: '#86198f', fontWeight: '600' }} title={a.officer_suggestions}>
                          {a.officer_suggestions.length > 45 ? `${a.officer_suggestions.slice(0, 45)}...` : a.officer_suggestions}
                        </span>
                      ) : (a.status === 'APPROVED' ? (
                        <span style={{ color: '#059669', fontWeight: '700' }}>✓ Certificate Issued</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>None</span>
                      ))}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedAppId(a.application_id)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          background: a.status === 'READY_FOR_REVIEW' ? '#059669' : '#1d4ed8',
                          borderColor: a.status === 'READY_FOR_REVIEW' ? '#047857' : '#1d4ed8'
                        }}
                      >
                        <Eye size={12} />
                        <span>{a.status === 'READY_FOR_REVIEW' ? 'Review & Approve' : 'Open Dossier'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
