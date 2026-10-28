import React, { useState, useEffect } from 'react';
import { IndianEmblem } from './Emblems';
import { Search, Bell, BookOpen, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import ApplicationDetailPage from '../pages/ApplicationDetailPage';
import DocumentViewerPage from '../pages/DocumentViewerPage';
import DocumentationPage from '../pages/DocumentationPage';

import InstitutionViews from '../views/InstitutionViews';
import VerificationOfficerViews from '../views/VerificationOfficerViews';
import ComplianceReviewerViews from '../views/ComplianceReviewerViews';
import DecisionMakerViews from '../views/DecisionMakerViews';
import AdminViews from '../views/AdminViews';

import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const currentRole = (user?.role || 'institution').toLowerCase();

  const getDefaultRolePage = (role: string) => {
    if (role === 'institution') return 'inst-dashboard';
    if (role === 'verification_officer' || role === 'officer') return 'vo-dashboard';
    if (role === 'compliance_reviewer') return 'cr-dashboard';
    if (role === 'decision_maker') return 'dm-dashboard';
    if (role === 'admin') return 'admin-dashboard';
    return 'inst-dashboard';
  };

  const [currentPage, setCurrentPage] = useState<string>(() => {
    const token = localStorage.getItem('token');
    if (!token) return 'login';
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return getDefaultRolePage((u.role || 'institution').toLowerCase());
      } catch {
        return 'inst-dashboard';
      }
    }
    return 'inst-dashboard';
  });

  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedDocName, setSelectedDocName] = useState<string>('');
  const [searchVal, setSearchVal] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  // When user role changes or logs in, reset to role's default dashboard
  useEffect(() => {
    if (user?.role && (currentPage === 'login' || currentPage === 'dashboard')) {
      setCurrentPage(getDefaultRolePage(currentRole));
    }
  }, [user?.role]);

  const handleSelectApp = (appId: string) => {
    setSelectedAppId(appId);
    setCurrentPage('app-detail');
  };

  const handleViewDoc = (docName: string) => {
    setSelectedDocName(docName);
    setCurrentPage('doc-viewer');
  };

  // Auth pages
  if (currentPage === 'login') {
    return (
      <LoginPage
        onNavigateToSignUp={() => setCurrentPage('signup')}
        onLoginSuccess={() => {
          const uStr = localStorage.getItem('user');
          const roleFromStorage = uStr ? JSON.parse(uStr)?.role : 'institution';
          setCurrentPage(getDefaultRolePage(roleFromStorage));
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

  return (
    <div className="app-container">
      {/* Sidebar with exact 5-role menus */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={page => setCurrentPage(page)}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Top Official Header */}
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

            {/* Search Input */}
            <div className="header-search">
              <span className="header-search-icon">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search dossiers, rules, records..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNotification(!showNotification)}
                style={{ padding: '6px 10px', position: 'relative' }}
                title="Notifications"
              >
                <Bell size={15} />
              </button>

              {showNotification && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '320px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  padding: '14px',
                  zIndex: 100
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                    Statutory Alerts &amp; Notifications
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', padding: '8px', background: '#f8fafc', borderRadius: '6px', lineHeight: '1.5' }}>
                    ● Academic Year 2026-27 Approval Process Active.<br />
                    ● Server-enforced RBAC enabled across all 5 user roles.
                  </div>
                </div>
              )}
            </div>

            {/* APH Norms & Documentation */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage('documentation')}
              title="Project & Handbook Documentation"
            >
              <BookOpen size={14} />
              <span>APH Norms</span>
            </button>

            {/* User Profile Badge */}
            <div
              className="user-profile-badge"
              onClick={() => setCurrentPage(getDefaultRolePage(currentRole))}
              title="User Profile"
              style={{ cursor: 'pointer' }}
            >
              <div className="user-avatar-circle">
                {user?.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : (user?.role ? user.role.slice(0, 2).toUpperCase() : 'US')}
              </div>
              <div className="user-info-text">
                <div className="user-info-name">{user?.full_name || 'Active User'}</div>
                <div className="user-info-role" style={{ textTransform: 'capitalize' }}>
                  {currentRole.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                logout();
                setCurrentPage('login');
              }}
              title="Sign Out"
              style={{ padding: '6px 12px', fontSize: '12px', color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content Router based on Role and SubPage */}
        <main className="page-container" style={{ paddingBottom: '90px' }}>
          {/* Detailed Application Dossier View */}
          {currentPage === 'app-detail' && (
            <ApplicationDetailPage
              appId={selectedAppId}
              onBack={() => setCurrentPage(getDefaultRolePage(currentRole))}
              onNavigateTab={tab => setCurrentPage(tab)}
            />
          )}

          {/* Document Viewer View */}
          {currentPage === 'doc-viewer' && (
            <DocumentViewerPage
              documentName={selectedDocName}
              onBack={() => setCurrentPage(getDefaultRolePage(currentRole))}
            />
          )}

          {/* Handbook Documentation View */}
          {currentPage === 'documentation' && (
            <DocumentationPage />
          )}

          {/* ROLE 1: INSTITUTION USER VIEWS */}
          {currentRole === 'institution' && currentPage !== 'app-detail' && currentPage !== 'doc-viewer' && currentPage !== 'documentation' && (
            <InstitutionViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={handleSelectApp}
              onViewDoc={handleViewDoc}
            />
          )}

          {/* ROLE 2: VERIFICATION OFFICER VIEWS */}
          {(currentRole === 'verification_officer' || currentRole === 'officer') && currentPage !== 'app-detail' && currentPage !== 'doc-viewer' && currentPage !== 'documentation' && (
            <VerificationOfficerViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={handleSelectApp}
              onViewDoc={handleViewDoc}
            />
          )}

          {/* ROLE 3: COMPLIANCE REVIEWER VIEWS */}
          {currentRole === 'compliance_reviewer' && currentPage !== 'app-detail' && currentPage !== 'doc-viewer' && currentPage !== 'documentation' && (
            <ComplianceReviewerViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={handleSelectApp}
              onViewDoc={handleViewDoc}
            />
          )}

          {/* ROLE 4: AUTHORIZED AICTE DECISION-MAKER VIEWS */}
          {currentRole === 'decision_maker' && currentPage !== 'app-detail' && currentPage !== 'doc-viewer' && currentPage !== 'documentation' && (
            <DecisionMakerViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={handleSelectApp}
              onViewDoc={handleViewDoc}
            />
          )}

          {/* ROLE 5: SYSTEM ADMINISTRATOR VIEWS */}
          {currentRole === 'admin' && currentPage !== 'app-detail' && currentPage !== 'doc-viewer' && currentPage !== 'documentation' && (
            <AdminViews
              subPage={currentPage}
              onNavigate={page => setCurrentPage(page)}
              onSelectApp={handleSelectApp}
              onViewDoc={handleViewDoc}
            />
          )}
        </main>

        {/* Official Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div>
            AICTE Regulatory Compliance &amp; Application Validation Platform · Ministry of Education, Government of India
          </div>
          <div style={{ marginTop: '2px', color: '#94a3b8' }}>
            Smart India Hackathon 2026 · Role-Based Scrutiny Workflow (Synthetic Demo Environment)
          </div>
        </footer>
      </div>
    </div>
  );
}
