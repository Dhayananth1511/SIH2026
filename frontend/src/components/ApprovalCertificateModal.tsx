import React from 'react';
import { IndianEmblem, Aictelogo } from './Emblems';
import { X, Printer, Download, QrCode, ShieldCheck, CheckCircle2, Award, Calendar, FileText } from 'lucide-react';
import type { Application, DecisionRecord } from '../types';

interface Props {
  application: Application | null;
  onClose: () => void;
}

export default function ApprovalCertificateModal({ application, onClose }: Props) {
  if (!application) return null;

  const decisionRec: Partial<DecisionRecord> = application.decision_record || {
    decision: application.final_decision || 'CLEARED',
    reasons: application.decision_remarks || 'Extension of Approval granted in accordance with AICTE Approval Process Handbook norms.',
    order_number: application.decision_order_no || `AICTE/EoA/2026-27/${application.application_id}`,
    authority_designation: 'Member Secretary, AICTE',
    decided_at: application.decision_at || new Date().toISOString(),
    decision_maker_name: 'Dr. Anil Sahasrabudhe'
  };

  const isApproved =
    (decisionRec.decision || '').toUpperCase() === 'CLEARED' ||
    (application.status || '').toUpperCase() === 'DECISION_RECORDED' ||
    (application.status || '').toUpperCase() === 'APPROVED' ||
    Boolean(application.certificate_issued);

  const issueDateFormatted = application.officer_reviewed_at
    ? new Date(application.officer_reviewed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : (decisionRec.decided_at
      ? new Date(decisionRec.decided_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '28th October 2026');

  const certNo = application.certificate_number || `AICTE/CERT/2026-27/${application.application_id.replace('APP-', '')}`;
  const permanentInstituteId = `1-${Math.abs(application.institution_id || 1097241851).toString().padStart(10, '0')}`;
  const verificationHash = (application as any).verification_hash || 'c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f17890abcdef1234567890abcdef123456';

  // Sanctioned programmes schedule
  const programmes = [
    { program: 'Engineering & Technology (UG)', course: 'Computer Science & Engineering', intake: 120, shift: 'Regular', accreditation: 'NBA Accredited' },
    { program: 'Engineering & Technology (UG)', course: 'Artificial Intelligence & Data Science', intake: 60, shift: 'Regular', accreditation: 'Approved' },
    { program: 'Engineering & Technology (UG)', course: 'Electronics & Communication Engineering', intake: 60, shift: 'Regular', accreditation: 'Approved' },
    { program: 'Engineering & Technology (UG)', course: 'Mechanical Engineering', intake: 60, shift: 'Regular', accreditation: 'Approved' },
    { program: 'Management (PG)', course: 'Master of Business Administration (MBA)', intake: 60, shift: 'Regular', accreditation: 'Approved' }
  ];

  const totalIntake = programmes.reduce((acc, p) => acc + p.intake, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-card certificate-modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '96vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print" style={{
          minHeight: '60px',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <Award size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.3px', lineHeight: 1.3 }}>
                AICTE Official Certificate of Approval (Academic Year 2026–2027)
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Certificate No: <strong style={{ color: '#fbbf24' }}>{certNo}</strong> &bull; Permanent Institute ID: {permanentInstituteId}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #1e40af, #1d4ed8)',
                color: '#ffffff',
                border: '1px solid #3b82f6',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(30, 64, 175, 0.4)',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} />
              <span>Download / Print Official PDF</span>
            </button>

            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px', borderRadius: '50%', color: '#94a3b8', background: '#1e293b', border: '1px solid #334155', cursor: 'pointer' }}
              title="Close Certificate"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate Preview Canvas */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '30px',
          background: '#1e293b',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          {/* Printable Certificate Page */}
          <div
            id="printable-approval-certificate"
            style={{
              width: '100%',
              maxWidth: '920px',
              background: '#fdfbf7',
              color: '#0f172a',
              position: 'relative',
              boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
              borderRadius: '4px',
              boxSizing: 'border-box',
              padding: '24px'
            }}
          >
            {/* Outer Double Security Ornamental Border */}
            <div style={{
              border: '4px solid #1e3a8a',
              padding: '6px',
              position: 'relative',
              background: '#ffffff'
            }}>
              <div style={{
                border: '2px solid #b45309',
                padding: '26px 32px',
                position: 'relative',
                background: '#ffffff'
              }}>

                {/* Corner Decorative Elements */}
                <div style={{ position: 'absolute', top: '4px', left: '4px', width: '20px', height: '20px', borderTop: '3px solid #b45309', borderLeft: '3px solid #b45309' }} />
                <div style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderTop: '3px solid #b45309', borderRight: '3px solid #b45309' }} />
                <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '20px', height: '20px', borderBottom: '3px solid #b45309', borderLeft: '3px solid #b45309' }} />
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '20px', height: '20px', borderBottom: '3px solid #b45309', borderRight: '3px solid #b45309' }} />

                {/* Subtle Watermark in background */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.04,
                  pointerEvents: 'none',
                  zIndex: 0
                }}>
                  <Aictelogo size={380} />
                </div>

                {/* Content Layer */}
                <div style={{ position: 'relative', zIndex: 1 }}>

                  {/* Header: National Emblem & AICTE Crest */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid #d97706',
                    paddingBottom: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                      <IndianEmblem size={68} color="#1e3a8a" />
                    </div>

                    <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        अखिल भारतीय तकनीकी शिक्षा परिषद्
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.8px', marginTop: '2px' }}>
                        ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginTop: '2px' }}>
                        (A Statutory Body of the Government of India, Ministry of Education)
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                        Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | Website: www.aicte-india.org
                      </div>
                    </div>

                    <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                      <Aictelogo size={68} />
                    </div>
                  </div>

                  {/* Certificate Title Banner */}
                  <div style={{
                    textAlign: 'center',
                    margin: '18px 0 14px 0',
                    background: 'linear-gradient(90deg, transparent, rgba(254, 243, 199, 0.6), transparent)',
                    padding: '8px 0'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#b45309',
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}>
                      शैक्षणिक वर्ष २०२६-२७ हेतु अनुमोदन प्रमाण पत्र
                    </div>
                    <div style={{
                      fontSize: '22px',
                      fontWeight: '900',
                      color: '#1e3a8a',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      marginTop: '3px'
                    }}>
                      CERTIFICATE OF APPROVAL
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#047857',
                      letterSpacing: '0.5px',
                      marginTop: '2px'
                    }}>
                      EXTENSION OF APPROVAL (EoA) FOR ACADEMIC YEAR 2026–2027
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '8px 14px',
                    fontSize: '11px',
                    marginBottom: '18px'
                  }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Certificate No:</span><br />
                      <strong style={{ color: '#0f172a' }}>{certNo}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Permanent Institute ID:</span><br />
                      <strong style={{ color: '#0f172a' }}>{permanentInstituteId}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Application Dossier:</span><br />
                      <strong style={{ color: '#1e3a8a' }}>{application.application_id}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Date of Issuance:</span><br />
                      <strong style={{ color: '#0f172a' }}>{issueDateFormatted}</strong>
                    </div>
                  </div>

                  {/* Conferment Preamble */}
                  <div style={{
                    fontSize: '12.5px',
                    lineHeight: '1.7',
                    textAlign: 'justify',
                    color: '#1e293b',
                    marginBottom: '16px'
                  }}>
                    This is to formally certify that{' '}
                    <strong style={{ color: '#1e3a8a', fontSize: '13.5px', textDecoration: 'underline' }}>
                      {application.institution_name}
                    </strong>
                    , situated at {application.city || 'Pune'}, {application.state || 'Maharashtra'} (Region: {application.region || 'Western'}),
                    having submitted its statutory application under the provisions of the <strong>All India Council for Technical Education Act, 1987 (52 of 1987)</strong>,
                    and having satisfactorily verified compliance with all statutory parameters—including clear contiguous campus land tenure, municipal building stability,
                    Faculty-to-Student Ratio (1:20 SFR), Fire & Life Safety clearance, and financial endowments as specified in the
                    <strong> AICTE Approval Process Handbook (APH 2026-27)</strong>, is hereby granted:
                  </div>

                  {/* Conferment Highlight Box */}
                  <div style={{
                    border: '1.5px dashed #059669',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '6px',
                    padding: '10px 16px',
                    textAlign: 'center',
                    marginBottom: '18px'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#065f46', letterSpacing: '0.5px' }}>
                      EXTENSION OF APPROVAL (EoA) FOR TECHNICAL PROGRAMMES &bull; ACADEMIC YEAR 2026–27
                    </span>
                    <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                      Category: {application.category || 'Extension of Approval'} &bull; Institution Type: {application.institution_type || 'Engineering & Technology'}
                    </div>
                  </div>

                  {/* Sanctioned Programmes & Intake Table */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.4px' }}>
                      Schedule of Approved Technical Programmes & Sanctioned Annual Intake
                    </div>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1'
                    }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #94a3b8' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', color: '#1e293b', fontWeight: '700' }}>#</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', color: '#1e293b', fontWeight: '700' }}>Programme Level</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', color: '#1e293b', fontWeight: '700' }}>Approved Course / Specialization</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', color: '#1e293b', fontWeight: '700' }}>Shift / Mode</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', color: '#1e293b', fontWeight: '700' }}>Accreditation Status</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#1e293b', fontWeight: '700' }}>Sanctioned Intake</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programmes.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ padding: '5px 10px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '5px 10px', fontWeight: '600', color: '#1e3a8a' }}>{p.program}</td>
                            <td style={{ padding: '5px 10px', fontWeight: '700', color: '#0f172a' }}>{p.course}</td>
                            <td style={{ padding: '5px 10px', textAlign: 'center', color: '#475569' }}>{p.shift}</td>
                            <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '9.5px',
                                fontWeight: '700',
                                background: p.accreditation.includes('NBA') ? '#dcfce7' : '#f1f5f9',
                                color: p.accreditation.includes('NBA') ? '#166534' : '#475569'
                              }}>
                                {p.accreditation}
                              </span>
                            </td>
                            <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: '800', color: '#1e3a8a' }}>{p.intake}</td>
                          </tr>
                        ))}
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: '800' }}>
                          <td colSpan={5} style={{ padding: '7px 10px', textAlign: 'right', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Total Sanctioned Annual Intake for 2026–27:
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#059669', fontSize: '13px' }}>
                            {totalIntake} Seats
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Statutory Terms & Conditions Notice */}
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    lineHeight: '1.5',
                    borderLeft: '3px solid #d97706',
                    paddingLeft: '10px',
                    marginBottom: '18px'
                  }}>
                    <strong>Statutory Compliance Mandate:</strong> The granting of this approval is strictly subject to adherence with AICTE Anti-Ragging Regulations,
                    reservation quotas as per central/state statutory policies, barrier-free built infrastructure for Divyangjan, valid municipal fire clearances, and timely upload of mandatory disclosure particulars on the AICTE Portal.
                  </div>

                  {/* Authentication & Security Sign-Off Block */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.8fr 1.3fr',
                    gap: '12px',
                    alignItems: 'center',
                    borderTop: '2px solid #e2e8f0',
                    paddingTop: '14px'
                  }}>
                    {/* Left: QR Code & Verification */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '74px',
                        height: '74px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <QrCode size={64} color="#0f172a" />
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>SCAN FOR DIGITAL VERIFICATION</div>
                        <div>Validates authentic council decree</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                          Hash: {verificationHash.substring(0, 16)}...
                        </div>
                        <div style={{ color: '#2563eb', textDecoration: 'underline', marginTop: '1px' }}>
                          approval.aicte-india.org/verify
                        </div>
                      </div>
                    </div>

                    {/* Center: Gold Embossed Council Seal */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '74px',
                        height: '74px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #fef08a 0%, #eab308 60%, #b45309 100%)',
                        border: '2px dashed #78350f',
                        boxShadow: '0 2px 8px rgba(180, 83, 9, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#78350f',
                        padding: '4px',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ fontSize: '6.5px', fontWeight: '900', letterSpacing: '0.5px' }}>AICTE &bull; INDIA</div>
                        <Award size={20} color="#78350f" />
                        <div style={{ fontSize: '6px', fontWeight: '800', marginTop: '1px' }}>OFFICIAL SEAL</div>
                        <div style={{ fontSize: '5.5px', fontWeight: '700' }}>2026–2027</div>
                      </div>
                    </div>

                    {/* Right: Digital Signature Stamp */}
                    <div style={{
                      textAlign: 'right',
                      background: '#f8fafc',
                      border: '1.5px solid #93c5fd',
                      borderRadius: '5px',
                      padding: '8px 12px'
                    }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1e40af', fontSize: '9.5px', fontWeight: '700', marginBottom: '2px' }}>
                        <ShieldCheck size={12} color="#1e40af" />
                        <span>Digitally Signed by Competent Authority</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', fontFamily: 'serif' }}>
                        {application.officer_name || 'Dr. Priya Sharma'}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#1e3a8a' }}>
                        AICTE Approval Officer / Authorized Competent Authority
                      </div>
                      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                        Signed: {issueDateFormatted} &bull; New Delhi
                      </div>
                      <div style={{ fontSize: '8px', color: '#059669', fontWeight: '700', marginTop: '2px' }}>
                        ✓ Cryptographically Validated DSC
                      </div>
                    </div>
                  </div>

                  {/* Council Footer Disclaimer */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '9px',
                    color: '#94a3b8',
                    marginTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '8px'
                  }}>
                    This is an electronically generated and digitally signed Certificate of Approval issued by the All India Council for Technical Education.
                    Physical signature is not required. Tampering with this certificate is an offence punishable under Section 468 of the Indian Penal Code.
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
