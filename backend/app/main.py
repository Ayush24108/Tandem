import sys
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.projects import router as projects_router
from app.routes.meetings import router as meetings_router

# Ensure repo root is on sys.path for ai/ module imports
_repo_root = str(Path(__file__).resolve().parent.parent.parent)
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

# AI / ROPA router — provides /api/intelligence/analyze and /api/intelligence/ask
try:
    from ai.router import router as ai_router
except ImportError:
    ai_router = None

app = FastAPI(title="Tandem Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(projects_router)
app.include_router(meetings_router)
if ai_router is not None:
    app.include_router(ai_router)
