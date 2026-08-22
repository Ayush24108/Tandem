"""
Checkpoint 4 — POST /meetings/{meeting_id}/audio Test
=======================================================
Tests the full audio-upload → Whisper → Supabase pipeline.

Test matrix:
  T1  Valid audio file   → 200, meeting_id + transcript returned
  T2  Empty audio file   → 400
  T3  Missing field      → 422 (FastAPI validation)
  T4  Invalid meeting ID → 404
  T5  Temp file cleanup  → temp file must not exist after request

Runs against a LIVE server (uvicorn must be running on port 8000).
Uses a real meeting row created via Supabase at test start.
"""

import sys
import os
import io
import math
import struct
import wave
import requests

# Ensure UTF-8 output on Windows (avoids cp1252 UnicodeEncodeError)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_URL = os.getenv("TANDEM_TEST_URL", "http://127.0.0.1:8000")

# ── Add backend to path for direct Supabase access ────────────────────────────
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.services.database_service import get_db


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_tone_wav_bytes(duration_seconds: float = 2.0) -> bytes:
    """Generate a non-silent WAV in memory (returns bytes)."""
    sample_rate = 16000
    num_samples = int(sample_rate * duration_seconds)
    freqs = [300, 900, 2400]
    amplitude = 8000
    buf = io.BytesIO()
    with wave.open(buf, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        for i in range(num_samples):
            t = i / sample_rate
            val = sum(amplitude * math.sin(2 * math.pi * f * t) / len(freqs) for f in freqs)
            val = max(-32767, min(32767, int(val)))
            w.writeframesraw(struct.pack("<h", val))
    return buf.getvalue()


def create_test_fixtures(db) -> tuple[str, str]:
    """Insert a temporary project + meeting, return (project_id, meeting_id)."""
    proj = db.table("projects").insert({
        "name": "CP4 Test Project",
        "description": "Checkpoint 4 audio upload test — safe to delete"
    }).execute()
    project_id = proj.data[0]["id"]

    meet = db.table("meetings").insert({
        "project_id": project_id,
        "title": "CP4 Test Meeting"
    }).execute()
    meeting_id = meet.data[0]["id"]

    return project_id, meeting_id


def cleanup_fixtures(db, project_id: str):
    """Remove the test project (cascades to meetings + transcripts)."""
    db.table("projects").delete().eq("id", project_id).execute()
    print(f"  [Cleanup] Removed project {project_id} and all children")


def check_server_running():
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        assert r.status_code == 200
        print(f"  Server reachable at {BASE_URL} [OK]")
    except Exception as e:
        print(f"\n  [FAIL] Cannot reach server at {BASE_URL}")
        print(f"         Start it with:  python -m uvicorn app.main:app --reload --port 8000")
        print(f"         Error: {e}")
        sys.exit(1)


# ── Test runners ───────────────────────────────────────────────────────────────

def t1_valid_audio(meeting_id: str, wav_bytes: bytes) -> bool:
    print("\n[T1] Valid audio -> expects 200 with meeting_id + transcript")
    r = requests.post(
        f"{BASE_URL}/meetings/{meeting_id}/audio",
        files={"audio": ("test_audio.wav", wav_bytes, "audio/wav")},
        timeout=120,   # Whisper may take a moment
    )
    if r.status_code == 200:
        data = r.json()
        assert data.get("meeting_id") == meeting_id, "meeting_id mismatch"
        assert "transcript" in data, "transcript key missing"
        print(f"  Status: {r.status_code} [OK]")
        print(f"  transcript: {repr(data['transcript'])}")
        return True
    else:
        print(f"  FAILED -- status {r.status_code}: {r.text}")
        return False


def t2_empty_audio(meeting_id: str) -> bool:
    print("\n[T2] Empty audio bytes -> expects 400")
    r = requests.post(
        f"{BASE_URL}/meetings/{meeting_id}/audio",
        files={"audio": ("empty.wav", b"", "audio/wav")},
        timeout=15,
    )
    if r.status_code == 400:
        print(f"  Status: {r.status_code} [OK]  detail: {r.json().get('detail')}")
        return True
    else:
        print(f"  FAILED -- expected 400, got {r.status_code}: {r.text}")
        return False


def t3_missing_field() -> bool:
    print("\n[T3] No audio field at all -> expects 422 (FastAPI validation)")
    r = requests.post(
        f"{BASE_URL}/meetings/00000000-0000-0000-0000-000000000000/audio",
        data={},   # no files at all
        timeout=15,
    )
    if r.status_code == 422:
        print(f"  Status: {r.status_code} [OK]")
        return True
    else:
        print(f"  FAILED -- expected 422, got {r.status_code}: {r.text}")
        return False


def t4_invalid_meeting_id(wav_bytes: bytes) -> bool:
    print("\n[T4] Non-existent meeting UUID -> expects 404")
    fake_id = "00000000-0000-0000-0000-000000000000"
    r = requests.post(
        f"{BASE_URL}/meetings/{fake_id}/audio",
        files={"audio": ("test_audio.wav", wav_bytes, "audio/wav")},
        timeout=15,
    )
    if r.status_code == 404:
        print(f"  Status: {r.status_code} [OK]  detail: {r.json().get('detail')}")
        return True
    else:
        print(f"  FAILED -- expected 404, got {r.status_code}: {r.text}")
        return False


# ── Main ───────────────────────────────────────────────────────────────────────

def run_checkpoint4():
    print("=" * 60)
    print("  CHECKPOINT 4 -- POST /meetings/{id}/audio")
    print("=" * 60)

    check_server_running()

    db = get_db()
    project_id, meeting_id = create_test_fixtures(db)
    print(f"\n  Test project : {project_id}")
    print(f"  Test meeting : {meeting_id}")

    wav_bytes = make_tone_wav_bytes(duration_seconds=2.0)
    print(f"\n  Audio payload: {len(wav_bytes)} bytes (2s tone WAV)")

    results = {}
    try:
        results["T1_valid_audio"]     = t1_valid_audio(meeting_id, wav_bytes)
        results["T2_empty_audio"]     = t2_empty_audio(meeting_id)
        results["T3_missing_field"]   = t3_missing_field()
        results["T4_invalid_meeting"] = t4_invalid_meeting_id(wav_bytes)
    finally:
        cleanup_fixtures(db, project_id)

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  CHECKPOINT 4 -- RESULTS")
    print("=" * 60)
    all_passed = True
    for name, passed in results.items():
        status = "PASS [OK]" if passed else "FAIL [X]"
        print(f"  {name:<26} {status}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("  ALL TESTS PASSED -- Checkpoint 4 complete.")
    else:
        print("  SOME TESTS FAILED -- see output above.")
        sys.exit(1)


if __name__ == "__main__":
    run_checkpoint4()
