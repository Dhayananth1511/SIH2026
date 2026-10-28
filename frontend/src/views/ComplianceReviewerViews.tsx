import React, { useState, useEffect } from 'react';
import { getApplications } from '../api';
import type { Application } from '../types';
import OfficerReviewView from './OfficerReviewView';
import {
  Scale,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search
} from 'lucide-react';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function ComplianceReviewerViews({ subPage, onNavigate, onSelectApp, onViewDoc }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
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

  // Filter compliance queue: applications under compliance review or doc verified
  const complianceQueue = apps.filter(a => {
    const s = a.status?.toUpperCase();
    return s === 'UNDER_COMPLIANCE_REVIEW' || s === 'DOC_VERIFIED' || s === 'COMPLIANCE_REVIEW' || s === 'DECISION_PENDING';
  });

  const filteredQueue = complianceQueue.filter(a =>
    a.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.institution_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ============================================================ */}
      {/* 1. COMPLIANCE OFFICER DASHBOARD */}
      {/* ============================================================ */}
      {(subPage === 'cr-dashboard' || subPage === 'dashboard') && (
        <div>
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6d28d9', fontWeight: '700' }}>
              Statutory Scrutiny Desk
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '4px 0 6px 0' }}>
              Compliance Officer Workspace
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Audit institutional applications against configurable AICTE APH 2026-27 statutory rules, record scrutiny recommendations, and forward to Authorized Decision-Maker.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Compliance Review Queue</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#6d28d9', marginTop: '4px' }}>
                {complianceQueue.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Cleared by Scrutiny Officer</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {apps.filter(a => a.status === 'UNDER_COMPLIANCE_REVIEW').length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Clarifications In-Flight</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
                {apps.filter(a => a.status === 'CLARIFICATION_REQUESTED').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. COMPLIANCE REVIEW QUEUE */}
      {/* ============================================================ */}
      <div className="gov-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              Regulatory Compliance Review Queue
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Applications requiring statutory rule matching and regulatory recommendation
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID or Institute..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '220px', fontSize: '12px', padding: '5px 10px' }}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No applications currently pending in compliance review.
                  </td>
                </tr>
              ) : (
                filteredQueue.map(a => (
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
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedAppId(a.application_id)}
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                      >
                        <Eye size={12} />
                        <span>Review Compliance</span>
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
