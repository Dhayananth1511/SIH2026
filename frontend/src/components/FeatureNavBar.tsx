import React from 'react';
import {
  FileText,
  FileSearch,
  FileCheck2,
  ShieldAlert,
  Building2,
  SlidersHorizontal,
  BarChart3,
  UserCheck
} from 'lucide-react';

export interface FeatureTab {
  id: number;
  label: string;
  shortTitle: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface Props {
  activeFeature: number;
  onSelectFeature: (featureId: number) => void;
  anomaliesCount?: number;
  missingCount?: number;
}

export default function FeatureNavBar({
  activeFeature,
  onSelectFeature,
  anomaliesCount = 0,
  missingCount = 0
}: Props) {
  const features: FeatureTab[] = [
    {
      id: 1,
      shortTitle: '1. Accept Application',
      label: '1. Accept Sample AICTE Application & Docs',
      icon: <FileText size={15} />
    },
    {
      id: 2,
      shortTitle: '2. Extract & Validate',
      label: '2. Extract & Validate Information (OCR)',
      icon: <FileSearch size={15} />
    },
    {
      id: 3,
      shortTitle: '3. Missing & Inconsistencies',
      label: '3. Identify Missing Docs & Inconsistencies',
      icon: <FileCheck2 size={15} />,
      badge: missingCount > 0 ? `${missingCount} Discrepancies` : undefined,
      badgeColor: '#b45309'
    },
    {
      id: 4,
      shortTitle: '4. Document Manipulation',
      label: '4. Flag Potential Document Manipulation',
      icon: <ShieldAlert size={15} />,
      badge: anomaliesCount > 0 ? `${anomaliesCount} Tamper Flags` : undefined,
      badgeColor: '#dc2626'
    },
    {
      id: 5,
      shortTitle: '5. Authorized Sources',
      label: '5. Authorized Source Verification',
      icon: <Building2 size={15} />
    },
    {
      id: 6,
      shortTitle: '6. Configurable Rules',
      label: '6. Check Configurable Compliance Rules',
      icon: <SlidersHorizontal size={15} />
    },
    {
      id: 7,
      shortTitle: '7. Evidence Dashboard',
      label: '7. Evidence-Backed Dashboard',
      icon: <BarChart3 size={15} />
    },
    {
      id: 8,
      shortTitle: '8. Audit & Human Review',
      label: '8. Audit Trail & Human Review (HITL)',
      icon: <UserCheck size={15} />
    }
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 'max-content' }}>
          {features.map(f => {
            const isActive = activeFeature === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFeature(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #1e3a8a' : '3px solid transparent',
                  background: isActive ? '#f8fafc' : 'transparent',
                  color: isActive ? '#1e3a8a' : '#475569',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{
                  color: isActive ? '#1e3a8a' : '#64748b',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {f.icon}
                </span>
                <span>{f.label}</span>
                {f.badge && (
                  <span style={{
                    background: f.badgeColor || '#dc2626',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '4px'
                  }}>
                    {f.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
