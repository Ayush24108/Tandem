"""
routes/projects.py
------------------
GET /projects
    List all projects.

GET /projects/{project_id}
    Return a single project row.

GET /projects/{project_id}/state
    Return full project state from Supabase:
    { project, decisions, tasks, risks, unresolved, recent_activity }

GET /projects/{project_id}/full
    Return project merged with intelligence — matches frontend Project type shape.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.services.database_service import get_db
from app.services.project_service import get_project_by_id, get_project_state

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


@router.get("/{project_id}/full")
def get_project_full_endpoint(project_id: str, db=Depends(get_db)):
    """
    Return a project merged with its intelligence in the frontend Project shape:
    { id, name, tagline, description, members, teamPulse, decisions, tasks, risks,
      unresolvedIssues, recentActivity }

    The frontend ProjectDetailView and MeetingRecorder use this endpoint.
    """
    try:
        state = get_project_state(db, project_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logging.error(f"Unexpected error in get_project_full for {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error.")

    proj = state["project"]
    decisions_raw = state.get("decisions", [])
    tasks_raw = state.get("tasks", [])
    risks_raw = state.get("risks", [])
    unresolved_raw = state.get("unresolved", [])
    activity_raw = state.get("recent_activity", [])

    # Map DB rows → frontend shapes
    decisions = [
        {
            "id": d.get("id", ""),
            "title": d.get("content") or d.get("title", ""),
            "reason": d.get("reason", ""),
            "status": d.get("status", "confirmed"),
            "timestamp": d.get("created_at", ""),
            "projectId": project_id,
        }
        for d in decisions_raw
    ]

    tasks = [
        {
            "id": t.get("id", ""),
            "title": t.get("title", ""),
            "assignee": t.get("assignee") or t.get("owner") or "Unassigned",
            "status": t.get("status", "todo"),
            "priority": t.get("priority", "medium"),
            "projectId": project_id,
        }
        for t in tasks_raw
    ]

    risks = [
        {
            "id": r.get("id", ""),
            "title": r.get("title") or r.get("description", ""),
            "description": r.get("description", ""),
            "severity": r.get("severity", "medium"),
            "status": "open",
            "projectId": project_id,
        }
        for r in risks_raw
    ]

    unresolved_issues = [
        {
            "id": u.get("id", ""),
            "title": u.get("title") or u.get("description", ""),
            "description": u.get("description", ""),
            "projectId": project_id,
        }
        for u in unresolved_raw
    ]

    recent_activity = [
        {
            "id": a.get("id", ""),
            "text": a.get("description", ""),
            "timestamp": a.get("created_at", ""),
            "type": a.get("type", "meeting"),
        }
        for a in activity_raw
    ]

    return {
        "id": proj.get("id", project_id),
        "name": proj.get("name", ""),
        "tagline": proj.get("tagline") or proj.get("description", "")[:60],
        "description": proj.get("description", ""),
        "members": [],
        "teamPulse": {
            "decisionsCount": len(decisions),
            "tasksCompletedCount": len([t for t in tasks if t["status"] in ("done", "completed")]),
            "unresolvedCount": len(unresolved_issues),
            "risksCount": len(risks),
        },
        "decisions": decisions,
        "tasks": tasks,
        "risks": risks,
        "unresolvedIssues": unresolved_issues,
        "recentActivity": recent_activity,
    }


@router.get("/{project_id}")
def get_project_by_id_endpoint(project_id: str, db=Depends(get_db)):
    """Return a single project row by ID."""
    try:
        project = get_project_by_id(db, project_id)
        if project is None:
            raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
        return project
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error fetching project.")

