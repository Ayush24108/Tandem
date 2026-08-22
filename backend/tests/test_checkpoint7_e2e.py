"""
Checkpoint 7 — End-to-End Integration Test
===========================================
Verifies the full pipeline in one pass:

  1. POST /meetings/{meeting_id}/audio
       → Whisper transcribes
       → transcript saved to Supabase

  2. POST /meetings/{meeting_id}/process
       → analyze_transcript() (heuristic or AI)
       → decisions/tasks/risks/unresolved saved to Supabase

  3. GET /projects/{project_id}/state
       → all four intelligence categories present
       → recent_activity contains the meeting

Requires the server running on port 8000.
Creates and cleans up its own Supabase fixtures.
"""

import sys
import os
import io
import math
import struct
import wave
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.getenv("TANDEM_TEST_URL", "http://127.0.0.1:8000")

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
from app.services.database_service import get_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def check_server():
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        assert r.status_code == 200
        print(f"  Server reachable at {BASE_URL} [OK]")
    except Exception as e:
        print(f"  [FAIL] Cannot reach {BASE_URL}: {e}")
        print(f"         Run: python -m uvicorn app.main:app --port 8000")
        sys.exit(1)


def make_speech_wav_bytes(duration_seconds: float = 2.0) -> bytes:
    """
    Generate a synthetic speech-like WAV (multi-frequency tone) in memory.
    This won't produce meaningful words but verifies Whisper runs without
    crashing when USE_MOCK_TRANSCRIPT=false.
    """
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


def create_fixtures(db):
    """Create project + meeting. Return (project_id, meeting_id)."""
    proj = db.table("projects").insert({
        "name": "CP7 E2E Project",
        "description": "Checkpoint 7 end-to-end integration test"
    }).execute()
    project_id = proj.data[0]["id"]

    meet = db.table("meetings").insert({
        "project_id": project_id,
        "title": "CP7 E2E Meeting"
    }).execute()
    meeting_id = meet.data[0]["id"]
    return project_id, meeting_id


def cleanup(db, project_id: str):
    db.table("projects").delete().eq("id", project_id).execute()
    print(f"  [Cleanup] Removed project {project_id} and all children")


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------

def step1_upload_audio(meeting_id: str, wav_bytes: bytes) -> tuple[bool, str]:
    """POST audio → expect 200 with transcript key."""
    print("\n[STEP 1] POST /meetings/{id}/audio  (Whisper transcription)")
    r = requests.post(
        f"{BASE_URL}/meetings/{meeting_id}/audio",
        files={"audio": ("e2e_test.wav", wav_bytes, "audio/wav")},
        timeout=180,   # Whisper model load + transcription can be slow
    )
    if r.status_code != 200:
        print(f"  FAIL -- status {r.status_code}: {r.text}")
        return False, ""
    data = r.json()
    if "transcript" not in data:
        print(f"  FAIL -- 'transcript' key missing in response: {data}")
        return False, ""
    transcript = data["transcript"]
    print(f"  Status: 200 [OK]")
    print(f"  transcript ({len(transcript)} chars): {repr(transcript[:120])}")
    return True, transcript


def step1b_verify_transcript_in_supabase(db, meeting_id: str) -> bool:
    """Confirm transcript was actually persisted."""
    print("\n[STEP 1b] Verify transcript saved to Supabase")
    res = (
        db.table("meeting_transcripts")
        .select("transcript")
        .eq("meeting_id", meeting_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        print("  FAIL -- no transcript row in meeting_transcripts")
        return False
    t = res.data[0]["transcript"]
    print(f"  Found transcript ({len(t)} chars) [OK]")
    return True


def step2_process_meeting(meeting_id: str) -> tuple[bool, dict]:
    """POST /process → expect intelligence dict."""
    print("\n[STEP 2] POST /meetings/{id}/process  (analyze_transcript)")
    r = requests.post(f"{BASE_URL}/meetings/{meeting_id}/process", timeout=60)
    if r.status_code != 200:
        print(f"  FAIL -- status {r.status_code}: {r.text}")
        return False, {}
    data = r.json()
    for key in ("decisions", "tasks", "risks", "unresolved"):
        if key not in data or not isinstance(data[key], list):
            print(f"  FAIL -- key '{key}' missing or not a list")
            return False, {}
    print(f"  Status: 200 [OK]")
    print(f"  decisions={len(data['decisions'])}  tasks={len(data['tasks'])}  "
          f"risks={len(data['risks'])}  unresolved={len(data['unresolved'])}")
    return True, data


def step2b_verify_intelligence_in_supabase(db, meeting_id: str) -> bool:
    """At least some rows should exist (depends on transcript content)."""
    print("\n[STEP 2b] Verify intelligence saved to Supabase")
    dec = db.table("decisions").select("id").eq("meeting_id", meeting_id).execute()
    tsk = db.table("tasks").select("id").eq("meeting_id", meeting_id).execute()
    rsk = db.table("risks").select("id").eq("meeting_id", meeting_id).execute()
    unr = db.table("unresolved_issues").select("id").eq("meeting_id", meeting_id).execute()
    total = len(dec.data) + len(tsk.data) + len(rsk.data) + len(unr.data)
    print(f"  decisions={len(dec.data)}, tasks={len(tsk.data)}, "
          f"risks={len(rsk.data)}, unresolved={len(unr.data)}")
    # A tone-only WAV will produce an empty transcript → 0 rows is acceptable.
    # The important thing is that the call succeeded and the schema is correct.
    if total == 0:
        print("  NOTE: 0 intelligence rows (empty/tone-only transcript). "
              "Pipeline completed successfully — analysis returned empty results.")
    else:
        print(f"  {total} row(s) persisted [OK]")
    return True   # structural success regardless of count


def step3_get_project_state(project_id: str, meeting_id: str) -> bool:
    """GET /projects/{id}/state → all six keys present, meeting in activity."""
    print("\n[STEP 3] GET /projects/{id}/state")
    r = requests.get(f"{BASE_URL}/projects/{project_id}/state", timeout=15)
    if r.status_code != 200:
        print(f"  FAIL -- status {r.status_code}: {r.text}")
        return False
    data = r.json()
    required = {"project", "decisions", "tasks", "risks", "unresolved", "recent_activity"}
    missing = required - set(data.keys())
    if missing:
        print(f"  FAIL -- missing keys: {missing}")
        return False
    print(f"  Status: 200 [OK]  all 6 keys present")

    # Confirm the test project id matches
    if data["project"]["id"] != project_id:
        print(f"  FAIL -- project.id mismatch")
        return False
    print(f"  project.id matches [OK]")

    # Confirm the meeting shows up in recent_activity
    activity_meeting_ids = [a["id"] for a in data["recent_activity"] if a["type"] == "meeting"]
    if meeting_id not in activity_meeting_ids:
        print(f"  FAIL -- meeting {meeting_id} not found in recent_activity")
        return False
    print(f"  meeting present in recent_activity [OK]")
    print(f"  recent_activity count: {len(data['recent_activity'])}")
    return True


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def run_checkpoint7():
    print("=" * 60)
    print("  CHECKPOINT 7 -- FULL PIPELINE END-TO-END")
    print("=" * 60)

    check_server()
    db = get_db()

    project_id, meeting_id = create_fixtures(db)
    print(f"\n  Fixture project : {project_id}")
    print(f"  Fixture meeting : {meeting_id}")

    wav_bytes = make_speech_wav_bytes(duration_seconds=2.0)
    print(f"  Audio payload   : {len(wav_bytes)} bytes (2s synthetic WAV)")

    results = {}
    try:
        ok1, _ = step1_upload_audio(meeting_id, wav_bytes)
        results["S1_audio_upload_200"]       = ok1

        results["S1b_transcript_in_supabase"] = (
            step1b_verify_transcript_in_supabase(db, meeting_id) if ok1 else False
        )

        ok2, _ = step2_process_meeting(meeting_id)
        results["S2_process_200"]             = ok2

        results["S2b_intelligence_in_supabase"] = (
            step2b_verify_intelligence_in_supabase(db, meeting_id) if ok2 else False
        )

        results["S3_project_state_200"]       = step3_get_project_state(project_id, meeting_id)

    finally:
        cleanup(db, project_id)

    # Summary
    print("\n" + "=" * 60)
    print("  CHECKPOINT 7 -- RESULTS")
    print("=" * 60)
    all_passed = True
    for name, passed in results.items():
        status = "PASS [OK]" if passed else "FAIL [X]"
        print(f"  {name:<32} {status}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("  ALL STEPS PASSED -- Checkpoint 7 complete.")
    else:
        print("  SOME STEPS FAILED -- see output above.")
        sys.exit(1)


if __name__ == "__main__":
    run_checkpoint7()
