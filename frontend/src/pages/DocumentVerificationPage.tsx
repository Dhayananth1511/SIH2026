import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, getApplications, verifyDocumentItem, completeVerification } from '../api';
import type { Document, Application } from '../types';
import { useAuth } from '../AuthContext';

interface Props {
  appId?: string;
  onViewDocument?: (docName: string) => void;
}

export default function DocumentVerificationPage({ appId = '', onViewDocument }: Props) {
  const { user } = useAuth();
  const role = (user?.role || 'institution').toLowerCase();
  const isOfficerOrAdmin = ['verification_officer', 'officer', 'admin'].includes(role);

  const [docs, setDocs] = useState<Document[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState(appId);
  const [selectedDocType, setSelectedDocType] = useState('Land & Building');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchDocs = async (targetAppId: string) => {
    setLoading(true);
    try {
      const data = await getDocuments(targetAppId);
      setDocs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getApplications().then(all => {
      setApps(all);
      if (all.length > 0 && !all.some(a => String(a.application_id || a.id) === selectedApp)) {
        setSelectedApp(String(all[0].application_id || all[0].id));
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedApp) {
      fetchDocs(selectedApp);
    }
  }, [selectedApp]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      setNotice(null);
      try {
        const uploaded = await uploadDocument(selectedApp, selectedDocType, file);
        setNotice({ text: `✓ Successfully uploaded & computed SHA-256 fingerprint for ${uploaded.filename}` });
        fetchDocs(selectedApp);
      } catch (err: any) {
        setNotice({ text: `Upload failed: ${err?.response?.data?.detail || err?.message || 'Server error'}`, isError: true });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleVerifySingle = async (docId: string | number, newStatus: string) => {
    try {
      await verifyDocumentItem(docId, newStatus, `Inspected by Verification Officer (${user?.full_name || role})`);
      setNotice({ text: `✓ Document #${docId} marked as ${newStatus}` });
      fetchDocs(selectedApp);
    } catch (err: any) {
      setNotice({ text: err?.response?.data?.detail || 'Failed to update document status', isError: true });
    }
  };

  const handleCompleteMilestone = async () => {
    try {
      await completeVerification(selectedApp, 'All certificates verified against OCR standards by Verification Officer.', 'verified');
      setNotice({ text: `✓ Verification Milestone Completed for ${selectedApp}. Advanced to Compliance Review!` });
      fetchDocs(selectedApp);
    } catch (err: any) {
      setNotice({ text: err?.response?.data?.detail || 'Failed to complete milestone', isError: true });
    }
  };

  return (
    <div className="animate-in">
      {/* Title */}
      <div className="page-title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: '#e0f2fe',
              color: '#0369a1'
            }}>
              🔍 Role 2: Document Verification Desk
            </span>
          </div>
          <h2 className="page-title">Document Verification &amp; OCR Forensics</h2>
          <p className="page-subtitle">Real document storage, SHA-256 cryptographic hashing &amp; tamper anomaly audit</p>
        </div>

        {/* Target Application Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Target Application:</span>
          <select
            className="filter-select"
            value={selectedApp}
            onChange={e => setSelectedApp(e.target.value)}
          >
            {apps.map(a => {
              const id = String(a.application_id || a.id);
              return (
                <option key={id} value={id}>
                  {id} - {a.institution_name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {notice && (
        <div style={{
          padding: '12px 18px',
          background: notice.isError ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${notice.isError ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '8px',
          color: notice.isError ? '#b91c1c' : '#15803d',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          {notice.text}
        </div>
      )}

      {/* Upload Dropzone (for Institution & Admin) */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a' }}>
            Upload Real Statutory Document
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Select Document Category:</span>
            <select
              className="filter-select"
              value={selectedDocType}
              onChange={e => setSelectedDocType(e.target.value)}
            >
              <option value="Land & Building">Land &amp; Building Title Deed</option>
              <option value="Fire Safety">Fire Safety NOC / Certificate</option>
              <option value="Faculty">Faculty Registry &amp; Cadre Ratio</option>
              <option value="Building Plan">Approved Building / Structural Plan</option>
              <option value="Financial FDR">Fixed Deposit Receipt (FDR)</option>
              <option value="Other">Statutory Affidavit / Other</option>
            </select>
          </div>
        </div>

        <label className="upload-dropzone" style={{ display: 'block', margin: 0 }}>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileInput}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <div className="upload-icon-circle">
            {uploading ? '⏳' : '☁️'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '4px' }}>
            {uploading ? 'Uploading & Calculating Cryptographic Hash...' : 'Upload Document to Database'}
          </div>
          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
            Drag and drop your file here, or <span style={{ color: '#2563eb', fontWeight: '600' }}>click to browse</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
            Saves to storage and registers SHA-256 fingerprint in database
          </div>
        </label>
      </div>

      {/* Uploaded Documents List */}
      <div className="white-card">
        <div className="white-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="white-card-title">
            Documents for {selectedApp} ({docs.length} files in database)
          </span>
          {isOfficerOrAdmin && (
            <button
              className="btn btn-primary"
              onClick={handleCompleteMilestone}
              disabled={docs.length === 0}
              style={{ background: '#0284c7' }}
            >
              ✓ Complete Verification Milestone
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading documents from database...
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p>No documents uploaded yet for {selectedApp}.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Upload a file above to test forensic verification.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Category</th>
                  <th>SHA-256 Fingerprint</th>
                  <th>Status</th>
                  <th>Verification Notes</th>
                  <th style={{ textAlign: 'center' }}>Officer Action</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => {
                  const hash = doc.sha256_hash ? `${doc.sha256_hash.slice(0, 10)}...${doc.sha256_hash.slice(-6)}` : 'Verified';
                  const isVerified = doc.status === 'verified';
                  const isFlagged = doc.status === 'flagged';

                  return (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>📄</span>
                          {doc.filename}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#475569' }}>
                          {doc.doc_type}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                        {hash}
                      </td>
                      <td>
                        <span className={`status-pill ${isVerified ? 'verified' : isFlagged ? 'deficiencies' : 'pending'}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '11.5px', color: '#64748b', maxWidth: '200px' }}>
                        {doc.verification_result || 'Pending review'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onViewDocument ? onViewDocument(doc.filename) : alert('Viewing ' + doc.filename)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            Canvas
                          </button>
                          {isOfficerOrAdmin && (
                            <>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleVerifySingle(doc.id, 'verified')}
                                style={{ padding: '3px 8px', fontSize: '11px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                                title="Mark Verified"
                              >
                                ✓
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleVerifySingle(doc.id, 'flagged')}
                                style={{ padding: '3px 8px', fontSize: '11px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                                title="Flag Anomaly"
                              >
                                ⚠️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
