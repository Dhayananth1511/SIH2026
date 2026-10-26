# VerifyAI — AI-Powered Application Validation, Document Authentication & Regulatory Compliance Platform


[![AICTE / MoE](https://img.shields.io/badge/Initiative-AICTE%20%7C%20Ministry%20of%20Education-1A365D?style=for-the-badge&logo=india)](https://www.aicte-india.org/)
[![SIH Hackathon](https://img.shields.io/badge/Smart%20India%20Hackathon-Problem%20Statement%20Solution-FF9933?style=for-the-badge)](https://sih.gov.in/)
[![Stack](https://img.shields.io/badge/Architecture-React%20%7C%20Node%20%7C%20FastAPI%20%7C%20LangGraph-138808?style=for-the-badge)](https://github.com/)
[![Docker Ready](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED?style=for-the-badge&logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](LICENSE)

---

## Executive Overview

Every academic cycle, the **All India Council for Technical Education (AICTE)** processes tens of thousands of institutional applications for **Extension of Approval (EoA)**, new technical campus approvals, intake variations, and institutional mergers under the mandates of the **AICTE Approval Process Handbook (APH)**.

Scrutinizing millions of physical and scanned pages—land ownership deeds, municipal building approvals, fire safety clearances, structural stability certificates, faculty rolls, and bank guarantees—is an arduous, repetitive, and time-critical operation. AICTE scrutiny committees face persistent operational bottlenecks:
- **Scattered Information & Cross-Document Inconsistencies**: Discrepancies between figures declared in the portal and figures buried across disparate affidavits, survey plans, and municipal certificates.
- **Sophisticated Document Tampering**: Pixel-level date alterations, copied rubber stamps, altered survey plot numbers, forged issuing authority seals, and recycled certificates shared across sister campuses.
- **Verification Latency**: Prolonged delays in manual verification against state revenue portals, universities, and issuing authority databases.
- **Subjective Human Scrutiny & Inconsistent Checklists**: Variability in deficiency interpretation and checklist application across different regional offices.

**VerifyAI** is an enterprise-grade, secure, transparent, and explainable **AI-Decision Support System (DSS)** designed for deep integration into the AICTE National Portal. It automates upstream document validation, performs multi-lingual optical extraction, runs forensic computer-vision manipulation detection, connects with authorized issuing-authority APIs (DigiLocker, State Land Portals, e-Courts, QR Verifiers), and evaluates extracted records against configurable APH regulatory rules—**while rigorously preserving 100% human-in-the-loop statutory scrutiny and sovereign decision-making**.

---

## Table of Contents

1. [Institutional Applicant Workflow](#1-institutional-applicant-workflow)
2. [AICTE Scrutiny Officer & Admin Workflow](#2-aicte-scrutiny-officer--admin-workflow)
3. [VerifyAI Agent Internal Flow (LangGraph Swarm)](#3-verifyai-agent-internal-flow-langgraph-swarm)
4. [Project Development & CI/CD Workflow](#4-project-development--cicd-workflow)
5. [Complete System Architecture](#5-complete-system-architecture)
   - [5a. Architecture Walkthrough & Execution Trace](#5a-architecture-walkthrough--execution-trace)
6. [Multi-Agent Swarm — Agent I/O Specifications](#6-multi-agent-swarm--agent-io-specifications)
7. [Forensic Vision & Manipulation Detection Engine](#7-forensic-vision--manipulation-detection-engine)
8. [Issuing Authority Verification Gateway](#8-issuing-authority-verification-gateway)
9. [Error Handling, Fallback & Retry Strategy](#9-error-handling-fallback--retry-strategy)
10. [Deployment & Infrastructure Topology](#10-deployment--infrastructure-topology)
11. [Security, DPDP Compliance & Statutory Safeguards](#11-security-dpdp-compliance--statutory-safeguards)
12. [Observability, Telemetry & Audit Chains](#12-observability-telemetry--audit-chains)
13. [Functional Execution Scenarios (Simulated Demos)](#13-functional-execution-scenarios-simulated-demos)
14. [Technology Stack](#14-technology-stack)
15. [Modular Project Structure](#15-modular-project-structure)
16. [Local Setup and Execution Guide](#16-local-setup-and-execution-guide)

---

## 1. Institutional Applicant Workflow

Traces the execution path starting from institutional client login, Zod schema validation, multi-document parallel upload, real-time pre-validation checks, AI-guided deficiency rectification, to final submission into the AICTE processing queue.

```mermaid
graph TD
    classDef default fill:#1e1e2e,stroke:#cdd6f4,stroke-width:2px,color:#cdd6f4;
    classDef startEnd fill:#a6e3a1,stroke:#a6e3a1,stroke-width:2px,color:#11111b;
    classDef process fill:#89b4fa,stroke:#89b4fa,stroke-width:2px,color:#11111b;
    classDef agent fill:#f9e2af,stroke:#f9e2af,stroke-width:2px,color:#11111b;
    classDef api fill:#f5c2e7,stroke:#f5c2e7,stroke-width:2px,color:#11111b;
    classDef error fill:#f38ba8,stroke:#f38ba8,stroke-width:2px,color:#11111b;

    Inst([Institution User]):::startEnd --> Auth["Institutional Auth<br/>(Zod + Hook Form + JWT RBAC)"]:::process
    Auth --> AppCategory["Select Application Category<br/>(EoA / New Campus / Intake Variation / Merger)"]:::process
    AppCategory --> UploadCenter["Document Upload Center<br/>(PDF / TIFF / Scanned Docs)"]:::process

    UploadCenter --> FileScanner["Upload Sanitizer<br/>(ClamAV Malware + MIME Validator)"]:::process
    FileScanner --> GatewayRouter["Express API Gateway<br/>(Rate Limiting + Token Validation)"]:::process

    GatewayRouter --> PreCheckEngine["Pre-Validation Dispatcher<br/>(Node.js Service)"]:::process

    %% Parallel Pre-checks
    subgraph PreValidationStage ["Stage 1: Real-Time Instant Document Verification"]
        DocClassifier["Document Classification<br/>(PyMuPDF Layout Heuristics)"]:::agent
        ExpCheck["Expiration Validator<br/>(Fire NOC / Land Lease / Bank Guarantee)"]:::agent
        CompletenessCheck["Mandatory Checklist Filter<br/>(APH Category Matrix)"]:::agent
        QRCheck["Digital Signature & QR Scanner<br/>(PKI / e-District QR Verifier)"]:::agent
    end

    PreCheckEngine --> DocClassifier
    PreCheckEngine --> ExpCheck
    PreCheckEngine --> CompletenessCheck
    PreCheckEngine --> QRCheck

    DocClassifier --> AggregatePreCheck["Aggregate Pre-Check Results"]:::process
    ExpCheck --> AggregatePreCheck
    CompletenessCheck --> AggregatePreCheck
    QRCheck --> AggregatePreCheck

    AggregatePreCheck --> CheckDeficiencies{"Deficiencies or Missing Files Detected?"}:::process

    CheckDeficiencies -->|Yes| RectificationWizard["Self-Rectification Wizard<br/>(Live In-Browser Deficiency Warnings)"]:::error
    RectificationWizard --> PromptReupload["Prompt User: Replace Expired / Missing File"]:::process
    PromptReupload --> UploadCenter

    CheckDeficiencies -->|No| FormalSubmission["Generate Preliminary Verification Token<br/>(SHA-256 Pre-Validation Digest)"]:::process
    FormalSubmission --> SubmitQueue["Enqueue for Deep Scrutiny Swarm<br/>(BullMQ + PostgreSQL Status: PENDING_SCRUTINY)"]:::process
    SubmitQueue --> InstAck([Application Successfully Submitted]):::startEnd
```

---

## 2. AICTE Scrutiny Officer & Admin Workflow

Details role-based access for AICTE Scrutiny Officers, Regional Directors, and Central Administrators to review evidence-linked findings, inspect anomalies, view digital verification sources, and issue statutory decisions.

```mermaid
graph TD
    classDef default fill:#1e1e2e,stroke:#cdd6f4,stroke-width:2px,color:#cdd6f4;
    classDef startEnd fill:#a6e3a1,stroke:#a6e3a1,stroke-width:2px,color:#11111b;
    classDef process fill:#89b4fa,stroke:#89b4fa,stroke-width:2px,color:#11111b;
    classDef officer fill:#f9e2af,stroke:#f9e2af,stroke-width:2px,color:#11111b;
    classDef flag fill:#f38ba8,stroke:#f38ba8,stroke-width:2px,color:#11111b;
    classDef approved fill:#a6e3a1,stroke:#a6e3a1,stroke-width:2px,color:#11111b;

    Officer([AICTE Scrutiny Officer]):::startEnd --> AuthOfficer["Officer Authentication<br/>(MFA + RBAC Token)"]:::process
    AuthOfficer --> OfficerQueue["Assigned Applications Queue<br/>(Sorted by Anomaly Severity & Submission Date)"]:::process

    OfficerQueue --> SelectApp["Open Application Review Workspace"]:::process
    SelectApp --> SplitScreenUI["Split-Screen Evidence Inspector<br/>(Portal Declarations vs Extracted Original PDF)"]:::officer

    subgraph InspectionPanel ["Evidence Inspection & Anomaly Verification"]
        CrossCheckView["Cross-Document Inconsistency View<br/>(Land Deed vs Municipal NOC vs Affidavit)"]:::process
        ForensicViewer["Forensic Image Viewer<br/>(Error Level Analysis Heatmap + Stamp Overlay)"]:::flag
        AuthAPIResult["Issuing Authority Source Log<br/>(DigiLocker / State Revenue / e-Sign Certificate)"]:::process
        APHChecklist["APH 2024-27 Rule Matrix<br/>(SFR Ratio, Carpet Area, Lab Equipment)"]:::process
    end

    SplitScreenUI --> CrossCheckView
    SplitScreenUI --> ForensicViewer
    SplitScreenUI --> AuthAPIResult
    SplitScreenUI --> APHChecklist

    CrossCheckView --> OfficerEvaluation{"Officer Statutory Evaluation"}:::process
    ForensicViewer --> OfficerEvaluation
    AuthAPIResult --> OfficerEvaluation
    APHChecklist --> OfficerEvaluation

    OfficerEvaluation -->|Discrepancies Confirmed| GenMemo["Generate Deficiency Scrutiny Sheet (DSS)<br/>(Evidence-linked memo with APH rule citations)"]:::flag
    OfficerEvaluation -->|Physical Verification Needed| TriggerInspection["Flag for Physical Expert Committee Inspection (EVC)"]:::flag
    OfficerEvaluation -->|All Standards Met| RecommendApproval["Recommend for Approval / EoA Grant"]:::approved

    GenMemo --> CryptographicSign["Officer Digital Sign-Off (e-Sign / PKI)"]:::process
    TriggerInspection --> CryptographicSign
    RecommendApproval --> CryptographicSign

    CryptographicSign --> WriteAudit["Append to Immutable SHA-256 Audit Ledger<br/>(PostgreSQL + Audit Vault)"]:::process
    WriteAudit --> NotifyInstitute["Dispatch Notification to Institution Portal & Email"]:::process
    NotifyInstitute --> EndOfficer([Review Cycle Finalized]):::startEnd
```

---

## 3. VerifyAI Agent Internal Flow (LangGraph Swarm)

Highlights the multi-agent decision graph orchestrated via **LangGraph**, where specialized agents handle layout classification, multilingual OCR extraction, forensic image tampering detection, cross-document correlation, and APH compliance checks.

```mermaid
graph TD
    classDef default fill:#1e1e2e,stroke:#cdd6f4,stroke-width:2px,color:#cdd6f4;
    classDef startEnd fill:#a6e3a1,stroke:#a6e3a1,stroke-width:2px,color:#11111b;
    classDef process fill:#89b4fa,stroke:#89b4fa,stroke-width:2px,color:#11111b;
    classDef agent fill:#f9e2af,stroke:#f9e2af,stroke-width:2px,color:#11111b;
    classDef tool fill:#f5c2e7,stroke:#f5c2e7,stroke-width:2px,color:#11111b;
    classDef error fill:#f38ba8,stroke:#f38ba8,stroke-width:2px,color:#11111b;

    AppPayload([Incoming Application Payload]):::startEnd --> MasterSupervisor["Master Scrutiny Supervisor<br/>(LangGraph Root Node)"]:::agent

    MasterSupervisor --> CategoryRouter["Category Router<br/>(Determines applicable APH Checklist)"]:::process

    %% Stage 1: Document Extraction Swarm
    subgraph ExtractionSwarm ["Phase 1: Deep Ingestion & Forensic Swarm"]
        ParserAgent["Vector Document Parser<br/>(PyMuPDF Structure & Text Extractor)"]:::agent
        OCRAgent["Multilingual OCR Agent<br/>(PaddleOCR: Hindi / Regional / English)"]:::agent
        ForensicAgent["Forensic Vision Agent<br/>(OpenCV: ELA, Stamp Masking, Font Incongruity)"]:::agent
        QRSignatureAgent["Digital Signature & QR Agent<br/>(X.509 PKI & QR Payload Decrypter)"]:::agent
    end

    CategoryRouter --> ParserAgent
    CategoryRouter --> OCRAgent
    CategoryRouter --> ForensicAgent
    CategoryRouter --> QRSignatureAgent

    ParserAgent --> JoinExtracted["State Reducer: Consolidate Document Extractions"]:::process
    OCRAgent --> JoinExtracted
    ForensicAgent --> JoinExtracted
    QRSignatureAgent --> JoinExtracted

    %% Stage 2: Cross-Verification & External Issuing Authority Gateway
    subgraph CrossVerificationSwarm ["Phase 2: Triangulation & External Authority Bridge"]
        CrossDocAgent["Cross-Document Consistency Agent<br/>(Land / Faculty / Building / Intake Matcher)"]:::agent
        IssuingAuthAgent["Issuing Authority Bridge Agent<br/>(DigiLocker, State Bhulekh, e-District Gateway)"]:::agent
    end

    JoinExtracted --> CrossDocAgent
    JoinExtracted --> IssuingAuthAgent

    CrossDocAgent --> AggregateEvidence["Aggregate Evidence Graph"]:::process
    IssuingAuthAgent --> AggregateEvidence

    %% Stage 3: APH Regulatory Rules Engine
    subgraph ComplianceStage ["Phase 3: Regulatory Compliance Verification"]
        APHRulesAgent["Regulatory Compliance Agent<br/>(AICTE APH 2024-27 Norms Matrix)"]:::agent
        LandCalc["Campus Land & Zone Norms Checker"]:::tool
        FacultyCalc["Cadre Ratio & SFR Checker (1:15 / 1:20)"]:::tool
        InfraCalc["Lab Area & Built-Up Area Calculator"]:::tool
    end

    AggregateEvidence --> APHRulesAgent
    APHRulesAgent --> LandCalc
    APHRulesAgent --> FacultyCalc
    APHRulesAgent --> InfraCalc

    LandCalc --> RuleSynthesis["Synthesize Compliance Findings"]:::process
    FacultyCalc --> RuleSynthesis
    InfraCalc --> RuleSynthesis

    RuleSynthesis --> DSSAgent["Explainable DSS Generator Agent<br/>(Generates Bounding Box Visuals & Citation Cards)"]:::agent

    DSSAgent --> CheckAnomalies{"Anomalies or Deficiencies Detected?"}:::process

    CheckAnomalies -->|High Severity Flag| FlagReview["Tag: SUSPECTED_ANOMALY<br/>Route to Senior Scrutiny Committee"]:::error
    CheckAnomalies -->|Deficiencies Detected| FlagDeficiency["Tag: DEFICIENCY_FLAGGED<br/>Draft Rectification Notice"]:::error
    CheckAnomalies -->|All Clear| FlagPassed["Tag: PRE_VALIDATED_CLEAR<br/>Eligible for Streamlined Approval"]:::process

    FlagReview --> StateCommit["Persist Validation Report & Findings to DB"]:::process
    FlagDeficiency --> StateCommit
    FlagPassed --> StateCommit

    StateCommit --> FinalOutput([Return Explainable Verification Dossier]):::startEnd
```

---

## 4. Project Development & CI/CD Workflow

Illustrates the Git feature-branch workflow, automated multi-runtime CI pipelines via GitHub Actions, containerized unit and integration testing, security scanning, and deployment stages.

```mermaid
graph TD
    classDef default fill:#1e1e2e,stroke:#cdd6f4,stroke-width:2px,color:#cdd6f4;
    classDef local fill:#a6e3a1,stroke:#a6e3a1,stroke-width:2px,color:#11111b;
    classDef ci fill:#89b4fa,stroke:#89b4fa,stroke-width:2px,color:#11111b;
    classDef cd fill:#f9e2af,stroke:#f9e2af,stroke-width:2px,color:#11111b;

    subgraph LocalDev ["Local Engineering"]
        GitBranch["Feature Branch (feat/cross-doc-check)"]:::local
        LocalRun["Local Testing (npm test / pytest)"]:::local
        GitCommit["Atomic Commit & Sign-off"]:::local
        GitPush["Push to Remote GitHub Repository"]:::local

        GitBranch --> LocalRun --> GitCommit --> GitPush
    end

    subgraph ActionsCI ["GitHub Actions Automated CI"]
        PRTrigger["Pull Request Triggered"]:::ci
        
        subgraph ParallelChecks ["Parallel Verification Jobs"]
            FE_Lint["Frontend: ESLint + Vitest + Typecheck"]:::ci
            BE_Lint["Backend: ESLint + Jest + Zod Schema Validation"]:::ci
            AI_Tests["AI Service: Pytest + Forensic Vision Algorithm Checks"]:::ci
            Security_Scan["Security: Trivy Container Scan + npm audit + Bandit"]:::ci
        end

        DockerBuild["Multi-Stage Docker Image Compilation"]:::ci
        MergeMain["Merge to Main Branch"]:::ci

        PRTrigger --> FE_Lint
        PRTrigger --> BE_Lint
        PRTrigger --> AI_Tests
        PRTrigger --> Security_Scan

        FE_Lint --> DockerBuild
        BE_Lint --> DockerBuild
        AI_Tests --> DockerBuild
        Security_Scan --> DockerBuild

        DockerBuild --> MergeMain
    end

    subgraph CD_Deployment ["Continuous Deployment & Container Orchestration"]
        DeployTrigger["CD Action Triggered on Main"]:::cd
        RegistryPush["Push Images to Container Registry (GHCR / Docker Hub)"]:::cd
        ComposeDeploy["Docker Compose Deployment on Server"]:::cd
        HealthProbe["Post-Deploy Health Checks (/api/health & /ai/health)"]:::cd
        ProductionReady(["VerifyAI Production Active"]):::cd

        MergeMain --> DeployTrigger --> RegistryPush --> ComposeDeploy --> HealthProbe --> ProductionReady
    end

    GitPush --> PRTrigger
```

---

## 5. Complete System Architecture

Maps the system across functional boundaries: Frontend Client Tier, Node.js Gateway & Orchestrator Tier, Python AI & Forensic Microservice Tier, LangGraph Agent Cluster, External Verification Repositories, and Persistent Storage Vaults.

```mermaid
graph TD
    %% Styling
    classDef default fill:#1e1e2e,stroke:#cdd6f4,stroke-width:2px,color:#cdd6f4;
    classDef frontend fill:#89b4fa,stroke:#89b4fa,stroke-width:2px,color:#11111b;
    classDef backend fill:#a6e3a1,stroke:#a6e3a1,stroke-width:2px,color:#11111b;
    classDef ai fill:#f9e2af,stroke:#f9e2af,stroke-width:2px,color:#11111b;
    classDef db fill:#fab387,stroke:#fab387,stroke-width:2px,color:#11111b;
    classDef ext fill:#f5c2e7,stroke:#f5c2e7,stroke-width:2px,color:#11111b;

    %% Client Tier
    subgraph ClientTier ["1. Frontend Client Tier (React 18 + TypeScript + Vite + Tailwind + shadcn/ui)"]
        UI_Institute["Institution Portal (Upload & Live Pre-check)"]:::frontend
        UI_Officer["Scrutiny Officer Workspace (Side-by-Side Review)"]:::frontend
        UI_Admin["Regional Director Dashboard (Analytics & Overrides)"]:::frontend
        PDFRenderer["React-PDF / PDF.js Engine with Bounding Box SVG Overlays"]:::frontend
        ClientState["TanStack React Query Cache & Zod Client Schemas"]:::frontend
    end

    %% Gateway Tier
    subgraph GatewayTier ["2. Application Gateway & Controller Tier (Node.js + Express + TypeScript)"]
        APIRouter["Express REST API Router"]:::backend
        
        subgraph Middlewares ["Security & Governance Middlewares"]
            RateLimit["Rate Limiter & DDoS Guard"]:::backend
            HelmetShield["Helmet Security Headers & CORS"]:::backend
            JWT_RBAC["JWT & Fine-Grained RBAC Middleware"]:::backend
            ZodValidator["Zod Input / DTO Schema Validator"]:::backend
            AuditInterceptor["SHA-256 Tamper-Evident Audit Interceptor"]:::backend
        end

        TaskManager["Async Queue & Pipeline Manager (BullMQ / In-Memory Worker)"]:::backend
        DocVaultManager["Encrypted File Vault Manager"]:::backend
    end

    %% AI Microservice Tier
    subgraph AIServiceTier ["3. Forensic & Extraction Microservice (Python 3.11 + FastAPI)"]
        FastAPIRouter["FastAPI Async API Gateway"]:::ai
        
        subgraph CoreEngines ["Processing Engines"]
            PyMuPDFEngine["PyMuPDF (Text, Coordinates & Metadata Engine)"]:::ai
            PaddleOCREngine["PaddleOCR Multilingual Engine (Orientation & Deskewing)"]:::ai
            OpenCVForensics["OpenCV Forensic Lab (ELA, Clone & Stamp Masking)"]:::ai
            PKIScanner["PKI Digital Signature & QR Decryptor"]:::ai
        end

        %% LangGraph Agent Swarm
        subgraph LangGraphCluster ["LangGraph Multi-Agent Orchestration Swarm"]
            SupervisorNode["Supervisor Node (State Dispatcher)"]:::ai
            CrossDocNode["Cross-Document Consistency Agent"]:::ai
            APHComplianceNode["APH Regulatory Rule Engine"]:::ai
            DSSReporterNode["Explainable DSS Report Generator"]:::ai
        end
    end

    %% Storage Tier
    subgraph StorageTier ["4. Persistent Storage & Ledger Tier"]
        PostgresDB[(PostgreSQL 16: Relational Records, Findings & Audit Ledger)]:::db
        ObjectStorage[(MinIO / AWS S3: Encrypted Document Repository)]:::db
        Redis[(Redis: Task Queue & Extraction Cache)]:::db
    end

    %% External Repositories Tier
    subgraph ExternalTier ["5. Authorized Verification Repositories (Mock / Official)"]
        DigiLockerAPI["DigiLocker Document Verification Gateway"]:::ext
        StateLandRegistry["State Revenue / Bhulekh Land Records API"]:::ext
        UniversityAffiliation["Affiliating University NOC Portal"]:::ext
        FireSafetyAPI["State Fire Services Clearance API"]:::ext
    end

    %% Connections
    UI_Institute --> ClientState
    UI_Officer --> PDFRenderer
    UI_Officer --> ClientState
    ClientState -->|JSON / Multi-part Uploads| APIRouter

    APIRouter --> RateLimit --> HelmetShield --> JWT_RBAC --> ZodValidator --> AuditInterceptor
    AuditInterceptor --> TaskManager
    TaskManager --> DocVaultManager

    DocVaultManager --> ObjectStorage
    TaskManager --> Redis

    TaskManager -->|Dispatch Scan Jobs| FastAPIRouter
    FastAPIRouter --> CoreEngines
    CoreEngines --> LangGraphCluster

    LangGraphCluster --> ExternalTier
    LangGraphCluster -->|Findings & Bounding Boxes| FastAPIRouter
    FastAPIRouter -->|Structured JSON Dossier| TaskManager

    TaskManager --> PostgresDB
    AuditInterceptor --> PostgresDB
    PostgresDB -->|Status & Dossier Payloads| ClientState
```

---

### 5a. Architecture Walkthrough & Execution Trace

Here is the exact step-by-step sequence diagram when an institution submits a set of approval documents and the system executes extraction, anomaly checks, authority calls, and APH compliance:

```mermaid
sequenceDiagram
    autonumber
    actor Inst as Technical Institution
    participant FE as React Client (Vite)
    participant GW as Node.js Gateway (Express)
    participant S3 as MinIO / Object Store
    participant AI as FastAPI (PyMuPDF + PaddleOCR)
    participant LG as LangGraph Agent Swarm
    participant Auth as External Authority API (DigiLocker)
    participant DB as PostgreSQL 16
    actor Officer as AICTE Scrutiny Officer

    Inst->>FE: Uploads EoA Dossier (Land Deed, Fire NOC, Building Plan, Affidavit)
    FE->>GW: POST /api/applications/validate (multipart/form-data)
    GW->>GW: Zod schema & JWT validation
    GW->>S3: Encrypt & store raw PDF documents
    GW->>DB: Create application record (Status: PROCESSING)
    GW->>AI: Trigger processing pipeline POST /ai/v1/scrutinize {appId, fileUris}

    critical Stage 1: Document Parsing & Forensics
        AI->>AI: PyMuPDF: Extract vector text, page structures, font tables
        AI->>AI: PaddleOCR: Multilingual scan extraction with bounding boxes
        AI->>AI: OpenCV: Compute Error Level Analysis (ELA) for pixel compression anomalies
        AI->>AI: Scan for X.509 PKI signatures and dynamic QR codes
    end

    AI->>LG: Initialize LangGraph State with Extracted Tokens & Forensics
    
    critical Stage 2: LangGraph Orchestration & Cross-Checks
        LG->>LG: CategoryRouter: Load APH 2024-27 norms for category (Engineering Urban)
        LG->>LG: CrossDocAgent: Triangulate Land Acreage (Deed: 2.50 vs Portal: 2.50 vs Affidavit: 2.50)
        LG->>Auth: Query DigiLocker / State Portal for Fire NOC Ref #
        Auth-->>LG: Return Certificate Metadata & Expiry Date
        LG->>LG: APHComplianceNode: Compute Faculty Cadre (1:2:6) and Land Thresholds
        LG->>LG: DSSReporterNode: Compile Explainable Deficiency Dossier with PDF bounding boxes
    end

    LG-->>AI: Completed State & Evidence Dossier
    AI-->>GW: Return Structured JSON Scrutiny Dossier
    GW->>DB: Save Findings, Anomaly Flags & Append SHA-256 Audit Block
    GW->>DB: Update Application Status (Status: READY_FOR_REVIEW)
    GW-->>FE: Stream WebSocket update: Processing Complete

    Officer->>FE: Opens Officer Scrutiny Workspace
    FE->>GW: GET /api/applications/{id}/dossier
    GW-->>FE: Return Dossier + PDF Coordinates + ELA Heatmap
    FE->>Officer: Displays interactive split-screen with highlighted bounding boxes
    Officer->>GW: POST /api/applications/{id}/decide {decision: APPROVE_WITH_REMARKS}
    GW->>DB: Append Officer Signature to Immutable Audit Ledger
    GW-->>FE: Confirmation Ack (Audit Digest SHA-256 generated)
```

---

## 6. Multi-Agent Swarm — Agent I/O Specifications

The LangGraph orchestration swarm distributes specialized verification tasks across discrete, state-bounded agents:

| Agent Name | Primary Responsibility | Input Parameters | Output Products |
| :--- | :--- | :--- | :--- |
| **CategoryRouter** | Identifies application type and loads the appropriate AICTE Handbook checklist. | `application_type`, `institute_category`, `program_list` | `active_aph_checklist`, `mandatory_document_keys` |
| **VectorParserAgent** | Extracts native digital text, bounding boxes, tables, and PDF font metrics. | `raw_pdf_bytes`, `page_indices` | `structured_text_blocks`, `bounding_boxes`, `pdf_metadata` |
| **MultilingualOCRAgent** | Executes optical character recognition on scanned deeds, affidavits, and seals. | `scanned_image_arrays`, `language_hints` (hi, en) | `ocr_tokens`, `word_coordinates`, `confidence_scores` |
| **ForensicVisionAgent** | Detects digital tampering via ELA, copy-move cloning, and seal edge incongruities. | `image_matrices`, `compression_quality=95` | `ela_tamper_score`, `suspicious_bounding_boxes`, `heatmap_png` |
| **CrossDocConsistencyAgent** | Correlates extracted values across separate documents to detect factual contradictions. | `extracted_entities_map`, `portal_declared_fields` | `discrepancy_flags`, `mismatch_deltas`, `evidence_pairs` |
| **IssuingAuthorityAgent** | Queries digital authorities (DigiLocker, State Land Portals, e-District QR). | `doc_ref_no`, `qr_payload`, `authority_type` | `auth_status` *(VERIFIED / MISMATCH / EXPIRED)*, `source_stamp` |
| **APHComplianceAgent** | Evaluates institutional parameters against mathematical AICTE APH regulatory norms. | `total_intake`, `land_area`, `faculty_list`, `built_up_area` | `compliance_pass_fail_map`, `shortfall_amounts`, `aph_clause_citations` |
| **DSSGeneratorAgent** | Synthesizes all findings into an explainable, evidence-backed Deficiency Scrutiny Sheet. | `all_agent_states`, `audit_trace` | `deficiency_memo_pdf`, `officer_action_summary`, `sha256_digest` |

---

## 7. Forensic Vision & Manipulation Detection Engine

VerifyAI incorporates a multi-spectrum forensic computer vision pipeline to protect the regulatory process from altered certificates:

```
                      [ Uploaded Document Image / PDF Page ]
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  [ Error Level Analysis ]     [ Font Incongruity Check ]   [ Seal & Stamp Verifier ]
  • Resaves at 95% quality     • Measures baseline variance • Isolates circular seals
  • Computes pixel diff scale  • Detects mismatched kerning • Checks color distribution
  • Generates high-loss mask   • Flags overlaid font glyphs • Masks duplicate stamp uses
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                                        ▼
                   [ Forensic Fusion & Confidence Scorer ]
                     ├── Green: Natural document compression
                     ├── Orange: Minor artifacting (Scanned reprint)
                     └── Red: Pixel manipulation detected (Date / Number altered)
```

1. **Error Level Analysis (ELA)**:
   - Resaves digital images at a known compression baseline (95%) and evaluates the matrix difference:
     $$\Delta(x, y) = |I_{\text{original}}(x, y) - I_{\text{recompressed}}(x, y)| \times \text{Scale Factor}$$
   - Pixels altered with editing software (Photoshop, Canva, Acrobat Edit) display sharply elevated error levels compared to the original background substrate.
2. **Font & Metadata Forensics**:
   - Analyzes font resource tables embedded inside PDF objects. Flags documents containing multiple embedded subsets for single numerical fields (e.g., date modified from `2023` to `2027`).
   - Parses EXIF and XMP streams to flag modifying software signatures (`CreatorTool: Adobe Photoshop`, mismatched `ModifyDate` vs `CreateDate`).
3. **Cross-Institutional Perceptual Hashing (pHash)**:
   - Generates 64-bit DCT perceptual hashes for submitted building photographs and structural floorplans.
   - Detects if an identical building or computer center photograph has been recycled across multiple distinct institutional applications.

---

## 8. Issuing Authority Verification Gateway

VerifyAI provides automated connectors to authorized digital issuing repositories:

```
                            [ VerifyAI Gateway ]
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   [ DigiLocker API ]        [ State Land Registry ]    [ PKI & Dynamic QR ]
   • Fetches verified        • Queries Land Records     • Decrypts 2D Secure QR
     Building Safety / NOC     (e.g., Bhulekh, AP       • Validates X.509 digital
   • Compares cryptographic    Meebhoomi, TamilNilam)     signatures against CCA
     URI and timestamp       • Confirms survey / khata    India root certs
```

### Verification Status Enumeration
Every document processed receives an unambiguous, auditable status tag:
- `VERIFIED`: Exact match between document data and issuing authority database.
- `MISMATCH_DETECTED`: Authority record located, but critical parameters (name, survey number, validity) differ.
- `EXPIRED`: Document authentic, but current date exceeds statutory validity window.
- `PENDING_SOURCE`: External issuing portal currently unreachable (automatic retry enqueued).
- `SOURCE_UNAVAILABLE`: Document type has no public API; automatically flagged for **Manual Verification Mandatory**.

---

## 9. Error Handling, Fallback & Retry Strategy

VerifyAI implements resilient fault-tolerance patterns across every operational boundary:

```mermaid
graph TD
    classDef default fill:#1e1e2e,stroke:#cdd6f4,stroke-width:2px,color:#cdd6f4;
    classDef process fill:#89b4fa,stroke:#89b4fa,stroke-width:2px,color:#11111b;
    classDef retry fill:#fab387,stroke:#fab387,stroke-width:2px,color:#11111b;
    classDef fallback fill:#f9e2af,stroke:#f9e2af,stroke-width:2px,color:#11111b;
    classDef manual fill:#f38ba8,stroke:#f38ba8,stroke-width:2px,color:#11111b;

    OpRequest[Document Verification Call] --> ExecuteOp[Execute Primary Parser / API]:::process
    ExecuteOp --> CheckResult{Success?}:::process

    CheckResult -->|Yes| FinishOp[Update State & Return]:::process
    CheckResult -->|Transient Failure / Timeout| EvaluateRetry{Retry Count < 3?}:::retry

    EvaluateRetry -->|Yes| ExponentialBackoff[Exponential Backoff: 2s, 4s, 8s]:::retry
    ExponentialBackoff --> ExecuteOp

    EvaluateRetry -->|Exhausted| TriggerFallback[Trigger Secondary Fallback Pipeline]:::fallback

    subgraph FallbackMatrix ["Degradation Fallback Strategy"]
        VectorFail["PyMuPDF Vector Parse Failed ➔ Fallback to PaddleOCR Scan Engine"]:::fallback
        OCRConfidenceLow["OCR Confidence < 70% ➔ Multi-angle Deskew & Contrast Normalization"]:::fallback
        APIUnreachable["External Authority API Offline ➔ Tag as PENDING_SOURCE & Alert Officer"]:::fallback
    end

    TriggerFallback --> VectorFail
    TriggerFallback --> OCRConfidenceLow
    TriggerFallback --> APIUnreachable

    VectorFail --> FallbackEval{Fallback Resolved?}:::process
    OCRConfidenceLow --> FallbackEval
    APIUnreachable --> FallbackEval

    FallbackEval -->|Yes| FinishOp
    FallbackEval -->|Critical Failure| ManualEscalation["Escalate to Manual Review Mandatory Flag<br/>(System never crashes or guesses)"]:::manual
    ManualEscalation --> FinishOp
```

---

## 10. Deployment & Infrastructure Topology

The production architecture is containerized via Docker and deployable across on-premise NIC/AICTE data centers or sovereign cloud providers:

```
                            [ External Traffic: HTTPS:443 ]
                                          │
                                          ▼
                         [ NGINX Reverse Proxy & SSL Term ]
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
 [ Frontend React Static App ]                               [ Backend API Gateway ]
   (Vite Build / NGINX Server)                                (Node.js 20 Express)
   Port: 80 / 5173                                            Port: 5000
                                                                        │
                                       ┌────────────────────────────────┴────────────────┐
                                       ▼                                                 ▼
                          [ AI Microservice Engine ]                            [ Postgres 16 DB ]
                           (Python 3.11 + FastAPI)                              Relational & Audit
                           Port: 8000                                           Port: 5432
                                       │
                                       ├────────────────────────────────┐
                                       ▼                                ▼
                          [ MinIO S3 Object Store ]              [ Redis 7 Cache ]
                           Document Encrypted Vault               Task Queue / PubSub
                           Port: 9000 / 9001                      Port: 6379
```

---

## 11. Security, DPDP Compliance & Statutory Safeguards

### Non-Autonomous Decision-Support Mandate
Under Section 10 of the AICTE Act and the official problem requirements, **VerifyAI does not autonomously reject or approve any application**.
- All AI-generated outputs serve strictly as **advisory decision-support intelligence**.
- Rejections, deficiency notices, and inspection orders require explicit review, written justification, and cryptographic e-Sign sign-off from authorized AICTE officers.

### Data Protection & Cryptographic Audit Trails
- **DPDP Act (2023) Compliance**: PII fields (such as faculty Aadhaar numbers, personal phone numbers, and bank account balances) are masked with SHA-256 salts prior to LLM/agent processing.
- **SHA-256 Tamper-Evident Ledger**: Every state transition generates a cryptographic digest linked to the preceding record:
  $$\text{Block Hash} = \text{SHA-256}\Big(\text{PrevHash} + \text{Timestamp} + \text{AppID} + \text{OfficerID} + \text{Action} + \text{FindingsHash}\Big)$$
  Ensures absolute legal admissibility during statutory appeals, RTI filings, and High Court inquiries.

---

## 12. Observability, Telemetry & Audit Chains

VerifyAI provides comprehensive system telemetry and compliance tracking:
- **Application Processing Timeline**: Real-time Gantt timeline tracking milliseconds spent in OCR, forensics, cross-checking, and authority queries.
- **Confidence Distribution Histograms**: Real-time monitoring of OCR confidence scores across different regional languages and document layouts.
- **Audit Event Inspector**: Searchable, role-filtered log viewer displaying who reviewed which application, what evidence was inspected, and all historical decisions.

---

## 13. Functional Execution Scenarios (Simulated Demos)

### Scenario A: Clean Application (`Case 01 — Urban Engineering EoA`)
- **Institution**: APEX Institute of Technology (New Delhi).
- **Submitted Docs**: Land Deed (2.75 Acres), Fire NOC (Valid to 2026), Municipal Plan, Faculty List (SFR 1:15).
- **VerifyAI Outcome**: 
  - ✅ Land norm satisfied (Min required: 2.50 Acres).
  - ✅ Fire NOC verified via Delhi Fire Service API.
  - ✅ Faculty cadre ratio 1:2:6 perfectly compliant.
  - **Status**: `PRE_VALIDATED_CLEAR` (Eligible for accelerated scrutiny).

### Scenario B: Tampered Fire Safety NOC (`Case 02 — Forgery Flag`)
- **Institution**: Vidya Technical College.
- **Submitted Docs**: Fire NOC purportedly valid until November 2027.
- **VerifyAI Outcome**:
  - 🚨 **ELA Forensics**: High error-level compression box detected precisely around the digit `7` in `2027`.
  - 🚨 **PDF Metadata**: Modified via `Adobe Photoshop 2022` on 14-Oct-2026.
  - 🚨 **Issuing Authority API**: State Fire records show original certificate expired on 14-Nov-2023.
  - **Status**: `SUSPECTED_ANOMALY` (Routed directly to Senior Committee with evidence overlay).

### Scenario C: Cross-Document Acreage Inconsistency (`Case 03 — Contradiction`)
- **Institution**: Green Valley Polytechnic.
- **Submitted Docs**: Portal declares 4.0 Acres. Land Sale Deed Schedule 'A' text extract calculates to 2.8 Acres.
- **VerifyAI Outcome**:
  - ⚠️ **Cross-Document Mismatch**: Portal acreage (4.0) deviates from Deed extracted acreage (2.80) by 1.20 Acres.
  - ⚠️ **Handbook Rule Check**: Rural polytechnic requires 3.0 Acres minimum. True acreage creates 0.20 Acre deficit.
  - **Status**: `DEFICIENCY_FLAGGED` (Auto-drafts Deficiency Scrutiny Memo citing APH Clause 4.1.2).

---

## 14. Technology Stack

VerifyAI is built strictly adhering to the modern, performant, and reliable technology stack specified for enterprise AICTE deployment:

```
├── 1. Frontend Web Client
│   ├── React 18 & TypeScript (Type-safe, component-driven UI architecture)
│   ├── Vite (Next-generation high-speed build tool and dev server)
│   ├── Tailwind CSS (Configured with government-grade design color palettes)
│   ├── shadcn/ui & Radix UI (Accessible, unstyled primitives for tables, modals, tabs)
│   ├── Lucide React (Clean, modern iconography)
│   └── React-PDF / PDF.js (High-fidelity vector canvas PDF rendering with SVG bounding overlays)
│
├── 2. Main Backend Gateway
│   ├── Node.js 20 LTS & Express
│   ├── TypeScript (Shared types across gateway and client DTOs)
│   ├── Zod (Rigorous runtime schema validation for requests and payloads)
│   ├── JWT & Multi-Role RBAC (Institution, Scrutiny Officer, Regional Director, Admin)
│   ├── Multer & ClamAV (Secure multi-part upload handling with virus isolation)
│   └── BullMQ / Redis (Asynchronous background worker orchestration)
│
├── 3. AI & Forensic Microservice
│   ├── Python 3.11 & FastAPI (High-concurrency async processing endpoints)
│   ├── PyMuPDF (fitz) (Direct vector PDF text, page geometry, font-table parser)
│   ├── PaddleOCR (Multilingual Indian script OCR: Hindi, Regional & English)
│   ├── OpenCV & NumPy (Error Level Analysis, clone detection, stamp edge extraction)
│   └── Pillow (Image recompression and matrix manipulation)
│
├── 4. AI Workflow Orchestration
│   ├── LangGraph (Stateful multi-actor agent decision graph and cyclic flows)
│   ├── LLM Provider Adapter (Flexible support for local Ollama/Mistral or sovereign cloud LLMs)
│   └── Prompt Guardrails (Strict zero-hallucination regulatory citation filters)
│
├── 5. Database & Storage Vault
│   ├── PostgreSQL 16 (Relational schemas, application states & immutable audit trail)
│   ├── SQLAlchemy 2.0 & Alembic (Python ORM & automated database migrations)
│   └── MinIO / AWS S3 (Private, encrypted S3-compatible document storage)
│
└── 6. DevOps & Quality Assurance
    ├── Docker & Docker Compose (One-command orchestration across all services)
    ├── GitHub Actions (Continuous Integration linting, security scans, unit tests)
    ├── Pytest (FastAPI route tests, OCR evaluation & forensic algorithm benchmarks)
    └── Vitest & React Testing Library (Frontend UI component and store testing)
```

---

## 15. Modular Project Structure

```
aicte-verifyai/
├── .github/
│   └── workflows/
│       ├── ci-backend.yml              # Node.js build, lint & unit tests
│       ├── ci-ai-service.yml           # Pytest suite & forensic benchmarks
│       └── ci-frontend.yml             # Vite build & Vitest test suites
├── docker-compose.yml                  # Complete multi-service orchestration
├── .env.example                        # Unified environment configuration
│
├── apps/
│   ├── frontend/                       # React 18 + TypeScript + Vite Client
│   │   ├── src/
│   │   │   ├── assets/                 # Emblems, AICTE branding & icons
│   │   │   ├── components/
│   │   │   │   ├── audit/              # Cryptographic timeline & log viewer
│   │   │   │   ├── dashboard/          # Summary metrics, status charts
│   │   │   │   ├── inspection/         # Split-screen PDF viewer with bounding boxes
│   │   │   │   ├── ui/                 # shadcn/ui primitives
│   │   │   │   └── upload/             # Multi-file upload with instant pre-validation
│   │   │   ├── hooks/                  # Custom React hooks (useApplication, useDossier)
│   │   │   ├── layouts/                # Portal and Officer dashboard layouts
│   │   │   ├── pages/                  # Route pages (Login, ReviewWorkspace, Analytics)
│   │   │   └── services/               # Axios/Fetch client with interceptors
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── vite.config.ts
│   │
│   ├── backend/                        # Node.js + Express + TypeScript Gateway
│   │   ├── src/
│   │   │   ├── config/                 # Environment, Postgres & S3 connectors
│   │   │   ├── controllers/            # Route controllers (auth, apps, review, audit)
│   │   │   ├── middlewares/            # RBAC, Zod validator, audit interceptor
│   │   │   ├── models/                 # Database interfaces and DTOs
│   │   │   ├── routes/                 # REST endpoints (/api/v1/applications, etc.)
│   │   │   └── utils/                  # SHA-256 cryptographic chain helpers
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ai-service/                     # Python 3.11 + FastAPI Microservice
│       ├── app/
│       │   ├── api/                    # FastAPI routes (/v1/scrutinize, /v1/forensics)
│       │   ├── core/                   # App configs and security models
│       │   ├── forensica/              # ELA, metadata, clone detection algorithms
│       │   ├── ocr/                    # PyMuPDF parser & PaddleOCR pipelines
│       │   ├── rules/                  # Configurable APH 2024-27 rule matrices
│       │   ├── workflows/              # LangGraph multi-agent decision state graph
│       │   └── main.py                 # FastAPI application root
│       ├── tests/                      # Pytest suite with sample synthetic documents
│       ├── requirements.txt
│       └── Dockerfile
│
├── data/
│   ├── rules/
│   │   └── aicte_aph_2024_27.json      # Machine-readable AICTE handbook thresholds
│   └── sample_datasets/                # Curated evaluation dossiers
│       ├── 01_valid_engineering_eoa/
│       ├── 02_forged_fire_noc/
│       └── 03_mismatched_land_deed/
│
└── docs/
    ├── ARCHITECTURE.md                 # System specifications & sequence traces
    ├── COMPLIANCE_MATRIX.md            # Mapping to AICTE Approval Process Handbook
    └── API_REFERENCE.md                # OpenAPI / Swagger specification
```

---

## 16. Local Setup and Execution Guide

### Prerequisites
- **Docker & Docker Compose** (v24+ recommended)
- Or for bare-metal setup: **Node.js 20 LTS**, **Python 3.11**, **PostgreSQL 16**, and **MinIO / Redis**

---

### Method A: One-Command Docker Compose (Fastest & Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/aicte-verifyai.git
   cd aicte-verifyai
   ```

2. **Initialize Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Build and launch the complete multi-service stack**:
   ```bash
   docker compose up --build -d
   ```

4. **Verify Running Services**:
   ```bash
   docker compose ps
   ```

5. **Access Application Interfaces**:
   - 🖥️ **VerifyAI Web Portal**: [http://localhost:5173](http://localhost:5173)
   - 🌐 **Node.js Gateway Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - 🧠 **FastAPI AI Docs & Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - 🗄️ **MinIO Object Console**: [http://localhost:9001](http://localhost:9001) *(User: `minioadmin` / Pass: `minioadmin`)*

---

### Method B: Manual Bare-Metal Developer Setup

#### Step 1: Start PostgreSQL and Redis
Ensure PostgreSQL is running locally on port `5432` with a database named `verifyai`, and Redis on port `6379`.

#### Step 2: Launch the AI & Document Processing Microservice (Python)
```bash
cd apps/ai-service

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Step 3: Launch the Main Backend Gateway (Node.js)
```bash
cd apps/backend

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start Node.js API development server
npm run dev
```

#### Step 4: Launch the Frontend Web Application (React + Vite)
```bash
cd apps/frontend

# Install dependencies
npm install

# Start Vite hot-reloading development server
npm run dev
```

---

### Running Automated Test Suites

```bash
# 1. Run Python AI, OCR & Forensic tests:
cd apps/ai-service
pytest tests/ -v

# 2. Run Backend Gateway unit and integration tests:
cd apps/backend
npm test

# 3. Run Frontend unit and component tests:
cd apps/frontend
npm run test
```

---

## 👥 The Team & Hackathon Contribution

Developed with ❤️ for the **Smart India Hackathon (SIH)** under the auspices of the **AICTE Innovation Cell**, Ministry of Education, Government of India.

*Engineered to uphold the sanctity of technical education in India through trustworthy, explainable, and responsible artificial intelligence.*

---

## 📄 License & Attribution

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.  
All regulatory checklists and Approval Process Handbook (APH) citations are intellectual property of the **All India Council for Technical Education (AICTE)**.
