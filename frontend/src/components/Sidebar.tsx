import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import {
  Landmark,
  LayoutDashboard,
  Building2,
  ClipboardList,
  ScanLine,
  MessageSquare,
  History,
  User as UserIcon,
  Inbox,
  FileText,
  Cpu,
  ShieldCheck,
  Scale,
  FileCheck,
  Users,
  CheckSquare,
  Scroll,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  currentPage,
  onNavigate,
  notificationCount = 0,
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}: Props) {
  const { user, logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('sidebar_collapsed', String(next));
        return next;
      });
    }
  };

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

  let portalTitle = 'AICTE SmartVerify';
  let portalSubtitle = 'Institution Portal';
  let navItems: NavItem[] = [];

  // ============================================================
  // EXACT THREE ROLE-BASED SIDEBARS (With Increased Sizing)
  // ============================================================
  if (roleKey === 'institution') {
    portalSubtitle = 'Institution Portal';
    navItems = [
      { id: 'inst-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
      { id: 'inst-profile', label: 'Institution Profile', icon: <Building2 size={20} strokeWidth={2} /> },
      { id: 'inst-applications', label: 'My Applications', icon: <ClipboardList size={20} strokeWidth={2} /> },
      { id: 'inst-validation-rectification', label: 'AI Validation & Rectification', icon: <ScanLine size={20} strokeWidth={2} /> },
      {
        id: 'inst-clarifications-notifications',
        label: 'Clarifications & Notifications',
        icon: <MessageSquare size={20} strokeWidth={2} />,
        badge: notificationCount > 0 ? String(notificationCount) : undefined
      },
      { id: 'inst-history', label: 'Application History', icon: <History size={20} strokeWidth={2} /> },
      { id: 'inst-account', label: 'My Account', icon: <UserIcon size={20} strokeWidth={2} /> }
    ];
  } else if (roleKey === 'officer') {
    portalSubtitle = 'AICTE Officer Portal';
    navItems = [
      { id: 'officer-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
      { id: 'officer-queue', label: 'Application Queue', icon: <Inbox size={20} strokeWidth={2} /> },
      { id: 'officer-scrutiny', label: 'Application Scrutiny', icon: <FileText size={20} strokeWidth={2} /> },
      { id: 'officer-ai-validation', label: 'AI Validation Report', icon: <Cpu size={20} strokeWidth={2} /> },
      { id: 'officer-doc-auth', label: 'Document Authentication', icon: <ShieldCheck size={20} strokeWidth={2} /> },
      { id: 'officer-compliance', label: 'Verification & Compliance', icon: <Scale size={20} strokeWidth={2} /> },
      { id: 'officer-clarifications', label: 'Clarifications', icon: <MessageSquare size={20} strokeWidth={2} /> },
      { id: 'officer-review-decision', label: 'Review & Decision', icon: <FileCheck size={20} strokeWidth={2} /> },
      { id: 'officer-audit', label: 'Audit History', icon: <History size={20} strokeWidth={2} /> },
      { id: 'officer-account', label: 'My Account', icon: <UserIcon size={20} strokeWidth={2} /> }
    ];
  } else if (roleKey === 'admin') {
    portalSubtitle = 'Admin Portal';
    navItems = [
      { id: 'admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
      { id: 'admin-users', label: 'User Management', icon: <Users size={20} strokeWidth={2} /> },
      { id: 'admin-roles', label: 'Roles & Permissions', icon: <ShieldCheck size={20} strokeWidth={2} /> },
      { id: 'admin-rules', label: 'Rules & Checklists', icon: <CheckSquare size={20} strokeWidth={2} /> },
      { id: 'admin-ai-integrations', label: 'AI & Integrations', icon: <Cpu size={20} strokeWidth={2} /> },
      { id: 'admin-logs-audit', label: 'System Logs & Audit Trail', icon: <Scroll size={20} strokeWidth={2} /> }
    ];
  }

  const isCurrentActive = (itemId: string) => {
    if (currentPage === itemId) return true;
    if (roleKey === 'institution') {
      if (itemId === 'inst-dashboard' && (currentPage === 'dashboard' || currentPage === 'inst-dashboard')) return true;
      if (itemId === 'inst-applications' && (currentPage === 'inst-create-app' || currentPage === 'inst-applications')) return true;
    }
    if (roleKey === 'officer') {
      if (itemId === 'officer-dashboard' && (currentPage === 'dashboard' || currentPage === 'vo-dashboard' || currentPage === 'officer-dashboard')) return true;
      if (itemId === 'officer-queue' && currentPage === 'vo-assigned') return true;
    }
    if (roleKey === 'admin') {
      if (itemId === 'admin-dashboard' && (currentPage === 'dashboard' || currentPage === 'admin-dashboard')) return true;
    }
    return false;
  };

  return (
    <aside
      id="aicte-sidebar"
      style={{
        width: isCollapsed ? '78px' : '280px',
        minWidth: isCollapsed ? '78px' : '280px',
        maxWidth: isCollapsed ? '78px' : '280px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        padding: isCollapsed ? '16px 10px 14px 10px' : '16px 14px 14px 14px',
        boxSizing: 'border-box',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '1px 0 10px rgba(0, 0, 0, 0.03)',
        zIndex: 100,
        fontFamily: "'Inter', sans-serif",
        userSelect: 'none',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s ease'
      }}
    >
      {/* Top Portal Card Header */}
      {!isCollapsed ? (
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '10px',
          padding: '12px 14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#1e3a8a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 2px 5px rgba(30, 58, 138, 0.3)'
            }}>
              <Landmark size={22} strokeWidth={2.2} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '14.5px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.2px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap'
              }}>
                {portalTitle}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#2563eb',
                marginTop: '2px',
                whiteSpace: 'nowrap'
              }}>
                {portalSubtitle}
              </div>
            </div>
          </div>

          {/* Close / Collapse Button */}
          <button
            onClick={handleToggle}
            title="Collapse sidebar"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid transparent',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      ) : (
        /* Collapsed Top Header */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div
            title={`${portalTitle} - ${portalSubtitle}`}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#1e3a8a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(30, 58, 138, 0.3)',
              cursor: 'pointer'
            }}
            onClick={handleToggle}
          >
            <Landmark size={22} strokeWidth={2.2} />
          </div>

          {/* Expand Button */}
          <button
            onClick={handleToggle}
            title="Expand sidebar"
            style={{
              width: '32px',
              height: '26px',
              borderRadius: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        paddingRight: '2px'
      }}>
        {navItems.map(item => {
          const active = isCurrentActive(item.id);

          if (isCollapsed) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  border: active ? '1.5px solid #3b82f6' : '1px solid transparent',
                  background: active ? '#eff6ff' : 'transparent',
                  color: active ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#0f172a';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }
                }}
              >
                {item.icon}
                {item.badge && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    background: '#dc2626',
                    borderRadius: '50%',
                    border: '1.5px solid #ffffff'
                  }} />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '8px',
                border: active ? '1px solid #bfdbfe' : '1px solid transparent',
                background: active ? '#eff6ff' : 'transparent',
                color: active ? '#1d4ed8' : '#334155',
                fontSize: '14px',
                fontWeight: active ? '700' : '600',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: active ? '0 1px 3px rgba(37, 99, 235, 0.08)' : 'none'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#334155';
                }
              }}
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: active ? '#1d4ed8' : '#64748b',
                flexShrink: 0
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              {item.badge && (
                <span style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: '#e2e8f0',
        margin: '12px 4px 10px 4px'
      }} />

      {/* Sign Out Button in Red */}
      {!isCollapsed ? (
        <button
          onClick={() => {
            logout();
            onNavigate('login');
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 14px',
            borderRadius: '8px',
            border: '1px solid transparent',
            background: 'transparent',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <LogOut size={20} strokeWidth={2.2} />
          </span>
          <span>Sign Out</span>
        </button>
      ) : (
        <button
          onClick={() => {
            logout();
            onNavigate('login');
          }}
          title="Sign Out"
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            border: '1px solid transparent',
            background: 'transparent',
            color: '#dc2626',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <LogOut size={20} strokeWidth={2.2} />
        </button>
      )}
    </aside>
  );
}
