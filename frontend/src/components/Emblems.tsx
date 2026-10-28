import React from 'react';

// Indian National Emblem (Ashoka Lion Capital with Satyameva Jayate)
export function IndianEmblem({ size = 36, color = '#1e3a8a' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central Lion Head */}
      <path d="M50 12 C44 12 39 16 39 22 C39 27 42 30 44 32 C41 34 38 38 38 44 C38 49 41 53 45 55 L45 62 C41 64 36 67 36 72 C36 76 40 79 45 80 L45 86 L55 86 L55 80 C60 79 64 76 64 72 C64 67 59 64 55 62 L55 55 C59 53 62 49 62 44 C62 38 59 34 56 32 C58 30 61 27 61 22 C61 16 56 12 50 12 Z" fill={color} />
      {/* Left Lion */}
      <path d="M30 20 C25 20 21 24 21 29 C21 34 24 37 26 39 C23 41 20 45 20 51 C20 56 23 60 27 62 L27 69 C23 71 18 74 18 79 C18 83 22 86 27 87 L27 90 L34 90 L34 85 C37 84 39 82 40 80 L38 72 L36 60 C33 58 31 55 31 51 C31 46 33 42 36 40 L35 34 C33 33 30 30 30 26 Z" fill={color} opacity="0.9" />
      {/* Right Lion */}
      <path d="M70 20 C75 20 79 24 79 29 C79 34 76 37 74 39 C77 41 80 45 80 51 C80 56 77 60 73 62 L73 69 C77 71 82 74 82 79 C82 83 78 86 73 87 L73 90 L66 90 L66 85 C63 84 61 82 60 80 L62 72 L64 60 C67 58 69 55 69 51 C69 46 67 42 64 40 L65 34 C67 33 70 30 70 26 Z" fill={color} opacity="0.9" />
      {/* Abacus / Base Plate with Ashoka Chakra */}
      <rect x="20" y="88" width="60" height="8" rx="2" fill={color} />
      <circle cx="50" cy="92" r="3.5" fill="#ffffff" />
      <circle cx="50" cy="92" r="1.5" fill={color} />
      {/* Bell Capital / Pedestal */}
      <path d="M26 96 L22 108 L78 108 L74 96 Z" fill={color} opacity="0.8" />
      <rect x="18" y="108" width="64" height="4" rx="1.5" fill={color} />
      {/* Satyameva Jayate (सत्यमेव जयते text bar) */}
      <text x="50" y="118" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={color} letterSpacing="0.8">
        सत्यमेव जयते
      </text>
    </svg>
  );
}

// AICTE Logo Crest (Official Indian Technical Education Symbol)
export function Aictelogo({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="42" fill="#fffbeb" stroke="#b45309" strokeWidth="1" strokeDasharray="2 2" />
        {/* Flame / Kalash / Lamp of Knowledge */}
        <path d="M50 20 C46 28 42 36 42 45 C42 54 46 60 50 64 C54 60 58 54 58 45 C58 36 54 28 50 20 Z" fill="#f59e0b" />
        <path d="M50 28 C48 34 45 39 45 45 C45 50 47 54 50 57 C53 54 55 50 55 45 C55 39 52 34 50 28 Z" fill="#ef4444" />
        {/* Open Book of Education */}
        <path d="M28 66 C36 62 44 63 50 67 C56 63 64 62 72 66 L70 76 C63 73 56 73 50 77 C44 73 37 73 30 76 Z" fill="#1e40af" />
        <path d="M50 67 L50 77" stroke="#ffffff" strokeWidth="1.5" />
        {/* Gear teeth outline on base */}
        <circle cx="50" cy="50" r="32" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" fill="none" />
        {/* Text */}
        <text x="50" y="87" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#1e40af">AICTE</text>
      </svg>
    </div>
  );
}

// 3D Isometric University Building for Sign Up page
export function IsometricCampusGraphic() {
  return (
    <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto', textAlign: 'center' }}>
      <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="wallLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="wallShade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* Isometric Base Grid */}
        <polygon points="200,40 370,140 200,240 30,140" fill="url(#groundGrad)" opacity="0.6" stroke="#93c5fd" strokeWidth="1.5" />
        
        {/* Pathways */}
        <polygon points="200,240 200,280 230,260 230,230" fill="#cbd5e1" opacity="0.5" />
        <polygon points="170,230 170,260 200,280 200,240" fill="#e2e8f0" opacity="0.5" />

        {/* Trees */}
        <circle cx="85" cy="130" r="14" fill="#10b981" opacity="0.85" />
        <polygon points="85,130 85,155 88,155 88,130" fill="#78350f" />
        
        <circle cx="310" cy="120" r="16" fill="#10b981" opacity="0.85" />
        <polygon points="310,120 310,145 313,145 313,120" fill="#78350f" />

        {/* Main Building Base Block */}
        {/* Left Wall */}
        <polygon points="120,130 200,175 200,105 120,60" fill="url(#wallLight)" stroke="#3b82f6" strokeWidth="1" />
        {/* Right Wall */}
        <polygon points="200,175 280,130 280,60 200,105" fill="url(#wallShade)" stroke="#2563eb" strokeWidth="1" />
        {/* Roof */}
        <polygon points="120,60 200,15 280,60 200,105" fill="url(#roofGrad)" stroke="#1d4ed8" strokeWidth="1" />

        {/* Windows - Left Wall */}
        <polygon points="135,80 150,88 150,105 135,97" fill="#60a5fa" opacity="0.8" />
        <polygon points="160,94 175,102 175,119 160,111" fill="#60a5fa" opacity="0.8" />
        <polygon points="135,110 150,118 150,135 135,127" fill="#60a5fa" opacity="0.8" />
        <polygon points="160,124 175,132 175,149 160,141" fill="#60a5fa" opacity="0.8" />

        {/* Windows - Right Wall */}
        <polygon points="225,102 240,94 240,111 225,119" fill="#93c5fd" opacity="0.8" />
        <polygon points="250,88 265,80 265,97 250,105" fill="#93c5fd" opacity="0.8" />
        <polygon points="225,132 240,124 240,141 225,149" fill="#93c5fd" opacity="0.8" />
        <polygon points="250,118 265,110 265,127 250,135" fill="#93c5fd" opacity="0.8" />

        {/* Main Portal / Columns */}
        <polygon points="188,168 200,175 200,140 188,133" fill="#ffffff" stroke="#3b82f6" strokeWidth="1" />
        <polygon points="200,175 212,168 212,133 200,140" fill="#e2e8f0" stroke="#3b82f6" strokeWidth="1" />
        <polygon points="192,160 200,165 200,150 192,145" fill="#1e40af" />
        <polygon points="200,165 208,160 208,145 200,150" fill="#1e3a8a" />

        {/* Flag on top */}
        <line x1="200" y1="15" x2="200" y2="-5" stroke="#64748b" strokeWidth="2" />
        <polygon points="200,-5 215,0 200,5" fill="#f97316" />
      </svg>
      <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '600', color: '#1e40af', letterSpacing: '0.3px' }}>
        Working Together for Quality Technical Education
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
        AICTE Approval Process Handbook (APH 2025-27)
      </div>
    </div>
  );
}

// Hero Graphic for Login Page (Lion Capital + Rashtrapati Bhavan / Technical Academy Pillar)
export function LoginHeroGraphic() {
  return (
    <div style={{
      height: '100%',
      minHeight: '380px',
      background: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      borderRadius: '12px',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid #bfdbfe'
    }}>
      {/* Decorative background circle */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(219,234,254,0.2) 70%)',
        top: '-40px',
        left: '-40px',
        pointerEvents: 'none'
      }} />

      {/* Ashoka Lion Capital Graphic */}
      <div style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '50%',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.15)',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
        display: 'inline-flex'
      }}>
        <IndianEmblem size={56} color="#1e3a8a" />
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Aictelogo size={28} />
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '-0.5px', margin: 0 }}>
          AICTE
        </h2>
      </div>

      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '8px', lineHeight: '1.4' }}>
        Regulatory Compliance &amp; Application Validation Platform
      </h3>

      <p style={{ fontSize: '13px', color: '#475569', maxWidth: '280px', lineHeight: '1.5', margin: '0 auto 20px' }}>
        Ensuring Quality, Compliance and Excellence in Technical Education
      </p>

      {/* Trust pill */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        background: '#ffffff',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#0369a1',
        border: '1px solid #bae6fd',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}>
        <span style={{ color: '#16a34a' }}>●</span> Official Scrutiny &amp; Validation Portal
      </div>
    </div>
  );
}
