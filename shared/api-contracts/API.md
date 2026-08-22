# Tandem API Contracts

This document specifies the interface contracts between the **Backend** (`backend/`), **Frontend** (`frontend/`), and **AI / ROPA Service** (`ai/`).

---

## 1. Intelligence Extraction

### `POST /api/meetings/{id}/analyze` or `POST /api/intelligence/analyze`
Processes an unstructured meeting transcript and returns structured project intelligence (Decisions, Tasks, Risks, Unresolved issues).

#### Request Body
```json
{
  "transcript": "Rahul: Let's use PostgreSQL because our data is relational.\nPriya: Agreed.\nManit: I'll handle the API.\nRahul: I'll implement the database schema.\nPriya: The auth integration may take longer than expected."
}
```

#### Response (`200 OK`)
Matches `shared/schemas/intelligence.json`:
```json
{
  "decisions": [
    {
      "id": "dec_1a2b3c",
      "title": "PostgreSQL selected as primary database",
      "reason": "Data structure is relational",
      "status": "confirmed",
      "confidence": 0.95
    }
  ],
  "tasks": [
    {
      "id": "task_2b3c4d",
      "title": "Implement the database schema",
      "owner": "Rahul",
      "status": "todo"
    },
    {
      "id": "task_3c4d5e",
      "title": "Handle the API implementation",
      "owner": "Manit",
      "status": "todo"
    }
  ],
  "risks": [
    {
      "id": "risk_4d5e6f",
      "title": "Authentication integration delay",
      "severity": "medium",
      "description": "Integration may take longer than expected"
    }
  ],
  "unresolved": []
}
```

---

## 2. Ask Tandem (Project Q&A)

### `POST /api/intelligence/ask`
Answers natural language questions over the project's current structured team state and recent meeting intelligence without requiring heavy vector databases or RAG.

#### Request Body
```json
{
  "query": "Why did we choose PostgreSQL?",
  "project_id": "proj_123",
  "team_state": {
    "decisions": [
      {
        "id": "dec_1a2b3c",
        "title": "PostgreSQL selected as primary database",
        "reason": "Data structure is relational",
        "status": "confirmed",
        "confidence": 0.95
      }
    ],
    "tasks": [],
    "risks": [],
    "unresolved": []
  },
  "recent_transcripts": [
    "Rahul: I think PostgreSQL makes more sense because our data is relational.\nPriya: Agreed."
  ]
}
```

#### Response (`200 OK`)
```json
{
  "answer": "PostgreSQL was selected because the team's data model is relational (decided in recent meeting by Rahul and Priya).",
  "sources": [
    {
      "type": "decision",
      "id": "dec_1a2b3c",
      "title": "PostgreSQL selected as primary database"
    }
  ]
}
```

---

## 3. Direct Python Interface for Backend

The backend can also invoke the AI/ROPA service directly in-process without network overhead:

```python
from ai.ropa_service import analyze_transcript, ask_tandem

# Analyze raw transcript
intelligence = analyze_transcript(transcript_text)
# Returns dict conforming to shared/schemas/intelligence.json

# Ask question over team state
response = ask_tandem(query_text, team_state=current_state, recent_transcripts=[...])
# Returns dict {"answer": str, "sources": list}
```

---

## 4. Error Handling Contract

| HTTP Code | Error Reason | Response Body | Fallback Behavior |
|---|---|---|---|
| `400 Bad Request` | Empty transcript or invalid input format | `{"error": "Invalid input", "message": "Transcript cannot be empty."}` | None |
| `422 Unprocessable Entity` | Schema validation error | `{"error": "Validation error", "details": [...]}` | Reject request |
| `500 Internal Error` / `503 Unavailable` | LLM API timeout/quota | In-process fallback returns deterministic rule-based intelligence so the app continues operating. | Fallback active |

---

## 5. Field Types & Enums Reference

### Decision
- `id` (string): Unique identifier (e.g. UUID or prefixed `dec_...`)
- `title` (string): Summary of the decision
- `reason` (string): Context or rationale
- `status` (string enum): `confirmed` | `proposed` | `superseded`
- `confidence` (float): Value between `0.0` and `1.0`

### Task
- `id` (string): Unique identifier (e.g. `task_...`)
- `title` (string): Actionable task description
- `owner` (string): Person name or `"Unassigned"`
- `status` (string enum): `todo` | `in_progress` | `done`

### Risk
- `id` (string): Unique identifier (e.g. `risk_...`)
- `title` (string): Brief risk summary
- `severity` (string enum): `low` | `medium` | `high`
- `description` (string): Detailed risk implications

### Unresolved
- `id` (string): Unique identifier (e.g. `unres_...`)
- `title` (string): Summary of the open question or pending discussion
- `status` (string enum): `open` | `resolved`
