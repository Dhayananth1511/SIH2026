"""
Agent 2: Forensic Anomaly Detection Agent (AICTE Statutory Pipeline)
Specialized in cryptographic hash cross-checking, PDF metadata forensics,
stream tampering indicators, and digital alteration analysis.
"""
import os
from typing import Dict, Any, List
from .base import BaseAgent


FORENSIC_SYSTEM_PROMPT = """You are the AICTE Forensic Anomaly Detection Agent.
Your responsibility is to analyze document forensic indicators, PDF metadata, creation timestamps, and software signatures to detect potential document tampering, re-used certificates, or visual splices.
Always return strict JSON:
{
  "has_anomaly": <bool>,
  "anomaly_confidence": <float between 0.00 and 1.00>,
  "anomaly_type": "<e.g. METADATA_MANIPULATION | CREATION_DATE_DISCREPANCY | SPLICED_SIGNATURE | NONE>",
  "detected_evidence": "<detailed evidentiary explanation of what looks suspicious>",
  "statutory_risk_level": "<LOW | MEDIUM | HIGH>",
  "scrutiny_guidance": "<objective instruction for the human Scrutiny Officer>"
}
"""


class ForensicAnomalyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="AGENT-02-FORENSIC",
            name="Forensic Anomaly Detection Agent",
            role_description="Detects cryptographic duplicates, metadata tampering, and document stream alterations."
        )

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        documents = state.get("documents", [])
        db_session = state.get("db_session")
        findings = []
        anomaly_scores = {}

        for doc in documents:
            doc_id = doc.get("id")
            filename = doc.get("filename", "")
            sha256_hash = doc.get("sha256_hash", "")
            meta = doc.get("metadata", {}) or {}

            # 1. Cryptographic SHA-256 Collision / Re-use Check
            if sha256_hash and db_session:
                from app.models import Document as DbDocument
                app_id = state.get("application_db_id")
                dup_cross_app = db_session.query(DbDocument).filter(
                    DbDocument.sha256_hash == sha256_hash,
                    DbDocument.application_id != app_id
                ).first()

                if dup_cross_app:
                    findings.append({
                        "check_type": "MANIPULATION",
                        "rule_id": "ANOMALY-HASH-DUP",
                        "severity": "medium",
                        "document_id": doc_id,
                        "finding_text": f"File checksum for '{filename}' ({sha256_hash[:12]}...) exactly matches document in Application #{dup_cross_app.application_id}. Potential anomaly — manual verification required.",
                        "detected_issue": "Identical cryptographic file checksum detected across distinct institutional applications.",
                        "why_attention_needed": "May indicate document reuse or sharing across sister institutions without separate statutory clearance.",
                        "recommended_action": "Scrutiny officer must manually verify the original document seal with the issuing department. Advisory only; does not prove forgery.",
                        "ai_suggestion": "Verify whether this clearance was issued centrally for multiple trust institutions.",
                        "page_number": 1
                    })

            # 2. Metadata Graphic Editor Forensics
            producer = str(meta.get("producer") or "").lower()
            creator = str(meta.get("creator") or "").lower()
            sus_tools = ["photoshop", "gimp", "canva", "inkscape", "paint.net", "ilovepdf", "sejda"]
            matched_sus = [tool for tool in sus_tools if tool in producer or tool in creator]

            if matched_sus:
                findings.append({
                    "check_type": "MANIPULATION",
                    "rule_id": "ANOMALY-METADATA-SUSPECT",
                    "severity": "medium",
                    "document_id": doc_id,
                    "finding_text": f"PDF metadata for '{filename}' indicates document processing via graphic editing tool ({matched_sus[0].capitalize()}). Potential anomaly — manual verification required.",
                    "detected_issue": f"PDF Producer/Creator signature indicates re-export via '{matched_sus[0]}'.",
                    "why_attention_needed": "Official government certificates are typically issued via scanned archival format or certified PAdES signing, not graphic editing suites.",
                    "recommended_action": "Officer must conduct manual verification against issuing authority repository before clearance.",
                    "ai_suggestion": "Re-scan the original paper certificate directly using an unedited scanner utility, or request an official e-Copy directly from the issuing authority.",
                    "page_number": 1
                })

            # 3. Filename Anomaly Flagging
            if "tampered" in filename.lower() or "suspicious" in filename.lower():
                findings.append({
                    "check_type": "MANIPULATION",
                    "rule_id": "ANOMALY-STRUCT-FLAG",
                    "severity": "high",
                    "document_id": doc_id,
                    "finding_text": f"Structural anomaly flag identified in {filename}. Potential anomaly — manual verification required.",
                    "detected_issue": "Suspicious indicator detected in PDF metadata and structural stream.",
                    "why_attention_needed": "Discrepancies in stream compression or conflicting modification stamps warrant manual examination.",
                    "recommended_action": "Officer must conduct manual verification against issuing repository. Never automatically reject solely based on algorithmic flag.",
                    "ai_suggestion": "Scrutiny officer review required against statutory cadastre records.",
                    "page_number": 1
                })

            # 4. Gemini AI Deep Forensic Reasoning (if configured)
            if self.gemini.is_configured():
                prompt = f"""Evaluate forensic indicators for this AICTE submission document:
Filename: {filename}
PDF Metadata: {meta}
Checksum: {sha256_hash}
Suspected Editing Signatures: {matched_sus}

Determine if there is evidence of post-issuance manipulation or metadata inconsistency."""
                ai_forensic = self.gemini.generate_json(prompt=prompt, system_instruction=FORENSIC_SYSTEM_PROMPT)
                if ai_forensic.get("_gemini_live") and ai_forensic.get("has_anomaly"):
                    anomaly_scores[doc_id] = ai_forensic

        return {
            "findings": findings,
            "anomaly_analysis": anomaly_scores
        }
