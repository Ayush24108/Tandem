# Tandem AI / ROPA Intelligence Engine

The Tandem AI Engine transforms unstructured meeting transcripts into structured project intelligence (`decisions`, `tasks`, `risks`, `unresolved`) and answers natural language questions over team state.

---

## 1. Quick Integration for Backend

### Option A: In-Process Python Call (Recommended)

```python
from ai.ropa_service import analyze_transcript, ask_tandem

# 1. Analyze Meeting Transcript
# Automatically uses configured LLM (Gemini/OpenAI) with deterministic offline fallback
intelligence = analyze_transcript(transcript_text)
# Returns dict conforming to shared/schemas/intelligence.json:
# {
#   "decisions": [{"id": "...", "title": "...", "reason": "...", "status": "confirmed", "confidence": 0.95}],
#   "tasks": [{"id": "...", "title": "...", "owner": "...", "status": "todo"}],
#   "risks": [{"id": "...", "title": "...", "severity": "medium", "description": "..."}],
#   "unresolved": [{"id": "...", "title": "...", "status": "open"}]
# }

# 2. Ask Tandem (Q&A over Team State)
response = ask_tandem(
    query="Why did we choose PostgreSQL?",
    team_state=current_project_team_state,
    recent_transcripts=[transcript_text]
)
# Returns: {"answer": "...", "sources": [{"type": "decision", "id": "...", "title": "..."}]}
```

### Option B: FastAPI Router

If mounting as API endpoints in FastAPI backend:
```python
from fastapi import FastAPI
from ai.router import router as ai_router

app = FastAPI()
if ai_router:
    app.include_router(ai_router)
```

Endpoints exposed:
- `POST /api/intelligence/analyze` — Request: `{"transcript": "..."}`
- `POST /api/intelligence/ask` — Request: `{"query": "...", "team_state": {...}, "recent_transcripts": [...]}`

---

## 2. Configuration (`.env`)

Add to `ai/.env` or root `.env`:

```env
# Google Gemini (Default recommended)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-flash-latest

# Or OpenAI / OpenAI-compatible
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_BASE_URL=https://api.openai.com/v1
```

*Note: If no API key is provided or the network is offline, the engine automatically runs using the local deterministic ROPA engine without crashing.*

---

## 3. Running Tests

```bash
python -m pytest
```
