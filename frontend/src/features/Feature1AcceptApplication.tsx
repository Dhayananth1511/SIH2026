import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  FileCheck,
  Building,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Hash,
  AlertCircle
} from 'lucide-react';
import { Application, Document } from '../types';
import { uploadDocument } from '../api';

interface Props {
  application: Application | null;
  documents: Document[];
  onRefresh: () => void;
  onNext: () => void;
}

const STATUTORY_DOC_TYPES = [
  'Land Title & Ownership Deed',
  'Fire & Life Safety NOC',
  'Approved Building & Structural Plan',
  'Faculty Master Roster & Cadre List',
  'Joint Fixed Deposit Receipt (FDR)'
];

export default function Feature1AcceptApplication({
  application,
  documents,
  onRefresh,
  onNext
}: Props) {
  const [selectedDocType, setSelectedDocType] = useState<string>(STATUTORY_DOC_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application?.application_id || !selectedFile) {
      setUploadMsg({ type: 'error', text: 'Please choose a file and select an application' });
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    try {
      await uploadDocument(application.application_id, selectedDocType, selectedFile);
      setUploadMsg({ type: 'success', text: `Successfully uploaded ${selectedFile.name} as ${selectedDocType}!` });
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err?.response?.data?.detail || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Feature Header */}
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
              FEATURE 1 OF 8
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Accept Sample AICTE Application &amp; Supporting Documents
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Ingests official AICTE Approval Process Handbook (APH) application forms alongside digital statutory supporting documents.
          </p>
        </div>
        <button
          onClick={onNext}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Feature 2: Extract &amp; Validate</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Grid: Left = Application Profile, Right = Upload Intake Zone */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left: Application Dossier Metadata Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} color="#1e3a8a" />
              <span>AICTE Application Dossier Profile</span>
            </h3>
            <span style={{
              background: '#f1f5f9',
              color: '#0f172a',
              fontWeight: '700',
              fontSize: '12px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {application?.application_id || 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Institution Name:</span>
              <strong style={{ color: '#0f172a', textAlign: 'right' }}>{application?.institution_name || 'Loading...'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Institution Type:</span>
              <span style={{ color: '#0f172a', fontWeight: '600' }}>{application?.institution_type || 'Engineering & Technology'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Application Category:</span>
              <span className="badge badge-info">{application?.category || 'Extension of Approval'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Location &amp; Region:</span>
              <span style={{ color: '#0f172a', fontWeight: '500' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                {application?.city || 'Pune'}, {application?.state || 'Maharashtra'} ({application?.region || 'Western'})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Programmes Applied For:</span>
              <span style={{ color: '#0f172a', fontWeight: '500', maxWidth: '60%', textAlign: 'right' }}>
                {application?.applied_for || 'Technical Courses'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Submission Date:</span>
              <span style={{ color: '#0f172a' }}>
                <Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />
                {application?.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Active Dossier'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Total Supporting Documents:</span>
              <strong style={{ color: '#1e3a8a' }}>{documents.length} Files Attached</strong>
            </div>
          </div>
        </div>

        {/* Right: Upload & Ingest Supporting Documents Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} color="#047857" />
            <span>Ingest Supporting Statutory Document</span>
          </h3>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Select Statutory Document Category:
              </label>
              <select
                value={selectedDocType}
                onChange={e => setSelectedDocType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#f8fafc',
                  outline: 'none'
                }}
              >
                {STATUTORY_DOC_TYPES.map(dt => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Choose File (PDF, DOCX, or Scanned Image):
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px dashed #94a3b8',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  fontSize: '12px'
                }}
              />
            </div>

            {uploadMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: uploadMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: uploadMsg.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${uploadMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`
              }}>
                {uploadMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{uploadMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Upload size={14} />
              <span>{uploading ? 'Ingesting Document & Calculating Hash...' : 'Upload & Ingest Document'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Uploaded Documents Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Ingested Statutory Documents ({documents.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Cryptographically registered documents with computed SHA-256 integrity hashes.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
          >
            Refresh Ingested List
          </button>
        </div>

        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
            <FileText size={36} style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <p style={{ fontWeight: '600' }}>No supporting documents uploaded for this application yet.</p>
            <p style={{ fontSize: '12px' }}>Use the form above to upload required statutory documents.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Document Type</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>File Name</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>SHA-256 Digest</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Size</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr key={doc.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>
                      <FileCheck size={14} color="#1e3a8a" style={{ display: 'inline', marginRight: '6px' }} />
                      {doc.doc_type}
                    </td>
                    <td style={{ padding: '12px', color: '#334155' }}>
                      {doc.filename}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                      <Hash size={11} style={{ display: 'inline', marginRight: '2px' }} />
                      {doc.sha256_hash ? `${doc.sha256_hash.slice(0, 14)}...${doc.sha256_hash.slice(-8)}` : 'Hash computed on intake'}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : '380 KB'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {doc.status === 'flagged' ? (
                        <span className="badge badge-danger">FLAGGED / ANOMALY</span>
                      ) : doc.status === 'verified' ? (
                        <span className="badge badge-success">INGESTED &amp; VERIFIED</span>
                      ) : (
                        <span className="badge badge-info">INGESTED (PENDING SCAN)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
