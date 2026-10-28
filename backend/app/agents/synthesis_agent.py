"""
Agent 5: Dossier Synthesis & AI Suggestion Agent (AICTE Statutory Pipeline)
Specialized in aggregating multi-agent findings, calculating objective compliance scores,
generating cohesive remediation guidance for institutions, and preparing the dossier
for the Human-in-the-Loop (HITL) Scrutiny Officer Desk.
"""
from typing import Dict, Any, List
from .base import BaseAgent


SYNTHESIS_SYSTEM_PROMPT = """You are the AICTE Chief Dossier Synthesis Agent.
Your responsibility is to take all findings from Document Intelligence, Forensics, Issuing Authority Reconciliation, and Regulatory Compliance agents, and synthesize an authoritative Executive Summary for the Scrutiny Officer and structured rectification steps for the Institution.
Always return strict JSON:
{
  "executive_summary": "<concise official overview of the dossier validation status>",
  "statutory_risk_level": "<LOW | MEDIUM | HIGH | CRITICAL>",
  "overall_compliance_score": <float between 0.0 and 100.0>,
  "institutional_action_plan": [
    {
      "step_number": <int>,
      "deficiency_title": "<short name of issue>",
      "action_required": "<precise instructions for the applicant>",
      "statutory_deadline_days": <int, default 15>
    }
  ],
  "hitl_scrutiny_guidance": "<specific notes for the AICTE Scrutiny Officer before taking final regulatory action>"
}
"""


class DossierSynthesisAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="AGENT-05-SYNTHESIS",
            name="Dossier Synthesis & Recommendation Agent",
            role_description="Synthesizes multi-agent findings, calculates compliance scores, and drafts institutional guidance."
        )

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        all_findings = state.get("aggregated_findings", [])
        passed_rules = state.get("passed_rules", [])
        verified_sources = state.get("verified_sources", [])
        app_obj = state.get("application_obj")

        total_checks = len(all_findings) + len(passed_rules)
        pass_count = len(passed_rules)
        calculated_score = round((pass_count / total_checks) * 100, 1) if total_checks > 0 else 100.0

        # Assess blocking severity
        has_critical = any(f.get("severity") in ("critical", "high") for f in all_findings)
        final_status = "ACTION_REQUIRED" if has_critical else "READY_FOR_REVIEW"

        ai_synthesis = None
        if self.gemini.is_configured() and len(all_findings) > 0:
            prompt = f"""Synthesize the multi-agent scrutiny review for technical institution:
Institution Name: {getattr(app_obj, 'institution_name', 'Applicant Institution')}
Application Category: {getattr(app_obj, 'category', 'EoA')}
Total Deficiencies Identified: {len(all_findings)}
Deficiencies List:
{all_findings}

Passed Checks Count: {len(passed_rules)}
Authoritative Sources Verified: {verified_sources}

Draft the executive dossier summary and institution action plan."""
            ai_res = self.gemini.generate_json(prompt=prompt, system_instruction=SYNTHESIS_SYSTEM_PROMPT)
            if ai_res.get("_gemini_live"):
                ai_synthesis = ai_res

        # Fallback summary if Gemini is not configured
        if not ai_synthesis:
            if has_critical:
                exec_sum = f"Multi-Agent Validation completed with {len(all_findings)} deficiency alert(s). Institutional rectification required prior to Scrutiny Committee review."
                risk_lvl = "HIGH"
            else:
                exec_sum = f"All mandatory regulatory checks passed successfully (Compliance Score: {calculated_score}%). Dossier cleared for Scrutiny Officer digital sign-off."
                risk_lvl = "LOW"

            ai_synthesis = {
                "executive_summary": exec_sum,
                "statutory_risk_level": risk_lvl,
                "overall_compliance_score": calculated_score,
                "institutional_action_plan": [
                    {
                        "step_number": idx + 1,
                        "deficiency_title": f.get("rule_description", f.get("detected_issue", "Deficiency")),
                        "action_required": f.get("recommended_action", "Upload updated documentation."),
                        "statutory_deadline_days": 15
                    } for idx, f in enumerate(all_findings[:5])
                ],
                "hitl_scrutiny_guidance": "Verify original physical seals and confirm bank lien status before approving Extension of Approval."
            }

        return {
            "final_status": final_status,
            "calculated_score": calculated_score,
            "synthesis": ai_synthesis
        }
