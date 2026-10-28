import React from 'react';
import { IndianEmblem } from './Emblems';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Bell,
  Scale,
  Scroll,
  Users,
  Settings,
  FileCheck,
  CheckCircle2,
  LogOut
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
  notificationCount?: number;
}

export default function Sidebar({ currentPage, onNavigate, notificationCount = 0 }: Props) {
  const { user, logout } = useAuth();
  const rawRole = (user?.role || 'institution').toLowerCase();

  let roleKey = 'institution';
  if (
    rawRole.includes('officer') ||
    rawRole.includes('scrutiny') ||
    rawRole.includes('verification') ||
    rawRole.includes('compliance') ||
    rawRole.includes('reviewer') ||
    rawRole.includes('chairman') ||
    rawRole.includes('decision')
  ) {
    roleKey = 'officer';
  } else if (rawRole.includes('admin')) {
    roleKey = 'admin';
  }

  let portalSubtitle = 'Regulatory Portal';
  let roleBadgeLabel = 'Institution';
  let roleBadgeBg = '#ecfdf5';
  let roleBadgeColor = '#065f46';
  let navItems: NavItem[] = [];

  // ============================================================
  // UNIFIED NAVIGATION SPECIFICATION
  // ============================================================
  if (roleKey === 'institution') {
    portalSubtitle = 'Institution Desk';
    roleBadgeLabel = 'Institution Applicant';
    roleBadgeBg = '#ecfdf5';
    roleBadgeColor = '#065f46';
    navItems = [
      { id: 'inst-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} strokeWidth={2.2} /> },
      { id: 'inst-applications', label: 'My Applications', icon: <ClipboardList size={15} strokeWidth={2.2} /> },
      { id: 'inst-profile', label: 'Institution Profile', icon: <Building2 size={15} strokeWidth={2.2} /> },
      {
        id: 'inst-notifications',
        label: 'Notifications',
        icon: <Bell size={15} strokeWidth={2.2} />,
        badge: notificationCount > 0 ? String(notificationCount) : undefined
      }
    ];
  } else if (roleKey === 'officer') {
    portalSubtitle = 'Approval Directorate';
    roleBadgeLabel = 'Approval Officer';
    roleBadgeBg = '#f0f9ff';
    roleBadgeColor = '#0369a1';
    navItems = [
      { id: 'vo-dashboard', label: 'Officer Dashboard', icon: <LayoutDashboard size={15} strokeWidth={2.2} /> },
      { id: 'vo-assigned', label: 'Review & Approval Queue', icon: <ClipboardList size={15} strokeWidth={2.2} /> }
    ];
  } else if (roleKey === 'admin') {
    portalSubtitle = 'System Administration';
    roleBadgeLabel = 'System Administrator';
    roleBadgeBg = '#f1f5f9';
    roleBadgeColor = '#0f172a';
    navItems = [
      { id: 'admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} strokeWidth={2.2} /> },
      { id: 'admin-users', label: 'Users and Institutions', icon: <Users size={15} strokeWidth={2.2} /> },
      { id: 'admin-rules', label: 'Document and Compliance Rules', icon: <Settings size={15} strokeWidth={2.2} /> },
      { id: 'admin-audit', label: 'Audit Logs', icon: <Scroll size={15} strokeWidth={2.2} /> }
    ];
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'US';

  return (
    <aside className="app-sidebar">
      {/* Brand & Emblem */}
      <div className="sidebar-brand-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IndianEmblem size={28} color="#1e3a8a" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              AICTE
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>
              {portalSubtitle}
            </div>
          </div>
        </div>

        {/* Role Pill */}
        <div style={{
          marginTop: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 8px',
          background: roleBadgeBg,
          color: roleBadgeColor,
          borderRadius: '4px',
          fontSize: '10.5px',
          fontWeight: '700',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: roleBadgeColor }} />
          <span>{roleBadgeLabel}</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">
          Navigation
        </div>
        {navItems.map(item => {
          const isActive = currentPage === item.id || (item.id.includes('dashboard') && currentPage === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer with Active User & Sign Out */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" title={user?.full_name || 'Active User'}>
              {user?.full_name || 'Active User'}
            </div>
            <div className="sidebar-user-role">
              {roleBadgeLabel}
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            logout();
            onNavigate('login');
          }}
          style={{ width: '100%', justifyContent: 'center', marginTop: '10px', color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2', fontSize: '11px' }}
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
