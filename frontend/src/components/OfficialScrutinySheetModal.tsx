import React, { useState, useEffect } from 'react';
import { IndianEmblem, Aictelogo } from './Emblems';
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Building2,
  MapPin,
  Calendar,
  Lock,
  Layers,
  Camera,
  Server
} from 'lucide-react';
import { getOfficialScrutinySheet } from '../api';
import type { OfficialScrutinySheet } from '../types';

interface Props {
  appId: string;
  onClose: () => void;
}

export default function OfficialScrutinySheetModal({ appId, onClose }: Props) {
  const [data, setData] = useState<OfficialScrutinySheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getOfficialScrutinySheet(appId);
      setData(res);
    } catch (e) {
      console.error('Failed to load official scrutiny sheet', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
        <div className="modal-card" style={{ maxWidth: '600px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            Generating Statutory AICTE Scrutiny Sheet...
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            Reconciling institutional dossier with central AICTE master registry and authoritative source logs.
          </div>
        </div>
      </div>
    );
  }

  const { application: app, master_record: master } = data;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-card certificate-modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '96vw',
          maxWidth: '1050px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Toolbar (hidden during print) */}
        <div
          className="no-print"
          style={{
            minHeight: '60px',
            background: '#0f172a',
            borderBottom: '1px solid #1e293b',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.3px', lineHeight: 1.3 }}>
                Form AICTE-SCRUTINY-2026: Official Statutory Scrutiny Dossier
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Application: <strong style={{ color: '#38bdf8' }}>{app.application_id}</strong> &bull; Permanent Institute ID: {master.aicte_id}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              className="gov-button"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <Printer size={15} /> Print / Save Scrutiny Dossier (PDF)
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                color: '#f8fafc',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              <X size={16} /> Close
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#ffffff',
            padding: '36px 44px',
            color: '#0f172a',
            fontFamily: 'Inter, -apple-system, sans-serif'
          }}
        >
          {/* Official Letterhead */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <IndianEmblem size={56} />
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>
                  GOVERNMENT OF INDIA &bull; MINISTRY OF EDUCATION
                </div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0b2545', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                  All India Council for Technical Education
                </div>
                <div style={{ fontSize: '11px', color: '#334155', fontWeight: '600' }}>
                  Regulation Bureau &bull; Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Aictelogo size={52} />
            </div>
          </div>

          {/* Form Banner */}
          <div
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '12px 16px',
              textAlign: 'center',
              marginBottom: '22px'
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1.2px', color: '#0369a1' }}>
              AICTE APPROVAL PROCESS HANDBOOK (APH 2026-27) &bull; REGULATORY SCRUTINY DIVISION
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: '900', margin: '4px 0 2px 0', color: '#0f172a', textTransform: 'uppercase' }}>
              {data.form_title}
            </h2>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              Form Identifier: <strong>{data.form_id}</strong> &bull; Generated: {data.generated_at} &bull; Classification: <strong>CONFIDENTIAL / OFFICIAL USE</strong>
            </div>
          </div>

          {/* SECTION 1: Institutional & Application Identification */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              1. Institutional Particulars & Application Category
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', width: '22%', color: '#475569' }}>Institution Name</td>
                  <td style={{ padding: '6px 10px', fontWeight: '800', color: '#0f172a', width: '38%' }}>{app.institution_name}</td>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', width: '20%', color: '#475569' }}>AICTE Permanent ID</td>
                  <td style={{ padding: '6px 10px', fontWeight: '800', color: '#0284c7', width: '20%' }}>{master.aicte_id}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>Application Dossier No</td>
                  <td style={{ padding: '6px 10px', fontWeight: '800', color: '#0f172a' }}>{app.application_id}</td>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>Academic Year / Region</td>
                  <td style={{ padding: '6px 10px', fontWeight: '600' }}>{app.academic_year} &bull; {app.region} Region ({app.state})</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>Application Category</td>
                  <td style={{ padding: '6px 10px', fontWeight: '800', color: '#15803d' }}>{app.category}</td>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>Applied Scrutiny Scope</td>
                  <td style={{ padding: '6px 10px', fontWeight: '600' }}>{app.applied_for}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>Scrutiny Readiness Index</td>
                  <td style={{ padding: '6px 10px', fontWeight: '800', color: app.scrutiny_score >= 80 ? '#15803d' : '#b91c1c' }}>
                    {app.scrutiny_score}% Statutory Compliance
                  </td>
                  <td style={{ padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>Workflow Status</td>
                  <td style={{ padding: '6px 10px', fontWeight: '800', color: app.status === 'READY_FOR_REVIEW' || app.status === 'APPROVED' ? '#15803d' : '#b45309' }}>
                    {app.status}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 2: AICTE Central Master Record Reconciliation */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              2. Pre-Scrutiny Reconciliation Against Central AICTE Records (Zero Manual Re-Check)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', background: '#f8fafc' }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '800', color: '#475569' }}>TER Processing Fee</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: master.ter_payment?.status === 'CONFIRMED' ? '#15803d' : '#b91c1c', marginTop: '2px' }}>
                  {master.ter_payment?.status === 'CONFIRMED' ? 'CLEARED & RECONCILED' : 'PAYMENT PENDING'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Receipt: <strong>{master.ter_payment?.receipt_no}</strong> ({master.ter_payment?.amount || '₹1,50,000'})
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', background: '#f8fafc' }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '800', color: '#475569' }}>Historical EoA Standing</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#15803d', marginTop: '2px' }}>
                  APPROVED (3-YEAR RECORD)
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Valid AY 2023-24, 2024-25, 2025-26 on Council ledger
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', background: '#f8fafc' }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '800', color: '#475569' }}>Sanctioned Student Intake</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1', marginTop: '2px' }}>
                  {master.sanctioned_intake} SEATS APPROVED
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Across UG & PG Engineering & Technology programs
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Issuing Authority Verification Outcomes (6-State Taxonomy) */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              3. Verification Through Original Issuing Authorities (API / QR / DSC)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>Competent Issuing Authority</th>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>Mechanism</th>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>Reference / Token</th>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>Statutory Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {data.authority_verifications.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 10px', fontWeight: '700', color: '#0f172a' }}>{item.authority}</td>
                    <td style={{ padding: '6px 10px', color: '#64748b' }}>{item.type}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#0284c7' }}>{item.token || 'N/A'}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '800',
                          background: item.status === 'VERIFIED' ? '#dcfce7' : item.status === 'MISMATCH_DETECTED' ? '#fee2e2' : '#fef3c7',
                          color: item.status === 'VERIFIED' ? '#15803d' : item.status === 'MISMATCH_DETECTED' ? '#b91c1c' : '#b45309'
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 4: Infrastructure & Computer Vision Evidence Log */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              4. Geo-Tagged Infrastructure Evidence & Computer Vision Scrutiny
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>Facility / Asset Block</th>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>Campus GPS Geo-Tag</th>
                  <th style={{ padding: '6px 10px', color: '#475569' }}>CV Analysis & Inspection Flag</th>
                </tr>
              </thead>
              <tbody>
                {data.infrastructure_evidence.map((infra, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 10px', fontWeight: '700', color: '#0f172a' }}>{infra.title}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ color: infra.gps_verified ? '#15803d' : '#b91c1c', fontWeight: '700' }}>
                        {infra.gps_verified ? '✓ GPS Verified (<50m of Campus Cadastre)' : '✗ Geo-Location Mismatch'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '800',
                          background: infra.compliance_status === 'COMPLIANT_ADVISORY' ? '#dcfce7' : '#fee2e2',
                          color: infra.compliance_status === 'COMPLIANT_ADVISORY' ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {infra.compliance_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 5: Statutory Safeguards & Natural Justice Disclaimer */}
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '6px',
              padding: '12px 16px',
              fontSize: '10.5px',
              color: '#92400e',
              lineHeight: 1.5,
              marginBottom: '28px'
            }}
          >
            <strong>STATUTORY MANDATE & ADVISORY NATURE:</strong> {data.statutory_safeguards}
          </div>

          {/* Sign-off & Cryptographic Seal Block */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              borderTop: '2px solid #0f172a',
              paddingTop: '20px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <QrCode size={40} style={{ color: '#0f172a' }} />
                <div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>
                    SHA-256 Cryptographic Audit Seal
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all', maxWidth: '340px' }}>
                    {data.cryptographic_seal}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>
                AICTE Scrutiny Division &bull; Western Regional Office
              </div>
              <div style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontSize: '10px', color: '#64748b' }}>
                Authorized Regulatory Scrutiny Officer
                <div style={{ fontWeight: '700', color: '#0f172a' }}>Arun (Approval Officer)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
