"""
FastAPI Router for Tandem AI / ROPA Integration.
Can be mounted directly by the FastAPI backend:
    from ai.router import router as ai_router
    app.include_router(ai_router)
"""

from typing import Any, Dict, List, Optional
try:
    from fastapi import APIRouter, HTTPException, status
    from pydantic import BaseModel, Field
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    APIRouter = object
    BaseModel = object

from ai.ropa_service import analyze_transcript, ask_tandem

if FASTAPI_AVAILABLE:
    router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])

    class AnalyzeTranscriptRequest(BaseModel):
        transcript: str = Field(..., min_length=1, description="Raw text transcript of the meeting")

    class AskTandemRequest(BaseModel):
        query: str = Field(..., min_length=1, description="Question about project decisions, tasks, or state")
        team_state: Optional[Dict[str, Any]] = Field(default=None, description="Consolidated team state")
        recent_transcripts: Optional[List[str]] = Field(default=None, description="Recent meeting transcripts")

    @router.post("/analyze", response_model=Dict[str, Any])
    async def analyze_meeting_transcript(payload: AnalyzeTranscriptRequest) -> Dict[str, Any]:
        """
        Analyzes a meeting transcript and returns structured project intelligence.
        Matches shared/schemas/intelligence.json.
        """
        if not payload.transcript.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transcript cannot be empty.",
            )
        try:
            return analyze_transcript(payload.transcript)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Intelligence extraction error: {exc}",
            )

    @router.post("/ask", response_model=Dict[str, Any])
    async def ask_tandem_endpoint(payload: AskTandemRequest) -> Dict[str, Any]:
        """
        Answers natural language queries regarding team decisions, tasks, and state.
        """
        if not payload.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query cannot be empty.",
            )
        try:
            return ask_tandem(
                query=payload.query,
                team_state=payload.team_state,
                recent_transcripts=payload.recent_transcripts,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ask Tandem query error: {exc}",
            )
else:
    router = None
