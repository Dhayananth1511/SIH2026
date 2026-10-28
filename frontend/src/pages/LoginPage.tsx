import React, { useState } from 'react';
import { IndianEmblem, LoginHeroGraphic } from '../components/Emblems';
import { login as apiLogin } from '../api';
import { useAuth } from '../AuthContext';
import type { User } from '../types';
import { GraduationCap, FileSearch, Scale, Building2, Settings, ShieldCheck } from 'lucide-react';

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
      const networkErr = err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error');
      const msg = detail
        ? detail
        : networkErr
        ? 'Cannot connect to backend server. Please verify backend is running on port 8000.'
        : err?.message || 'Login failed. Please verify credentials.';
      setError(msg);
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
      title: '1. Institution User',
      desc: 'Application submission, doc upload, corrections',
      email: 'institution@example.com',
      pass: 'inst123',
      color: '#059669',
      bg: '#ecfdf5',
      icon: <GraduationCap size={15} strokeWidth={2.2} />
    },
    {
      title: '2. Verification Officer',
      desc: 'OCR review, doc integrity, anomaly resolution',
      email: 'verification@aicte.gov.in',
      pass: 'officer123',
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: <FileSearch size={15} strokeWidth={2.2} />
    },
    {
      title: '3. Compliance Reviewer',
      desc: 'APH checklist scrutiny, infrastructure audit',
      email: 'compliance@aicte.gov.in',
      pass: 'reviewer123',
      color: '#7c3aed',
      bg: '#f5f3ff',
      icon: <Scale size={15} strokeWidth={2.2} />
    },
    {
      title: '4. AICTE Decision-Maker',
      desc: 'Official decree, order signing, approval/deficiency',
      email: 'decision@aicte.gov.in',
      pass: 'decision123',
      color: '#d97706',
      bg: '#fffbeb',
      icon: <Building2 size={15} strokeWidth={2.2} />
    },
    {
      title: '5. System Administrator',
      desc: 'User accounts, role assignment, rule engine',
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

            <div style={{ marginTop: '20px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
              <strong style={{ color: '#1e3a8a' }}>Statutory Notice:</strong> All review operations, OCR audits, and regulatory decrees are immutably logged with actor credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
