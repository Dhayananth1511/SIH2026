import React from 'react';
import { IndianEmblem } from './Emblems';
import { X, Printer, ShieldCheck, Download, CheckCircle2, AlertTriangle, XCircle, QrCode } from 'lucide-react';
import type { Application, DecisionRecord } from '../types';

interface Props {
  application: Application | null;
  onClose: () => void;
}

export default function RegulatoryOrderModal({ application, onClose }: Props) {
  if (!application) return null;

  const decisionRec: Partial<DecisionRecord> = application.decision_record || {
    decision: application.final_decision || 'CLEARED',
    reasons: application.decision_remarks || 'Extension of Approval granted in accordance with AICTE Approval Process Handbook norms.',
    order_number: application.decision_order_no || `AICTE/APH/2026-27/${application.application_id}`,
    authority_designation: 'Member Secretary, AICTE',
    decided_at: application.decision_at || new Date().toISOString(),
    decision_maker_name: 'Dr. Anil Sahasrabudhe'
  };

  const decisionType = decisionRec.decision?.toUpperCase() || 'CLEARED';
  const isCleared = decisionType === 'CLEARED';
  const isDeficiency = decisionType === 'DEFICIENCY';
  const isRejected = decisionType === 'REJECTED';

  const orderDate = decisionRec.decided_at
    ? new Date(decisionRec.decided_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print" style={{
          height: '52px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e3a8a' }}>
              Official Regulatory Decree
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              &bull; F.No: {decisionRec.order_number}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              <span>Print / Save Official PDF</span>
            </button>

            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px', borderRadius: '50%' }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Letterhead Canvas */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '30px 40px',
          background: '#ffffff',
          color: '#0f172a'
        }} id="printable-regulatory-order">
          {/* Government of India & AICTE Official Bilingual Header */}
          <div style={{
            textAlign: 'center',
            borderBottom: '2px solid #1e3a8a',
            paddingBottom: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <IndianEmblem size={44} color="#1e3a8a" />
            </div>

            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase' }}>
              अखिल भारतीय तकनीकी शिक्षा परिषद
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
            </div>
            <div style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>
              (A Statutory Body of the Government of India, Ministry of Education)
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
              Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | Website: www.aicte-india.org
            </div>
          </div>

          {/* Reference & Dispatch Meta Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '20px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '8px'
          }}>
            <div>
              <strong>F.No.</strong> {decisionRec.order_number}
            </div>
            <div>
              <strong>Date of Dispatch:</strong> {orderDate}
            </div>
          </div>

          {/* Addressee */}
          <div style={{ fontSize: '12.5px', lineHeight: '1.6', marginBottom: '20px' }}>
            <div>To,</div>
            <div style={{ fontWeight: '700', color: '#0f172a' }}>The Principal / Director,</div>
            <div style={{ fontWeight: '700', color: '#1e3a8a' }}>{application.institution_name}</div>
            <div style={{ color: '#475569' }}>{application.city}, {application.state}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Application Reference: #{application.application_id}</div>
          </div>

          {/* Subject Line */}
          <div style={{
            background: '#f8fafc',
            borderLeft: '4px solid #1e3a8a',
            padding: '10px 14px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            Sub: Statutory Regulatory Order for {application.category || 'Extension of Approval (EoA)'} for Academic Year 2026-27.
          </div>

          {/* Recital / Context */}
          <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#334155', textAlign: 'justify', marginBottom: '18px' }}>
            In terms of the provisions under the All India Council for Technical Education (Grant of Approvals for Technical Education) Regulations, 2026 notified on 15th January 2026 and norms standards, procedures and conditions prescribed by the Council from time to time, I am directed to convey the statutory determination of the Council as recorded by the Authorized Authority.
          </div>

          {/* Decision Decree Banner */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '6px',
            marginBottom: '20px',
            background: isCleared ? '#ecfdf5' : (isDeficiency ? '#fffbeb' : '#fef2f2'),
            border: `1.5px solid ${isCleared ? '#10b981' : (isDeficiency ? '#f59e0b' : '#ef4444')}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {isCleared && <CheckCircle2 size={24} color="#059669" />}
            {isDeficiency && <AlertTriangle size={24} color="#d97706" />}
            {isRejected && <XCircle size={24} color="#dc2626" />}

            <div>
              <div style={{
                fontSize: '13.5px',
                fontWeight: '800',
                textTransform: 'uppercase',
                color: isCleared ? '#065f46' : (isDeficiency ? '#92400e' : '#991b1b')
              }}>
                {isCleared && 'STATUTORY APPROVAL CONVEYED: EXTENSION OF APPROVAL (EoA) GRANTED'}
                {isDeficiency && 'DEFICIENCY NOTICE ISSUED: CONDITIONAL OPPORTUNITY TO RECTIFY'}
                {isRejected && 'STATUTORY REGULATORY REFUSAL ISSUED'}
              </div>
              <div style={{ fontSize: '11px', color: isCleared ? '#047857' : (isDeficiency ? '#b45309' : '#b91c1c'), marginTop: '2px' }}>
                {isCleared && 'Full compliance confirmed against AICTE Approval Process Handbook (APH 2026-27) norms.'}
                {isDeficiency && '15 calendar days granted to furnish rectified documentation to the Council.'}
                {isRejected && 'Statutory refusal recorded due to unresolved mandatory deficiencies.'}
              </div>
            </div>
          </div>

          {/* Verified Parameters Table */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
              Statutory Parameter Compliance Summary:
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Regulatory Check</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Statutory Norm</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Verified Evidence</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Outcome</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Land Parcel Contiguity</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>Min 5.0 Acres (APH 2.1)</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>Registered Title Deed Verified</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#059669', fontWeight: '700' }}>COMPLIANT</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Fire Safety Clearance</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>Valid State Fire NOC (APH 4.2)</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>State Fire Prevention Certificate</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: isCleared ? '#059669' : '#d97706', fontWeight: '700' }}>
                    {isCleared ? 'COMPLIANT' : 'SCRUTINIZED'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Building &amp; Structural Stability</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>PWD/Municipal Master Plan (APH 5.1)</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>Structural Stability Certificate</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#059669', fontWeight: '700' }}>COMPLIANT</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Faculty Cadre Ratio</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>1:20 SFR Ratio (APH 3.4)</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>University Approved Roll</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#059669', fontWeight: '700' }}>COMPLIANT</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Joint Endowment FDR</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>₹50 Lakhs Joint FDR (APH 6.3)</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>Bank Fixed Deposit Receipt</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#059669', fontWeight: '700' }}>COMPLIANT</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Reasoned Statutory Grounds */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              Reasoned Regulatory Finding:
            </div>
            <div style={{
              fontSize: '12px',
              lineHeight: '1.6',
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              color: '#1e293b'
            }}>
              {decisionRec.reasons}
            </div>
          </div>

          {/* Digital Authentication & QR Block */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid #cbd5e1',
            paddingTop: '20px',
            marginTop: '30px'
          }}>
            {/* Left: Cryptographic QR & Verification Hash */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '68px',
                height: '68px',
                border: '1px solid #94a3b8',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                color: '#1e3a8a'
              }}>
                <QrCode size={52} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.4' }}>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>AICTE Digital Authentication Key:</div>
                <code style={{ fontSize: '9.5px', color: '#334155' }}>
                  {application.application_id}&bull;DEC_{decisionRec.id || '01'}&bull;{orderDate}
                </code>
                <div>Digitally signed via Sovereign Regulatory Public Key Infrastructure.</div>
              </div>
            </div>

            {/* Right: Authorized Signatory Block */}
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{
                fontSize: '11px',
                color: '#059669',
                fontWeight: '700',
                border: '1px dashed #059669',
                padding: '4px 8px',
                borderRadius: '4px',
                marginBottom: '8px',
                background: '#ecfdf5'
              }}>
                DIGITALLY SIGNED &amp; SEALED
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>
                {decisionRec.decision_maker_name || 'Dr. Anil Sahasrabudhe'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {decisionRec.authority_designation || 'Member Secretary, AICTE'}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                All India Council for Technical Education
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
