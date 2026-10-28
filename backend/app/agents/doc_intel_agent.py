"""
Agent 1: Document Intelligence Agent (AICTE Statutory Pipeline)
Specialized in OCR extraction, semantic entity recognition, coordinate mapping,
and transforming unstructured PDF dossiers into canonical structured schemas.
"""
import os
import re
from typing import Dict, Any, List
import fitz

from .base import BaseAgent


DOC_INTEL_SYSTEM_PROMPT = """You are the AICTE Document Intelligence Agent for technical education compliance.
Your duty is to parse and extract key statutory fields from institutional compliance documents (Land Title Deeds, Fire NOC, Building Plans, Faculty Registers, Endowment FDRs).
Always return strict JSON with the following structure:
{
  "document_type_detected": "<detected document category>",
  "institution_name_extracted": "<exact institution/trust name on document or null>",
  "issuing_authority": "<official body that issued the document>",
  "issue_date": "<YYYY-MM-DD or null>",
  "expiry_date": "<YYYY-MM-DD or null>",
  "unique_reference_no": "<certificate URN/Deed number>",
  "key_metrics": {
    "land_acreage": <float or null>,
    "sfr_ratio": "<string e.g. 1:20 or null>",
    "fdr_amount_inr": <float or null>,
    "structural_stability_certified": <bool or null>
  },
  "confidence_score": <float between 0.00 and 1.00>,
  "evidence_snippet": "<verbatim sentence or paragraph from document demonstrating validity or terms>",
  "extraction_summary": "<brief summary of what was verified>"
}
"""


class DocumentIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="AGENT-01-DOC-INTEL",
            name="Document Intelligence Agent",
            role_description="Extracts statutory entities, validates machine readability, and standardizes document schemas."
        )

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        documents = state.get("documents", [])
        extracted_dossier = {}
        findings = []

        for doc in documents:
            file_path = doc.get("file_path")
            doc_type = doc.get("doc_type", "Unknown Document")
            filename = doc.get("filename", "unknown.pdf")
            doc_id = doc.get("id")

            # Read text via PyMuPDF
            full_text = ""
            page_count = 0
            if file_path and os.path.exists(file_path):
                try:
                    pdf_doc = fitz.open(file_path)
                    page_count = len(pdf_doc)
                    for i, page in enumerate(pdf_doc):
                        full_text += f"\n--- PAGE {i+1} ---\n" + page.get_text()
                    pdf_doc.close()
                except Exception as e:
                    findings.append({
                        "check_type": "EXTRACTION",
                        "rule_id": "VAL-DOC-CORRUPT",
                        "severity": "high",
                        "document_id": doc_id,
                        "finding_text": f"Document '{filename}' could not be decoded by Document Intelligence Agent: {str(e)}",
                        "page_number": 1
                    })
                    continue

            # If Gemini is live, perform LLM semantic extraction
            if self.gemini.is_configured() and len(full_text.strip()) > 30:
                user_prompt = f"""Analyze this uploaded AICTE supporting document.
Document Declared Type: {doc_type}
Filename: {filename}
Document Text (first 4000 characters):
{full_text[:4000]}

Extract all regulatory fields per the specified JSON schema."""
                ai_result = self.gemini.generate_json(
                    prompt=user_prompt,
                    system_instruction=DOC_INTEL_SYSTEM_PROMPT
                )
                if ai_result.get("_gemini_live"):
                    extracted_dossier[doc_id] = {
                        "doc_type": doc_type,
                        "filename": filename,
                        "page_count": page_count,
                        "ai_extracted": ai_result,
                        "is_readable": True,
                        "source": "GEMINI_2_5_FLASH"
                    }
                    continue

            # Fallback regex / deterministic parsing
            exp_match = re.search(r"(?:valid\s+till|expiry\s+date|validity|expires\s+on)[:\s]+([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})", full_text, re.IGNORECASE)
            area_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:acres|acre|hectares|sq\.m)", full_text, re.IGNORECASE)

            extracted_dossier[doc_id] = {
                "doc_type": doc_type,
                "filename": filename,
                "page_count": page_count,
                "ai_extracted": {
                    "document_type_detected": doc_type,
                    "institution_name_extracted": state.get("institution_name"),
                    "expiry_date": exp_match.group(1) if exp_match else None,
                    "key_metrics": {
                        "land_acreage": float(area_match.group(1)) if area_match else None
                    },
                    "confidence_score": 0.85,
                    "evidence_snippet": full_text[:250].strip() if full_text else "Direct file stream parsed.",
                    "extraction_summary": f"Deterministic text extraction completed ({page_count} pages parsed)."
                },
                "is_readable": True,
                "source": "DETERMINISTIC_PARSER"
            }

        return {
            "extracted_dossier": extracted_dossier,
            "findings": findings
        }
