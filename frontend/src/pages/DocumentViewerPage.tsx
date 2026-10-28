import React, { useState } from 'react';
import { IndianEmblem } from '../components/Emblems';

interface Props {
  documentName?: string;
  onBack?: () => void;
}

export default function DocumentViewerPage({ documentName = '', onBack }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
      {/* Top Header / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div className="breadcrumb-trail" style={{ marginBottom: 0 }}>
          {onBack && <span className="link" onClick={onBack}>Documents</span>}
          {onBack && <span>›</span>}
          <span className="current">{documentName}</span>
        </div>

        {/* Viewer Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          padding: '4px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom(Math.max(50, zoom - 15))}
            title="Zoom Out"
          >
            -
          </button>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155', minWidth: '45px', textAlign: 'center' }}>
            {zoom}%
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom(Math.min(180, zoom + 15))}
            title="Zoom In"
          >
            +
          </button>

          <div style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 4px' }} />

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
            {currentPage} / 4
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentPage(Math.min(4, currentPage + 1))}
            disabled={currentPage === 4}
          >
            ›
          </button>

          <div style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 4px' }} />

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setRotation((rotation + 90) % 360)}
            title="Rotate"
          >
            ⟳
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => alert(`Downloading verified copy of ${documentName}`)}
            title="Download"
          >
            ⬇
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
            title="Print"
          >
            🖨
          </button>
        </div>
      </div>

      {/* Main Split Viewer */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '140px 1fr 280px',
        gap: '16px',
        background: '#e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        overflow: 'hidden',
        border: '1px solid #cbd5e1'
      }}>
        {/* Left Thumbnails */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          border: '1px solid #cbd5e1'
        }}>
          {[1, 2, 3, 4].map(p => (
            <div
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: '6px',
                borderRadius: '6px',
                border: '2px solid',
                borderColor: currentPage === p ? '#2563eb' : '#e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{
                height: '90px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Page {p}</span>
                {p === 1 && (
                  <div style={{
                    position: 'absolute',
                    fontSize: '8px',
                    color: '#15803d',
                    border: '1px solid #16a34a',
                    padding: '1px 3px',
                    transform: 'rotate(-20deg)',
                    fontWeight: '700'
                  }}>
                    VERIFIED
                  </div>
                )}
              </div>
              <span style={{ fontSize: '11px', color: '#475569', marginTop: '4px', display: 'block' }}>
                Page {p}
              </span>
            </div>
          ))}
        </div>

        {/* Center Document Canvas */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          background: '#64748b',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{
            width: '520px',
            minHeight: '700px',
            background: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
            borderRadius: '2px',
            padding: '48px 40px',
            position: 'relative',
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease',
            color: '#1e293b'
          }}>
            {/* Stamp Stamp Seal Watermark */}
            <div style={{
              position: 'absolute',
              top: '42%',
              left: '48%',
              transform: 'translate(-50%, -50%) rotate(-18deg)',
              border: '4px double #16a34a',
              borderRadius: '8px',
              padding: '10px 28px',
              color: '#16a34a',
              fontSize: '32px',
              fontWeight: '900',
              letterSpacing: '3px',
              opacity: 0.88,
              pointerEvents: 'none',
              boxShadow: '0 0 10px rgba(22, 163, 74, 0.2)',
              textTransform: 'uppercase'
            }}>
              VERIFIED
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '1px', textAlign: 'center', marginTop: '2px' }}>
                AICTE COMPLIANCE WING · 2025
              </div>
            </div>

            {/* Document Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '16px', marginBottom: '20px' }}>
              <IndianEmblem size={42} color="#1e3a8a" />
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.5px', marginTop: '4px' }}>
                AICTE STATUTORY DOCUMENT REPOSITORY
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                REGULATORY COMPLIANCE &amp; FORENSIC INSPECTION DOSSIER
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '10px', textDecoration: 'underline' }}>
                {documentName ? documentName.toUpperCase().replace(/\.[A-Z0-9]+$/i, '') : 'OFFICIAL STATUTORY DOCUMENT'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                Tamper-Evident SHA-256 Verified · Secure Digital Archive
              </div>
            </div>

            {/* Document Body */}
            <div style={{ fontSize: '11.5px', lineHeight: '1.7', color: '#334155', textAlign: 'justify' }}>
              <p style={{ marginBottom: '12px' }}>
                This statutory document has been uploaded to the AICTE Compliance platform and parsed by the forensic verification pipeline:
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', marginBottom: '14px', fontSize: '11px' }}>
                <div><strong>Document Name:</strong> {documentName || 'Statutory Submission'}</div>
                <div><strong>Verification Status:</strong> Processed &amp; Digitally Authenticated</div>
                <div><strong>Forensic OCR Check:</strong> Text extracted &amp; cross-referenced with database records</div>
                <div><strong>Integrity Assurance:</strong> Cryptographic SHA-256 fingerprint verified against original submission</div>
              </div>

              <p style={{ marginBottom: '12px' }}>
                The document contents are reviewed by authorized Scrutiny Officers in accordance with the regulatory standards outlined in the AICTE Approval Process Handbook (APH 2025-27).
              </p>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748b' }}>
                <div style={{ width: '80px', height: '30px', borderBottom: '1px dashed #94a3b8', margin: '0 auto 4px' }} />
                Official Stamp
              </div>

              <div style={{ textAlign: 'center', fontSize: '10.5px' }}>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>AICTE Scrutiny Committee</div>
                <div style={{ color: '#64748b', fontSize: '9.5px' }}>Regulatory Compliance Wing</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspection Details Sidebar */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          border: '1px solid #cbd5e1',
          fontSize: '12px'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '8px' }}>
              Document Details
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569' }}>
              <div><strong>File:</strong> {documentName}</div>
              <div><strong>Size:</strong> 2.4 MB (4 Pages)</div>
              <div><strong>Format:</strong> PDF/A-1b Verified</div>
              <div><strong>Submitted:</strong> 10 Apr 2025</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              AI Inspection Results
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>OCR Accuracy:</span>
              <strong style={{ color: '#16a34a' }}>98.4%</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Seal Authenticity:</span>
              <strong style={{ color: '#16a34a' }}>Valid</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Tamper Score:</span>
              <strong style={{ color: '#16a34a' }}>0.00 (Pass)</strong>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              Officer Scrutiny Status
            </div>
            <div style={{ padding: '8px 10px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', fontWeight: '700', textAlign: 'center' }}>
              ✓ Endorsed &amp; Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
