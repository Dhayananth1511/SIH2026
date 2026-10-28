import React, { useState, useEffect } from 'react';
import { Sparkles, Key, CheckCircle, AlertCircle, Cpu, Shield, Bot, X } from 'lucide-react';
import { getAiStatus, configureGeminiKey } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GeminiConfigModal({ isOpen, onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const data = await getAiStatus();
      setAiStatus(data);
    } catch (err) {
      console.error('Failed to load AI status', err);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSaveSuccess(null);

    try {
      const res = await configureGeminiKey(apiKey.trim());
      setSaveSuccess(res.message || 'Gemini API Key activated successfully!');
      setApiKey('');
      await loadStatus();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to configure Gemini Key. Please verify key validity.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0b2545 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #f59e0b',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Sparkles size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Gemini Multi-Agent AI Configuration</h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>AICTE Central Multi-Agent Regulatory Compliance Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Current Status Badge */}
          <div style={{
            background: aiStatus?.gemini_configured ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${aiStatus?.gemini_configured ? '#86efac' : '#fde68a'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {aiStatus?.gemini_configured ? (
                <CheckCircle size={18} color="#15803d" />
              ) : (
                <AlertCircle size={18} color="#b45309" />
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: aiStatus?.gemini_configured ? '#15803d' : '#92400e' }}>
                  {aiStatus?.gemini_configured ? 'Gemini 2.5 Flash Engine: ONLINE & ACTIVE' : 'Gemini Engine: Key Pending (Using Heuristic Fallback)'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Architecture: {aiStatus?.architecture || '5-Agent Orchestration'}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '4px',
              background: aiStatus?.gemini_configured ? '#15803d' : '#d97706',
              color: '#ffffff'
            }}>
              {aiStatus?.gemini_configured ? 'LIVE AI' : 'STANDBY'}
            </span>
          </div>

          {/* Key Input Form */}
          <form onSubmit={handleSaveKey}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              Enter Google Gemini API Key
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Key size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key (AIzaSy...)"
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                style={{
                  background: '#0b2545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: loading || !apiKey.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !apiKey.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Cpu size={14} />
                <span>{loading ? 'Activating...' : 'Activate'}</span>
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
              Your key powers multimodal PDF OCR, forensic seal inspection, and APH 2026-27 legal reasoning across all 5 agents.
            </p>
          </form>

          {saveSuccess && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#ecfdf5', color: '#065f46', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} /> {saveSuccess}
            </div>
          )}

          {errorMsg && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          {/* Active 5 Agents List */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot size={14} color="#0284c7" />
              <span>5 Autonomous Verification Agents in Orchestration:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              {(aiStatus?.active_agents || [
                { id: 'AGENT-01-DOC-INTEL', name: 'Document Intelligence Agent', type: 'Multimodal Extraction' },
                { id: 'AGENT-02-FORENSIC', name: 'Forensic Anomaly Detection Agent', type: 'Tamper & Hash Forensics' },
                { id: 'AGENT-03-ISSUER-VERIFY', name: 'Issuer Verification Agent', type: 'Master Record Reconciler' },
                { id: 'AGENT-04-REGULATORY-COMPLIANCE', name: 'Regulatory Compliance Agent', type: 'APH 2026-27 Rule Evaluator' },
                { id: 'AGENT-05-SYNTHESIS', name: 'Dossier Synthesis & Recommendation Agent', type: 'Consensus & Action Planner' }
              ]).map((agent: any, idx: number) => (
                <div key={idx} style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px'
                }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {idx + 1}. {agent.name}
                  </span>
                  <span style={{ color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    {agent.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
