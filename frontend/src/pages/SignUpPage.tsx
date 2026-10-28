import React, { useState } from 'react';
import { IndianEmblem, IsometricCampusGraphic } from '../components/Emblems';
import { register as apiRegister } from '../api';
import type { UserRole } from '../types';
import { GraduationCap, FileSearch, Scale, Building2, Settings } from 'lucide-react';

interface Props {
  onNavigateToLogin: () => void;
}

export default function SignUpPage({ onNavigateToLogin }: Props) {
  const [role, setRole] = useState<UserRole>('institution');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const roleOptions: { key: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'institution', label: 'Institution User', icon: <GraduationCap size={14} />, desc: 'College application & doc upload' },
    { key: 'verification_officer', label: 'Verification Officer', icon: <FileSearch size={14} />, desc: 'OCR & document verification' },
    { key: 'compliance_reviewer', label: 'Compliance Reviewer', icon: <Scale size={14} />, desc: 'Statutory norms scrutiny' },
    { key: 'decision_maker', label: 'AICTE Decision-Maker', icon: <Building2 size={14} />, desc: 'Final approval/deficiency decree' },
    { key: 'admin', label: 'System Administrator', icon: <Settings size={14} />, desc: 'Users & rule configuration' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRegister({
        email,
        full_name: fullName,
        password,
        role: role
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
        padding: '28px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1020px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          overflow: 'hidden'
        }}>
          {/* Left Panel: Graphic */}
          <div style={{
            padding: '32px 24px',
            background: 'linear-gradient(145deg, #f0f7ff 0%, #e0f2fe 100%)',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <IsometricCampusGraphic />
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a' }}>
                Role-Enforced Governance
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', maxWidth: '280px' }}>
                Each user role adheres strictly to assigned statutory powers with an immutable cryptographic audit ledger.
              </div>
            </div>
          </div>

          {/* Right Panel: Sign Up Form */}
          <div style={{ padding: '36px 36px', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '4px' }}>
                Register Account
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                Join the AICTE Statutory Compliance Platform
              </p>
            </div>

            {/* Role Picker */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Select Role Designation
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {roleOptions.map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    style={{
                      padding: '8px 10px',
                      background: role === r.key ? '#ffffff' : '#f8fafc',
                      border: role === r.key ? '1.5px solid #09090b' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      boxShadow: role === r.key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="black-logo-badge-sm">
                        {r.icon}
                      </span>
                      <div style={{ fontSize: '11.5px', fontWeight: '700', color: role === r.key ? '#000000' : '#1e293b' }}>
                        {r.label}
                      </div>
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                      {r.desc}
                    </div>
                  </button>
                ))}
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
                ✓ Account created successfully! Redirecting to login...
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
                  Full Name / Institution Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma or ABC Institute of Technology"
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
                  placeholder="e.g. officer@aicte.gov.in or registrar@college.edu"
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
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                  transition: 'background 0.15s'
                }}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12.5px', color: '#64748b' }}>
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
