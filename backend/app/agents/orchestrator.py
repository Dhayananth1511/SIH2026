"""
Master Multi-Agent Orchestration Engine (AICTE Compliance Pipeline)
Coordinates execution across all 5 specialized agents, tracks state transitions,
maintains audit chains, and updates application models in the statutory database.
"""
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from .gemini_client import get_gemini_service
from .doc_intel_agent import DocumentIntelligenceAgent
from .forensic_agent import ForensicAnomalyAgent
from .issuer_agent import IssuerVerificationAgent
from .compliance_agent import RegulatoryComplianceAgent
from .synthesis_agent import DossierSynthesisAgent


class MultiAgentOrchestrator:
    def __init__(self):
        self.doc_intel = DocumentIntelligenceAgent()
        self.forensic = ForensicAnomalyAgent()
        self.issuer = IssuerVerificationAgent()
        self.compliance = RegulatoryComplianceAgent()
        self.synthesis = DossierSynthesisAgent()
        self.gemini = get_gemini_service()

    def run_pipeline(
        self,
        db: Session,
        app_id: str,
        current_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executes the full 5-agent regulatory validation pipeline for an application.
        """
        from app.models import (
            Application, Document, Finding, ComplianceCheck,
            ValidationRun, Notification, AuditEvent, AppStatus,
            FindingSeverity, FindingStatus, User
        )
        from app.validation_engine import get_category_checklist

        app_obj = db.query(Application).filter(Application.application_id == app_id).first()
        if not app_obj:
            raise ValueError(f"Application #{app_id} not found.")

        # Clear previous OPEN findings
        db.query(Finding).filter(
            Finding.application_id == app_obj.id,
            Finding.status == FindingStatus.OPEN
        ).delete(synchronize_session=False)

        # Gather documents
        uploaded_docs = db.query(Document).filter(
            Document.application_id == app_obj.id,
            Document.is_latest == True
        ).all()

        docs_data = []
        for d in uploaded_docs:
            docs_data.append({
                "id": d.id,
                "filename": d.filename,
                "file_path": d.file_path,
                "doc_type": d.doc_type,
                "sha256_hash": d.sha256_hash,
                "metadata": (d.extracted_data or {}).get("pdf_metadata", {})
            })

        category_checklist = get_category_checklist(app_obj.category)

        # Initialize shared multi-agent state
        state: Dict[str, Any] = {
            "application_id": app_id,
            "application_db_id": app_obj.id,
            "application_obj": app_obj,
            "institution_name": app_obj.institution_name,
            "documents": docs_data,
            "category_checklist": category_checklist,
            "db_session": db,
            "agent_traces": [],
            "aggregated_findings": []
        }

        pipeline_start = time.time()

        # -------------------------------------------------------------
        # STEP 1: DOCUMENT INTELLIGENCE AGENT
        # -------------------------------------------------------------
        res_doc_intel = self.doc_intel.execute(state)
        state["extracted_dossier"] = res_doc_intel.get("extracted_dossier", {})
        state["agent_traces"].append(res_doc_intel.get("_agent_log", {}))
        for f in res_doc_intel.get("findings", []):
            state["aggregated_findings"].append(f)

        # -------------------------------------------------------------
        # STEP 2: FORENSIC ANOMALY DETECTION AGENT
        # -------------------------------------------------------------
        res_forensic = self.forensic.execute(state)
        state["anomaly_analysis"] = res_forensic.get("anomaly_analysis", {})
        state["agent_traces"].append(res_forensic.get("_agent_log", {}))
        for f in res_forensic.get("findings", []):
            state["aggregated_findings"].append(f)

        # -------------------------------------------------------------
        # STEP 3: ISSUER VERIFICATION AGENT
        # -------------------------------------------------------------
        res_issuer = self.issuer.execute(state)
        state["verified_sources"] = res_issuer.get("verified_sources", [])
        state["unverified_sources"] = res_issuer.get("unverified_sources", [])
        state["agent_traces"].append(res_issuer.get("_agent_log", {}))
        for f in res_issuer.get("findings", []):
            state["aggregated_findings"].append(f)

        # -------------------------------------------------------------
        # STEP 4: REGULATORY COMPLIANCE AGENT
        # -------------------------------------------------------------
        res_compliance = self.compliance.execute(state)
        state["passed_rules"] = res_compliance.get("passed_rules", [])
        state["agent_traces"].append(res_compliance.get("_agent_log", {}))
        for f in res_compliance.get("findings", []):
            state["aggregated_findings"].append(f)

        # -------------------------------------------------------------
        # STEP 5: DOSSIER SYNTHESIS & RECOMMENDATION AGENT
        # -------------------------------------------------------------
        res_synthesis = self.synthesis.execute(state)
        state["agent_traces"].append(res_synthesis.get("_agent_log", {}))

        final_status = res_synthesis.get("final_status", "ACTION_REQUIRED")
        calculated_score = res_synthesis.get("calculated_score", 0.0)
        synthesis_data = res_synthesis.get("synthesis", {})

        # Save findings to database
        db_findings: List[Finding] = []
        for raw_f in state["aggregated_findings"]:
            sev_str = raw_f.get("severity", "medium").upper()
            sev_enum = FindingSeverity.MEDIUM
            if sev_str == "CRITICAL":
                sev_enum = FindingSeverity.CRITICAL
            elif sev_str == "HIGH":
                sev_enum = FindingSeverity.HIGH
            elif sev_str == "LOW":
                sev_enum = FindingSeverity.LOW

            f_obj = Finding(
                application_id=app_obj.id,
                document_id=raw_f.get("document_id"),
                check_type=raw_f.get("check_type", "COMPLIANCE"),
                rule_id=raw_f.get("rule_id", "APH-2026"),
                rule_description=raw_f.get("rule_description", raw_f.get("rule_id", "Rule")),
                severity=sev_enum,
                status=FindingStatus.OPEN,
                finding_text=raw_f.get("finding_text", ""),
                detected_issue=raw_f.get("detected_issue", raw_f.get("finding_text", "")),
                why_attention_needed=raw_f.get("why_attention_needed", "Statutory requirement per APH 2026-27."),
                recommended_action=raw_f.get("recommended_action", "Provide updated documentation."),
                ai_suggestion=raw_f.get("ai_suggestion"),
                evidence=raw_f.get("evidence", {}),
                page_number=raw_f.get("page_number", 1)
            )
            db.add(f_obj)
            db_findings.append(f_obj)

        db.commit()

        # Update application status
        app_obj.status = AppStatus.ACTION_REQUIRED.value if final_status == "ACTION_REQUIRED" else AppStatus.READY_FOR_REVIEW.value
        app_obj.current_stage = "submission" if final_status == "ACTION_REQUIRED" else "ready_for_review"
        app_obj.scrutiny_score = calculated_score
        app_obj.ai_suggestions = [
            {
                "rule_id": f.rule_id,
                "document": f.rule_description,
                "detected_issue": f.detected_issue,
                "suggestion": f.ai_suggestion,
                "severity": f.severity.value if hasattr(f.severity, 'value') else str(f.severity)
            } for f in db_findings if f.ai_suggestion
        ]
        app_obj.updated_at = datetime.utcnow()

        # Record notification
        notif_msg = (
            f"Multi-Agent Validation detected {len(db_findings)} deficiency alert(s)."
            if final_status == "ACTION_REQUIRED" else
            f"All mandatory multi-agent validation checks passed (Score: {calculated_score}%)."
        )
        notif = Notification(
            user_id=app_obj.submitted_by,
            application_id=app_obj.id,
            title="Multi-Agent Validation Completed",
            message=notif_msg,
            type="DEFICIENCY_ALERT" if final_status == "ACTION_REQUIRED" else "STATUS_CHANGE",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notif)

        # Record validation run
        run_count = db.query(ValidationRun).filter(ValidationRun.application_id == app_obj.id).count() + 1
        valid_user = db.query(User).filter(User.id == current_user_id).first() if current_user_id else None
        actual_user_id = valid_user.id if valid_user else None

        val_run = ValidationRun(
            application_id=app_obj.id,
            run_number=run_count,
            status=app_obj.status,
            scrutiny_score=calculated_score,
            rule_version="APH-2026.1-MULTI-AGENT",
            summary=synthesis_data.get("executive_summary", notif_msg),
            passed_checks=state.get("passed_rules", []),
            warnings=[f.finding_text for f in db_findings if f.severity in (FindingSeverity.LOW, FindingSeverity.MEDIUM)],
            external_unverified=state.get("unverified_sources", []),
            created_at=datetime.utcnow(),
            created_by=actual_user_id
        )
        db.add(val_run)

        # Audit Event
        audit = AuditEvent(
            application_id=app_obj.id,
            actor_id=actual_user_id,
            actor_name="AICTE Multi-Agent Orchestrator",
            action="5-Agent Validation Pipeline Executed",
            entity_type="application",
            entity_id=app_obj.application_id,
            details={
                "agents_count": 5,
                "gemini_live": self.gemini.is_configured(),
                "primary_model": self.gemini.primary_model if self.gemini.is_configured() else "rule_fallback",
                "deficiencies_count": len(db_findings),
                "score": calculated_score,
                "total_duration_ms": round((time.time() - pipeline_start) * 1000, 2)
            },
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
        db.refresh(app_obj)

        return {
            "application_id": app_obj.application_id,
            "status": app_obj.status,
            "scrutiny_score": calculated_score,
            "run_number": run_count,
            "summary": synthesis_data.get("executive_summary", notif_msg),
            "has_deficiencies": final_status == "ACTION_REQUIRED",
            "deficiencies_count": len(db_findings),
            "multi_agent_pipeline": {
                "agents_executed": 5,
                "gemini_live": self.gemini.is_configured(),
                "model": self.gemini.primary_model if self.gemini.is_configured() else "rule_fallback",
                "traces": state["agent_traces"],
                "synthesis": synthesis_data
            },
            "ai_suggestions": app_obj.ai_suggestions,
            "deficiencies": [
                {
                    "id": f.id,
                    "rule_id": f.rule_id,
                    "severity": f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                    "detected_issue": f.detected_issue,
                    "why_attention_needed": f.why_attention_needed,
                    "recommended_action": f.recommended_action,
                    "ai_suggestion": f.ai_suggestion,
                    "finding_text": f.finding_text,
                    "page_number": f.page_number
                } for f in db_findings
            ],
            "passed_checks": state.get("passed_rules", []),
            "external_verification": {
                "verified": state.get("verified_sources", []),
                "unverified": state.get("unverified_sources", [])
            },
            "timestamp": datetime.utcnow().isoformat()
        }


_orchestrator_instance: Optional[MultiAgentOrchestrator] = None


def get_orchestrator() -> MultiAgentOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = MultiAgentOrchestrator()
    return _orchestrator_instance
