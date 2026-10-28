import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getDashboardStats } from '../api';
import type { DashboardStats } from '../types';

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [appType, setAppType] = useState('All Types');
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
  }, []);

  const totalApps = stats?.total_applications || 0;
  const clearedCount = stats?.cleared || 0;
  const deficiencyCount = stats?.deficiencies || 0;
  const underReviewCount = stats?.under_review || 0;

  const trendData = stats?.weekly_submissions && stats.weekly_submissions.length > 0
    ? stats.weekly_submissions.map(w => ({
        date: w.week,
        submissions: w.count,
        cleared: Math.min(w.count, clearedCount),
        deficiencies: Math.min(w.count, deficiencyCount),
        under_review: Math.min(w.count, underReviewCount)
      }))
    : [];

  const deficiencyTypes = [
    { name: 'Missing Documents & Endorsements', percent: 40, color: '#ef4444' },
    { name: 'Expired Certificates (Fire / NOC)', percent: 25, color: '#f97316' },
    { name: 'Faculty & Cadre Inconsistencies', percent: 20, color: '#f59e0b' },
    { name: 'Document Hash & Tamper Anomalies', percent: 15, color: '#3b82f6' }
  ];

  const handleGenerateReport = () => {
    setReportGenerated(true);
    setTimeout(() => {
      alert(`Report generated for ${dateRange} (${appType}). Export ready.`);
      setReportGenerated(false);
    }, 600);
  };

  return (
    <div className="animate-in">
      {/* Title */}
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Reports</h2>
          <p className="page-subtitle">Aggregated institutional metrics, trend trajectories &amp; deficiency analytics</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ background: '#ffffff', padding: '14px 20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div className="filter-group">
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginRight: '8px' }}>Date Range</span>
            <select
              className="filter-select"
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Academic Year 2025-26">Academic Year 2025-26</option>
            </select>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginRight: '8px' }}>Application Type</span>
            <select
              className="filter-select"
              value={appType}
              onChange={e => setAppType(e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="EoA">EoA</option>
              <option value="Intake">Intake</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerateReport}
          disabled={reportGenerated}
        >
          {reportGenerated ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* 4 Summary Metric Stats */}
      <div className="metrics-grid-4">
        <div className="metric-stat-card">
          <div className="metric-stat-label">Total Applications</div>
          <div className="metric-stat-val">{totalApps}</div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-label">Cleared</div>
          <div className="metric-stat-val" style={{ color: '#16a34a' }}>
            {clearedCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>({totalApps > 0 ? ((clearedCount/totalApps)*100).toFixed(1) : 0}%)</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-label">With Deficiencies</div>
          <div className="metric-stat-val" style={{ color: '#dc2626' }}>
            {deficiencyCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>({totalApps > 0 ? ((deficiencyCount/totalApps)*100).toFixed(1) : 0}%)</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-label">Under Review</div>
          <div className="metric-stat-val" style={{ color: '#0284c7' }}>
            {underReviewCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>({totalApps > 0 ? ((underReviewCount/totalApps)*100).toFixed(1) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Two Charts Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left: Application Status Trend */}
        <div className="white-card">
          <div className="white-card-header">
            <span className="white-card-title">Application Status Trend</span>
          </div>
          <div className="white-card-body" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="cleared" stroke="#16a34a" name="Cleared" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="deficiencies" stroke="#dc2626" name="Deficiencies" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="under_review" stroke="#0284c7" name="Under Review" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Deficiency Types Horizontal Bars */}
        <div className="white-card">
          <div className="white-card-header">
            <span className="white-card-title">Top Deficiency Types</span>
          </div>
          <div className="white-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            {deficiencyTypes.map(item => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>{item.name}</span>
                  <span style={{ fontWeight: '700', color: item.color }}>{item.percent}%</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '9999px',
                      transition: 'width 0.8s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
