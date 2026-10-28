import React, { useState, useEffect } from 'react';
import { getApplications, createApplication } from '../api';
import type { Application } from '../types';
import { useAuth } from '../AuthContext';

interface Props {
  onSelectApp: (appId: string) => void;
}

export default function ApplicationsPage({ onSelectApp }: Props) {
  const { user } = useAuth();
  const role = (user?.role || 'officer').toLowerCase();
  const isInstitution = role === 'institution';

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [name, setName] = useState(isInstitution && user?.full_name ? user.full_name : '');
  const [type, setType] = useState('Engineering');
  const [appliedFor, setAppliedFor] = useState('Extension of Approval (EoA) 2026-27');
  const [region, setRegion] = useState('Southern');
  const [state, setState] = useState('Tamil Nadu');
  const [city, setCity] = useState('Chennai');
  const [category, setCategory] = useState('Affiliated');

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await getApplications();
      setApps(data);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newApp = await createApplication({
        institution_name: name,
        institution_type: type,
        category: category,
        region: region,
        state: state,
        city: city,
        applied_for: appliedFor
      });
      setSuccessMsg(`✓ Application ${newApp.application_id || newApp.id} created successfully in database!`);
      setShowModal(false);
      setName('');
      fetchApps();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = apps.filter(app => {
    const appIdStr = String(app.application_id || app.id);
    const matchesSearch =
      appIdStr.toLowerCase().includes(search.toLowerCase()) ||
      app.institution_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Cleared' && app.status === 'cleared') ||
      (statusFilter === 'Under Review' && app.status === 'under_review') ||
      (statusFilter === 'Deficiencies' && app.status === 'deficiency') ||
      (statusFilter === 'Submitted' && app.status === 'submitted');

    const matchesStage =
      stageFilter === 'All' ||
      (app.current_stage || 'submission') === stageFilter;

    const appType = app.application_type || app.applied_for || '';
    const matchesType =
      typeFilter === 'All' || appType.toLowerCase().includes(typeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesStage && matchesType;
  });

  return (
    <div className="animate-in">
      {/* Title */}
      <div className="page-title-row">
        <div>
          <h2 className="page-title">
            {isInstitution ? 'My Applications' : 'Regulatory Applications Queue'}
          </h2>
          <p className="page-subtitle">
            {isInstitution
              ? `Submissions for ${user?.full_name || 'your institution'} (${apps.length} records in database)`
              : `National regulatory repository (${apps.length} total institutions stored)`}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (isInstitution && user?.full_name) {
              setName(user.full_name);
            }
            setShowModal(true);
          }}
        >
          + New Application
        </button>
      </div>

      {successMsg && (
        <div style={{
          padding: '12px 18px',
          background: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#15803d',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by application ID, institution name, or city..."
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
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Cleared">Cleared</option>
            <option value="Under Review">Under Review</option>
            <option value="Deficiencies">Deficiencies</option>
            <option value="Submitted">Submitted</option>
          </select>

          <select
            className="filter-select"
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
          >
            <option value="All">All Stages</option>
            <option value="submission">1. Submission</option>
            <option value="ai_validation">2. AI Validation</option>
            <option value="doc_verification">3. Doc Verification</option>
            <option value="compliance_review">4. Compliance Scrutiny</option>
            <option value="decision">5. Decision Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="EoA">EoA</option>
            <option value="Intake">Intake</option>
            <option value="Course">New Course</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="white-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading applications from database...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
              No applications match your criteria
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
              Create your own original application to verify it live in the database.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              + Create New Application
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Institution Name</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Region / State</th>
                  <th>Type</th>
                  <th>Submitted On</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const appIdStr = String(app.application_id || app.id);
                  const isCleared = app.status === 'cleared';
                  const isUnderReview = app.status === 'under_review';
                  const isDeficiency = app.status === 'deficiency';
                  const stageName = (app.current_stage || 'submission').replace('_', ' ');

                  return (
                    <tr key={app.id}>
                      <td style={{ fontWeight: '700', color: '#2563eb' }}>
                        {appIdStr}
                      </td>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>
                        {app.institution_name}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#f1f5f9',
                          color: '#334155',
                          textTransform: 'capitalize'
                        }}>
                          {stageName}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${isCleared ? 'cleared' : isUnderReview ? 'under-review' : isDeficiency ? 'deficiencies' : 'info'}`}>
                          {isCleared ? 'Cleared' : isUnderReview ? 'Under Review' : isDeficiency ? 'Deficiencies' : 'Submitted'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {app.city ? `${app.city}, ` : ''}{app.state || app.region || 'India'}
                      </td>
                      <td>
                        <span className="status-pill eoa">
                          {app.application_type || app.applied_for || 'EoA'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {new Date(app.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectApp(appIdStr)}
                          style={{ padding: '4px 14px', fontSize: '12px', fontWeight: '600', color: '#2563eb', borderColor: '#bfdbfe' }}
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

        {/* Pagination footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div>
            Showing {filtered.length} active records from database
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              ‹
            </button>
            <button
              style={{
                padding: '4px 10px',
                border: '1px solid #2563eb',
                background: '#2563eb',
                color: '#ffffff',
                borderRadius: '4px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              1
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
              style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal: New Application Creation */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a8a' }}>
                ➕ Create New AICTE Application
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Institution Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Institute of Technology"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Institution Type
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="Engineering">Engineering &amp; Technology</option>
                    <option value="Polytechnic">Polytechnic</option>
                    <option value="Management">Management (MBA/PGDM)</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Architecture">Architecture</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="Southern">Southern</option>
                    <option value="South-Western">South-Western</option>
                    <option value="Northern">Northern</option>
                    <option value="Western">Western</option>
                    <option value="Eastern">Eastern</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Applied For
                </label>
                <select
                  value={appliedFor}
                  onChange={e => setAppliedFor(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Extension of Approval (EoA) 2026-27">Extension of Approval (EoA)</option>
                  <option value="Increase in Intake (60 Seats)">Increase in Intake</option>
                  <option value="New Course - Artificial Intelligence">New Course Introduction</option>
                  <option value="Infrastructure Modernization Grant">Infrastructure Verification</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting to DB...' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
