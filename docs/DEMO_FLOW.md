# Tandem — Demo & Pitch Flow

**Tagline**: *"Understand Together. Build Better."*

---

## 2-Minute Demo Script

### Scene 1: The Problem (0:00 - 0:25)
> *"Engineering teams spend hours every week in meetings making critical architectural decisions and assigning action items. But 24 hours later, context is lost in Slack threads, audio recordings nobody listens to, or scattered docs."*

### Scene 2: Live Ingestion & Sound-Reactive Studio (0:25 - 0:55)
1. Navigate to `/meeting` on the web app.
2. Click **Start Recording**:
   - Show the 24-band audio waveform pulsing with live speech.
   - Show the live speaker diarization cycle and instant real-time decision detections.
3. Click **End Meeting**:
   - Whisper transcribes the speech.
   - ROPA extracts structured decisions, action items, and risks.

### Scene 3: Living Project State (0:55 - 1:25)
1. Click **Update Project State**:
   - The app updates the persistent database state in Supabase.
   - Redirects to `/project/project-alpha`.
2. Highlight:
   - **Confirmed Decisions**: *"PostgreSQL selected for relational ACID compliance"* with rationale.
   - **Assigned Tasks**: *"Database schema design"* → Rahul, *"API routes"* → Manit.
   - **Active Risks**: *"Authentication integration delay"*.
   - **Team Pulse**: Instant velocity counters.

### Scene 4: Ask Tandem Q&A (1:25 - 1:50)
1. Click the floating **Ask Tandem** button (bottom right) or press `⌘K`.
2. Type or click: *"What did we decide about the database?"*
3. Show the instant answer with explicit source citation: *"PostgreSQL selected because data is relational"*.

### Scene 5: Wrap-up & Value (1:50 - 2:00)
> *"Tandem transforms ephemeral voice discussions into persistent, searchable project intelligence—keeping everyone on the same page automatically."*
