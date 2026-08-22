from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.projects import router as projects_router
from app.routes.meetings import router as meetings_router

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
