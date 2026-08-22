"""
analyze_transcript_stub.py
--------------------------
BACKEND-OWNED STUB for analyze_transcript().

This module lives in backend/app/services/ and is the ONLY import the
backend route uses. It is a thin adapter that:

  1. Tries to import and call the real analyze_transcript() from ai/ropa_service.py
     (once the AI developer ships it).
  2. Falls back to a local keyword-based heuristic so the pipeline works
     end-to-end even before the real AI implementation exists.

When the AI developer delivers ai/ropa_service.py with analyze_transcript():
  • The try-import block will succeed automatically.
  • No changes to the backend route are required.
  • Delete the heuristic fallback from this file once the real function is stable.

Contract (matches shared/schemas/intelligence.json):

  Input:  transcript: str
  Output: {
      "decisions":  [{"content": str}, ...],
      "tasks":      [{"title": str, "assignee": str|None, "status": "pending"}, ...],
      "risks":      [{"description": str, "mitigation": str|None}, ...],
      "unresolved": [{"description": str}, ...],
  }
"""

import logging
import re

# ── 1. Try real AI implementation first ───────────────────────────────────────
try:
    import sys
    import os
    # Make ai/ importable regardless of working directory
    _repo_root = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    )
    if _repo_root not in sys.path:
        sys.path.insert(0, _repo_root)

    from ai.ropa_service import analyze_transcript as _real_analyze_transcript

    def analyze_transcript(transcript: str) -> dict:
        """Delegates to the real AI implementation in ai/ropa_service.py."""
        logging.info("[analyze_transcript] Using real AI implementation (ai/ropa_service.py)")
        return _real_analyze_transcript(transcript)

    logging.info("[analyze_transcript] Loaded real AI implementation from ai/ropa_service.py")

except (ImportError, AttributeError):
    # ── 2. Heuristic fallback ─────────────────────────────────────────────────
    logging.warning(
        "[analyze_transcript] ai/ropa_service.py not available or analyze_transcript() "
        "not implemented. Using keyword-heuristic fallback. "
        "The AI developer must implement ai/ropa_service.analyze_transcript()."
    )

    # Keyword patterns for basic sentence classification
    _DECISION_PATTERNS = re.compile(
        r"\b(decided|we will|agreed|approved|going with|confirmed|resolved)\b",
        re.IGNORECASE,
    )
    _TASK_PATTERNS = re.compile(
        r"\b(action item|TODO|to[ -]do|assigned to|will handle|needs to|responsible for|follow[ -]up)\b",
        re.IGNORECASE,
    )
    _RISK_PATTERNS = re.compile(
        r"\b(risk|concern|issue|problem|blocker|might fail|could break|worried about|danger)\b",
        re.IGNORECASE,
    )
    _UNRESOLVED_PATTERNS = re.compile(
        r"\b(unclear|TBD|to be determined|open question|not sure|pending decision|still deciding|unknown)\b",
        re.IGNORECASE,
    )
    # Simple assignee extraction: "X will ..." or "assigned to X"
    _ASSIGNEE_PATTERN = re.compile(
        r"(?:assigned to|action item for)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)",
        re.IGNORECASE,
    )

    def _sentences(text: str) -> list[str]:
        """Split transcript into sentences on . ! ? or newlines."""
        return [s.strip() for s in re.split(r"[.!?\n]+", text) if s.strip()]

    def analyze_transcript(transcript: str) -> dict:
        """
        Keyword-heuristic fallback for analyze_transcript().
        Classifies each sentence into decisions / tasks / risks / unresolved.
        A sentence can match multiple categories.
        """
        logging.info("[analyze_transcript] Using keyword-heuristic fallback")

        if not transcript or not transcript.strip():
            return {"decisions": [], "tasks": [], "risks": [], "unresolved": []}

        decisions  = []
        tasks      = []
        risks      = []
        unresolved = []

        for sentence in _sentences(transcript):
            if _DECISION_PATTERNS.search(sentence):
                decisions.append({"content": sentence})

            if _TASK_PATTERNS.search(sentence):
                assignee_match = _ASSIGNEE_PATTERN.search(sentence)
                tasks.append({
                    "title":    sentence,
                    "assignee": assignee_match.group(1) if assignee_match else None,
                    "status":   "pending",
                })

            if _RISK_PATTERNS.search(sentence):
                risks.append({"description": sentence, "mitigation": None})

            if _UNRESOLVED_PATTERNS.search(sentence):
                unresolved.append({"description": sentence})

        return {
            "decisions":  decisions,
            "tasks":      tasks,
            "risks":      risks,
            "unresolved": unresolved,
        }
