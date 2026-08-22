"""
routes/projects.py
------------------
GET /projects
    List all projects.

GET /projects/{project_id}/state
    Return full project state from Supabase:
    { project, decisions, tasks, risks, unresolved, recent_activity }
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.services.database_service import get_db
from app.services.project_service import get_project_state

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
def get_projects(db=Depends(get_db)):
    """Return a list of all projects."""
    try:
        response = db.table("projects").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        logging.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail="Database error listing projects.")


@router.get("/{project_id}/state")
def get_project_state_endpoint(project_id: str, db=Depends(get_db)):
    """
    Return the full state of a project.

    Response:
      {
        "project":         { ...project row... },
        "decisions":       [ ...decision rows... ],
        "tasks":           [ ...task rows... ],
        "risks":           [ ...risk rows... ],
        "unresolved":      [ ...unresolved_issue rows... ],
        "recent_activity": [ ...up to 20 activity items... ]
      }

    Errors:
      404 -- project not found
      500 -- Supabase query failure
    """
    try:
        state = get_project_state(db, project_id)
        return state
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logging.error(f"Unexpected error in get_project_state for {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error.")
