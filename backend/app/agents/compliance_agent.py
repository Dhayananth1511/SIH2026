"""
Agent 4: Regulatory Compliance Agent (AICTE Statutory Pipeline)
Specialized in evaluating dossiers against statutory AICTE Approval Process Handbook (APH 2026-27)
regulations, chapter clauses, cadre ratio norms, and mandatory checklists.
"""
from datetime import datetime, date
import re
from typing import Dict, Any, List
from .base import BaseAgent


COMPLIANCE_SYSTEM_PROMPT = """You are the AICTE Regulatory Compliance Agent.
Your responsibility is to strictly evaluate extracted technical institution records against the AICTE Approval Process Handbook (APH 2026-27).
For any regulatory discrepancy, output strict JSON with:
{
  "is_compliant": <bool>,
  "statutory_clause": "<e.g. APH 2026-27 Chapter II, Sec 2.1>",
  "aph_norm_violated": "<concise description of regulatory rule violated>",
  "severity": "<critical | high | medium | low>",
  "actionable_suggestion": "<detailed legal and procedural instruction on how the institution can rectify this before scrutiny committee review>"
}
"""


class RegulatoryComplianceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="AGENT-04-REGULATORY-COMPLIANCE",
            name="Regulatory Compliance Agent",
            role_description="Evaluates institutional dossiers against APH 2026-27 statutory clauses and mandatory checklists."
        )

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        app_obj = state.get("application_obj")
        uploaded_docs = state.get("documents", [])
        extracted_dossier = state.get("extracted_dossier", {})
        category_checklist = state.get("category_checklist", [])
        db_session = state.get("db_session")

        findings = []
        passed_rules = []
        now_date = datetime.utcnow().date()

        docs_by_type = {}
        for d in uploaded_docs:
            docs_by_type[d.get("doc_type", "").strip().lower()] = d

        # 1. Mandatory Checklist Completeness Check
        for req in category_checklist:
            req_type_lower = req.get("doc_type", "").lower()
            matched_doc = None
            for dt_key, doc_item in docs_by_type.items():
                if req_type_lower in dt_key or dt_key in req_type_lower:
                    matched_doc = doc_item
                    break

            if not matched_doc:
                # LLM Clause Evaluation
                clause = f"APH 2026-27 Chapter II, Rule {req.get('rule_id', 'APH-GEN')}"
                suggestion = f"Upload the official signed and notarized PDF copy of '{req.get('doc_type')}'. Ensure it satisfies {req.get('required_value')}."

                if self.gemini.is_configured():
                    user_prompt = f"""Application Category: {app_obj.category}
Missing Required Document: {req.get('doc_type')}
Requirement: {req.get('required_value')}
Description: {req.get('description')}
Provide statutory APH clause and rectification guidance."""
                    ai_clause = self.gemini.generate_json(user_prompt, COMPLIANCE_SYSTEM_PROMPT)
                    if ai_clause.get("_gemini_live"):
                        clause = ai_clause.get("statutory_clause", clause)
                        suggestion = ai_clause.get("actionable_suggestion", suggestion)

                findings.append({
                    "check_type": "COMPLETENESS",
                    "rule_id": req.get("rule_id", "APH-MANDATORY"),
                    "severity": "critical",
                    "finding_text": f"Mandatory supporting document '{req.get('doc_type')}' is missing for application category '{app_obj.category}'.",
                    "detected_issue": f"Required document '{req.get('doc_type')}' not uploaded.",
                    "why_attention_needed": f"{clause} requires {req.get('doc_type')} for regulatory clearance under {app_obj.category} norms.",
                    "recommended_action": f"Upload the official signed and certified PDF copy of '{req.get('doc_type')}'.",
                    "ai_suggestion": suggestion,
                    "evidence": req,
                    "page_number": 1
                })
            else:
                passed_rules.append(f"Document present: {req.get('doc_type')}")

        # 2. Expiry & Validity Inspection across Uploaded Documents
        for d in uploaded_docs:
            d_id = d.get("id")
            fname = d.get("filename", "")
            dtype = d.get("doc_type", "")
            ext_info = extracted_dossier.get(d_id, {}).get("ai_extracted", {})
            exp_str = ext_info.get("expiry_date")

            if exp_str:
                try:
                    exp_clean = exp_str.replace('/', '-')
                    parts = exp_clean.split('-')
                    if len(parts) == 3:
                        exp_d = date(int(parts[0]), int(parts[1]), int(parts[2])) if len(parts[0]) == 4 else date(int(parts[2]), int(parts[1]), int(parts[0]))
                        if exp_d < now_date:
                            findings.append({
                                "check_type": "CONSISTENCY",
                                "rule_id": "VAL-DOC-EXPIRED",
                                "severity": "high",
                                "document_id": d_id,
                                "finding_text": f"The uploaded certificate '{fname}' has expired on {exp_d.strftime('%d-%b-%Y')}.",
                                "detected_issue": f"Clearance validity expired on {exp_d.strftime('%d-%b-%Y')}, prior to current scrutiny date {now_date.strftime('%d-%b-%Y')}.",
                                "why_attention_needed": "AICTE APH 2026-27 Chapter II regulations require valid, unexpired statutory clearances for Academic Year 2026-27.",
                                "recommended_action": "Upload the current renewed certificate from the issuing competent authority as a replacement document.",
                                "ai_suggestion": "Apply for renewal immediately at the State Portal, and upload the current renewed certificate or provisional renewal receipt.",
                                "page_number": 1
                            })
                        else:
                            passed_rules.append(f"Validity confirmed for {dtype} (Valid till {exp_d.strftime('%d-%b-%Y')})")
                except Exception:
                    pass

            # 3. Entity Identity / Name Consistency Check
            extracted_inst_name = ext_info.get("institution_name_extracted")
            if extracted_inst_name and len(extracted_inst_name.strip()) > 3:
                app_words = set(re.findall(r"\w+", (app_obj.institution_name or "").lower()))
                doc_words = set(re.findall(r"\w+", extracted_inst_name.lower()))
                common_words = app_words.intersection(doc_words)

                if ("polytechnic" in doc_words and "engineering" in app_words) or (len(common_words) < 2 and len(doc_words) > 2):
                    findings.append({
                        "check_type": "CONSISTENCY",
                        "rule_id": "VAL-NAME-MISMATCH",
                        "severity": "high",
                        "document_id": d_id,
                        "finding_text": f"Institution name in '{fname}' ({extracted_inst_name}) conflicts with registered institution record ({app_obj.institution_name}).",
                        "detected_issue": f"Entity mismatch: Document is issued to '{extracted_inst_name}', but application is registered for '{app_obj.institution_name}'.",
                        "why_attention_needed": "All statutory land deeds, fire certificates, and endowments must match the exact registered legal entity name.",
                        "recommended_action": "Upload supporting documents issued strictly in the name of the applicant institution, or provide official gazette change-of-name order.",
                        "ai_suggestion": "Upload either a certified Trust Resolution / Name Change Gazette notification or lease transfer endorsement registered with the local Revenue Authority.",
                        "page_number": 1
                    })
                else:
                    passed_rules.append(f"Entity identity matched for {dtype}")

        return {
            "findings": findings,
            "passed_rules": passed_rules
        }
