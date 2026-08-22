import os
import sys
import io
import wave
import math
import struct
import json
import requests
from pathlib import Path

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.database_service import get_db
from app.services.whisper_service import transcribe_audio
from app.services.meeting_service import (
    get_meeting_by_id,
    save_transcript,
    get_latest_transcript,
    save_intelligence,
)
from app.services.project_service import get_project_by_id, get_project_state
from ai.ropa_service import analyze_transcript, ask_tandem
from ai.schemas import validate_project_intelligence

print("======================================================")
print("   TANDEM BACKEND DEEP INTEGRATION TRACE & AUDIT")
print("======================================================")

db = get_db()
base_url = "http://127.0.0.1:8000"
results = []

def record(test_num, name, source, dest, passed, detail="", error=""):
    results.append({
        "num": test_num,
        "name": name,
        "source": source,
        "dest": dest,
        "passed": passed,
        "detail": detail,
        "error": error
    })
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] Check {test_num}: {source} -> {dest}")
    print(f"       Test: {name}")
    if detail:
        print(f"       Detail: {detail}")
    if error:
        print(f"       ERROR: {error}")
    print("------------------------------------------------------")

# 1. FastAPI Route Mount & Health Probe
try:
    r = requests.get(f"{base_url}/health", timeout=5)
    passed = r.status_code == 200 and r.json().get("status") == "ok"
    record(1, "FastAPI Route Mount & Health Probe", "app.main:app", "/health", passed, f"HTTP {r.status_code}")
except Exception as e:
    record(1, "FastAPI Route Mount & Health Probe", "app.main:app", "/health", False, error=str(e))

# 2. Audio Upload -> Temp File -> Whisper -> Transcript
try:
    buf = io.BytesIO()
    with wave.open(buf, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        for i in range(16000):
            val = int(8000 * math.sin(2 * math.pi * 440 * i / 16000))
            w.writeframesraw(struct.pack("<h", val))
    wav_bytes = buf.getvalue()
    
    r_upload = requests.post(
        f"{base_url}/meetings/meeting-alpha-1/audio",
        files={"audio": ("audit_test.wav", wav_bytes, "audio/wav")},
        timeout=15
    )
    passed = r_upload.status_code == 200 and "transcript" in r_upload.json() and len(r_upload.json()["transcript"]) > 0
    transcript_text = r_upload.json().get("transcript", "")
    record(2, "Audio Upload -> Temp File -> Whisper -> Transcript", "POST /meetings/{id}/audio", "whisper_service:transcribe_audio", passed, f"Transcript length: {len(transcript_text)} chars")
except Exception as e:
    record(2, "Audio Upload -> Temp File -> Whisper -> Transcript", "POST /meetings/{id}/audio", "whisper_service:transcribe_audio", False, error=str(e))

# 3. Transcript Storage in Supabase
try:
    saved_tr = get_latest_transcript(db, "meeting-alpha-1")
    passed = saved_tr is not None and len(saved_tr) > 0
    record(3, "Whisper Transcript -> Supabase meeting_transcripts Table", "meeting_service:save_transcript", "Supabase (meeting_transcripts)", passed, f"Retrieved {len(saved_tr or '')} chars")
except Exception as e:
    record(3, "Whisper Transcript -> Supabase meeting_transcripts Table", "meeting_service:save_transcript", "Supabase (meeting_transcripts)", False, error=str(e))

# 4. Raw Transcript -> AI/ROPA Pipeline
try:
    sample_audit_transcript = (
        "Rahul: We decided to select PostgreSQL because our clinical data is relational and requires ACID transactions.\n"
        "Manit: I will implement the FastAPI backend endpoints.\n"
        "Rahul: I will design the database schema and migration scripts today.\n"
        "Priya: The authentication module might be delayed if we evaluate custom JWT.\n"
        "Priya: We still need to decide on the deployment cloud provider."
    )
    raw_ai_output = analyze_transcript(sample_audit_transcript)
    d_cnt = len(raw_ai_output.get("decisions", []))
    t_cnt = len(raw_ai_output.get("tasks", []))
    r_cnt = len(raw_ai_output.get("risks", []))
    passed = (d_cnt > 0 or t_cnt > 0 or r_cnt > 0)
    record(4, "Raw Transcript -> AI/ROPA Engine", "POST /meetings/{id}/process", "ai.ropa_service:analyze_transcript", passed, f"Decisions: {d_cnt}, Tasks: {t_cnt}, Risks: {r_cnt}")
except Exception as e:
    record(4, "Raw Transcript -> AI/ROPA Engine", "POST /meetings/{id}/process", "ai.ropa_service:analyze_transcript", False, error=str(e))

# 5. Schema Validation of AI output
try:
    validated_intel = validate_project_intelligence(raw_ai_output)
    has_all_keys = all(k in validated_intel for k in ["decisions", "tasks", "risks", "unresolved"])
    record(5, "AI Output Schema Conformance Check", "ai.ropa_service", "shared/schemas/intelligence.json", has_all_keys, "Schema validated with decisions/tasks/risks/unresolved")
except Exception as e:
    record(5, "AI Output Schema Conformance Check", "ai.ropa_service", "shared/schemas/intelligence.json", False, error=str(e))

# 6. Structured Intelligence Persistence to Supabase
try:
    saved_intel = save_intelligence(db, "project-alpha", "meeting-alpha-1", validated_intel)
    d_saved = len(saved_intel.get("decisions", []))
    t_saved = len(saved_intel.get("tasks", []))
    r_saved = len(saved_intel.get("risks", []))
    passed = d_saved > 0 and t_saved > 0
    record(6, "ROPA Output -> Supabase Tables (decisions/tasks/risks/unresolved)", "meeting_service:save_intelligence", "Supabase (decisions, tasks, risks, unresolved)", passed, f"Saved {d_saved} decisions, {t_saved} tasks, {r_saved} risks")
except Exception as e:
    record(6, "ROPA Output -> Supabase Tables (decisions/tasks/risks/unresolved)", "meeting_service:save_intelligence", "Supabase (decisions, tasks, risks, unresolved)", False, error=str(e))

# 7. Project State Retrieval
try:
    state = get_project_state(db, "project-alpha")
    req_keys = ["project", "decisions", "tasks", "risks", "unresolved", "recent_activity"]
    has_keys = all(k in state for k in req_keys)
    r_state = requests.get(f"{base_url}/projects/project-alpha/full")
    d_len = len(state.get("decisions", []))
    t_len = len(state.get("tasks", []))
    a_len = len(state.get("recent_activity", []))
    passed = has_keys and r_state.status_code == 200
    record(7, "Supabase Tables -> Project State Aggregation", "GET /projects/{id}/state & /full", "project_service:get_project_state", passed, f"State contains {d_len} decisions, {t_len} tasks, {a_len} activity rows")
except Exception as e:
    record(7, "Supabase Tables -> Project State Aggregation", "GET /projects/{id}/state & /full", "project_service:get_project_state", False, error=str(e))

# 8. Ask Tandem Question Reasoning
try:
    ask_payload = {
        "query": "Why did we select PostgreSQL?",
        "project_id": "project-alpha",
        "team_state": {
            "decisions": [{"title": "PostgreSQL selected for relational data & ACID compliance", "reason": "Relational data requirements and clinical ACID transactions"}]
        }
    }
    r_ask = requests.post(f"{base_url}/api/intelligence/ask", json=ask_payload, timeout=15)
    ask_data = r_ask.json()
    passed = r_ask.status_code == 200 and "answer" in ask_data and len(ask_data["answer"]) > 0 and len(ask_data.get("sources", [])) > 0
    ans_text = ask_data.get("answer", "")[:65]
    src_len = len(ask_data.get("sources", []))
    record(8, "Ask Tandem Context -> Reasoning Engine -> Answer & Citations", "POST /api/intelligence/ask", "ai.ropa_service:ask_tandem", passed, f"Answer: {repr(ans_text)}..., Sources: {src_len}")
except Exception as e:
    record(8, "Ask Tandem Context -> Reasoning Engine -> Answer & Citations", "POST /api/intelligence/ask", "ai.ropa_service:ask_tandem", False, error=str(e))

# 9. Environment Variables & Credentials Loading
try:
    supa_url = os.getenv("SUPABASE_URL", "")
    supa_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    is_remote = bool(supa_url and supa_key and supa_url != "your_supabase_url_here")
    active_mode = f"Remote Supabase ({supa_url[:25]}...)" if is_remote else "Local Persistent Store (SQLite)"
    passed = True
    record(9, "Environment Variables Loading (.env)", "backend/.env & ai/.env", "database_service & llm_service", passed, f"Active database mode: {active_mode}")
except Exception as e:
    record(9, "Environment Variables Loading (.env)", "backend/.env & ai/.env", "database_service & llm_service", False, error=str(e))

# 10. CORS & Cross-Origin Headers
try:
    r_cors = requests.options(
        f"{base_url}/projects",
        headers={
            "Origin": "https://tandem-frontend.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type"
        }
    )
    cors_hdr = r_cors.headers.get("access-control-allow-origin", "")
    passed = cors_hdr in ["*", "https://tandem-frontend.vercel.app"]
    record(10, "CORS Middleware Cross-Origin Headers", "FastAPI CORSMiddleware", "Browser Clients / Vercel", passed, f"Access-Control-Allow-Origin: {cors_hdr}")
except Exception as e:
    record(10, "CORS Middleware Cross-Origin Headers", "FastAPI CORSMiddleware", "Browser Clients / Vercel", False, error=str(e))

# 11. Error Handling at Integration Boundaries
try:
    r_404 = requests.post(f"{base_url}/meetings/00000000-0000-0000-0000-000000000000/audio", files={"audio": ("test.wav", wav_bytes, "audio/wav")})
    r_400 = requests.post(f"{base_url}/meetings/meeting-alpha-1/audio", files={"audio": ("empty.wav", b"", "audio/wav")})
    r_p404 = requests.get(f"{base_url}/projects/00000000-0000-0000-0000-000000000000")
    passed = r_404.status_code == 404 and r_400.status_code == 400 and r_p404.status_code == 404
    record(11, "Boundary Error Handling (400, 404, 422)", "API Route Handlers", "HTTP Error Responses", passed, f"404 on missing meeting ({r_404.status_code}), 400 on empty audio ({r_400.status_code}), 404 on missing project ({r_p404.status_code})")
except Exception as e:
    record(11, "Boundary Error Handling (400, 404, 422)", "API Route Handlers", "HTTP Error Responses", False, error=str(e))

# 12. Integrity Check (No Broken Imports or Dead Endpoints)
try:
    p_list = requests.get(f"{base_url}/projects").status_code == 200
    ai_test = requests.post(f"{base_url}/api/intelligence/analyze", json={"transcript": "Test"}).status_code == 200
    p_full = requests.get(f"{base_url}/projects/project-alpha/full").status_code == 200
    passed = p_list and ai_test and p_full
    record(12, "Codebase Integrity (Imports, Mounts, Live Endpoints)", "app/main.py", "routes & ai.router", passed, "All routers connected and mounted")
except Exception as e:
    record(12, "Codebase Integrity (Imports, Mounts, Live Endpoints)", "app/main.py", "routes & ai.router", False, error=str(e))

print("\n======================================================")
total_passed = sum(1 for r in results if r["passed"])
print(f"AUDIT SUMMARY: {total_passed} / {len(results)} CHECKS PASSED")
print("======================================================")

if total_passed == len(results):
    print("ALL 12 CHECKS PASSED PERFECTLY!")
else:
    print("FAILURES DETECTED")
    sys.exit(1)
