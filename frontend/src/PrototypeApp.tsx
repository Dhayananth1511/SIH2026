import React, { useState, useEffect } from 'react';
import PrototypeHeader from './components/PrototypeHeader';
import FeatureNavBar from './components/FeatureNavBar';

import Feature1AcceptApplication from './features/Feature1AcceptApplication';
import Feature2ExtractValidate from './features/Feature2ExtractValidate';
import Feature3MissingInconsistencies from './features/Feature3MissingInconsistencies';
import Feature4DocumentManipulation from './features/Feature4DocumentManipulation';
import Feature5AuthorizedSources from './features/Feature5AuthorizedSources';
import Feature6ConfigurableRules from './features/Feature6ConfigurableRules';
import Feature7EvidenceDashboard from './features/Feature7EvidenceDashboard';
import Feature8AuditHumanReview from './features/Feature8AuditHumanReview';

import {
  getApplications,
  getApplication,
  getDocuments,
  getFindings,
  getCompliance,
  runValidation
} from './api';
import { Application, Document, Finding, ComplianceCheck } from './types';

export default function PrototypeApp() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('APP-2001');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);

  const [activeFeature, setActiveFeature] = useState<number>(1);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch all applications
  const fetchApplicationsList = async () => {
    try {
      const apps = await getApplications();
      setApplications(apps);
      if (apps.length > 0 && !selectedAppId) {
        setSelectedAppId(apps[0].application_id || 'APP-2001');
      }
    } catch (e) {
      console.error('Failed to load applications list', e);
    }
  };

  // 2. Fetch active application details, documents, findings, and compliance checks
  const fetchDossierData = async (appId: string) => {
    if (!appId) return;
    try {
      const [appData, docsData, findingsData, compData] = await Promise.all([
        getApplication(appId),
        getDocuments(appId),
        getFindings(appId),
        getCompliance(appId)
      ]);
      setSelectedApp(appData);
      setDocuments(docsData);
      setFindings(findingsData);
      setComplianceChecks(compData);
    } catch (e) {
      console.error('Failed to load dossier data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationsList();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchDossierData(selectedAppId);
    }
  }, [selectedAppId]);

  const handleSelectApp = (appId: string) => {
    setSelectedAppId(appId);
  };

  const handleRefresh = () => {
    fetchApplicationsList();
    if (selectedAppId) {
      fetchDossierData(selectedAppId);
    }
  };

  const handleRunFullValidation = async () => {
    if (!selectedAppId) return;
    setIsValidating(true);
    try {
      await runValidation(selectedAppId);
      handleRefresh();
      // Navigate to dashboard or next feature
      setActiveFeature(7);
    } catch (e) {
      console.error('Validation error', e);
    } finally {
      setIsValidating(false);
    }
  };

  // Calculate badge counts
  const anomaliesCount = documents.filter(d =>
    d.status === 'flagged' ||
    (d.verification_result || '').includes('ANOMALY') ||
    (d.verification_result || '').includes('TAMPER') ||
    d.extracted_data?.forensic_analysis?.tamper_detected ||
    d.extracted_data?.forensic_analysis?.hash_collision_detected
  ).length;

  const missingMandatoryCount = 5 - Math.min(5, documents.length);
  const discrepanciesCount = findings.filter(f =>
    (f.finding_text || '').toLowerCase().includes('inconsistency') ||
    (f.finding_text || '').toLowerCase().includes('mismatch') ||
    (f.finding_text || '').toLowerCase().includes('missing') ||
    (f.finding_text || '').toLowerCase().includes('shortfall')
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Official AICTE Prototype Header */}
      <PrototypeHeader
        applications={applications}
        selectedApp={selectedApp}
        onSelectApp={handleSelectApp}
        onRunValidation={handleRunFullValidation}
        isValidating={isValidating}
        onRefresh={handleRefresh}
        activeFeature={activeFeature}
      />

      {/* 8-Feature Clean Navigation Bar */}
      <FeatureNavBar
        activeFeature={activeFeature}
        onSelectFeature={setActiveFeature}
        anomaliesCount={anomaliesCount}
        missingCount={discrepanciesCount || missingMandatoryCount}
      />

      {/* Main Workspace Body */}
      <main style={{
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px',
        flex: 1
      }}>
        {loading && !selectedApp ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#1e3a8a', borderRadius: '50%', margin: '0 auto 16px auto' }} />
            <p style={{ fontWeight: '600' }}>Loading AICTE Scrutiny Engine Dossier...</p>
          </div>
        ) : (
          <div>
            {activeFeature === 1 && (
              <Feature1AcceptApplication
                application={selectedApp}
                documents={documents}
                onRefresh={handleRefresh}
                onNext={() => setActiveFeature(2)}
              />
            )}

            {activeFeature === 2 && (
              <Feature2ExtractValidate
                application={selectedApp}
                documents={documents}
                onRefresh={handleRefresh}
                onNext={() => setActiveFeature(3)}
              />
            )}

            {activeFeature === 3 && (
              <Feature3MissingInconsistencies
                application={selectedApp}
                documents={documents}
                findings={findings}
                onNext={() => setActiveFeature(4)}
              />
            )}

            {activeFeature === 4 && (
              <Feature4DocumentManipulation
                application={selectedApp}
                documents={documents}
                findings={findings}
                onNext={() => setActiveFeature(5)}
              />
            )}

            {activeFeature === 5 && (
              <Feature5AuthorizedSources
                application={selectedApp}
                documents={documents}
                onNext={() => setActiveFeature(6)}
              />
            )}

            {activeFeature === 6 && (
              <Feature6ConfigurableRules
                application={selectedApp}
                complianceChecks={complianceChecks}
                onRefresh={handleRefresh}
                onNext={() => setActiveFeature(7)}
              />
            )}

            {activeFeature === 7 && (
              <Feature7EvidenceDashboard
                application={selectedApp}
                documents={documents}
                findings={findings}
                complianceChecks={complianceChecks}
                onNext={() => setActiveFeature(8)}
              />
            )}

            {activeFeature === 8 && (
              <Feature8AuditHumanReview
                application={selectedApp}
                findings={findings}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        )}
      </main>

      {/* Official AICTE Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '16px 24px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        fontSize: '11.5px',
        color: '#64748b'
      }}>
        <div style={{ fontWeight: '600', color: '#0f172a' }}>
          AICTE Regulatory Compliance &amp; Application Validation Platform · Ministry of Education, Government of India
        </div>
        <div style={{ marginTop: '3px', color: '#94a3b8' }}>
          Smart India Hackathon 2026 Prototype · 8 Core Statutory Problem Statement Features
        </div>
      </footer>
    </div>
  );
}
