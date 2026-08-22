"""
project_service.py
------------------
Service layer for project-related database operations.
All Supabase queries for GET /projects/{project_id}/state live here.
"""

import logging
from supabase import Client


def get_project_by_id(db: Client, project_id: str) -> dict | None:
    """
    Fetch a single project row by primary key.
    Returns the row dict, or None if not found.
    """
    res = db.table("projects").select("*").eq("id", project_id).execute()
    if res.data:
        return res.data[0]
    return None


def get_project_state(db: Client, project_id: str) -> dict:
    """
    Fetch the full state of a project from Supabase.

    Queries:
      projects, decisions, tasks, risks, unresolved_issues, meetings

    Returns a dict with keys:
      project, decisions, tasks, risks, unresolved, recent_activity

    Raises:
      KeyError if project_id is not found (caller converts to 404)
      RuntimeError on Supabase failure (caller converts to 500)
    """
    try:
        # 1. Project row
        proj_res = db.table("projects").select("*").eq("id", project_id).execute()
        if not proj_res.data:
            raise KeyError(f"Project '{project_id}' not found.")
        project = proj_res.data[0]

        # 2. Decisions
        dec_res = (
            db.table("decisions")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )

        # 3. Tasks
        tsk_res = (
            db.table("tasks")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )

        # 4. Risks
        rsk_res = (
            db.table("risks")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )

        # 5. Unresolved issues
        unr_res = (
            db.table("unresolved_issues")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )

        # 6. Meetings (for recent_activity)
        mtg_res = (
            db.table("meetings")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )

    except KeyError:
        raise
    except Exception as e:
        logging.error(f"Supabase error fetching state for project {project_id}: {e}")
        raise RuntimeError(f"Database error fetching project state.") from e

    # 7. Build recent_activity: meetings + decisions + tasks + risks + unresolved
    #    Sorted by created_at descending, capped at 20 entries.
    activity_items = []

    for m in mtg_res.data:
        activity_items.append({
            "id":          m["id"],
            "type":        "meeting",
            "description": f"Meeting: {m['title']}",
            "created_at":  m.get("created_at"),
        })

    for d in dec_res.data:
        activity_items.append({
            "id":          d["id"],
            "type":        "decision",
            "description": d.get("content", ""),
            "created_at":  d.get("created_at"),
        })

    for t in tsk_res.data:
        activity_items.append({
            "id":          t["id"],
            "type":        "task",
            "description": t.get("title", ""),
            "created_at":  t.get("created_at"),
        })

    for r in rsk_res.data:
        activity_items.append({
            "id":          r["id"],
            "type":        "risk",
            "description": r.get("description", ""),
            "created_at":  r.get("created_at"),
        })

    for u in unr_res.data:
        activity_items.append({
            "id":          u["id"],
            "type":        "unresolved",
            "description": u.get("description", ""),
            "created_at":  u.get("created_at"),
        })

    # Sort by created_at descending (None values sort last)
    activity_items.sort(
        key=lambda x: x.get("created_at") or "",
        reverse=True,
    )
    recent_activity = activity_items[:20]

    return {
        "project":         project,
        "decisions":       dec_res.data,
        "tasks":           tsk_res.data,
        "risks":           rsk_res.data,
        "unresolved":      unr_res.data,
        "recent_activity": recent_activity,
    }
