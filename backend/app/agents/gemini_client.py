"""
Unified Gemini AI Client for AICTE Multi-Agent System.
Supports Gemini 2.5 Flash / Gemini 1.5 Flash via direct REST & official SDK,
with JSON schema enforcement, multimodal image/PDF reasoning, and resilient fallback.
"""
import os
import json
import base64
import logging
from typing import Dict, Any, Optional, List
import httpx

from app.config import settings

logger = logging.getLogger("gemini_service")


class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", None) or os.environ.get("GEMINI_API_KEY", "")
        self.primary_model = "gemini-2.5-flash"
        self.fallback_model = "gemini-1.5-flash"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def set_api_key(self, key: str):
        self.api_key = key.strip()
        os.environ["GEMINI_API_KEY"] = self.api_key

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 10)

    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        images_base64: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Executes a prompt expecting a structured JSON response.
        images_base64 format: [{"mime_type": "image/png", "data": "<base64_string>"}]
        """
        if not self.is_configured():
            return {
                "_gemini_live": False,
                "error": "GEMINI_API_KEY is not configured.",
                "notice": "Please configure your Gemini API Key in backend/.env to activate live AI reasoning."
            }

        target_model = model or self.primary_model
        
        # Build contents
        parts = []
        if images_base64:
            for img in images_base64:
                parts.append({
                    "inline_data": {
                        "mime_type": img.get("mime_type", "image/jpeg"),
                        "data": img.get("data", "")
                    }
                })
        parts.append({"text": prompt})

        payload: Dict[str, Any] = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json"
            }
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        url = f"{self.base_url}/{target_model}:generateContent?key={self.api_key}"

        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 404 and target_model != self.fallback_model:
                    # Fallback to gemini-1.5-flash
                    url_fb = f"{self.base_url}/{self.fallback_model}:generateContent?key={self.api_key}"
                    res = client.post(url_fb, json=payload)

                if res.status_code != 200:
                    logger.error(f"Gemini API returned status {res.status_code}: {res.text}")
                    return {
                        "_gemini_live": False,
                        "error": f"Gemini API Error {res.status_code}",
                        "raw_response": res.text[:400]
                    }

                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return {"_gemini_live": False, "error": "No candidates returned from Gemini"}

                content_parts = candidates[0].get("content", {}).get("parts", [])
                if not content_parts:
                    return {"_gemini_live": False, "error": "Empty content in Gemini response"}

                raw_text = content_parts[0].get("text", "").strip()

                # Parse JSON
                try:
                    parsed = json.loads(raw_text)
                    if isinstance(parsed, dict):
                        parsed["_gemini_live"] = True
                        parsed["_model"] = target_model
                    return parsed
                except json.JSONDecodeError:
                    # Clean markdown if enclosed in ```json
                    cleaned = raw_text
                    if "```json" in cleaned:
                        cleaned = cleaned.split("```json")[1].split("```")[0].strip()
                    elif "```" in cleaned:
                        cleaned = cleaned.split("```")[1].split("```")[0].strip()
                    parsed = json.loads(cleaned)
                    if isinstance(parsed, dict):
                        parsed["_gemini_live"] = True
                        parsed["_model"] = target_model
                    return parsed

        except Exception as e:
            logger.error(f"Exception during Gemini JSON call: {e}")
            return {
                "_gemini_live": False,
                "error": str(e)
            }

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.3
    ) -> str:
        """Executes a text generation prompt."""
        if not self.is_configured():
            return "Gemini API key is not configured. Live generation unavailable."

        target_model = model or self.primary_model
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature}
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        url = f"{self.base_url}/{target_model}:generateContent?key={self.api_key}"
        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 404 and target_model != self.fallback_model:
                    url_fb = f"{self.base_url}/{self.fallback_model}:generateContent?key={self.api_key}"
                    res = client.post(url_fb, json=payload)

                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return f"Gemini API returned error {res.status_code}: {res.text[:200]}"
        except Exception as e:
            return f"Gemini text generation failed: {str(e)}"


# Singleton instance
_service_instance: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    global _service_instance
    if _service_instance is None:
        _service_instance = GeminiService()
    return _service_instance
