import React, { useState, useEffect } from 'react';
import { IndianEmblem } from './Emblems';
import { LogOut, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Sidebar from './Sidebar';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';

import InstitutionViews from '../views/InstitutionViews';
import OfficerPortalViews from '../views/OfficerPortalViews';
import AdminViews from '../views/AdminViews';

import { useAuth } from '../AuthContext';
import { getNotifications } from '../api';
import type { Notification } from '../types';

export default function Layout() {
  const { user, logout } = useAuth();
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

  const getDefaultRolePage = (roleKey: string) => {
    if (roleKey === 'officer') return 'officer-dashboard';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (user?.role && (currentPage === 'login' || currentPage === 'dashboard' || currentPage === 'vo-dashboard')) {
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
      {/* Sidebar with exact role menus, white theme & open/close option */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={page => setCurrentPage(page)}
        notificationCount={unreadCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Top Official Government Header */}
        <header className="official-header">
          {/* Header Left with Sidebar Toggle Button */}
          <div className="header-left">
            <button
              id="header-sidebar-toggle-btn"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Expand sidebar (show menu text)" : "Collapse sidebar (show icons only)"}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
                marginRight: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.color = '#1d4ed8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#334155';
              }}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
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

        {/* Page Content Router based on Exact Three Roles */}
        <main className="page-container" style={{ paddingBottom: '60px' }}>
          {/* ROLE 1: INSTITUTION PORTAL */}
          {currentRoleKey === 'institution' && (
            <InstitutionViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={appId => {}}
              onViewDoc={() => {}}
            />
          )}

          {/* ROLE 2: AICTE OFFICER PORTAL */}
          {currentRoleKey === 'officer' && (
            <OfficerPortalViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onViewDoc={() => {}}
            />
          )}

          {/* ROLE 3: SYSTEM ADMINISTRATOR PORTAL */}
          {currentRoleKey === 'admin' && (
            <AdminViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={appId => {}}
              onViewDoc={() => {}}
            />
          )}
        </main>

        {/* Official Sovereign Government Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div style={{ fontWeight: '600', color: '#0f172a' }}>
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
