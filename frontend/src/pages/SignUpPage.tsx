import React, { useState } from 'react';
import { IndianEmblem, IsometricCampusGraphic } from '../components/Emblems';
import { register as apiRegister } from '../api';
import type { UserRole } from '../types';
import { GraduationCap } from 'lucide-react';

interface Props {
  onNavigateToLogin: () => void;
}

export default function SignUpPage({ onNavigateToLogin }: Props) {
  const [role] = useState<UserRole>('institution');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRegister({
        email,
        full_name: fullName,
        password,
        role: 'institution'
      });
      setSuccess(true);
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : err?.message || 'Registration failed.');
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
              Government of India | Ministry of Education
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

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '980px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          overflow: 'hidden'
        }}>
          {/* Left Panel: Graphic */}
          <div style={{
            padding: '36px 28px',
            background: 'linear-gradient(145deg, #f0f7ff 0%, #e0f2fe 100%)',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <IsometricCampusGraphic />
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>
                Institutional Portal Onboarding
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', maxWidth: '280px', lineHeight: '1.5' }}>
                Register your technical institute or university to submit AICTE approval applications, upload compliance documents, and receive real-time AI validation reports.
              </div>
            </div>
          </div>

          {/* Right Panel: Sign Up Form */}
          <div style={{ padding: '36px 36px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '4px' }}>
                Register Institution
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                Create your official AICTE applicant account
              </p>
            </div>

            {/* Role Designation: Fixed to Institution */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Role Designation
              </label>
              <div style={{
                padding: '10px 14px',
                background: '#f0fdf4',
                border: '1.5px solid #22c55e',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: '#15803d',
                  color: '#ffffff'
                }}>
                  <GraduationCap size={18} />
                </span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d' }}>
                    Institution User
                  </div>
                  <div style={{ fontSize: '11px', color: '#4b5563' }}>
                    Authorized for college &amp; university approval submissions.
                  </div>
                </div>
              </div>
            </div>

            {success && (
              <div style={{
                padding: '10px 14px',
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#15803d',
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                ✓ Institution account created successfully! Redirecting to login...
              </div>
            )}

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
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Institution Name / Authorized Signatory
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. ABC Institute of Technology"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. registrar@college.edu.in"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Mobile / Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
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
                  transition: 'background 0.15s'
                }}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12.5px', color: '#64748b' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
