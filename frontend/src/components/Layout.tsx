import React, { useState, useEffect } from 'react';
import { IndianEmblem } from './Emblems';
import { LogOut, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';

import InstitutionViews from '../views/InstitutionViews';
import VerificationOfficerViews from '../views/VerificationOfficerViews';
import ComplianceReviewerViews from '../views/ComplianceReviewerViews';
import DecisionMakerViews from '../views/DecisionMakerViews';
import AdminViews from '../views/AdminViews';

import { useAuth } from '../AuthContext';
import { getNotifications } from '../api';
import type { Notification } from '../types';

export default function Layout() {
  const { user, logout, switchRole } = useAuth();
  const rawRole = (user?.role || 'institution').toLowerCase();

  const getRoleKey = (r: string) => {
    const roleLower = (r || '').toLowerCase();
    if (
      roleLower.includes('officer') ||
      roleLower.includes('scrutiny') ||
      roleLower.includes('verification') ||
      roleLower.includes('compliance') ||
      roleLower.includes('reviewer') ||
      roleLower.includes('chairman') ||
      roleLower.includes('decision')
    ) {
      return 'officer';
    } else if (roleLower.includes('admin')) {
      return 'admin';
    }
    return 'institution';
  };

  const currentRoleKey = getRoleKey(rawRole);
  const isScrutiny = rawRole.includes('scrutiny') || rawRole.includes('verification') || rawRole === 'officer';
  const isCompliance = rawRole.includes('compliance') || rawRole.includes('reviewer');
  const isDecisionMaker = rawRole.includes('chairman') || rawRole.includes('decision');

  const getDefaultRolePage = (roleKey: string) => {
    if (roleKey === 'officer') return 'vo-dashboard';
    if (roleKey === 'admin') return 'admin-dashboard';
    return 'inst-dashboard';
  };

  const getRoleDisplayName = (roleKey: string) => {
    if (roleKey === 'officer') return 'AICTE Approval Officer';
    if (roleKey === 'admin') return 'System Administrator';
    return 'Institution Applicant';
  };

  const [currentPage, setCurrentPage] = useState<string>(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/officer')) {
        return 'vo-dashboard';
      }
      return 'login';
    }
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return getDefaultRolePage(getRoleKey(u.role));
      } catch {
        return 'inst-dashboard';
      }
    }
    return 'inst-dashboard';
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  useEffect(() => {
    if (user?.role && (currentPage === 'login' || currentPage === 'dashboard')) {
      setCurrentPage(getDefaultRolePage(currentRoleKey));
    }
    // Fetch notifications if logged in
    if (user?.role) {
      getNotifications().then(data => setNotifications(data)).catch(() => {});
    }
  }, [user?.role]);

  // Auth pages
  if (currentPage === 'login') {
    return (
      <LoginPage
        onNavigateToSignUp={() => setCurrentPage('signup')}
        onLoginSuccess={() => {
          const uStr = localStorage.getItem('user');
          const roleFromStorage = uStr ? JSON.parse(uStr)?.role : 'institution';
          setCurrentPage(getDefaultRolePage(getRoleKey(roleFromStorage)));
        }}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignUpPage
        onNavigateToLogin={() => setCurrentPage('login')}
      />
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="app-container">
      {/* Sidebar with exact role menus */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={page => setCurrentPage(page)}
        notificationCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Top Official Header (Section 12 - Government Design) */}
        <header className="official-header">
          {/* Header Left */}
          <div className="header-left">
            <IndianEmblem size={30} color="#1e3a8a" />
            <div className="header-title-group">
              <h1>AICTE</h1>
              <span>Regulatory Compliance &amp; Application Validation Platform</span>
            </div>
          </div>

          {/* Header Right */}
          <div className="header-right">
            <div className="gov-indicator">
              <div className="gov-title">Government of India</div>
              <div className="gov-sub">Ministry of Education</div>
            </div>

            {/* Directorate Workspace Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: '#f1f5f9',
              padding: '3px 4px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1'
            }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', padding: '0 5px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Directorate:
              </span>
              <button
                id="role-switch-officer-btn"
                onClick={() => {
                  switchRole('officer');
                  setCurrentPage('vo-dashboard');
                }}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: currentRoleKey === 'officer' ? '800' : '600',
                  background: currentRoleKey === 'officer' ? '#0f172a' : 'transparent',
                  color: currentRoleKey === 'officer' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="AICTE Scrutiny & Approval Directorate"
              >
                Scrutiny Bureau
              </button>
              <button
                id="role-switch-inst-btn"
                onClick={() => {
                  switchRole('institution');
                  setCurrentPage('inst-dashboard');
                }}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: currentRoleKey === 'institution' ? '800' : '600',
                  background: currentRoleKey === 'institution' ? '#0f172a' : 'transparent',
                  color: currentRoleKey === 'institution' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Technical Institution Applicant Desk"
              >
                Institution Desk
              </button>
              <button
                id="role-switch-admin-btn"
                onClick={() => {
                  switchRole('admin');
                  setCurrentPage('admin-dashboard');
                }}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: currentRoleKey === 'admin' ? '800' : '600',
                  background: currentRoleKey === 'admin' ? '#0f172a' : 'transparent',
                  color: currentRoleKey === 'admin' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Central System Administration"
              >
                Administration
              </button>
            </div>

            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                style={{ padding: '6px 10px', position: 'relative' }}
                title="Notifications & Alerts"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: '800',
                    borderRadius: '10px',
                    padding: '1px 5px'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationPopup && (
                <div style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  width: '320px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  padding: '12px',
                  zIndex: 100
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                    Notifications &amp; Statutory Notices
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#64748b', padding: '10px', textAlign: 'center' }}>
                      No notifications at this time.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {notifications.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '8px',
                            background: n.type === 'DEFICIENCY_ALERT' ? '#fffbeb' : '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ color: '#475569', lineHeight: '1.4' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div
              className="user-profile-badge"
              onClick={() => setCurrentPage(getDefaultRolePage(currentRoleKey))}
              style={{ cursor: 'pointer' }}
            >
              <div className="user-avatar-circle">
                {user?.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'US'}
              </div>
              <div className="user-info-text">
                <div className="user-info-name">{user?.full_name || 'Active User'}</div>
                <div className="user-info-role">
                  {getRoleDisplayName(currentRoleKey)}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              id="top-signout-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                logout();
                setCurrentPage('login');
              }}
              style={{ padding: '6px 10px', fontSize: '11.5px', color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content Router based on Role */}
        <main className="page-container" style={{ paddingBottom: '60px' }}>
          {/* ROLE 1: INSTITUTION */}
          {currentRoleKey === 'institution' && (
            <InstitutionViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={appId => {}}
              onViewDoc={() => {}}
            />
          )}

          {/* ROLE 2: SCRUTINY OFFICER */}
          {currentRoleKey === 'officer' && isScrutiny && (
            <VerificationOfficerViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={appId => {}}
              onViewDoc={() => {}}
            />
          )}

          {/* ROLE 3: COMPLIANCE OFFICER */}
          {currentRoleKey === 'officer' && isCompliance && (
            <ComplianceReviewerViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={appId => {}}
              onViewDoc={() => {}}
            />
          )}

          {/* ROLE 4: AUTHORIZED AICTE DECISION-MAKER */}
          {currentRoleKey === 'officer' && isDecisionMaker && !isScrutiny && (
            <DecisionMakerViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={appId => {}}
              onViewDoc={() => {}}
            />
          )}

          {/* ROLE 5: SYSTEM ADMINISTRATOR */}
          {currentRoleKey === 'admin' && (
            <AdminViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={appId => {}}
              onViewDoc={() => {}}
            />
          )}
        </main>

        {/* Official Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div>
            AICTE Regulatory Compliance &amp; Application Validation Platform · Ministry of Education, Government of India
          </div>
          <div style={{ marginTop: '2px', color: '#94a3b8' }}>
            Academic Year 2026-27 Statutory Approval Workflow
          </div>
        </footer>
      </div>
    </div>
  );
}
