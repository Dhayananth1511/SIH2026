import React, { useState } from 'react';
import { IndianEmblem, Aictelogo } from '../components/Emblems';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      {/* Official Documentation Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IndianEmblem size={44} color="#1e3a8a" />
            <Aictelogo size={40} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a8a', lineHeight: '1.2' }}>
              Regulatory Compliance &amp; Application Validation Platform
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
              Project Documentation · AI-Assisted Scrutiny System
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a8a' }}>
            Government of India
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            Ministry of Education
          </div>
        </div>
      </div>

      {/* Main Documentation Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Sticky Quick Links */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          position: 'sticky',
          top: '80px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Quick Links
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'overview', label: '1. Overview' },
              { id: 'features', label: '2. Key Features' },
              { id: 'architecture', label: '3. System Architecture' },
              { id: 'techstack', label: '4. Tech Stack' },
              { id: 'structure', label: '5. Project Structure' },
              { id: 'gettingstarted', label: '6. Getting Started' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  background: activeSection === item.id ? '#eff6ff' : 'transparent',
                  color: activeSection === item.id ? '#2563eb' : '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: activeSection === item.id ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* About this Project Box */}
          <div className="white-card" style={{ marginBottom: 0 }}>
            <div className="white-card-header">
              <span className="white-card-title">About this Project</span>
            </div>
            <div className="white-card-body" style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.7' }}>
              <p style={{ margin: 0 }}>
                This portal is the official regulatory system for <strong>AI-assisted regulatory compliance and application validation for AICTE, Ministry of Education, Government of India</strong>. It streamlines document scrutiny, cross-checks statutory norms against the AICTE Approval Process Handbook (APH 2026–27), authenticates digital signatures and QR codes, validates campus spatial boundaries, and delivers decision support to regulatory scrutiny officers.
              </p>
            </div>
          </div>

          {/* Section 1: Overview */}
          <div id="overview" className="white-card" style={{ marginBottom: 0 }}>
            <div className="white-card-header">
              <span className="white-card-title">1. Overview</span>
            </div>
            <div className="white-card-body" style={{ fontSize: '13px', color: '#334155', lineHeight: '1.7' }}>
              <p style={{ marginBottom: '10px' }}>
                Every year, thousands of technical institutions apply to AICTE for Extension of Approval (EoA), Increase in Intake, or New Program Sanction. The manual scrutiny process requires checking thousands of multi-page legal documents, fire safety clearances, building plans, and land titles.
              </p>
              <p>
                Our platform automates 80% of routine verification using multi-modal AI agents while keeping human scrutiny officers in complete control through Human-In-The-Loop (HITL) review.
              </p>
            </div>
          </div>

          {/* Section 2: Key Features */}
          <div id="features" className="white-card" style={{ marginBottom: 0 }}>
            <div className="white-card-header">
              <span className="white-card-title">2. Key Features</span>
            </div>
            <div className="white-card-body" style={{ fontSize: '13px', color: '#334155' }}>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.6' }}>
                <li><strong>Automated Document OCR &amp; Tamper Detection:</strong> Scans PDF, PNG, and JPG files to detect forgery, seal validity, and text consistency.</li>
                <li><strong>APH 2025-27 Rule Engine:</strong> Automatically parses land, building, faculty-to-student ratio, and financial deposit criteria.</li>
                <li><strong>Human-In-The-Loop (HITL) Adjudication:</strong> Allows officers to confirm findings, annotate documents, and issue deficiency memos with 1-click.</li>
                <li><strong>Immutable Cryptographic Audit Trail:</strong> SHA-256 event log recording every validation check and officer decision.</li>
                <li><strong>Executive Dashboards &amp; Trend Analytics:</strong> Real-time approval rates, regional distribution, and deficiency categorizations.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: System Architecture */}
          <div id="architecture" className="white-card" style={{ marginBottom: 0 }}>
            <div className="white-card-header">
              <span className="white-card-title">3. System Architecture</span>
            </div>
            <div className="white-card-body" style={{ fontSize: '13px', color: '#334155' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#1e3a8a',
                overflowX: 'auto'
              }}>
                [Frontend: React 19 + TypeScript + Recharts] <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼ REST API (JWT Authenticated)<br/>
                [Backend: FastAPI (Python 3.12)] ──► [SQLite3 / PostgreSQL DB]<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──► [Document Extraction Agent (Tesseract OCR / PDFPlumber)]<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──► [Forensic Tamper Detection (Hash &amp; EXIF Analysis)]<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──► [APH 2025-27 Regulatory Rule Engine]
              </div>
            </div>
          </div>

          {/* Section 4: Tech Stack */}
          <div id="techstack" className="white-card" style={{ marginBottom: 0 }}>
            <div className="white-card-header">
              <span className="white-card-title">4. Tech Stack</span>
            </div>
            <div className="white-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '12.5px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#2563eb' }}>Frontend</strong>
                <div style={{ color: '#64748b', marginTop: '4px' }}>React 19, TypeScript, Vite, Recharts, Vanilla CSS</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#2563eb' }}>Backend</strong>
                <div style={{ color: '#64748b', marginTop: '4px' }}>FastAPI, Python 3.12, Uvicorn, SQLAlchemy, Pydantic</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#2563eb' }}>AI &amp; Security</strong>
                <div style={{ color: '#64748b', marginTop: '4px' }}>PyPDF, SHA-256 Ledger, JWT Bearer Auth</div>
              </div>
            </div>
          </div>

          {/* Section 5 & 6: Quick Setup */}
          <div id="gettingstarted" className="white-card" style={{ marginBottom: 0 }}>
            <div className="white-card-header">
              <span className="white-card-title">5. Getting Started</span>
            </div>
            <div className="white-card-body" style={{ fontSize: '13px', color: '#334155' }}>
              <p style={{ marginBottom: '8px' }}>Launch both services easily:</p>
              <pre style={{
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
                lineHeight: '1.5'
              }}>
                <code>
# 1. Run start.bat from repository root<br/>
start.bat<br/><br/>
# Or manually in two terminal tabs:<br/>
cd backend &amp;&amp; .venv\Scripts\uvicorn app.main:app --reload --port 8000<br/>
cd frontend &amp;&amp; npm run dev
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
