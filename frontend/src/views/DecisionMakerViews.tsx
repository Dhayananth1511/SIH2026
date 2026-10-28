import React, { useState, useEffect } from 'react';
import { getApplications } from '../api';
import type { Application } from '../types';
import OfficerReviewView from './OfficerReviewView';
import {
  FileCheck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scroll,
  Search
} from 'lucide-react';

interface Props {
  subPage: string;
  onNavigate: (page: string) => void;
  onSelectApp: (appId: string) => void;
  onViewDoc: (docName: string) => void;
}

export default function DecisionMakerViews({ subPage, onNavigate, onSelectApp, onViewDoc }: Props) {
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

  // Filter applications for decision: stage is 'decision' or completed
  const pendingDecisions = apps.filter(a => {
    const s = a.status?.toUpperCase();
    const stg = a.current_stage;
    return stg === 'decision' || s === 'DECISION_PENDING' || (s === 'UNDER_COMPLIANCE_REVIEW' && a.compliance_status === 'recommended_for_decision');
  });

  const decidedApplications = apps.filter(a => a.status === 'DECISION_RECORDED' || a.status === 'cleared' || a.status === 'rejected');

  const filteredList = pendingDecisions.filter(a =>
    a.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.institution_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ============================================================ */}
      {/* 1. DECISION-MAKER DASHBOARD */}
      {/* ============================================================ */}
      {(subPage === 'dm-dashboard' || subPage === 'dashboard') && (
        <div>
          <div className="gov-card" style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b45309', fontWeight: '700' }}>
              AICTE Statutory Directorate
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '4px 0 6px 0' }}>
              Authorized Decision-Maker Workspace
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Statutory authority for regulatory decisions. Review complete multi-tier dossiers, scrutiny findings, and compliance recommendations. Record reasoned official decisions (Approved, Deficiency Notice, or Refusal).
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: '700' }}>Pending Authorized Decision</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
                {pendingDecisions.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #059669', background: '#ecfdf5' }}>
              <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: '700' }}>Official Decrees Recorded</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
                {decidedApplications.length}
              </div>
            </div>

            <div className="gov-card" style={{ padding: '16px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '11.5px', color: '#0369a1', fontWeight: '600' }}>Total Applications Reviewed</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                {apps.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. APPLICATIONS FOR DECISION */}
      {/* ============================================================ */}
      <div className="gov-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              Applications Awaiting Official Statutory Decision
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Cases cleared through Scrutiny and Compliance tiers awaiting final signature
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
                <th>Compliance Status</th>
                <th>AI Scrutiny Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No applications currently awaiting statutory decree.
                  </td>
                </tr>
              ) : (
                filteredList.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '700', color: '#1d4ed8' }}>{a.application_id}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{a.institution_name}</td>
                    <td>{a.category}</td>
                    <td>{a.academic_year || '2026-27'}</td>
                    <td>
                      <span className="status-badge status-doc_verified">
                        {a.compliance_status || 'Compliance Cleared'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: a.scrutiny_score >= 80 ? '#059669' : '#b45309' }}>
                      {a.scrutiny_score}%
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedAppId(a.application_id)}
                        style={{ padding: '4px 10px', fontSize: '11.5px', background: '#059669', borderColor: '#059669' }}
                      >
                        <Scroll size={12} />
                        <span>Sign Official Decree</span>
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
