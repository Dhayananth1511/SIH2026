import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Flame,
  Landmark,
  MapPin,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Server,
  Code
} from 'lucide-react';
import { Application, Document } from '../types';

interface Props {
  application: Application | null;
  documents: Document[];
  onNext: () => void;
}

interface SourceVerificationResult {
  sourceName: string;
  sourceType: string;
  queryParam: string;
  status: 'VERIFIED_OFFICIAL' | 'RECORD_NOT_FOUND_OR_EXPIRED' | 'LIEN_CONFLICT';
  statusCode: number;
  apiEndpoint: string;
  responsePayload: Record<string, any>;
  verifiedAt: string;
  notes: string;
}

export default function Feature5AuthorizedSources({
  application,
  documents,
  onNext
}: Props) {
  const [queryingSource, setQueryingSource] = useState<string | null>(null);
  const [activeJsonModal, setActiveJsonModal] = useState<SourceVerificationResult | null>(null);

  // Build the 4 authorized external source verification cards based on current application
  const isApex = (application?.application_id || '').includes('2001');
  const isModern = (application?.application_id || '').includes('2003');
  const isGreenfield = (application?.application_id || '').includes('2002');

  const sources: SourceVerificationResult[] = [
    {
      sourceName: 'State Revenue Department / Bhulekh Land Records Registry',
      sourceType: 'Land Title & Ownership Registry',
      queryParam: isGreenfield ? 'Khasra/Survey Sy No. 88/2, Devanahalli' : isModern ? 'Khasra 94/11, Najafgarh' : 'Plot 402/1A, Haveli, Pune',
      status: 'VERIFIED_OFFICIAL',
      statusCode: 200,
      apiEndpoint: 'https://landrecords.gov.in/api/v2/title-verification',
      responsePayload: {
        registry_status: 'AUTHENTIC_REGISTERED',
        survey_number: isGreenfield ? '88/2' : isModern ? '94/11' : '402/1A',
        title_holder: application?.institution_name,
        contiguous_acreage_verified: isGreenfield ? 4.10 : isModern ? 5.05 : 5.20,
        encumbrance_status: 'NON_ENCUMBERED_CLEAN_TITLE',
        registration_sub_office: isGreenfield ? 'Devanahalli' : isModern ? 'South West Delhi' : 'Haveli, Pune',
        query_timestamp: new Date().toISOString()
      },
      verifiedAt: '2026-03-01T10:15:00Z',
      notes: isGreenfield
        ? 'Verified in State Bhoomi portal: Confirms deed is authentic, but land area is only 4.10 Acres (below 5.0 Acres norm).'
        : 'Official government title verified with zero encumbrance and contiguous parcel status.'
    },
    {
      sourceName: 'State Directorate of Fire & Emergency Services Portal',
      sourceType: 'Life Safety Clearance Registry',
      queryParam: isModern ? 'Dispatch # DFS/HQ/2020/5512-MOD' : isGreenfield ? 'Dispatch Query (Missing Document)' : 'Dispatch # PFS/NOC/2024/8891',
      status: isModern ? 'RECORD_NOT_FOUND_OR_EXPIRED' : isGreenfield ? 'RECORD_NOT_FOUND_OR_EXPIRED' : 'VERIFIED_OFFICIAL',
      statusCode: isModern ? 404 : isGreenfield ? 404 : 200,
      apiEndpoint: 'https://fireservices.gov.in/api/v1/noc/validate',
      responsePayload: isModern ? {
        status: 'FAILED',
        error: 'DISPATCH_RECORD_NOT_FOUND',
        message: 'No active or archived Fire Safety NOC found matching certificate number DFS/HQ/2020/5512-MOD in Delhi Fire Service Headquarters database.',
        query_timestamp: new Date().toISOString()
      } : isGreenfield ? {
        status: 'FAILED',
        error: 'NO_NOC_SUBMITTED',
        message: 'Institution has not provided a Fire Services dispatch number in application submission.',
        query_timestamp: new Date().toISOString()
      } : {
        status: 'ACTIVE_VALID',
        noc_dispatch_number: 'PFS/NOC/2024/8891',
        issuing_division: 'Maharashtra Fire Services, Pune Division',
        issue_date: '2024-02-12',
        valid_until: '2027-02-11',
        inspection_status: 'COMPREHENSIVE_CLEARANCE_PASSED',
        query_timestamp: new Date().toISOString()
      },
      verifiedAt: '2026-03-01T10:20:00Z',
      notes: isModern
        ? 'ALERT: State Fire Services API reports NO MATCH for the claimed certificate number. Document is forged or unrecorded.'
        : isGreenfield
        ? 'CRITICAL DEFICIENCY: Fire NOC is unuploaded in application package.'
        : 'Verified authentic against State Fire Directorate portal. Valid through 11-Feb-2027.'
    },
    {
      sourceName: 'Municipal Town Planning & Building Sanction Registry',
      sourceType: 'Structural Building Permission System',
      queryParam: isGreenfield ? 'Sanction BBMP/ADDL/2022/904' : isModern ? 'Sanction MCD/B-SZ/2021/782' : 'Sanction PMC/BP/2023/1102',
      status: 'VERIFIED_OFFICIAL',
      statusCode: 200,
      apiEndpoint: 'https://townplanning.gov.in/api/v3/sanctions/query',
      responsePayload: {
        sanction_number: isGreenfield ? 'BBMP/ADDL/2022/904' : isModern ? 'MCD/B-SZ/2021/782' : 'PMC/BP/2023/1102',
        competent_authority: isGreenfield ? 'BBMP Town Planning' : isModern ? 'MCD Online Sanction' : 'PMC Town Planning Department',
        approved_built_up_area: isGreenfield ? '8,900 sq.m' : isModern ? '10,200 sq.m' : '12,450 sq.m',
        occupancy_certificate_issued: true,
        structural_stability_certificate: 'FILED_AND_APPROVED',
        query_timestamp: new Date().toISOString()
      },
      verifiedAt: '2026-03-01T10:25:00Z',
      notes: 'Approved blueprint registered with Municipal Town Planning department. Structural safety certified.'
    },
    {
      sourceName: 'Core Banking Gateway / AICTE Financial FDR Gateway',
      sourceType: 'Banking Financial Guarantee Verification',
      queryParam: isModern ? 'FDR # PNB/FDR/2021/1109' : isGreenfield ? 'FDR Missing' : 'FDR # SBI/FDR/2023/90182',
      status: isModern ? 'LIEN_CONFLICT' : isGreenfield ? 'RECORD_NOT_FOUND_OR_EXPIRED' : 'VERIFIED_OFFICIAL',
      statusCode: isModern ? 409 : isGreenfield ? 404 : 200,
      apiEndpoint: 'https://banking.aicte-india.org/api/fdr/verify-lien',
      responsePayload: isModern ? {
        status: 'LIEN_CONFLICT_ERROR',
        error: 'DUPLICATE_FDR_USAGE',
        fdr_number: 'PNB/FDR/2021/1109',
        bank_name: 'Punjab National Bank',
        registered_lien_holder: 'Pratap College of Polytechnic, Rohtak',
        conflict_detected: 'Identical FDR has already been pledged for another institution in Haryana.',
        query_timestamp: new Date().toISOString()
      } : isGreenfield ? {
        status: 'MISSING',
        error: 'NO_FDR_SUBMITTED'
      } : {
        status: 'LIEN_CONFIRMED',
        fdr_number: 'SBI/FDR/2023/90182',
        bank_name: 'State Bank of India',
        deposit_amount: 'INR 50,00,000',
        joint_holder: 'Apex Education Trust & AICTE Western Region',
        auto_renewal_clause: true,
        query_timestamp: new Date().toISOString()
      },
      verifiedAt: '2026-03-01T10:30:00Z',
      notes: isModern
        ? 'CONFLICT: Core banking check proves this FDR was pledged by a completely different institution in Rohtak!'
        : isGreenfield
        ? 'Deficiency: Joint FDR certificate pending upload.'
        : 'Joint FDR of ₹50 Lakhs confirmed under active lien to AICTE Western Region.'
    }
  ];

  const handleSimulateQuery = (sourceName: string) => {
    setQueryingSource(sourceName);
    setTimeout(() => {
      setQueryingSource(null);
    }, 800);
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
              FEATURE 5 OF 8
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Authorized Source Verification Gateway
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Cross-verifies supporting documents against authoritative state registries and banking gateways (Revenue/Bhulekh, Fire Directorate, Town Planning, Core Banking).
          </p>
        </div>
        <button
          onClick={onNext}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Feature 6: Configurable Rules</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Grid of Authorized Source Verifiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {sources.map((src, idx) => {
          const isVerified = src.status === 'VERIFIED_OFFICIAL';
          const isQuerying = queryingSource === src.sourceName;

          return (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: isVerified ? '1px solid #cbd5e1' : '2px solid #ef4444',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Card Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                background: isVerified ? '#f8fafc' : '#fff5f5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    {src.sourceType}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isVerified ? '#dcfce7' : '#fee2e2',
                    color: isVerified ? '#166534' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isVerified ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {src.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {src.sourceName}
                </h3>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px 20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Search / Registry Query Parameter:</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '12.5px' }}>
                    {src.queryParam}
                  </strong>
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  color: isVerified ? '#334155' : '#991b1b'
                }}>
                  {src.notes}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
                  <span>Gateway Endpoint:</span>
                  <code style={{ color: '#1e3a8a', fontSize: '11px' }}>{src.apiEndpoint}</code>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f1f5f9',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={() => handleSimulateQuery(src.sourceName)}
                  disabled={isQuerying}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RefreshCw size={12} className={isQuerying ? 'spin' : ''} />
                  <span>{isQuerying ? 'Querying API...' : 'Re-Query Registry'}</span>
                </button>

                <button
                  onClick={() => setActiveJsonModal(src)}
                  className="btn btn-sm"
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px'
                  }}
                >
                  <Code size={12} />
                  <span>View JSON Payload</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* JSON Payload Viewer Modal */}
      {activeJsonModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            maxWidth: '640px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={16} color="#38bdf8" />
                <strong style={{ fontSize: '14px' }}>Authorized Registry Response Payload</strong>
              </div>
              <button
                onClick={() => setActiveJsonModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                Endpoint: <code>{activeJsonModal.apiEndpoint}</code> · Status: <strong>{activeJsonModal.statusCode} OK</strong>
              </div>
              <pre style={{
                background: '#0f172a',
                color: '#38bdf8',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '12px',
                maxHeight: '320px',
                overflowY: 'auto',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(activeJsonModal.responsePayload, null, 2)}
              </pre>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button onClick={() => setActiveJsonModal(null)} className="btn btn-secondary btn-sm">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
