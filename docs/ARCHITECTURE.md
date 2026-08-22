# Tandem — System Architecture

Tandem transforms team conversations into persistent project intelligence without complex vector databases or heavyweight sync protocols.

---

## High-Level Architecture

```
                               ┌────────────────────────┐
                               │   Next.js 15 Frontend  │
                               │  Dark Cybernetic UI    │
                               └───────────┬────────────┘
                                           │
                             HTTPS REST (NEXT_PUBLIC_API_URL)
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │    FastAPI Backend     │
                               │   REST Routing & CORS  │
                               └───────────┬────────────┘
                                           │
               ┌───────────────────────────┼───────────────────────────┐
               ▼                           ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
    │   Whisper Audio STT  │    │  ROPA Engine & AI    │    │  Supabase PostgreSQL │
    │ Speech-to-Transcript │    │ Decisions / Tasks /  │    │ Persistent Source    │
    │ (Local / Fallback)   │    │ Risks / Unresolved   │    │ of Truth             │
    └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

---

## Subsystems

### 1. Frontend (`frontend/`)
- **Framework**: Next.js 15 (App Router) + React 18 + Tailwind CSS.
- **Visuals**: Dark cybernetic theme (`#070b14`), electric blue accents, WebGL2 MetallicPaint shader, Three.js soundwaves/dither, PixelSwap bento grids.
- **State Flow**: Stateless UI layer reading and writing through the FastAPI REST layer directly to Supabase.
- **Pages**:
  - `/` — Brand homepage with interactive capability bento and live terminal.
  - `/workspace` — Project directory with live team pulse, search, and filter chips.
  - `/project/[id]` — Living project state (confirmed decisions, tasks with assignees, risks, unresolved questions, audit trail) with Ask Tandem Q&A.
  - `/meeting` — Meeting recorder with sound-reactive waveform, speaker cycling, live toasts, and automatic intelligence extraction.

### 2. Backend (`backend/`)
- **Framework**: FastAPI + Uvicorn.
- **API Endpoints**:
  - `GET /health` — Service liveness probe.
  - `GET /projects` — List all projects.
  - `GET /projects/{id}/full` — Consolidated project intelligence for frontend rendering.
  - `GET /projects/{id}/state` — Raw database state with activity items.
  - `POST /meetings/{id}/audio` — Upload audio, transcribe with Whisper, store transcript.
  - `POST /meetings/{id}/process` — Analyze transcript with ROPA, extract intelligence, persist to Supabase.
  - `POST /api/intelligence/analyze` — Standalone transcript extraction endpoint.
  - `POST /api/intelligence/ask` — Natural language Q&A reasoning directly over structured team state.

### 3. AI / ROPA Engine (`ai/`)
- **ROPA (Reasoning on Project Artifacts)**: Deterministic rule-based extraction engine with multi-speaker parsing and ambiguity detection.
- **LLM Integration**: Direct API client supporting GitHub Models (free GPT-4o-mini tier), OpenAI, and Google Gemini with automatic zero-downtime deterministic fallback.
- **Zero-Dependency Fallback**: Works 100% offline without third-party LLM keys or network access.

### 4. Database (`Supabase`)
- **Tables**: `projects`, `meetings`, `meeting_transcripts`, `decisions`, `tasks`, `risks`, `unresolved_issues`.
- **Integrity**: Foreign key cascading deletes, default UUIDs, ISO timestamps.
