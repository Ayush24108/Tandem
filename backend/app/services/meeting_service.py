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
