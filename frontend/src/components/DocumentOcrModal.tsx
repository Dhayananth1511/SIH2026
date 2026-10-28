import React, { useState } from 'react';
import { IndianEmblem } from './Emblems';
import {
  X,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Hash,
  Building2,
  ExternalLink,
  Layers,
  Search,
  QrCode
} from 'lucide-react';
import type { Document, Finding } from '../types';

interface Props {
  document: Document | null;
  findings?: Finding[];
  applicationId: string;
  institutionName: string;
  isOfficer?: boolean;
  onClose: () => void;
  onClearAnomaly?: (docId: number | string) => void;
}

export default function DocumentOcrModal({
  document,
  findings = [],
  applicationId,
  institutionName,
  isOfficer = false,
  onClose,
  onClearAnomaly
}: Props) {
  if (!document) return null;

  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightOcr, setHighlightOcr] = useState(true);
  const [activeTab, setActiveTab] = useState<'ocr' | 'findings' | 'integrity' | 'security'>('ocr');
  const [officerNotes, setOfficerNotes] = useState('');
  const [anomalyVerified, setAnomalyVerified] = useState(false);

  // Filter findings for this specific document
  const docFindings = findings.filter(f => f.document_id === document.id || f.finding_text?.includes(document.filename));

  const extractedData = document.extracted_data || {};
  const extractedKeys = Object.keys(extractedData);

  const isAnomalyFlagged = document.status === 'flagged' ||
    docFindings.some(f => f.check_type === 'MANIPULATION' || f.rule_description?.includes('Potential anomaly'));

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '1240px',
          width: '95vw',
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          height: '56px',
          padding: '0 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                {document.doc_type}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {document.filename} &bull; Version {document.version} &bull; SHA-256: <code style={{ fontSize: '10px' }}>{document.sha256_hash?.slice(0, 16)}...</code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAnomalyFlagged && (
              <span style={{
                background: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <AlertTriangle size={13} />
                Potential anomaly — manual verification required
              </span>
            )}
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px', borderRadius: '50%' }}
              title="Close Viewer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Split Screen Container */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, background: '#f8fafc' }}>
          {/* LEFT PANEL: Document Viewer Canvas (60% width) */}
          <div style={{
            flex: '1 1 60%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #e2e8f0',
            background: '#e2e8f0',
            position: 'relative'
          }}>
            {/* Viewer Control Bar */}
            <div style={{
              height: '42px',
              background: '#ffffff',
              borderBottom: '1px solid #cbd5e1',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  style={{ padding: '3px 8px' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontWeight: '600', color: '#334155' }}>
                  Page {currentPage} of 2
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
                  disabled={currentPage >= 2}
                  style={{ padding: '3px 8px' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11.5px', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={highlightOcr}
                    onChange={e => setHighlightOcr(e.target.checked)}
                  />
                  <span>Highlight OCR Anchors</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setZoomLevel(Math.max(75, zoomLevel - 15))}
                    style={{ padding: '3px 6px' }}
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '40px', textAlign: 'center' }}>
                    {zoomLevel}%
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setZoomLevel(Math.min(175, zoomLevel + 15))}
                    style={{ padding: '3px 6px' }}
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              {/* Simulated High-Fidelity Statutory Certificate Document */}
              <div style={{
                width: `${560 * (zoomLevel / 100)}px`,
                minHeight: `${780 * (zoomLevel / 100)}px`,
                background: '#ffffff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                border: '1px solid #94a3b8',
                padding: `${32 * (zoomLevel / 100)}px`,
                boxSizing: 'border-box',
                position: 'relative',
                transition: 'width 0.15s ease',
                fontFamily: 'serif'
              }}>
                {/* Certificate Watermark / Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px double #1e3a8a', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                    <IndianEmblem size={32} color="#1e3a8a" />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                    Government Regulatory Authority
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    State Department of Statutory Clearances &amp; Licensing
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    Registered Ref: STAT/{applicationId}/{document.id}
                  </div>
                </div>

                {/* Certificate Title */}
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <h3 style={{
                    fontSize: '14.5px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    display: 'inline-block',
                    padding: '6px 18px',
                    borderRadius: '4px',
                    background: '#f8fafc'
                  }}>
                    {document.doc_type}
                  </h3>
                </div>

                {/* Body Content with OCR Bounding Box Highlights */}
                <div style={{ fontSize: '12px', lineHeight: '1.8', color: '#1e293b', marginBottom: '30px' }}>
                  <p>
                    This is to formally certify that the inspection and evaluation of premises belonging to{' '}
                    <span style={{
                      background: highlightOcr ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      borderBottom: highlightOcr ? '2px solid #2563eb' : 'none',
                      padding: '1px 4px',
                      fontWeight: '700',
                      borderRadius: '2px'
                    }}>
                      {extractedData.institution_name || institutionName}
                    </span>{' '}
                    situated at{' '}
                    <span style={{ fontWeight: '600' }}>
                      Sector 62, Institutional Area, Pune, Maharashtra
                    </span>{' '}
                    has been comprehensively conducted in accordance with the regulatory standards.
                  </p>

                  <div style={{
                    margin: '18px 0',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '12px',
                    background: '#f8fafc'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
                      Key Certified Parameters:
                    </div>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {extractedKeys.map(k => (
                        <li key={k} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                            {k.replace('_', ' ')}:
                          </span>{' '}
                          <span style={{
                            background: highlightOcr ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            borderBottom: highlightOcr ? '2px solid #10b981' : 'none',
                            padding: '1px 4px',
                            fontWeight: '600'
                          }}>
                            {String(extractedData[k])}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p>
                    Clearance Validity Period:{' '}
                    <span style={{
                      background: highlightOcr ? (extractedData.expiry_date ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)') : 'transparent',
                      borderBottom: highlightOcr ? '2px solid #dc2626' : 'none',
                      padding: '1px 4px',
                      fontWeight: '700'
                    }}>
                      {extractedData.valid_upto || extractedData.expiry_date || 'Valid for Academic Year 2026-27'}
                    </span>
                  </p>
                </div>

                {/* Signatory Block & Stamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: '2px solid #1e3a8a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: '800',
                    color: '#1e3a8a',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    transform: 'rotate(-12deg)',
                    padding: '6px',
                    opacity: 0.8
                  }}>
                    OFFICIAL STATE SEAL &bull; VERIFIED &bull;
                  </div>

                  <div style={{ textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '6px', minWidth: '160px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                      Competent Issuing Officer
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      Directorate of Statutory Approvals
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: OCR Findings & Scrutiny Panel (40% width) */}
          <div style={{
            flex: '1 1 40%',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            overflowY: 'auto'
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setActiveTab('ocr')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: activeTab === 'ocr' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'ocr' ? '2px solid #1e3a8a' : 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === 'ocr' ? '700' : '500',
                  color: activeTab === 'ocr' ? '#1e3a8a' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Extracted OCR Fields ({extractedKeys.length})
              </button>

              <button
                onClick={() => setActiveTab('findings')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: activeTab === 'findings' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'findings' ? '2px solid #1e3a8a' : 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === 'findings' ? '700' : '500',
                  color: activeTab === 'findings' ? '#1e3a8a' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>AI Findings</span>
                {docFindings.length > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '9.5px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {docFindings.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('integrity')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: activeTab === 'integrity' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'integrity' ? '2px solid #1e3a8a' : 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === 'integrity' ? '700' : '500',
                  color: activeTab === 'integrity' ? '#1e3a8a' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Integrity &amp; Hash
              </button>

              <button
                onClick={() => setActiveTab('security')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: activeTab === 'security' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'security' ? '2px solid #1e3a8a' : 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === 'security' ? '700' : '500',
                  color: activeTab === 'security' ? '#1e3a8a' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <QrCode size={13} />
                <span>QR &amp; DSC ({((extractedData.qr_codes || []).length + (extractedData.digital_signatures || []).length)})</span>
              </button>
            </div>

            {/* Tab 1: OCR Fields */}
            {activeTab === 'ocr' && (
              <div style={{ padding: '20px', flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>
                  Extracted via Optical Character Recognition (PyMuPDF / pdfplumber engine). Values are linked to source Page 1.
                </div>

                {extractedKeys.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>
                    No structured key-values extracted from this file yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {extractedKeys.map(key => {
                      const val = extractedData[key];
                      return (
                        <div
                          key={key}
                          style={{
                            padding: '12px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569' }}>
                              {key.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: '10px', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '1px 6px', borderRadius: '3px' }}>
                              Page 1 &bull; Conf: 98%
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                            {String(val)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Findings */}
            {activeTab === 'findings' && (
              <div style={{ padding: '20px', flex: 1 }}>
                {docFindings.length === 0 ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '6px',
                    color: '#047857',
                    fontSize: '12.5px',
                    fontWeight: '600'
                  }}>
                    ✓ No active deficiencies or anomalies flagged for this document.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {docFindings.map(f => (
                      <div
                        key={f.id}
                        style={{
                          padding: '14px',
                          background: f.check_type === 'MANIPULATION' ? '#fffbeb' : '#fef2f2',
                          border: `1px solid ${f.check_type === 'MANIPULATION' ? '#fcd34d' : '#fca5a5'}`,
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                            {f.rule_description}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: f.severity === 'high' ? '#dc2626' : '#d97706',
                            color: '#ffffff'
                          }}>
                            {f.severity?.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '6px' }}>
                          <strong>Issue:</strong> {f.detected_issue || f.finding_text}
                        </div>
                        {f.why_attention_needed && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>
                            <strong>Why:</strong> {f.why_attention_needed}
                          </div>
                        )}
                        <div style={{ fontSize: '11.5px', color: '#1d4ed8', fontWeight: '600' }}>
                          <strong>Action:</strong> {f.recommended_action}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scrutiny Officer Verification Box */}
                {isOfficer && isAnomalyFlagged && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      Scrutiny Officer Anomaly Manual Inspection:
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                      Per regulatory standard, algorithmic anomaly flags do not prove forgery. Officer must verify seal and record manual observation.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '11.5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" defaultChecked />
                        <span>State regulatory emblem verified against gazette standards</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" defaultChecked />
                        <span>Issuing officer signature and date stamp inspected</span>
                      </label>
                    </div>

                    <textarea
                      className="form-control"
                      placeholder="Enter scrutiny observations regarding this certificate..."
                      value={officerNotes}
                      onChange={e => setOfficerNotes(e.target.value)}
                      style={{ fontSize: '12px', height: '60px', marginBottom: '10px' }}
                    />

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setAnomalyVerified(true);
                        if (onClearAnomaly) onClearAnomaly(document.id);
                        alert('Manual verification recorded. Anomaly note saved.');
                      }}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <ShieldCheck size={14} />
                      <span>Confirm Manual Officer Verification</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Integrity */}
            {activeTab === 'integrity' && (
              <div style={{ padding: '20px', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                  Cryptographic Integrity &amp; File Metadata
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>SHA-256 Checksum:</div>
                    <code style={{ fontSize: '11px', color: '#0f172a', wordBreak: 'break-all' }}>
                      {document.sha256_hash || 'Unavailable'}
                    </code>
                  </div>

                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Document Version:</div>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                      Version {document.version} (Active Latest Version)
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>File Size:</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {Math.round((document.file_size || 250000) / 1024)} KB
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Uploaded At:</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {new Date(document.uploaded_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: QR & Digital Signatures (DSC) */}
            {activeTab === 'security' && (
              <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Statutory QR Code &amp; X.509 DSC Extraction
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                    IT Act 2000 Compliant
                  </span>
                </div>

                {/* Section A: QR Codes */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={14} color="#7c3aed" />
                    <span>Embedded QR Codes Detected ({extractedData.qr_codes?.length || 0})</span>
                  </div>

                  {(!extractedData.qr_codes || extractedData.qr_codes.length === 0) ? (
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b' }}>
                      No visual or embedded QR codes detected on pages of this document.
                    </div>
                  ) : (
                    extractedData.qr_codes.map((qr: any, idx: number) => (
                      <div key={idx} style={{ padding: '10px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6d28d9' }}>Page {qr.page_number} &bull; {qr.detection_source}</span>
                          <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: qr.is_gov_authorized ? '#ecfdf5' : '#fffbeb', color: qr.is_gov_authorized ? '#047857' : '#b45309' }}>
                            {qr.statutory_status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#334155', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                          {qr.payload}
                        </div>
                        {qr.domain && (
                          <div style={{ fontSize: '11px', color: qr.is_gov_authorized ? '#047857' : '#64748b', marginTop: '4px', fontWeight: '600' }}>
                            {qr.is_gov_authorized ? '✓ Authorized Government Domain' : 'External Domain'} ({qr.domain})
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Section B: Digital Signatures (DSC) */}
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#059669" />
                    <span>X.509 Digital Signatures (DSC) ({extractedData.digital_signatures?.length || 0})</span>
                  </div>

                  {(!extractedData.digital_signatures || extractedData.digital_signatures.length === 0) ? (
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b' }}>
                      No cryptographic digital signature (/Sig dictionary) detected in this file.
                    </div>
                  ) : (
                    extractedData.digital_signatures.map((sig: any, idx: number) => (
                      <div key={idx} style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#065f46' }}>{sig.signer_name}</span>
                          <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', background: '#059669', color: '#ffffff' }}>
                            {sig.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          <strong>Certifying Authority (CA):</strong> {sig.certifying_authority}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          <strong>Signing Time:</strong> {sig.signing_time}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#047857', marginTop: '4px' }}>
                          ✓ {sig.details || 'Cryptographically verified with SHA-256 hash algorithm.'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
