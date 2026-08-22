"""
meeting_service.py
------------------
Service layer for meeting-related database operations.
Keeps route handlers thin and business logic testable.
"""

import logging
from supabase import Client


def get_meeting_by_id(db: Client, meeting_id: str) -> dict | None:
    """
    Fetch a single meeting row by primary key.
    Returns the row dict, or None if not found.
    """
    res = db.table("meetings").select("*").eq("id", meeting_id).execute()
    if res.data:
        return res.data[0]
    return None


def save_transcript(db: Client, meeting_id: str, transcript: str) -> dict:
    """
    Insert a transcript row into meeting_transcripts.
    Returns the inserted row.
    Raises RuntimeError on Supabase failure.
    """
    payload = {
        "meeting_id": meeting_id,
        "transcript": transcript,
    }
    try:
        res = db.table("meeting_transcripts").insert(payload).execute()
        if not res.data:
            raise RuntimeError("Supabase insert returned no data for meeting_transcripts")
        return res.data[0]
    except Exception as e:
        logging.error(f"Failed to persist transcript for meeting {meeting_id}: {e}")
        raise RuntimeError(f"Database error saving transcript: {str(e)}") from e


def get_latest_transcript(db: Client, meeting_id: str) -> str | None:
    """
    Retrieve the most recently saved transcript for a meeting.
    Returns the transcript string, or None if none exists.
    """
    res = (
        db.table("meeting_transcripts")
        .select("transcript")
        .eq("meeting_id", meeting_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if res.data:
        return res.data[0]["transcript"]
    return None


def get_project_id_for_meeting(db: Client, meeting_id: str) -> str | None:
    """
    Return the project_id associated with a meeting, or None.
    """
    meeting = get_meeting_by_id(db, meeting_id)
    if meeting:
        return meeting.get("project_id")
    return None


def save_intelligence(
    db: Client,
    project_id: str,
    meeting_id: str,
    intelligence: dict,
) -> dict:
    """
    Persist structured intelligence (decisions/tasks/risks/unresolved) to Supabase.

    Inserts rows into: decisions, tasks, risks, unresolved_issues.
    Returns a dict of saved rows keyed by category.
    Raises RuntimeError on any DB failure.
    """
    saved: dict = {
        "decisions":  [],
        "tasks":      [],
        "risks":      [],
        "unresolved": [],
    }

    try:
        # --- decisions ---
        for item in intelligence.get("decisions", []):
            row = {
                "project_id": project_id,
                "meeting_id": meeting_id,
                "content": item["content"],
            }
            res = db.table("decisions").insert(row).execute()
            if res.data:
                saved["decisions"].append(res.data[0])

        # --- tasks ---
        for item in intelligence.get("tasks", []):
            row = {
                "project_id": project_id,
                "meeting_id": meeting_id,
                "title":    item["title"],
                "status":   item.get("status", "pending"),
                "assignee": item.get("assignee"),
            }
            res = db.table("tasks").insert(row).execute()
            if res.data:
                saved["tasks"].append(res.data[0])

        # --- risks ---
        for item in intelligence.get("risks", []):
            row = {
                "project_id":  project_id,
                "meeting_id":  meeting_id,
                "description": item["description"],
                "mitigation":  item.get("mitigation"),
            }
            res = db.table("risks").insert(row).execute()
            if res.data:
                saved["risks"].append(res.data[0])

        # --- unresolved issues ---
        for item in intelligence.get("unresolved", []):
            row = {
                "project_id":  project_id,
                "meeting_id":  meeting_id,
                "description": item["description"],
            }
            res = db.table("unresolved_issues").insert(row).execute()
            if res.data:
                saved["unresolved"].append(res.data[0])

    except Exception as e:
        logging.error(f"Failed to persist intelligence for meeting {meeting_id}: {e}")
        raise RuntimeError(f"Database error saving intelligence: {str(e)}") from e

    logging.info(
        f"Saved intelligence for meeting {meeting_id}: "
        f"{len(saved['decisions'])} decisions, {len(saved['tasks'])} tasks, "
        f"{len(saved['risks'])} risks, {len(saved['unresolved'])} unresolved"
    )
    return saved
