import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Building,
  ExternalLink,
  Award,
  Layers
} from 'lucide-react';
import { Application, Document, Finding, ComplianceCheck } from '../types';

interface Props {
  application: Application | null;
  documents: Document[];
  findings: Finding[];
  complianceChecks: ComplianceCheck[];
  onNext: () => void;
}

export default function Feature7EvidenceDashboard({
  application,
  documents,
  findings,
  complianceChecks,
  onNext
}: Props) {
  const [expandedCheckId, setExpandedCheckId] = useState<number | null>(null);

  const score = application?.scrutiny_score || application?.score || 0;
  const passCount = complianceChecks.filter(c => c.result === 'pass').length;
  const failCount = complianceChecks.filter(c => c.result === 'fail').length;
  const warnCount = complianceChecks.filter(c => c.result === 'warning').length;

  const handlePrint = () => {
    window.print();
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
              FEATURE 7 OF 8
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Display Evidence-Backed Results on a Dashboard
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Executive scrutiny scorecard with transparent, evidence-backed matrix linking every statutory check to verified document facts.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={13} />
            <span>Print Scrutiny Dossier</span>
          </button>
          <button
            onClick={onNext}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Feature 8: Human Review &amp; Audit</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Scrutiny Score Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '700', textTransform: 'uppercase' }}>
              Scrutiny Score
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '4px', letterSpacing: '-0.5px' }}>
              {score}%
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
              AICTE Norm Compliance
            </div>
          </div>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={32} color="#f59e0b" />
          </div>
        </div>

        {/* Checks Passed */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Checks Passed</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {passCount} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>/ {complianceChecks.length}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px', fontWeight: '600' }}>
            Fully Satisfied Norms
          </div>
        </div>

        {/* Checks Failed / Deficient */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Non-Compliant / Deficient</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: failCount > 0 ? '#b91c1c' : '#64748b', marginTop: '4px' }}>
            {failCount}
          </div>
          <div style={{ fontSize: '11.5px', color: failCount > 0 ? '#b91c1c' : '#64748b', marginTop: '2px', fontWeight: '600' }}>
            {failCount > 0 ? 'Requires Rectification' : 'Zero Deficiencies'}
          </div>
        </div>

        {/* Ingested Documents */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Supporting Documents</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e3a8a', marginTop: '4px' }}>
            {documents.length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginTop: '2px', fontWeight: '600' }}>
            Verified Cryptographic Hashes
          </div>
        </div>
      </div>

      {/* Evidence-Backed Compliance Matrix Table */}
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
              <ShieldCheck size={16} color="#1e3a8a" />
              <span>Evidence-Backed Statutory Compliance Matrix</span>
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Every AICTE rule requirement directly cross-referenced with source document evidence and registry facts.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>Rule ID &amp; Norm</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>Required Standard</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>Extracted Fact (Evidence)</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>Compliance Status</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Evidence Details</th>
              </tr>
            </thead>
            <tbody>
              {complianceChecks.map(check => {
                const isExpanded = expandedCheckId === check.id;
                const isPass = check.result === 'pass';
                const isFail = check.result === 'fail';

                return (
                  <React.Fragment key={check.id}>
                    <tr style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isExpanded ? '#f8fafc' : '#ffffff'
                    }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{check.rule_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          {check.rule_id} · {check.category}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontWeight: '500' }}>
                        {check.required_value || 'Mandatory Standard'}
                      </td>
                      <td style={{ padding: '12px 14px', color: isPass ? '#0f172a' : '#b91c1c', fontWeight: '600' }}>
                        {check.evidence_value || 'Pending Verification'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {isPass ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> PASS
                          </span>
                        ) : isFail ? (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={11} /> FAIL
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={11} /> WARNING
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td colSpan={5} style={{ padding: '14px 20px' }}>
                          <div style={{
                            background: '#ffffff',
                            padding: '14px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12.5px',
                            lineHeight: '1.5'
                          }}>
                            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Statutory Audit Evaluation Note:
                            </div>
                            <p style={{ color: '#334155', margin: '0 0 10px 0' }}>
                              {check.details}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11.5px',
                              color: '#64748b',
                              borderTop: '1px solid #f1f5f9',
                              paddingTop: '8px'
                            }}>
                              <span>Source: Uploaded Supporting Document Dossier</span>
                              <span>Timestamp: {check.checked_at ? new Date(check.checked_at).toLocaleString() : 'Active Verification'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
