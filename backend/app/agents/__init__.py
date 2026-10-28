"""
AICTE Multi-Agent Regulatory Validation & Decision Support Framework.
Five autonomous agents orchestrating document intelligence, forensics,
authoritative reconciliation, regulatory compliance, and synthesis.
"""

from .gemini_client import GeminiService, get_gemini_service
from .orchestrator import MultiAgentOrchestrator, get_orchestrator

__all__ = [
    "GeminiService",
    "get_gemini_service",
    "MultiAgentOrchestrator",
    "get_orchestrator",
]
