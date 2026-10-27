# AICTE Application Validation and Regulatory Compliance Platform

> **AI-assisted decision support for preliminary validation, document authentication and configurable compliance checking of technical-institution applications.**

![Status](https://img.shields.io/badge/status-prototype-orange)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-blue)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791)
![Data](https://img.shields.io/badge/data-synthetic%20only-lightgrey)

> **DEMO ENVIRONMENT. SYNTHETIC DATA ONLY.**
> This is a Smart India Hackathon (SIH) prototype. It is not an official AICTE system, is not connected to any restricted AICTE database, and does not make regulatory decisions. All sample institutions, documents and verification responses are synthetic.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Key Features](#3-key-features)
4. [System Architecture](#4-system-architecture)
5. [Tech Stack](#5-tech-stack)
6. [Project Structure](#6-project-structure)
7. [Getting Started](#7-getting-started)
8. [Configuration](#8-configuration)
9. [Roles and Permissions](#9-roles-and-permissions)
10. [Validation Workflow](#10-validation-workflow)
11. [Compliance Rules Engine](#11-compliance-rules-engine)
12. [Issuer Verification](#12-issuer-verification)
13. [Multi-Agent Layer (LangGraph) & Human-in-the-Loop (HITL) Governance](#13-multi-agent-layer-langgraph--human-in-the-loop-hitl-governance)
14. [Demo Dataset and Test Scenarios](#14-demo-dataset-and-test-scenarios)
15. [API Documentation](#15-api-documentation)
16. [Testing and Evaluation](#16-testing-and-evaluation)
17. [Security and Auditability](#17-security-and-auditability)
18. [Deployment](#18-deployment)
19. [Roadmap](#19-roadmap)
20. [Known Limitations](#20-known-limitations)
21. [Contributing](#21-contributing)
22. [Team](#22-team)
23. [License and Disclaimer](#23-license-and-disclaimer)

---

## 1. Overview

The All India Council for Technical Education (AICTE) processes applications from technical institutions for Extension of Approval (EoA) and related changes. Manual scrutiny of the volume and variety of supporting documents is slow, repetitive and error-prone.

This platform is a **decision-support layer** that performs preliminary checks at the earliest stage:

- Validates application fields and supporting documents against configurable rules.
- Extracts data from documents using OCR and structured extraction.
- Flags missing, expired, duplicate and inconsistent information.
- Raises **preliminary** anomaly indicators for human verification.
- Verifies documents through issuing-authority adapters (simulated in this demo).
- Presents evidence-linked findings on a dashboard with a full audit trail.

> **Principle:** AI outputs are advisory. Statutory scrutiny, physical inspection and final regulatory decisions remain with the competent AICTE authorities. A missing document is a *validation finding*; a suspicious document is an *anomaly indicator*. Neither is a finding of fraud or a final rejection.

---

## 2. Problem Statement

**Title:** AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification
**Organization:** AICTE, Ministry of Education, Government of India

### Objectives

- Identify missing, incomplete, expired or inconsistent information and documents at the application stage.
- Reduce repeated manual checking by reusing authorized institutional records.
- Detect potential document alterations, duplication and anomalies.
- Verify documents via issuing-authority portals, APIs, QR codes or digital signatures where authorized.
- Assist in checking infrastructure evidence against configurable requirements.
- Provide transparent, traceable and explainable validation results.

### Capabilities demonstrated by this prototype

| # | Required capability | Where in the platform |
|---|---------------------|-----------------------|
| 1 | Accept a sample application and supporting documents | Application intake |
| 2 | Extract and validate information | OCR and extraction pipeline |
| 3 | Identify missing documents and inconsistencies | Validation engine |
| 4 | Flag potential document manipulation | Anomaly analysis |
| 5 | Verify documents via authorized sources (where feasible) | Issuer verification adapters |
| 6 | Check against configurable compliance rules | Compliance engine |
| 7 | Display evidence-backed results | Dashboard and application detail |
| 8 | Audit trail and human review before adverse action | Audit service and review workspace |

---

## 3. Key Features

| Module | Description |
|--------|-------------|
| **Application intake** | Upload an application and multiple PDF/image documents with type, size and content validation |
| **OCR and extraction** | Embedded-PDF text and OCR for scans; fields returned with confidence and document/page references |
| **Completeness checks** | Missing, unreadable, incomplete and expired documents |
| **Consistency checks** | Cross-document comparison of names, institution IDs, certificate numbers and dates |
| **Anomaly indicators** | SHA-256 duplicate detection, PDF metadata checks, image consistency checks |
| **Issuer verification** | Common adapter interface with statuses: verified, mismatch, expired, pending, source unavailable, manual review |
| **Compliance engine** | Versioned, configurable rules per application category with evidence-linked results |
| **Infrastructure review** | Flags photos/plans needing additional evidence or physical inspection |
| **Dashboard** | Application status, deficiencies, verification results, review queues |
| **Human review** | Confirm, dismiss or escalate findings with a mandatory reason |
| **Audit trail** | Append-only log of actor, rule version, evidence, source response and outcome |

---

## 4. System Architecture

The platform is a **modular monolith**: easier to build, test and demonstrate than microservices.

```mermaid
graph TB
    subgraph Presentation["Presentation Layer (Client)"]
        Frontend["React + TypeScript Frontend<br/>(Vite · Tailwind CSS · shadcn/ui)"]
        Portal["Institution Portal"]
        Dashboard["Admin Dashboard"]
        Reviewer["Reviewer Workspace"]
        Frontend --- Portal
        Frontend --- Dashboard
        Frontend --- Reviewer
    end

    subgraph BackendGateway["API Gateway & Orchestration (FastAPI)"]
        API["FastAPI REST Backend<br/>(JWT Auth · RBAC · Pydantic Validation)"]
        Orchestrator["Validation Orchestrator"]
        LangGraph["LangGraph Multi-Agent Orchestrator<br/>(StateGraph Workflow & Supervised Triage)"]
        API --> Orchestrator
        Orchestrator --> LangGraph

        subgraph CoreEngines["Core Processing & Compliance Engines"]
            DocEngine["Document Engine<br/>• OCR (PaddleOCR / Tesseract)<br/>• PyMuPDF Text Extraction<br/>• SHA-256 Deduplication"]
            RulesEngine["Rules Engine (Versioned)<br/>• Category Checklists<br/>• Expiry Validation<br/>• Cross-Document Consistency"]
            IssuerAdapters["Verification Adapters<br/>• State & Agency APIs<br/>• QR & Digital Signatures<br/>• Simulated Issuers (Demo)"]
            AuditService["Audit Service<br/>• Append-Only Event Log<br/>• Cryptographic Hash Chaining"]
        end

        LangGraph --> DocEngine
        LangGraph --> RulesEngine
        LangGraph --> IssuerAdapters
        LangGraph --> AuditService
    end

    subgraph StorageLayer["Data & Persistence Layer"]
        Postgres[("PostgreSQL Database<br/>• Structured Application Data<br/>• Compliance Rules<br/>• Validation Findings & Audit Records")]
        FileStore[("Private File Storage<br/>• Encrypted Uploads<br/>• Evidence Documents & Images")]
    end

    Frontend -->|"REST (JWT)"| API
    AuditService --> Postgres
    RulesEngine --> Postgres
    DocEngine --> FileStore
    DocEngine --> Postgres
    IssuerAdapters --> Postgres
```

**Design notes**

- The database separates the *original application*, the *extracted information* and the *findings of each validation run*, so a result can be reproduced after a rule change.
- Deterministic logic (rules, hashing, expiry, cross-checks) is authoritative. AI assists with extraction, classification and explanation.
- Antigravity is the development environment, not the application runtime.

---

## 5. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI-assisted development | Google Antigravity | Generate, edit, test and debug the application |
| Frontend | React, TypeScript, Vite | Upload, dashboards, review screens |
| UI | Tailwind CSS, shadcn/ui | Responsive government-enterprise interface |
| Charts | Recharts | Statistics and validation metrics |
| Backend | Python, FastAPI | REST APIs and orchestration |
| Validation | Pydantic | Request/response schemas |
| Database | PostgreSQL | Applications, rules, findings, audit records |
| ORM / migrations | SQLAlchemy, Alembic | Data access and schema versioning |
| Authentication | JWT, Argon2 | Secure login and password storage |
| Authorization | RBAC | Role-specific permissions |
| Storage | Local (demo), S3-compatible private storage (deployment) | Uploaded evidence |
| OCR | PaddleOCR or Tesseract | Text from scans and images |
| PDF processing | PyMuPDF, pypdf | Text, metadata, page info |
| Image analysis | OpenCV, Pillow | Suspicious-region indicators |
| AI extraction (optional) | Structured-output LLM API with rule-based fallback | Fields into validated JSON |
| Semantic retrieval (optional) | Sentence Transformers, FAISS | Search approved regulatory documents |
| Agent orchestration | LangGraph | Multi-agent decision-support and validation workflow |
| Background jobs (optional) | Celery, Redis | Asynchronous processing |
| Testing | Pytest, HTTPX, Vitest | Backend and frontend tests |
| Deployment | Docker, Docker Compose | Reproducible environment |
| CI/CD | GitHub Actions | Automated tests and builds |

**Core stack:** React, TypeScript, Tailwind, FastAPI, LangGraph (Multi-Agent Workflow), PostgreSQL, SQLAlchemy, PyMuPDF, PaddleOCR, OpenCV, RBAC and audit logs. Runs locally without paid AI APIs.

---

## 6. Project Structure

```
AICTE-Validation-Platform/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/            # route handlers
│   │   ├── core/           # config, security, dependencies
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # business logic, OCR, extraction
│   │   ├── validators/     # completeness, expiry, consistency
│   │   ├── verifiers/      # issuer verification adapters
│   │   ├── workflows/      # LangGraph multi-agent decision workflows
│   │   └── audit/          # audit event service
│   ├── tests/
│   └── requirements.txt
├── sample_data/
│   ├── applications/
│   ├── documents/
│   └── expected_results/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+ and npm
- PostgreSQL 15+ (or Docker)
- Docker and Docker Compose (recommended)
- Git

### Option A: Docker Compose (recommended)

```bash
git clone https://github.com/<your-username>/AICTE-Validation-Platform.git
cd AICTE-Validation-Platform
cp .env.example .env        # edit values before running
docker compose up --build
```

### Option B: Run locally

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head               # run migrations
python -m app.seed                 # load synthetic demo data
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

> The commands above reflect the intended project layout. Adjust module names (for example the seed command) to match your implementation.

---

## 8. Configuration

Copy `.env.example` to `.env`. **Never commit `.env`.**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://user:pass@localhost:5432/aicte` |
| `SECRET_KEY` | JWT signing secret | *(generate a long random value)* |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `30` |
| `UPLOAD_DIR` | Private upload directory | `./storage/uploads` |
| `MAX_UPLOAD_MB` | Per-file size limit | `10` |
| `MAX_PDF_PAGES` | Page limit per document | `50` |
| `OCR_ENGINE` | `paddleocr` or `tesseract` | `paddleocr` |
| `LLM_API_KEY` | Optional, for AI extraction | *(empty to disable)* |
| `RETENTION_DAYS` | Document retention period | `365` |

---

## 9. Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Institution user** | Create applications, upload evidence, rectify permitted deficiencies |
| **Verification officer** | Inspect extracted data, run checks, review issuer responses |
| **Compliance reviewer** | Review regulatory findings and infrastructure evidence |
| **Administrator** | Manage users, roles, checklists and rules |
| **Auditor** | Read-only access to audit history and evidence |

Permissions are enforced **server-side**, with institution-level data isolation. The UI only mirrors them. Demo accounts are seeded for each role; see `sample_data/` for credentials. These are for demonstration only.

---

## 10. Validation Workflow

```mermaid
flowchart TD
    Start(["1. Upload Application & Supporting Documents"]) --> Intake["2. Document Intake & Pre-Validation<br/>(MIME, Size & SHA-256 Hashing)"]
    
    Intake --> Extraction["3. OCR & Structured Field Extraction<br/>(PaddleOCR / Tesseract + PyMuPDF)"]
    
    Extraction --> ValChecks{"4. Preliminary Validation"}
    ValChecks -->|"Completeness"| C1["Check Missing Documents"]
    ValChecks -->|"Validity"| C2["Check Expiry & Validity Dates"]
    ValChecks -->|"Consistency"| C3["Cross-Document Consistency Checks"]
    
    C1 & C2 & C3 --> Anomaly["5. Anomaly & Forensic Indicators<br/>(Metadata, Duplicate Hashes & Compression)"]
    
    Anomaly --> Issuer["6. Issuer Verification Adapters<br/>(Simulated & Live Verification / QR)"]
    
    Issuer --> Compliance["7. Compliance Rules Engine<br/>(Versioned APH Regulatory Evaluation)"]
    
    Compliance --> Report["8. Aggregated Validation Report<br/>(Evidence-Linked Dashboard Dossier)"]
    
    Report --> HumanReview{"9. Human Review & Decision"}
    HumanReview -->|"Confirm Deficiency"| Notice["Issue Rectification Notice / Memo"]
    HumanReview -->|"Confirm Anomaly"| Escalate["Escalate to AICTE Scrutiny Committee"]
    HumanReview -->|"Verified / Dismiss"| Approve["Proceed to Statutory Decision"]
    
    HumanReview -.->|"Actor, Reason & Timestamp"| Audit[("Append-Only Audit Trail<br/>(Updated at every step)")]
```

### Finding structure

Every finding includes a reason, severity, evidence reference, affected field and suggested next step.

```json
{
  "application_id": "APP-1004",
  "rule_id": "DEMO-CROSSCHECK-001",
  "status": "mismatch_detected",
  "severity": "high",
  "finding": "Institution identifier differs across records",
  "evidence": [
    { "document": "application.pdf", "page": 1, "field": "institution_id", "value": "SYNTH-100" },
    { "document": "certificate.pdf", "page": 1, "field": "institution_id", "value": "SYNTH-200" }
  ],
  "requires_human_review": true,
  "final_regulatory_decision": null
}
```

An **extraction failure** is reported separately from a **genuine mismatch**.

---

## 11. Compliance Rules Engine

- Application-category-specific checklists.
- Rules have a unique ID, description, version, effective date, severity and required evidence.
- Supported checks: required documents, expiry, cross-field consistency, comparison with synthetic institutional records.
- Result states: `pass`, `fail`, `warning`, `not_applicable`, `unable_to_evaluate`.
- Each finding links to the rule version, evidence, extracted values and an explanation.

> **Important:** All bundled rules are labelled **prototype/demo rules**. No unverified AICTE regulation is hardcoded as official. Rules are stored separately so they can be replaced with verified, authorized rules from the applicable Approval Process Handbook.

---

## 12. Issuer Verification

A common adapter interface supports multiple sources:

| Adapter | Status |
|---------|--------|
| Simulated issuer (synthetic records) | Implemented for demo, **clearly labelled** |
| Authorized issuer API | Designed, requires authorized access |
| Official portal / digital repository | Designed, requires authorization |
| QR code verification | Designed |
| Digital signature validation | Designed |

**Statuses:** `verified`, `mismatch_detected`, `expired`, `verification_pending`, `source_unavailable`, `manual_review_required`.

Each attempt records the source, timestamp, response reference and result. An unavailable or inconclusive source produces a pending or manual-review status, never a false verification.

> Simulated results do **not** represent verification of real government records. The platform does not scrape restricted portals or bypass access controls.

---

## 13. Multi-Agent Layer (LangGraph) & Human-in-the-Loop (HITL) Governance

> **Full Specification:** See dedicated [AGENT_WORKFLOW.md](file:///d:/BIT/Dhaya/Sih/AGENT_WORKFLOW.md) and [plan.md](file:///d:/BIT/Dhaya/Sih/plan.md) for complete mathematical schemas, state types, and regulatory decision matrices.

The platform integrates a controlled LangGraph multi-agent orchestration layer coordinating specialized verification stages on top of the deterministic core. Crucially, **AI agents operate strictly in an advisory capacity**; all statutory actions require mandatory, authenticated Human-in-the-Loop approval.

```mermaid
flowchart LR
    Start([Application Submitted]) --> DocIntel["Document Intelligence<br/>(OCR & Structured Extraction)"]
    DocIntel --> AnomalyNode["Anomaly Analysis<br/>(Duplicates, Metadata & Tampering)"]
    AnomalyNode --> IssuerNode["Issuer Verification<br/>(External & Simulated Adapters)"]
    IssuerNode --> CompNode["Compliance Analysis<br/>(Versioned Regulatory Rules)"]
    CompNode --> Aggregator["Result Aggregator<br/>(Merge Findings & Separate AI Observations)"]
    Aggregator --> HumanGate{{"Human-in-the-Loop Review<br/>(Mandatory Reasoned Decision)"}}
    HumanGate --> End([Final Validation Outcome])
    
    DocIntel -.-> Audit[("Audit Trail")]
    AnomalyNode -.-> Audit
    IssuerNode -.-> Audit
    CompNode -.-> Audit
    Aggregator -.-> Audit
    HumanGate -.-> Audit
```

### Specialized Verification Agents

| Node | Responsibility | Output Type |
|------|----------------|-------------|
| **Document Intelligence Agent** | PDF parsing, multi-lingual OCR, table extraction, bounding-box coordinate mapping | Structured Canonical JSON with Page/Box Refs |
| **Forensic Anomaly Agent** | Cryptographic SHA-256 hash duplication, internal metadata vs issued date mismatch, compression artifacts | Anomaly Indicators (`ANOMALY_INDICATOR_UNCONFIRMED`) |
| **Issuer Verification Agent** | Queries state land records, fire safety directorates, university affiliation APIs | Verification Status (`verified`, `mismatch`, `pending`) |
| **Compliance Analysis Agent** | Deterministic evaluation of Approval Process Handbook (APH 2026-27) clauses | Rule Evaluation (`pass`, `deficiency`, `warning`) |
| **Result Aggregator Agent** | Merges agent findings, deduplicates flags, computes Scrutiny Readiness Index | Consolidated Evidence-Linked Scrutiny Dossier |

### Statutory Human-in-the-Loop (HITL) Approval Process

Under administrative law principles (Principles of Natural Justice), an automated algorithm cannot withhold Extension of Approval (EoA) or penalize an applicant institution. The platform implements a **Strict Human-in-the-Loop Gate**:

1. **Evidence-Linked Dossier Review**: The Scrutiny Officer inspects extracted metrics side-by-side with original document scans and highlighted OCR bounding boxes.
2. **Four-Way Decision Authority**:
   - **Confirm Deficiency**: Officer validates the AI finding and generates a formal **Deficiency Memo (Form AICTE-DEF-2026)** with a statutory 7-day cure window.
   - **Officer Override with Justification**: Officer dismisses an AI flag (e.g., recognizing a valid state government exemption). The officer **must provide a mandatory written statutory justification**, permanently sealed in the audit log.
   - **Escalate to Standing Scrutiny Committee (SSC)**: For potential forensic tampering or fraudulent certificates requiring an institutional hearing.
   - **Provisional Scrutiny Clearance**: When all mandatory APH norms are verified, granting progression to statutory approval.
3. **Dual-Custody Governance**: High-impact adverse actions require two-officer digital sign-off (Scrutiny Officer + Regional Officer).
4. **Immutable Append-Only Audit Trail**: Every agent tool execution, confidence score, officer review action, override note, and digital signature is cryptographically chained and timestamped.

### Agent Guardrails & Safety Constraints

- **Advisory Only**: Agents cannot approve or reject applications, alter rules, or grant permissions.
- **Zero Instruction Injection**: Uploaded PDFs and images are treated strictly as untrusted binary data; document contents cannot manipulate prompt contexts.
- **Deterministic Precedence**: Hardcoded statutory arithmetic (e.g., built-up area thresholds) takes absolute precedence over probabilistic LLM outputs.
- **Auditability**: Every agent execution is stamped with run ID, node version, execution latency, and input/output hash proofs.

---

## 14. Demo Dataset and Test Scenarios

All records are synthetic.

| Sample | Condition | Expected output |
|--------|-----------|-----------------|
| APP-1001 | All documents present and consistent | Pass on configured demo checks |
| APP-1002 | Required NOC missing | Missing-document finding |
| APP-1003 | Certificate past expiry date | Expired-document finding |
| APP-1004 | Different institution ID across documents | Cross-document mismatch |
| APP-1005 | Same document uploaded twice | Duplicate indicator |
| APP-1006 | Altered date or visible region | Potential anomaly for review |
| APP-1007 | Certificate matches synthetic issuer record | Simulated verification match |
| APP-1008 | Issuer service unavailable | Source unavailable / manual review |
| APP-1009 | Insufficient infrastructure evidence | Additional evidence or inspection review |

For anomaly demonstration, use the paired original and deliberately altered synthetic certificate. A visual or metadata anomaly is **not** proof of forgery.

---

## 15. API Documentation

Interactive documentation is available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

Illustrative endpoint groups (final routes may differ):

| Group | Examples |
|-------|----------|
| Auth | `POST /auth/login` |
| Applications | `GET/POST /applications`, `GET /applications/{id}` |
| Documents | `POST /applications/{id}/documents` |
| Validation | `POST /applications/{id}/validate`, `GET /validation-runs/{id}` |
| Findings | `GET /applications/{id}/findings` |
| Verification | `POST /documents/{id}/verify` |
| Reviews | `POST /findings/{id}/review` |
| Rules | `GET/POST /rules` (admin only) |
| Audit | `GET /audit-events` |
| Agent Workflows | `POST /workflows/start`, `GET /workflows/{run_id}` |

---

## 16. Testing and Evaluation

### Run tests

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm run test
```

### Scenarios covered

Complete application, missing document, expired certificate, identifier mismatch, duplicate upload, altered synthetic document, simulated verification match, unavailable issuer, rule-linked finding, cross-institution access denial, and reviewer resolution appearing in the audit trail.

### Evaluation metrics

| Metric | Method |
|--------|--------|
| OCR / field extraction accuracy | Compare against labelled ground truth |
| Missing-document detection | Detected vs. expected missing items |
| Consistency detection | Correct identification of seeded mismatches |
| Anomaly detection | Precision and recall on deliberately created anomalies |
| Issuer verification | Correct outcomes for match, mismatch, unavailable |
| Processing time | Per application and per document |
| Review traceability | Every decision has actor, reason and timestamp |

> Report actual results from the evaluation script, including false positives and failures. Do not publish fabricated accuracy figures.

**Latest results:** _to be added after running the evaluation script._

---

## 17. Security and Auditability

- Argon2 password hashing; expiring JWT access tokens.
- Server-side RBAC and institution-level data isolation.
- File type, size and content validation; safe filenames; private storage with no public file URLs.
- Secrets in environment variables only.
- Parameterized database access and safe error messages.
- Rate limiting on authentication and expensive endpoints.
- Append-only audit events for uploads, validation runs, rule changes, issuer checks and reviewer actions.
- Configurable retention and secure deletion.

> Application-level audit logs are **not** claimed to be tamper-proof without a separate, tested integrity mechanism.

**For production** also consider encryption in transit and at rest, malware scanning, backups, secret rotation, monitoring and a formal security review.

---

## 18. Deployment

1. Run `docker compose up --build` for frontend, FastAPI and PostgreSQL.
2. Configure GitHub Actions to run backend and frontend tests on every push.
3. Keep synthetic demo files separate from production configuration.
4. Verify no secrets or sensitive documents are committed.
5. For real deployment, use private S3-compatible storage and follow AICTE authorization policies for any integration.

---

## 19. Roadmap

- [ ] Backend foundation: models, auth, RBAC, upload APIs
- [ ] OCR, extraction and document validation pipeline
- [ ] Compliance rules engine with versioning
- [ ] Simulated issuer verification adapter
- [ ] React dashboard, application detail and review workspace
- [ ] Security and audit pass
- [ ] End-to-end tests and evaluation script
- [x] LangGraph multi-agent orchestration layer
- [ ] RAG over approved regulatory documents
- [ ] QR and digital-signature verification adapters
- [ ] Background processing with Celery and Redis

---

## 20. Known Limitations

- Runs on synthetic data; no integration with real AICTE systems.
- Issuer verification is simulated.
- Rules are prototype rules, not official regulations.
- Anomaly detection gives preliminary indicators, not proof of forgery.
- Computer-vision infrastructure checks are advisory and limited in accuracy.
- Audit log integrity is application-level only.

---

## 21. Contributing

1. Fork the repository and create a feature branch.
2. Make changes with tests.
3. Run the full test suite.
4. Open a pull request describing the change.

---

## 22. Team

| Name | Role |
|------|------|
| _Your name_ | _Role_ |
| _Teammate_ | _Role_ |

**Event:** Smart India Hackathon, Problem Statement by AICTE.

---

## 23. License and Disclaimer

Licensed under the **MIT License** (replace if your team chooses otherwise).

This project is a hackathon prototype and decision-support demonstration. It is not affiliated with or endorsed by AICTE. All outputs are advisory; statutory scrutiny, inspections and final regulatory decisions rest with the competent authorities.
