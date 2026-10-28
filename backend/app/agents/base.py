"""
Base Agent Interface for AICTE Multi-Agent Compliance Pipeline.
Provides standardized execution contracts, trace logging, latency tracking,
and state management across all five specialized agents.
"""
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from .gemini_client import get_gemini_service, GeminiService


class BaseAgent(ABC):
    def __init__(self, agent_id: str, name: str, role_description: str):
        self.agent_id = agent_id
        self.name = name
        self.role_description = role_description
        self.gemini: GeminiService = get_gemini_service()

    @abstractmethod
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the agent's specialized task.
        Receives immutable state context and returns agent findings/state delta.
        """
        pass

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Wrapper handling timing, exception guardrails, and audit tracing."""
        start_time = time.time()
        agent_log = {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "started_at": datetime.utcnow().isoformat(),
            "status": "RUNNING",
            "is_ai_live": self.gemini.is_configured(),
            "model_used": self.gemini.primary_model if self.gemini.is_configured() else "rule_heuristic_fallback"
        }

        try:
            result = self.run(state)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            agent_log["status"] = "COMPLETED"
            agent_log["duration_ms"] = duration_ms
            agent_log["completed_at"] = datetime.utcnow().isoformat()
            result["_agent_log"] = agent_log
            return result
        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            agent_log["status"] = "ERROR"
            agent_log["error"] = str(e)
            agent_log["duration_ms"] = duration_ms
            agent_log["completed_at"] = datetime.utcnow().isoformat()
            return {
                "findings": [],
                "error": str(e),
                "_agent_log": agent_log
            }
