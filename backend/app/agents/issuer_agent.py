"""
Agent 3: Issuer Verification Agent (AICTE Statutory Pipeline)
Specialized in reconciling applicant claims with central master records,
issuing authority registries (Bhulekh, Fire Portal, State Technical Universities),
and validating digital signature / QR code credentials.
"""
from typing import Dict, Any, List
from .base import BaseAgent


class IssuerVerificationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="AGENT-03-ISSUER-VERIFY",
            name="Issuer Verification Agent",
            role_description="Reconciles documents with AICTE Master Records, state registries, and authoritative databases."
        )

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        db_session = state.get("db_session")
        app_obj = state.get("application_obj")
        findings = []
        verified_sources = []
        unverified_sources = []

        if not db_session or not app_obj:
            return {"findings": findings, "verified_sources": verified_sources}

        from app.models import AicteMasterRecord, AuthorityVerification

        # 1. AICTE Central Institutional Master Record (AIMR) Check
        master_rec = None
        if app_obj.institution_id:
            master_rec = db_session.query(AicteMasterRecord).filter(AicteMasterRecord.institution_id == app_obj.institution_id).first()
        if not master_rec and app_obj.institution:
            master_rec = db_session.query(AicteMasterRecord).filter(AicteMasterRecord.aicte_id == app_obj.institution.aicte_id).first()

        if master_rec:
            # Check TER Processing Fee
            ter_info = master_rec.ter_payment or {}
            if str(ter_info.get("status", "")).upper() != "CONFIRMED":
                findings.append({
                    "check_type": "CONSISTENCY",
                    "rule_id": "APH-TER-01",
                    "severity": "high",
                    "finding_text": "Technical Education Regulatory (TER) processing fee has not been confirmed in the AICTE Central Financial Ledger.",
                    "detected_issue": f"TER transaction reference '{ter_info.get('receipt_no', 'N/A')}' status is '{ter_info.get('status', 'UNPAID')}'.",
                    "why_attention_needed": "AICTE APH 2026-27 Section 1.4 requires full clearance of TER processing fee prior to scrutiny.",
                    "recommended_action": "Verify transaction receipt on AICTE payment gateway or attach the Bank Challan / UTR reference.",
                    "ai_suggestion": "Verify TER payment reference with the Accounts Division, AICTE. Ensure payment receipt ref is updated in Step 1.",
                    "page_number": 1
                })
            else:
                verified_sources.append(f"AICTE Financial Ledger: TER Confirmed ({ter_info.get('receipt_no')})")

            # Check Intake Expansion consistency
            if master_rec.total_sanctioned_intake and (app_obj.institution and app_obj.institution.total_intake):
                applied_intake = app_obj.institution.total_intake
                sanctioned = master_rec.total_sanctioned_intake
                if applied_intake > (sanctioned + 120):
                    findings.append({
                        "check_type": "CONSISTENCY",
                        "rule_id": "APH-INTAKE-02",
                        "severity": "medium",
                        "finding_text": f"Requested intake of {applied_intake} exceeds AICTE Master Record sanctioned capacity ({sanctioned}).",
                        "detected_issue": "Course expansion requires prerequisite NBA Tier-1 accreditation and prior council approval.",
                        "why_attention_needed": "AICTE APH 2026-27 Chapter II, Sec 2.8 caps intake growth without accredited programs.",
                        "recommended_action": "Submit NBA Tier-1 accreditation certificate or adjust requested intake to permissible cap.",
                        "ai_suggestion": "Confirm whether this application is accompanied by valid NBA Tier-1 accreditation order for requested courses.",
                        "page_number": 1
                    })

        # 2. Query or Load Authority Verification Adapters
        auth_records = db_session.query(AuthorityVerification).filter(AuthorityVerification.application_id == app_obj.id).all()
        for ar in auth_records:
            if ar.status == "VERIFIED":
                verified_sources.append(f"{ar.authority_name} ({ar.urn_or_token})")
            elif ar.status == "MISMATCH_DETECTED":
                findings.append({
                    "check_type": "EXTERNAL_AUTH",
                    "rule_id": "AUTH-MISMATCH-FLAG",
                    "severity": "high",
                    "finding_text": f"Issuing authority '{ar.authority_name}' returned conflicting data for reference '{ar.urn_or_token}'.",
                    "detected_issue": ar.discrepancy_details or "Issuer repository record does not match submitted details.",
                    "why_attention_needed": "Authoritative verification mismatch requires statutory confirmation before regulatory clearance.",
                    "recommended_action": "Contact issuing authority or upload digitally-signed verification receipt.",
                    "ai_suggestion": "Re-check unique reference number against official issuing portal and ensure current certificate is registered.",
                    "page_number": 1
                })
            elif ar.status in ("SOURCE_UNAVAILABLE", "VERIFICATION_PENDING"):
                unverified_sources.append(f"{ar.authority_name}: {ar.status}")

        return {
            "findings": findings,
            "verified_sources": verified_sources,
            "unverified_sources": unverified_sources
        }
