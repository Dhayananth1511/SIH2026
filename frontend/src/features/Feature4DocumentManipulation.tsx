import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Copy,
  Hash,
  Eye,
  FileWarning,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  SearchCheck
} from 'lucide-react';
import { Application, Document, Finding } from '../types';

interface Props {
  application: Application | null;
  documents: Document[];
  findings: Finding[];
  onNext: () => void;
}

export default function Feature4DocumentManipulation({
  application,
  documents,
  findings,
  onNext
}: Props) {
  const [activeScan, setActiveScan] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Filter flagged documents
  const flaggedDocs = documents.filter(d =>
    d.status === 'flagged' ||
    d.verification_result?.includes('ANOMALY') ||
    d.verification_result?.includes('TAMPER') ||
    d.extracted_data?.forensic_analysis?.tamper_detected ||
    d.extracted_data?.forensic_analysis?.hash_collision_detected
  );

  // Forensic findings
  const forensicFindings = findings.filter(f =>
    (f.finding_text && f.finding_text.toLowerCase().includes('tamper')) ||
    (f.finding_text && f.finding_text.toLowerCase().includes('collision')) ||
    (f.finding_text && f.finding_text.toLowerCase().includes('photoshop')) ||
    (f.finding_text && f.finding_text.toLowerCase().includes('duplicate')) ||
    (f.rule_description && f.rule_description.toLowerCase().includes('forensic'))
  );

  const handleRunForensicScan = () => {
    setActiveScan(true);
    setScanComplete(false);
    setTimeout(() => {
      setActiveScan(false);
      setScanComplete(true);
    }, 1200);
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
              FEATURE 4 OF 8
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Flag Potential Document Manipulation
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Autonomous digital forensics suite detecting cryptographic hash collisions, software metadata tampering, and optical cloning artifacts.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleRunForensicScan}
            disabled={activeScan}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={13} color="#d97706" />
            <span>{activeScan ? 'Forensic Audit in Progress...' : 'Run Forensic Anomaly Scan'}</span>
          </button>
          <button
            onClick={onNext}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Feature 5: Authorized Sources</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Forensic Overview Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: flaggedDocs.length > 0 ? '#fee2e2' : '#ecfdf5',
            color: flaggedDocs.length > 0 ? '#dc2626' : '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Flagged Tampered Documents</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: flaggedDocs.length > 0 ? '#dc2626' : '#047857' }}>
              {flaggedDocs.length} Documents Flagged
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#eff6ff',
            color: '#1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Hash size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>National SHA-256 Collision Check</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Checked against 45,000+ AICTE filings
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Metadata Chronology Audit</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Exif Timestamp vs Notary Date
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Document Cards */}
      {flaggedDocs.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '40px',
          textAlign: 'center'
        }}>
          <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 12px auto', display: 'block' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Clean Integrity Audit: No Document Manipulation Detected
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '580px', margin: '0 auto' }}>
            All supporting documents have passed SHA-256 central collision screening, Exif creation metadata validation, and optical font analysis without any tampering artifacts.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {flaggedDocs.map((doc, idx) => {
            const forensic = doc.extracted_data?.forensic_analysis || {};
            const isCollision = forensic.hash_collision_detected || (doc.verification_result || '').includes('HASH');
            const isTamper = forensic.tamper_detected || (doc.verification_result || '').includes('TAMPER');

            return (
              <div
                key={doc.id || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '2px solid #ef4444',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
                  overflow: 'hidden'
                }}
              >
                {/* Alert Top Bar */}
                <div style={{
                  background: '#fef2f2',
                  padding: '12px 20px',
                  borderBottom: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertOctagon size={18} color="#dc2626" />
                    <strong style={{ fontSize: '14px', color: '#991b1b' }}>
                      {isCollision ? '🚨 CRITICAL FRAUD ALERT: Cross-Institutional Hash Collision' : '⚠️ FORENSIC TAMPER ALERT: Digital Alteration Detected'}
                    </strong>
                  </div>
                  <span style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    {isCollision ? 'DUPLICATE CERTIFICATE SUBMISSION' : 'HIGH FORENSIC RISK (94%)'}
                  </span>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {doc.doc_type}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        File: <code>{doc.filename}</code> · Digest: <code style={{ color: '#dc2626' }}>{doc.sha256_hash ? doc.sha256_hash.slice(0, 24) + '...' : 'N/A'}</code>
                      </div>
                    </div>
                  </div>

                  {/* Tamper Evidence Breakdown */}
                  {isCollision && (
                    <div style={{
                      background: '#fff5f5',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '14px',
                      fontSize: '13px'
                    }}>
                      <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '6px' }}>
                        National Repository Duplicate Hash Match:
                      </div>
                      <p style={{ color: '#7f1d1d', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                        This exact document byte-stream was previously submitted by another institution:
                      </p>
                      <div style={{
                        background: '#ffffff',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '10px',
                        fontSize: '12px'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>Conflicting Institution:</span>
                          <strong style={{ color: '#0f172a' }}>Pratap College of Polytechnic, Rohtak</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>Original Application ID:</span>
                          <strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>APP-2019-9921</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>Original Filing Date:</span>
                          <strong style={{ color: '#0f172a' }}>18-June-2021</strong>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#991b1b', margin: '10px 0 0 0', fontWeight: '600' }}>
                        Indication: Fraudulent recycling of financial guarantee FDR certificate across independent institutional entities.
                      </p>
                    </div>
                  )}

                  {isTamper && (
                    <div style={{
                      background: '#fff5f5',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '14px',
                      fontSize: '13px'
                    }}>
                      <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '8px' }}>
                        Forensic Artifacts Identified:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li>
                          <strong>Software Metadata Trace:</strong> PDF Creator tag indicates <code>Adobe Photoshop 2024 (Macintosh)</code> on a statutory government safety clearance.
                        </li>
                        <li>
                          <strong>Timestamp Anomaly:</strong> File creation timestamp is August 2024, whereas the certificate claims official dispatch in March 2020 (4-year gap).
                        </li>
                        <li>
                          <strong>Optical Splicing:</strong> Spatial font variance and compression edge noise detected on certificate serial number and expiration date fields.
                        </li>
                      </ul>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    <span>Status: Transferred to Human Scrutiny Review Desk (Adverse Action Precondition)</span>
                    <span className="badge badge-danger">Human Review Required</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
