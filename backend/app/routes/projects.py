from fastapi import APIRouter, HTTPException, Depends
from app.services.database_service import get_db

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("")
def get_projects(db=Depends(get_db)):
    try:
        response = db.table("projects").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{project_id}/state")
def get_project_state(project_id: str, db=Depends(get_db)):
    try:
        # Fetch project details
        proj_res = db.table("projects").select("*").eq("id", project_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        project = proj_res.data[0]

        # Fetch related tables
        decisions_res = db.table("decisions").select("*").eq("project_id", project_id).execute()
        tasks_res = db.table("tasks").select("*").eq("project_id", project_id).execute()
        risks_res = db.table("risks").select("*").eq("project_id", project_id).execute()
        unresolved_res = db.table("unresolved_issues").select("*").eq("project_id", project_id).execute()
        meetings_res = db.table("meetings").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()

        # Map meetings to recent activity format
        recent_activity = []
        for meeting in meetings_res.data:
            recent_activity.append({
                "id": meeting["id"],
                "type": "meeting",
                "description": f"Meeting: {meeting['title']}",
                "created_at": meeting.get("created_at")
            })

        return {
            "project": project,
            "decisions": decisions_res.data,
            "tasks": tasks_res.data,
            "risks": risks_res.data,
            "unresolved": unresolved_res.data,
            "recent_activity": recent_activity
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
