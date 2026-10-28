import React, { useState } from 'react';
import { IndianEmblem } from './Emblems';
import { RefreshCw, Play, Shield, Building2, CheckCircle, AlertTriangle, XCircle, FileText, Sparkles } from 'lucide-react';
import { Application } from '../types';
import GeminiConfigModal from './GeminiConfigModal';

interface Props {
  applications: Application[];
  selectedApp: Application | null;
  onSelectApp: (appId: string) => void;
  onRunValidation: () => void;
  isValidating: boolean;
  onRefresh: () => void;
  activeFeature: number;
}

export default function PrototypeHeader({
  applications,
  selectedApp,
  onSelectApp,
  onRunValidation,
  isValidating,
  onRefresh,
  activeFeature
}: Props) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'cleared') {
      return (
        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={12} /> CLEARED / APPROVED
        </span>
      );
    }
    if (s === 'deficiency') {
      return (
        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={12} /> DEFICIENCY NOTICE
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <XCircle size={12} /> REJECTED / ADVERSE ACTION
        </span>
      );
    }
    return (
      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Shield size={12} /> UNDER SCRUTINY
      </span>
    );
  };

  return (
    <header style={{
      background: '#0f172a',
      color: '#ffffff',
      padding: '12px 24px',
      borderBottom: '3px solid #f59e0b',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left: Branding & National Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: '#ffffff',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <IndianEmblem size={28} color="#0f172a" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                color: '#ffffff'
              }}>
                AICTE
              </span>
              <span style={{
                background: '#1e3a8a',
                color: '#93c5fd',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}>
                Scrutiny Engine
              </span>
              <span style={{
                background: '#047857',
                color: '#a7f3d0',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                APH 2026-27
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Statutory Regulatory Compliance &amp; Application Validation Prototype · Government of India
            </div>
          </div>
        </div>

        {/* Center: Quick Sample Application Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.06)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.12)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} color="#f59e0b" />
            <span>Select Sample Dossier:</span>
          </div>
          <select
            value={selectedApp?.application_id || ''}
            onChange={e => onSelectApp(e.target.value)}
            style={{
              background: '#1e293b',
              color: '#ffffff',
              border: '1px solid #475569',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '280px',
              outline: 'none'
            }}
          >
            {applications.map(app => (
              <option key={app.application_id || app.id} value={app.application_id}>
                {app.application_id} - {app.institution_name} ({app.status ? app.status.toUpperCase() : 'REVIEW'})
              </option>
            ))}
          </select>

          {selectedApp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getStatusBadge(selectedApp.status)}
              <div style={{
                background: '#334155',
                color: '#38bdf8',
                fontWeight: '700',
                fontSize: '12px',
                padding: '3px 8px',
                borderRadius: '4px'
              }}>
                Score: {selectedApp.scrutiny_score || selectedApp.score || 0}%
              </div>
            </div>
          )}
        </div>

        {/* Right: Validation & Demo Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onRunValidation}
            disabled={isValidating || !selectedApp}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000000',
              fontWeight: '700',
              fontSize: '12px',
              padding: '8px 14px',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isValidating ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
            }}
            title="Execute End-to-End AICTE 8-Feature Scrutiny Pipeline"
          >
            <Play size={13} fill="#000000" />
            <span>{isValidating ? 'Running Scrutiny...' : '⚡ Run Full 8-Step Scrutiny'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }}
            title="Refresh Dossier Data"
          >
            <RefreshCw size={13} className={isValidating ? 'spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="btn btn-sm"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '8px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Configure Gemini LLM & Multi-Agent Engine"
          >
            <Sparkles size={13} color="#38bdf8" />
            <span>🤖 Gemini AI Agents</span>
          </button>
        </div>
      </div>

      <GeminiConfigModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </header>
  );
}

