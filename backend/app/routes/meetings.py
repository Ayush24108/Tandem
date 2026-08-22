"""
routes/meetings.py
-------------------
POST /meetings/{meeting_id}/audio

Accepts a multipart/form-data upload with field name "audio".
Pipeline:
  upload → temp file → Whisper → transcript → Supabase → response

Response shape:
  { "meeting_id": "...", "transcript": "..." }
"""

import os
import tempfile
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.services.database_service import get_db
from app.services.meeting_service import get_meeting_by_id, save_transcript
from app.services.whisper_service import transcribe_audio

router = APIRouter(prefix="/meetings", tags=["meetings"])

# Allowed audio MIME types / extensions
ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a",
    "audio/ogg", "audio/webm",
    "audio/flac",
    "application/octet-stream",  # browsers sometimes send this for .wav blobs
}

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac", ".mp4"}

MAX_AUDIO_BYTES = 100 * 1024 * 1024  # 100 MB hard cap


@router.post("/{meeting_id}/audio")
async def upload_audio(
    meeting_id: str,
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    db=Depends(get_db),
):
    """
    Accept an audio file upload, transcribe it with Whisper,
    persist the transcript, and return it.

    Errors:
      400 — missing, empty, or unsupported audio
      404 — meeting not found
      422 — Whisper could not process the audio
      500 — database failure
    """

    # ── 1. Validate file presence ──────────────────────────────────────────────
    if audio is None or audio.filename == "":
        raise HTTPException(status_code=400, detail="No audio file provided.")

    # ── 2. Validate content type / extension ───────────────────────────────────
    content_type = (audio.content_type or "").lower()
    ext = Path(audio.filename).suffix.lower() if audio.filename else ".wav"

    if content_type not in ALLOWED_AUDIO_TYPES and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported audio format '{content_type or ext}'. "
                f"Accepted: wav, mp3, m4a, ogg, webm, flac."
            ),
        )

    # ── 3. Read file bytes ────────────────────────────────────────────────────
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Audio file exceeds maximum allowed size of 100 MB.",
        )

    # ── 4. Verify meeting exists in Supabase ──────────────────────────────────
    try:
        meeting = get_meeting_by_id(db, meeting_id)
    except Exception as e:
        logging.error(f"DB error looking up meeting {meeting_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error looking up meeting.")

    if meeting is None:
        raise HTTPException(status_code=404, detail=f"Meeting '{meeting_id}' not found.")

    # ── 5. Write to temp file, transcribe, then always delete ─────────────────
    suffix = ext if ext in ALLOWED_EXTENSIONS else ".wav"
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=suffix, delete=False, prefix="tandem_audio_"
        ) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        logging.info(
            f"Saved upload for meeting {meeting_id} → temp file {tmp_path} "
            f"({len(audio_bytes)} bytes)"
        )

        try:
            transcript = transcribe_audio(tmp_path)
        except RuntimeError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Whisper transcription failed: {str(e)}",
            )

    finally:
        # Always clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
                logging.info(f"Deleted temp file: {tmp_path}")
            except OSError as cleanup_err:
                logging.warning(f"Could not delete temp file {tmp_path}: {cleanup_err}")

    # ── 6. Handle empty transcript ────────────────────────────────────────────
    if not transcript or not transcript.strip():
        logging.warning(
            f"Whisper returned empty transcript for meeting {meeting_id}. "
            "The audio may contain no speech."
        )
        # Still a valid result — store it and return it.
        transcript = ""

    # ── 7. Persist to Supabase ────────────────────────────────────────────────
    try:
        save_transcript(db, meeting_id, transcript)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ── 8. Return ─────────────────────────────────────────────────────────────
    logging.info(f"Transcript saved for meeting {meeting_id} ({len(transcript)} chars)")
    return {
        "meeting_id": meeting_id,
        "transcript": transcript,
    }
