import React from 'react';
import { IndianEmblem } from './Emblems';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Plus,
  Folder,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Clock,
  User,
  FileSearch,
  FileCode,
  ShieldAlert,
  CheckCheck,
  FileEdit,
  History,
  Scale,
  Map,
  Building,
  FileText,
  MessageSquare,
  ArrowRight,
  Hourglass,
  FileCheck,
  Search,
  BarChart3,
  Scroll,
  Users,
  Shield,
  Settings,
  RefreshCw,
  Cpu,
  Activity,
  Wrench,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
  findingCount?: number;
}

export default function Sidebar({ currentPage, onNavigate }: Props) {
  const { user, logout } = useAuth();
  const role = (user?.role || 'institution').toLowerCase();

  let portalSubtitle = 'Regulatory Portal';
  let roleBadgeLabel = 'Authorized User';
  let roleBadgeBg = '#f1f5f9';
  let roleBadgeColor = '#0f172a';
  let navItems: NavItem[] = [];

  // ============================================================
  // EXACT 5-ROLE SIDEBAR SPECIFICATION WITH SLEEK BLACK LOGO MARKS
  // ============================================================
  if (role === 'institution') {
    portalSubtitle = 'Institution Desk';
    roleBadgeLabel = 'Institution User';
    roleBadgeBg = '#ecfdf5';
    roleBadgeColor = '#065f46';
    navItems = [
      { id: 'inst-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} strokeWidth={2.2} /> },
      { id: 'inst-profile', label: 'Institution Profile', icon: <Building2 size={14} strokeWidth={2.2} /> },
      { id: 'inst-applications', label: 'My Applications', icon: <ClipboardList size={14} strokeWidth={2.2} /> },
      { id: 'inst-create-app', label: 'Create Application', icon: <Plus size={14} strokeWidth={2.5} /> },
      { id: 'inst-docs', label: 'Document Center', icon: <Folder size={14} strokeWidth={2.2} /> },
      { id: 'inst-checklist', label: 'Requirements Checklist', icon: <CheckCircle2 size={14} strokeWidth={2.2} /> },
      { id: 'inst-deficiencies', label: 'Clarifications & Deficiencies', icon: <AlertTriangle size={14} strokeWidth={2.2} /> },
      { id: 'inst-notifications', label: 'Notifications', icon: <Bell size={14} strokeWidth={2.2} /> },
      { id: 'inst-timeline', label: 'Application Timeline', icon: <Clock size={14} strokeWidth={2.2} /> },
      { id: 'inst-account', label: 'My Account', icon: <User size={14} strokeWidth={2.2} /> },
    ];
  } else if (role === 'verification_officer' || role === 'officer') {
    portalSubtitle = 'Document Verification Desk';
    roleBadgeLabel = 'Verification Officer';
    roleBadgeBg = '#f0f9ff';
    roleBadgeColor = '#0369a1';
    navItems = [
      { id: 'vo-dashboard', label: 'Verification Dashboard', icon: <LayoutDashboard size={14} strokeWidth={2.2} /> },
      { id: 'vo-assigned', label: 'Assigned Applications', icon: <ClipboardList size={14} strokeWidth={2.2} /> },
      { id: 'vo-doc-workspace', label: 'Document Verification', icon: <FileSearch size={14} strokeWidth={2.2} /> },
      { id: 'vo-ocr', label: 'OCR & Extracted Data', icon: <FileCode size={14} strokeWidth={2.2} /> },
      { id: 'vo-anomalies', label: 'Anomaly Findings', icon: <ShieldAlert size={14} strokeWidth={2.2} /> },
      { id: 'vo-issuer', label: 'Issuer Verification', icon: <Building2 size={14} strokeWidth={2.2} /> },
      { id: 'vo-checklist', label: 'Verification Checklist', icon: <CheckCheck size={14} strokeWidth={2.2} /> },
      { id: 'vo-raise-deficiency', label: 'Raise Deficiencies', icon: <FileEdit size={14} strokeWidth={2.2} /> },
      { id: 'vo-history', label: 'Verification History', icon: <History size={14} strokeWidth={2.2} /> },
    ];
  } else if (role === 'compliance_reviewer') {
    portalSubtitle = 'Regulatory Scrutiny Desk';
    roleBadgeLabel = 'Compliance Reviewer';
    roleBadgeBg = '#f5f3ff';
    roleBadgeColor = '#6d28d9';
    navItems = [
      { id: 'cr-dashboard', label: 'Compliance Dashboard', icon: <LayoutDashboard size={14} strokeWidth={2.2} /> },
      { id: 'cr-applications', label: 'Applications for Review', icon: <ClipboardList size={14} strokeWidth={2.2} /> },
      { id: 'cr-checklist', label: 'Regulatory Checklist', icon: <Scale size={14} strokeWidth={2.2} /> },
      { id: 'cr-evidence-mapping', label: 'Requirement-to-Evidence Mapping', icon: <Map size={14} strokeWidth={2.2} /> },
      { id: 'cr-infrastructure', label: 'Infrastructure Assessment', icon: <Building size={14} strokeWidth={2.2} /> },
      { id: 'cr-gaps', label: 'Compliance Gaps', icon: <AlertTriangle size={14} strokeWidth={2.2} /> },
      { id: 'cr-observations', label: 'Review Observations', icon: <FileText size={14} strokeWidth={2.2} /> },
      { id: 'cr-clarifications', label: 'Clarification Requests', icon: <MessageSquare size={14} strokeWidth={2.2} /> },
      { id: 'cr-forward', label: 'Forward for Decision', icon: <ArrowRight size={14} strokeWidth={2.2} /> },
    ];
  } else if (role === 'decision_maker') {
    portalSubtitle = 'Statutory Directorate';
    roleBadgeLabel = 'AICTE Decision-Maker';
    roleBadgeBg = '#fffbeb';
    roleBadgeColor = '#b45309';
    navItems = [
      { id: 'dm-dashboard', label: 'Decision Dashboard', icon: <LayoutDashboard size={14} strokeWidth={2.2} /> },
      { id: 'dm-pending', label: 'Pending Decisions', icon: <Hourglass size={14} strokeWidth={2.2} /> },
      { id: 'dm-case-review', label: 'Complete Case Review', icon: <FileCheck size={14} strokeWidth={2.2} /> },
      { id: 'dm-findings', label: 'Findings & Evidence', icon: <Search size={14} strokeWidth={2.2} /> },
      { id: 'dm-compliance-summary', label: 'Compliance Summary', icon: <BarChart3 size={14} strokeWidth={2.2} /> },
      { id: 'dm-workspace', label: 'Decision Workspace', icon: <Scale size={14} strokeWidth={2.2} /> },
      { id: 'dm-recorded', label: 'Recorded Decisions', icon: <Scroll size={14} strokeWidth={2.2} /> },
      { id: 'dm-history', label: 'Decision History', icon: <History size={14} strokeWidth={2.2} /> },
    ];
  } else if (role === 'admin') {
    portalSubtitle = 'System Administration';
    roleBadgeLabel = 'System Administrator';
    roleBadgeBg = '#f1f5f9';
    roleBadgeColor = '#0f172a';
    navItems = [
      { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <LayoutDashboard size={14} strokeWidth={2.2} /> },
      { id: 'admin-users', label: 'User Management', icon: <Users size={14} strokeWidth={2.2} /> },
      { id: 'admin-roles', label: 'Roles & Permissions', icon: <Shield size={14} strokeWidth={2.2} /> },
      { id: 'admin-institutions', label: 'Institution Accounts', icon: <Building2 size={14} strokeWidth={2.2} /> },
      { id: 'admin-rules', label: 'Rule Configuration', icon: <Settings size={14} strokeWidth={2.2} /> },
      { id: 'admin-workflow', label: 'Workflow Configuration', icon: <RefreshCw size={14} strokeWidth={2.2} /> },
      { id: 'admin-integrations', label: 'Integrations & AI Services', icon: <Cpu size={14} strokeWidth={2.2} /> },
      { id: 'admin-audit', label: 'Audit Logs', icon: <Scroll size={14} strokeWidth={2.2} /> },
      { id: 'admin-health', label: 'System Health', icon: <Activity size={14} strokeWidth={2.2} /> },
      { id: 'admin-settings', label: 'System Settings', icon: <Wrench size={14} strokeWidth={2.2} /> },
    ];
  } else {
    portalSubtitle = 'AICTE Portal';
    roleBadgeLabel = role;
    navItems = [
      { id: 'inst-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} strokeWidth={2.2} /> },
      { id: 'inst-applications', label: 'Applications', icon: <ClipboardList size={14} strokeWidth={2.2} /> },
    ];
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : role.slice(0, 2).toUpperCase();

  // Helper to determine if an item is active
  const isItemActive = (itemId: string) => {
    if (currentPage === itemId) return true;
    if (currentPage === 'dashboard') {
      return itemId.endsWith('-dashboard');
    }
    return false;
  };

  return (
    <aside className="official-sidebar">
      {/* Brand Header */}
      <div 
        className="sidebar-header" 
        onClick={() => {
          if (role === 'institution') onNavigate('inst-dashboard');
          else if (role === 'verification_officer' || role === 'officer') onNavigate('vo-dashboard');
          else if (role === 'compliance_reviewer') onNavigate('cr-dashboard');
          else if (role === 'decision_maker') onNavigate('dm-dashboard');
          else if (role === 'admin') onNavigate('admin-dashboard');
          else onNavigate('inst-dashboard');
        }} 
        style={{ cursor: 'pointer' }}
      >
        <IndianEmblem size={28} color="#09090b" />
        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
          <div className="sidebar-brand-name">AICTE</div>
          <div className="sidebar-brand-sub">{portalSubtitle}</div>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{
          padding: '5px 10px',
          background: roleBadgeBg,
          color: roleBadgeColor,
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <ShieldCheck size={12} strokeWidth={2.5} />
          <span>{roleBadgeLabel}</span>
        </div>
      </div>

      {/* Navigation List - Role Specific Menu */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Workflow Menu</div>
        <ul className="nav-list">
          {navItems.map(item => {
            const active = isItemActive(item.id);
            return (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${active ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="nav-logo-badge">
                    {item.icon}
                  </span>
                  <span className="nav-label">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="nav-badge">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Official Status Box */}
      <div style={{
        margin: '12px 12px 0 12px',
        padding: '10px 12px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: '700', marginBottom: '2px' }}>
          <CheckCircle2 size={12} />
          <span>APH 2026-27 Norms</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '10.5px' }}>
          Server-Enforced RBAC Active
        </div>
      </div>

      {/* User Session Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-widget">
          <div className="user-avatar-circle">
            {initials}
          </div>
          <div className="user-info-text">
            <div className="user-info-name">
              {user?.full_name || 'Active User'}
            </div>
            <div className="user-info-role" style={{ textTransform: 'capitalize' }}>
              {role.replace('_', ' ')}
            </div>
          </div>
          <button
            className="btn-signout"
            onClick={logout}
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
