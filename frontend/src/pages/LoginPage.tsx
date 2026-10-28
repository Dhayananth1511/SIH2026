import React, { useState, useEffect } from 'react';
import { IndianEmblem, LoginHeroGraphic } from '../components/Emblems';
import { login as apiLogin, getActiveApiUrl, setCustomApiUrl, resetApiUrl, checkBackendHealth } from '../api';
import { useAuth } from '../AuthContext';
import type { User } from '../types';
import { GraduationCap, FileSearch, Scale, Building2, Settings, ShieldCheck, Server, RefreshCw, CheckCircle2, AlertTriangle, Sliders, ExternalLink } from 'lucide-react';

interface Props {
  onNavigateToSignUp?: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onNavigateToSignUp, onLoginSuccess }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Backend connection & health states
  const [activeUrl, setActiveUrl] = useState<string>(getActiveApiUrl());
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'waking' | 'offline'>('checking');
  const [serverLatency, setServerLatency] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customInput, setCustomInput] = useState(getActiveApiUrl());
  const [testingHealth, setTestingHealth] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const runHealthCheck = async (target?: string) => {
    setTestingHealth(true);
    setServerStatus('checking');
    try {
      const res = await checkBackendHealth(target);
      if (res.ok) {
        setServerStatus('online');
        setServerLatency(res.latencyMs || null);
      } else if (res.status === 'waking') {
        setServerStatus('waking');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    } finally {
      setTestingHealth(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleSaveCustomUrl = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault();
    const target = overrideUrl || customInput;
    if (!target || target.trim() === '') return;
    setTestingHealth(true);
    setConfigMsg(null);
    try {
      const cleaned = setCustomApiUrl(target);
      setCustomInput(cleaned);
      setActiveUrl(cleaned);
      const res = await checkBackendHealth(cleaned);
      if (res.ok) {
        setServerStatus('online');
        setServerLatency(res.latencyMs || null);
        setConfigMsg({ text: `✓ Connected successfully to ${cleaned} (${res.latencyMs}ms)`, ok: true });
        setError('');
      } else if (res.status === 'waking') {
        setServerStatus('waking');
        setConfigMsg({ text: '⏳ Server is waking up (Render cold-start takes ~30s). URL saved!', ok: true });
      } else {
        setServerStatus('offline');
        setConfigMsg({ text: `⚠️ Server saved, but /health check failed: ${res.message}. Please verify the URL.`, ok: false });
      }
    } catch (err: any) {
      setConfigMsg({ text: `Failed to test URL: ${err?.message || 'Network error'}`, ok: false });
    } finally {
      setTestingHealth(false);
    }
  };

  const handleResetUrl = () => {
    const def = resetApiUrl();
    setCustomInput(def);
    setActiveUrl(def);
    setConfigMsg({ text: 'Reset to auto-detected default URL.', ok: true });
    runHealthCheck(def);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiLogin(email, password);
      const user: User = {
        id: res.user_id,
        email,
        full_name: res.full_name || email.split('@')[0],
        role: res.role || 'institution',
        is_active: true,
        created_at: new Date().toISOString()
      };
      login(res.access_token, user);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const networkErr = err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error') || err?.code === 'ECONNABORTED';
      const currentEndpoint = getActiveApiUrl();
      const msg = detail
        ? detail
        : networkErr
        ? `Cannot connect to backend server at ${currentEndpoint}. If the Render backend was sleeping, please wait ~30s for it to wake up, or update the backend URL below.`
        : err?.message || 'Login failed. Please verify credentials.';
      setError(msg);
      if (networkErr) {
        setServerStatus('offline');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  const demoRoles = [
    {
      title: '1. Institution Portal',
      desc: 'Submit application, view AI validation status & suggestions, download approved certificate',
      email: 'institution@example.com',
      pass: 'inst123',
      color: '#059669',
      bg: '#ecfdf5',
      icon: <GraduationCap size={15} strokeWidth={2.2} />
    },
    {
      title: '2. AICTE Approval Officer',
      desc: 'Single officer: AI validation scrutiny, send suggestions if fault found, grant official approval & issue certificate',
      email: 'officer@aicte.gov.in',
      pass: 'officer123',
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: <FileSearch size={15} strokeWidth={2.2} />
    },
    {
      title: '3. System Administrator',
      desc: 'Platform governance, AICTE regulatory rule parameters, audit trail oversight',
      email: 'admin@aicte.gov.in',
      pass: 'admin123',
      color: '#475569',
      bg: '#f8fafc',
      icon: <Settings size={15} strokeWidth={2.2} />
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Government Header */}
      <header style={{
        height: '64px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IndianEmblem size={34} color="#1e3a8a" />
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e3a8a', lineHeight: '1.2' }}>
              AICTE
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              Regulatory Compliance &amp; Application Validation Platform
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#1e3a8a' }}>
            Government of India
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Ministry of Education
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1060px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          overflow: 'hidden'
        }}>
          {/* Left Panel: Hero Graphic & 1-Click Role Switcher */}
          <div style={{ padding: '28px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px' }}>
              <LoginHeroGraphic />
            </div>

            {/* 1-Click Demo Accounts for the 5 Roles */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} />
                <span>Select User Role for SIH Evaluation (1-Click Fill)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {demoRoles.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDemoRole(r.email, r.pass)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: email === r.email ? r.bg : '#ffffff',
                      border: email === r.email ? `1.5px solid ${r.color}` : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="black-logo-badge">
                        {r.icon}
                      </span>
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: email === r.email ? r.color : '#1e293b' }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          {r.desc}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10.5px', color: email === r.email ? r.color : '#94a3b8', fontWeight: '600' }}>
                      {email === r.email ? '✓ Selected' : 'Use'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Form */}
          <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '4px' }}>
                Portal Sign In
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                AICTE Regulatory Compliance &amp; Application Validation Platform
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Official Email ID / Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. verification@aicte.gov.in"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#ffffff'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#ffffff'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#2563eb' }}
                  />
                  Remember active session
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to registered email.'); }} style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: '#09090b',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  transition: 'background 0.15s, transform 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#000000'}
                onMouseOut={e => e.currentTarget.style.background = '#09090b'}
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12.5px', color: '#64748b' }}>
              Need a new account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                Register Here
              </button>
            </div>

            {/* Backend Connection Status & Quick Config */}
            <div style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: serverStatus === 'offline' ? '#fef2f2' : '#f8fafc',
              border: serverStatus === 'offline' ? '1px solid #fecaca' : '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Server size={13} color="#64748b" />
                  <span style={{ fontWeight: '600', color: '#334155' }}>Backend:</span>
                  {serverStatus === 'online' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '700',
                      fontSize: '10.5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                      Online {serverLatency ? `(${serverLatency}ms)` : ''}
                    </span>
                  )}
                  {serverStatus === 'waking' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef3c7',
                      color: '#b45309',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '700',
                      fontSize: '10.5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                      Waking Up (~30s)
                    </span>
                  )}
                  {serverStatus === 'checking' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#f1f5f9',
                      color: '#64748b',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '600',
                      fontSize: '10.5px'
                    }}>
                      Connecting...
                    </span>
                  )}
                  {serverStatus === 'offline' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '700',
                      fontSize: '10.5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                      Offline / Sleep
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => runHealthCheck()}
                    disabled={testingHealth}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10.5px',
                      padding: '2px 4px'
                    }}
                    title="Ping backend health check"
                  >
                    <RefreshCw size={11} className={testingHealth ? 'spin' : ''} />
                    {testingHealth ? 'Pinging...' : 'Ping'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      color: '#475569',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      fontSize: '10.5px',
                      fontWeight: '600'
                    }}
                  >
                    {showConfig ? 'Hide' : 'Configure URL'}
                  </button>
                </div>
              </div>

              <div style={{
                marginTop: '4px',
                fontSize: '10px',
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Target: <code>{activeUrl}</code>
              </div>

              {serverStatus === 'waking' && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 8px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  color: '#92400e',
                  fontSize: '10.5px',
                  lineHeight: '1.4'
                }}>
                  ⏳ <strong>Render Free-Tier Notice:</strong> The server is warming up after inactivity. This cold-start usually finishes in ~30 seconds.
                </div>
              )}

              {showConfig && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '6px', fontSize: '11px' }}>
                    Set Custom Backend API URL:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      placeholder="e.g. https://your-backend.onrender.com"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '11px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCustomUrl()}
                      disabled={testingHealth}
                      style={{
                        padding: '6px 10px',
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '10.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {testingHealth ? 'Testing...' : 'Save & Test'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const url = 'https://aicte-compliance-backend-rglx.onrender.com';
                        handleSaveCustomUrl(undefined, url);
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        color: '#334155'
                      }}
                    >
                      Preset: Render Backend (rglx)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = 'http://localhost:8000';
                        handleSaveCustomUrl(undefined, url);
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        color: '#334155'
                      }}
                    >
                      Preset: Localhost:8000
                    </button>
                    <button
                      type="button"
                      onClick={handleResetUrl}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      Reset to Auto
                    </button>
                  </div>

                  {configMsg && (
                    <div style={{
                      marginTop: '6px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      background: configMsg.ok ? '#ecfdf5' : '#fef2f2',
                      color: configMsg.ok ? '#065f46' : '#991b1b',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {configMsg.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
              <strong style={{ color: '#1e3a8a' }}>Statutory Notice:</strong> All review operations, OCR audits, and regulatory decrees are immutably logged with actor credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
