"""
Data models and schemas for Tandem Project Intelligence.
Matches shared/schemas/intelligence.json.
"""

from __future__ import annotations
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional


class DecisionStatus(str, Enum):
    CONFIRMED = "confirmed"
    PROPOSED = "proposed"
    SUPERSEDED = "superseded"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class RiskSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class UnresolvedStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"


@dataclass
class Decision:
    title: str
    reason: str = ""
    status: str = DecisionStatus.CONFIRMED.value
    confidence: float = 1.0
    id: str = field(default_factory=lambda: f"dec_{uuid.uuid4().hex[:8]}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "reason": self.reason,
            "status": self.status,
            "confidence": round(float(self.confidence), 2),
        }


@dataclass
class Task:
    title: str
    owner: str = "Unassigned"
    status: str = TaskStatus.TODO.value
    id: str = field(default_factory=lambda: f"task_{uuid.uuid4().hex[:8]}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "owner": self.owner or "Unassigned",
            "status": self.status,
        }


@dataclass
class Risk:
    title: str
    severity: str = RiskSeverity.MEDIUM.value
    description: str = ""
    id: str = field(default_factory=lambda: f"risk_{uuid.uuid4().hex[:8]}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "severity": self.severity,
            "description": self.description,
        }


@dataclass
class UnresolvedItem:
    title: str
    status: str = UnresolvedStatus.OPEN.value
    id: str = field(default_factory=lambda: f"unres_{uuid.uuid4().hex[:8]}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "status": self.status,
        }


@dataclass
class ProjectIntelligence:
    decisions: List[Decision] = field(default_factory=list)
    tasks: List[Task] = field(default_factory=list)
    risks: List[Risk] = field(default_factory=list)
    unresolved: List[UnresolvedItem] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decisions": [d.to_dict() for d in self.decisions],
            "tasks": [t.to_dict() for t in self.tasks],
            "risks": [r.to_dict() for r in self.risks],
            "unresolved": [u.to_dict() for u in self.unresolved],
        }


def validate_project_intelligence(data: Any) -> Dict[str, Any]:
    """
    Validates and normalizes raw dictionary data against the intelligence schema contract.
    Ensures all expected keys and field types exist with appropriate fallback defaults.
    """
    if not isinstance(data, dict):
        raise ValueError("Project intelligence payload must be a JSON object / dict.")

    cleaned: Dict[str, List[Dict[str, Any]]] = {
        "decisions": [],
        "tasks": [],
        "risks": [],
        "unresolved": [],
    }

    # Validate decisions
    for item in data.get("decisions", []):
        if not isinstance(item, dict) or not item.get("title"):
            continue
        status = item.get("status", "confirmed")
        if status not in {"confirmed", "proposed", "superseded"}:
            status = "confirmed"
        try:
            confidence = float(item.get("confidence", 1.0))
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, TypeError):
            confidence = 1.0

        cleaned["decisions"].append({
            "id": str(item.get("id") or f"dec_{uuid.uuid4().hex[:8]}"),
            "title": str(item["title"]).strip(),
            "reason": str(item.get("reason", "")).strip(),
            "status": status,
            "confidence": round(confidence, 2),
        })

    # Validate tasks
    for item in data.get("tasks", []):
        if not isinstance(item, dict) or not item.get("title"):
            continue
        status = item.get("status", "todo")
        if status not in {"todo", "in_progress", "done"}:
            status = "todo"
        owner = str(item.get("owner") or "Unassigned").strip()
        if not owner:
            owner = "Unassigned"

        cleaned["tasks"].append({
            "id": str(item.get("id") or f"task_{uuid.uuid4().hex[:8]}"),
            "title": str(item["title"]).strip(),
            "owner": owner,
            "status": status,
        })

    # Validate risks
    for item in data.get("risks", []):
        if not isinstance(item, dict) or not item.get("title"):
            continue
        severity = item.get("severity", "medium")
        if severity not in {"low", "medium", "high"}:
            severity = "medium"

        cleaned["risks"].append({
            "id": str(item.get("id") or f"risk_{uuid.uuid4().hex[:8]}"),
            "title": str(item["title"]).strip(),
            "severity": severity,
            "description": str(item.get("description", "")).strip(),
        })

    # Validate unresolved
    for item in data.get("unresolved", []):
        if not isinstance(item, dict) or not item.get("title"):
            continue
        status = item.get("status", "open")
        if status not in {"open", "resolved"}:
            status = "open"

        cleaned["unresolved"].append({
            "id": str(item.get("id") or f"unres_{uuid.uuid4().hex[:8]}"),
            "title": str(item["title"]).strip(),
            "status": status,
        })

    return cleaned
