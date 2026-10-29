import React, { useState } from 'react';
import { IndianEmblem, LoginHeroGraphic } from '../components/Emblems';
import { login as apiLogin, getActiveApiUrl } from '../api';
import { useAuth } from '../AuthContext';
import type { User } from '../types';

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
      const networkErr = err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error') || err?.code === 'ECONNABORTED';
      const currentEndpoint = getActiveApiUrl();
      const msg = detail
        ? detail
        : networkErr
        ? `Cannot connect to backend server at ${currentEndpoint}. Please check your connection.`
        : err?.message || 'Login failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
        padding: '36px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          overflow: 'hidden'
        }}>
          {/* Left Panel: Hero Graphic & Portal Summary */}
          <div style={{
            padding: '40px 32px',
            background: 'linear-gradient(145deg, #f0f7ff 0%, #e0f2fe 100%)',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <LoginHeroGraphic />
            <div style={{ marginTop: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px' }}>
                Statutory Regulatory Compliance
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '320px', lineHeight: '1.6', margin: '0 auto' }}>
                Centralized platform for Institutional Approvals, AI Document Audits, and Regulatory Decision Oversight under the Ministry of Education.
              </p>
            </div>
          </div>

          {/* Right Panel: Form */}
          <div style={{ padding: '44px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
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
                marginBottom: '18px'
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
                  placeholder="name@domain.gov.in or institute@domain.edu.in"
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#2563eb' }}
                  />
                  Remember active session
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert('Please contact administrator at admin@gov.in for password assistance.'); }}
                  style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}
                >
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

            <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '12.5px', color: '#64748b' }}>
              Institution / College applying for approval?{' '}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                Register Here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
