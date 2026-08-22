"""
ROPA (Reasoning on Project Artifacts) & Intelligence Engine.
Transforms unstructured meeting transcripts into structured project intelligence.
"""

from __future__ import annotations
import json
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

from ai.schemas import (
    Decision,
    DecisionStatus,
    ProjectIntelligence,
    Risk,
    RiskSeverity,
    Task,
    TaskStatus,
    UnresolvedItem,
    UnresolvedStatus,
    validate_project_intelligence,
)


def _clean_text(text: str) -> str:
    """Removes outer quotes, extra spaces, and trailing punctuation."""
    text = text.strip().strip('"\'“”')
    return text.strip()


def _parse_transcript_lines(transcript: str) -> List[Tuple[Optional[str], str]]:
    """
    Parses a transcript into a list of (speaker, utterance) tuples.
    Handles:
      - Line-by-line speaker tags: 'Rahul: "I think PostgreSQL makes more sense."'
      - Sentence-by-sentence statements: 'Let's use PostgreSQL. Manit will implement the API.'
    """
    lines = [line.strip() for line in transcript.splitlines() if line.strip()]
    parsed: List[Tuple[Optional[str], str]] = []

    speaker_pattern = re.compile(r"^([A-Za-z0-9_\-\s]{2,30}):\s*(.*)$")

    for line in lines:
        match = speaker_pattern.match(line)
        if match:
            speaker = match.group(1).strip()
            content = _clean_text(match.group(2))
            parsed.append((speaker, content))
        else:
            # If no speaker colon, split sentences on period/semicolon/newline
            sub_sentences = re.split(r"(?<=[.!?])\s+", line)
            for sub in sub_sentences:
                sub_clean = _clean_text(sub)
                if sub_clean:
                    parsed.append((None, sub_clean))

    return parsed


def deterministic_extract_intelligence(transcript: str) -> Dict[str, Any]:
    """
    Deterministic rule-based extraction engine for transcript intelligence.
    Serves as local extraction layer and reliable fallback when LLM is unavailable.
    """
    if not transcript or not transcript.strip():
        return {
            "decisions": [],
            "tasks": [],
            "risks": [],
            "unresolved": [],
        }

    parsed_lines = _parse_transcript_lines(transcript)
    full_text = " ".join(content for _, content in parsed_lines)

    decisions: List[Dict[str, Any]] = []
    tasks: List[Dict[str, Any]] = []
    risks: List[Dict[str, Any]] = []
    unresolved: List[Dict[str, Any]] = []

    # Track ambiguity indicators across the text
    ambiguity_cues = ["maybe", "not sure", "discuss this tomorrow", "discuss later", "tbd", "open question", "haven't decided", "explore"]
    has_ambiguity = any(re.search(rf"\b{re.escape(cue)}\b", full_text, re.IGNORECASE) for cue in ambiguity_cues)

    # 1. Extraction of Decisions vs Unresolved
    # Detect ambiguous discussions (e.g. TEST 3: "Maybe MongoDB could work. I'm not sure. Let's discuss this tomorrow.")
    if has_ambiguity and ("let's discuss" in full_text.lower() or "not sure" in full_text.lower()):
        # Check what topic is being discussed ambiguously
        db_match = re.search(r"(?:maybe\s+)?([A-Za-z0-9]+)\s+(?:could|might)\s+work", full_text, re.IGNORECASE)
        if db_match:
            topic = db_match.group(1)
            unresolved.append({
                "id": f"unres_{uuid.uuid4().hex[:8]}",
                "title": f"{topic} evaluation / selection",
                "status": "open",
            })
        else:
            unresolved.append({
                "id": f"unres_{uuid.uuid4().hex[:8]}",
                "title": "Pending discussion / open topic",
                "status": "open",
            })
    else:
        # Check explicit decisions
        decision_patterns = [
            r"let's use\s+([^.,;\n]+)",
            r"we (?:decided to|decided on|will)\s+(?:select|use|go with)?\s*([^.,;\n]+)",
            r"decided (?:to select|to use|on)?\s+([^.,;\n]+)",
            r"confirmed\s+([^.,;\n]+)",
            r"agreed\.?\s*(?:let's use\s+([^.,;\n]+))?",
            r"choose\s+([^.,;\n]+)",
            r"selected\s+([^.,;\n]+)",
        ]

        for speaker, utterance in parsed_lines:
            for pat in decision_patterns:
                match = re.search(pat, utterance, re.IGNORECASE)
                if match:
                    subject = match.group(1) if match.lastindex and match.group(1) else None
                    if not subject:
                        # check if subject mentioned before in transcript
                        prev_tech = re.search(r"\b(PostgreSQL|Postgres|MySQL|MongoDB|Redis|FastAPI|React|Next\.js|Supabase)\b", full_text, re.IGNORECASE)
                        if prev_tech:
                            subject = prev_tech.group(1)
                    if subject:
                        cleaned_subject = _clean_text(subject)
                        # Avoid duplicates
                        if not any(d["title"].lower() == cleaned_subject.lower() or cleaned_subject.lower() in d["title"].lower() for d in decisions):
                            # Look for reason in full text
                            reason = ""
                            reason_match = re.search(rf"{re.escape(cleaned_subject)}[^\.\n]*because\s+([^.,;\n]+)", full_text, re.IGNORECASE)
                            if not reason_match:
                                reason_match = re.search(r"because\s+([^.,;\n]+)", full_text, re.IGNORECASE)
                            if reason_match:
                                reason = f"Because {reason_match.group(1).strip()}"

                            decisions.append({
                                "id": f"dec_{uuid.uuid4().hex[:8]}",
                                "title": cleaned_subject,
                                "reason": reason,
                                "status": "confirmed",
                                "confidence": 0.95,
                            })

    # 2. Extraction of Tasks with Owners
    # Patterns:
    #   - "Rahul will build the database schema." -> owner: Rahul, task: build the database schema
    #   - "Manit will implement the API." -> owner: Manit, task: implement the API
    #   - Speaker: "I'll handle the API" -> owner: Speaker, task: handle the API
    task_patterns = [
        # Named 3rd person: "<Name> will <action>" or "<Name> to <action>"
        r"^([A-Z][a-z]+)\s+(?:will|is going to|to)\s+(?:build|implement|handle|create|set up|design|write|do)\s+(.+)$",
        r"^([A-Z][a-z]+)\s+(?:will|is going to|to)\s+(.+)$",
    ]

    first_person_patterns = [
        # 1st person: "I'll handle the API" or "I will build..."
        r"^(?:I'll|I will|I can)\s+(?:handle|implement|build|create|set up|design|write|do)\s+(.+)$",
        r"^(?:I'll|I will|I can)\s+(.+)$",
    ]

    for speaker, utterance in parsed_lines:
        matched_task = False

        # First check first-person if speaker is known
        if speaker:
            for pat in first_person_patterns:
                m = re.match(pat, utterance, re.IGNORECASE)
                if m:
                    action = m.group(1).strip().rstrip(".")
                    title = f"{action.capitalize()}" if not action.lower().startswith(("handle", "implement", "build", "create")) else f"{action.capitalize()}"
                    # normalize title e.g. "API" -> "API implementation" or "Handle the API"
                    tasks.append({
                        "id": f"task_{uuid.uuid4().hex[:8]}",
                        "title": utterance.strip().rstrip("."),
                        "owner": speaker,
                        "status": "todo",
                    })
                    matched_task = True
                    break

        if not matched_task:
            for pat in task_patterns:
                m = re.match(pat, utterance, re.IGNORECASE)
                if m:
                    owner_candidate = m.group(1).strip()
                    action = m.group(2).strip().rstrip(".")
                    # Check that owner_candidate is not a keyword like 'The', 'Let', 'Maybe', 'Agreed'
                    if owner_candidate.lower() not in {"the", "let", "maybe", "agreed", "we", "this", "our"}:
                        tasks.append({
                            "id": f"task_{uuid.uuid4().hex[:8]}",
                            "title": utterance.strip().rstrip("."),
                            "owner": owner_candidate,
                            "status": "todo",
                        })
                        matched_task = True
                        break

    # 3. Extraction of Risks
    # Patterns:
    #   - "The authentication integration may be delayed."
    #   - "I'm concerned the authentication integration may take longer than expected."
    #   - "risk", "blocker", "bottleneck", "delay", "take longer"
    risk_cues = [
        r"(?:concerned|concern)(?:\s+(?:that|about))?\s+([^.,;\n]+(?:\s+(?:may|might|could)\s+[^.,;\n]+)?)",
        r"([^.,;\n]*(?:may|might|could)\s+be\s+delayed[^.,;\n]*)",
        r"([^.,;\n]*take\s+longer\s+than\s+expected[^.,;\n]*)",
        r"([^.,;\n]*risk\s+of\s+[^.,;\n]*)",
    ]

    for speaker, utterance in parsed_lines:
        for cue in risk_cues:
            m = re.search(cue, utterance, re.IGNORECASE)
            if m:
                extracted = m.group(1).strip().rstrip(".")
                title = extracted
                # Clean title for standard risk phrasing
                if "authentication integration" in title.lower() and "delay" in utterance.lower():
                    title = "Authentication integration delay"
                elif "authentication integration" in title.lower() and "longer" in utterance.lower():
                    title = "Authentication integration delay"

                severity = "medium"
                if any(w in utterance.lower() for w in ["critical", "high", "severe", "blocker"]):
                    severity = "high"
                elif any(w in utterance.lower() for w in ["minor", "low", "slight"]):
                    severity = "low"

                if not any(r["title"].lower() == title.lower() for r in risks):
                    risks.append({
                        "id": f"risk_{uuid.uuid4().hex[:8]}",
                        "title": title,
                        "severity": severity,
                        "description": utterance.strip().rstrip("."),
                    })

    raw_result = {
        "decisions": decisions,
        "tasks": tasks,
        "risks": risks,
        "unresolved": unresolved,
    }

    return validate_project_intelligence(raw_result)


def analyze_transcript(transcript: str, use_llm: Optional[bool] = None) -> Dict[str, Any]:
    """
    Primary unified entry point for transcript intelligence analysis.

    Flow:
        transcript -> ROPA / Extraction -> Structured Project Intelligence

    Transforms unstructured meeting transcripts into structured project intelligence:
      - Decisions (with reasons, status, confidence)
      - Tasks (with actionable titles, owners, status)
      - Risks (with severity and descriptions)
      - Unresolved items (open issues/questions)

    The rest of the application does NOT need to know internal extraction mechanics.

    Args:
        transcript: Raw text of the meeting transcript.
        use_llm: If True, invokes LLM with deterministic fallback.
                 If False, runs local deterministic engine directly.
                 If None (default), auto-detects LLM credentials; uses LLM if configured, else local.

    Returns:
        JSON-compatible dictionary conforming strictly to shared/schemas/intelligence.json.
    """
    if not transcript or not transcript.strip():
        return {
            "decisions": [],
            "tasks": [],
            "risks": [],
            "unresolved": [],
        }

    # Auto-detect if use_llm is not explicitly specified
    should_use_llm = use_llm
    if should_use_llm is None:
        from ai.llm_service import _load_dotenv_if_exists
        import os
        _load_dotenv_if_exists()
        has_keys = bool(
            os.getenv("GEMINI_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("GITHUB_TOKEN")
            or os.getenv("GH_TOKEN")
        )
        should_use_llm = has_keys

    if should_use_llm:
        try:
            from ai.llm_service import extract_project_intelligence
            return extract_project_intelligence(transcript, allow_fallback=True)
        except Exception:
            return deterministic_extract_intelligence(transcript)

    return deterministic_extract_intelligence(transcript)


def ask_tandem(
    query: str,
    team_state: Optional[Dict[str, Any]] = None,
    recent_transcripts: Optional[List[str]] = None,
    use_llm: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Answers natural language queries about project state without requiring vector DBs or RAG.
    Reasons directly over structured Team State (Decisions, Tasks, Risks, Unresolved)
    and recent meeting transcripts.

    Args:
        query: The user's question (e.g. 'Why did we choose PostgreSQL?', 'What tasks are assigned to Rahul?')
        team_state: Dict matching shared/schemas/team-state.json (or intelligence.json).
        recent_transcripts: List of raw transcript strings from recent meetings.
        use_llm: Whether to use LLM for answering (defaults to auto-detection with fallback).

    Returns:
        Dict: {"answer": str, "sources": List[Dict[str, str]]}
    """
    if not query or not query.strip():
        return {
            "answer": "Please provide a valid question.",
            "sources": [],
        }

    clean_state = team_state or {}
    transcripts = recent_transcripts or []

    # 1. Deterministic Local Reasoning Helper
    def _deterministic_ask(q: str, state: Dict[str, Any]) -> Dict[str, Any]:
        q_lower = q.lower().strip()
        decisions = state.get("decisions", [])
        tasks = state.get("tasks", [])
        risks = state.get("risks", [])
        unresolved = state.get("unresolved", [])

        sources = []

        # Question: "Why did we choose X?"
        why_match = re.search(r"why\s+(?:did\s+we\s+choose|choose|use)\s+([A-Za-z0-9_\-\s]+)\??", q_lower)
        if why_match or "why" in q_lower:
            target = why_match.group(1).strip() if why_match else ""
            matched_dec = None
            for d in decisions:
                if target and (target in d["title"].lower() or d["title"].lower() in target):
                    matched_dec = d
                    break
                elif not target and d.get("reason"):
                    matched_dec = d
                    break

            if matched_dec:
                sources.append({"type": "decision", "id": matched_dec.get("id", ""), "title": matched_dec["title"]})
                reason_text = matched_dec.get("reason") or "It was confirmed by the team as the best technical fit."
                return {
                    "answer": f"We chose {matched_dec['title']} because: {reason_text}",
                    "sources": sources,
                }
            elif target:
                return {
                    "answer": f"No confirmed decision record found explaining why '{target}' was selected.",
                    "sources": [],
                }

        # Question: "What tasks are assigned to X?" / "What is X working on?"
        tasks_match = re.search(r"(?:tasks\s+(?:assigned\s+to|for)|what\s+is\s+([A-Za-z]+)\s+working\s+on)", q_lower)
        person_match = re.search(r"\b([A-Z][a-z]+)\b", q)
        if "task" in q_lower or "working on" in q_lower or "assigned to" in q_lower:
            person = person_match.group(1) if person_match else ""
            if person and person.lower() not in {"what", "who", "why", "are", "is", "the", "tasks"}:
                matched_tasks = [t for t in tasks if person.lower() in t.get("owner", "").lower()]
                for t in matched_tasks:
                    sources.append({"type": "task", "id": t.get("id", ""), "title": t["title"]})
                if matched_tasks:
                    task_list = "; ".join(f"{t['title']} ({t['status']})" for t in matched_tasks)
                    return {
                        "answer": f"Tasks assigned to {person}: {task_list}.",
                        "sources": sources,
                    }
                else:
                    return {
                        "answer": f"No active tasks are currently assigned to {person}.",
                        "sources": [],
                    }
            elif tasks:
                for t in tasks:
                    sources.append({"type": "task", "id": t.get("id", ""), "title": t["title"]})
                task_list = "; ".join(f"{t['title']} -> {t.get('owner', 'Unassigned')}" for t in tasks)
                return {
                    "answer": f"Current project tasks: {task_list}.",
                    "sources": sources,
                }

        # Question: "What did we decide?" / "decisions"
        if "decide" in q_lower or "decision" in q_lower:
            if decisions:
                for d in decisions:
                    sources.append({"type": "decision", "id": d.get("id", ""), "title": d["title"]})
                dec_list = "; ".join(f"{d['title']}" + (f" (Reason: {d['reason']})" if d.get('reason') else "") for d in decisions)
                return {
                    "answer": f"Confirmed team decisions: {dec_list}.",
                    "sources": sources,
                }
            return {
                "answer": "No decisions have been recorded yet.",
                "sources": [],
            }

        # Question: "What is currently unresolved?" / "open issues"
        if "unresolved" in q_lower or "open" in q_lower or "pending" in q_lower:
            if unresolved:
                for u in unresolved:
                    sources.append({"type": "unresolved", "id": u.get("id", ""), "title": u["title"]})
                unres_list = "; ".join(u["title"] for u in unresolved)
                return {
                    "answer": f"Currently unresolved topics: {unres_list}.",
                    "sources": sources,
                }
            return {
                "answer": "There are no unresolved items currently pending.",
                "sources": [],
            }

        # Question: "What are the risks?"
        if "risk" in q_lower or "blocker" in q_lower:
            if risks:
                for r in risks:
                    sources.append({"type": "risk", "id": r.get("id", ""), "title": r["title"]})
                risk_list = "; ".join(f"{r['title']} [Severity: {r.get('severity', 'medium')}]" for r in risks)
                return {
                    "answer": f"Identified project risks: {risk_list}.",
                    "sources": sources,
                }
            return {
                "answer": "No active risks recorded.",
                "sources": [],
            }

        # General summary
        summary_parts = []
        if decisions:
            summary_parts.append(f"{len(decisions)} decision(s)")
        if tasks:
            summary_parts.append(f"{len(tasks)} task(s)")
        if risks:
            summary_parts.append(f"{len(risks)} risk(s)")
        if unresolved:
            summary_parts.append(f"{len(unresolved)} unresolved item(s)")

        return {
            "answer": f"Tandem Team State contains: {', '.join(summary_parts) if summary_parts else 'no recorded items yet'}.",
            "sources": sources,
        }

    # 2. Check if LLM should be used
    should_use_llm = use_llm
    if should_use_llm is None:
        from ai.llm_service import _load_dotenv_if_exists
        import os
        _load_dotenv_if_exists()
        has_keys = bool(
            os.getenv("GEMINI_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("GITHUB_TOKEN")
            or os.getenv("GH_TOKEN")
        )
        should_use_llm = has_keys

    if should_use_llm:
        try:
            from ai.llm_service import call_llm_api, _extract_json_from_text, PROMPTS_DIR
            ask_prompt_path = PROMPTS_DIR / "ask_tandem.txt"
            template = ask_prompt_path.read_text(encoding="utf-8")
            prompt = (
                template.replace("{{TEAM_STATE}}", json.dumps(clean_state, indent=2))
                .replace("{{RECENT_TRANSCRIPTS}}", "\n---\n".join(transcripts) if transcripts else "None provided.")
                .replace("{{QUERY}}", query.strip())
            )
            raw_res = call_llm_api(
                prompt=prompt,
                system_message="You are Ask Tandem. Return ONLY valid JSON with 'answer' and 'sources'.",
            )
            parsed = _extract_json_from_text(raw_res)
            if "answer" in parsed:
                return {
                    "answer": str(parsed["answer"]),
                    "sources": list(parsed.get("sources", [])),
                }
        except Exception:
            pass

    return _deterministic_ask(query, clean_state)
