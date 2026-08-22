# Tandem — Production Deployment & Verification Guide

This guide details how to deploy the **Tandem** application to production with zero friction.

---

## Architecture Overview

```
                        ┌────────────────────────┐
                        │   Vercel (Frontend)    │
                        │      Next.js 15        │
                        └──────────┬─────────────┘
                                   │ HTTPS REST (NEXT_PUBLIC_API_URL)
                                   ▼
                        ┌────────────────────────┐
                        │ Railway / Render (API) │
                        │        FastAPI         │
                        └──────────┬─────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    ┌──────────────────────┐               ┌──────────────────────┐
    │  Supabase (Database) │               │   ROPA Intelligence  │
    │ PostgreSQL + Auth    │               │ Deterministic / LLM  │
    └──────────────────────┘               └──────────────────────┘
```

---

## 1. Backend Deployment (Railway or Render)

### Option A: Railway (Recommended — 2 minutes)
1. Go to [railway.app](https://railway.app) and create a **New Project** → **Deploy from GitHub repo**.
2. Select `Ayush24108/Tandem`.
3. In **Settings**:
   - **Root Directory**: `backend` (or leave default with root `Procfile`)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Variables**, add:
   - `SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGci...`
   - `USE_MOCK_TRANSCRIPT` = `true` (or `false` if hosting supports Whisper/ffmpeg)
   - `GITHUB_TOKEN` = `ghp_...` (optional: enables LLM extraction)
5. Generate a public domain (e.g. `https://tandem-backend.up.railway.app`).
6. Test health: `https://tandem-backend.up.railway.app/health` → `{"status": "ok"}`.

### Option B: Render
1. Go to [render.com](https://render.com) → **New Web Service**.
2. Connect your GitHub repository.
3. Settings:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `USE_MOCK_TRANSCRIPT=true`).

---

## 2. Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import Git Repository.
2. Select `Ayush24108/Tandem`.
3. Configure Project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://your-deployed-backend-url.railway.app`
5. Click **Deploy**.

---

## 3. End-to-End Production Verification Checklist

- [ ] `GET https://your-backend/health` returns `{"status": "ok"}`
- [ ] `GET https://your-backend/projects` returns live Supabase projects
- [ ] Open frontend on desktop and mobile
- [ ] Record a test meeting on `/meeting` → verify audio upload and ROPA extraction
- [ ] Check `/project/project-alpha` → verify decisions, tasks, and risks are synced from Supabase
- [ ] Click **Ask Tandem** (bottom right) → ask *"What did we decide about the database?"* → verify source citations
