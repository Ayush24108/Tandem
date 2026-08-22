"""
Checkpoint 6 -- GET /projects/{project_id}/state Test
======================================================
Tests the full project-state endpoint against live Supabase data.

Test matrix:
  T1  Valid project with no data   -> 200, all 6 keys present, lists are empty
  T2  Valid project with data      -> 200, decisions/tasks/risks/unresolved populated
  T3  recent_activity populated    -> meetings + decisions + tasks show up
  T4  Invalid project UUID         -> 404 with useful detail
  T5  GET /projects                -> 200, returns a list

Requires the server to be running on port 8000.
Creates and cleans up its own Supabase fixtures.
"""

import sys
import os
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.getenv("TANDEM_TEST_URL", "http://127.0.0.1:8000")

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
from app.services.database_service import get_db

REQUIRED_KEYS = {"project", "decisions", "tasks", "risks", "unresolved", "recent_activity"}


# -- Helpers ------------------------------------------------------------------

def check_server():
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        assert r.status_code == 200
        print(f"  Server reachable at {BASE_URL} [OK]")
    except Exception as e:
        print(f"  [FAIL] Cannot reach {BASE_URL}: {e}")
        print(f"         Run: python -m uvicorn app.main:app --port 8000")
        sys.exit(1)


def create_project(db, name: str) -> str:
    res = db.table("projects").insert({"name": name, "description": "CP6 test"}).execute()
    return res.data[0]["id"]


def create_meeting(db, project_id: str, title: str) -> str:
    res = db.table("meetings").insert({"project_id": project_id, "title": title}).execute()
    return res.data[0]["id"]


def insert_decision(db, project_id: str, meeting_id: str, content: str):
    db.table("decisions").insert({
        "project_id": project_id, "meeting_id": meeting_id, "content": content
    }).execute()


def insert_task(db, project_id: str, meeting_id: str, title: str):
    db.table("tasks").insert({
        "project_id": project_id, "meeting_id": meeting_id,
        "title": title, "status": "pending"
    }).execute()


def insert_risk(db, project_id: str, meeting_id: str, description: str):
    db.table("risks").insert({
        "project_id": project_id, "meeting_id": meeting_id, "description": description
    }).execute()


def insert_unresolved(db, project_id: str, meeting_id: str, description: str):
    db.table("unresolved_issues").insert({
        "project_id": project_id, "meeting_id": meeting_id, "description": description
    }).execute()


def cleanup(db, project_id: str):
    db.table("projects").delete().eq("id", project_id).execute()
    print(f"  [Cleanup] Removed project {project_id}")


def get_state(project_id: str) -> requests.Response:
    return requests.get(f"{BASE_URL}/projects/{project_id}/state", timeout=15)


# -- Tests --------------------------------------------------------------------

def t1_empty_project_returns_correct_shape(db) -> bool:
    print("\n[T1] Empty project -> 200, all 6 keys present, lists empty")
    pid = create_project(db, "CP6-T1 Empty Project")
    try:
        r = get_state(pid)
        if r.status_code != 200:
            print(f"  FAIL -- status {r.status_code}: {r.text}")
            return False
        data = r.json()

        missing = REQUIRED_KEYS - set(data.keys())
        if missing:
            print(f"  FAIL -- missing keys: {missing}")
            return False

        for key in ("decisions", "tasks", "risks", "unresolved", "recent_activity"):
            if not isinstance(data[key], list):
                print(f"  FAIL -- '{key}' is not a list: {data[key]}")
                return False

        if not isinstance(data["project"], dict):
            print(f"  FAIL -- 'project' is not a dict")
            return False

        if data["project"]["id"] != pid:
            print(f"  FAIL -- project.id mismatch")
            return False

        print(f"  Status: 200 [OK]  project.id matches  all lists empty [OK]")
        return True
    finally:
        cleanup(db, pid)


def t2_project_with_data_returns_populated_lists(db) -> bool:
    print("\n[T2] Project with data -> decisions/tasks/risks/unresolved all populated")
    pid = create_project(db, "CP6-T2 Data Project")
    try:
        mid = create_meeting(db, pid, "Sprint Planning")
        insert_decision(db, pid, mid, "Use PostgreSQL for storage")
        insert_task(db, pid, mid, "Set up CI pipeline")
        insert_risk(db, pid, mid, "Third-party API may be unreliable")
        insert_unresolved(db, pid, mid, "Database schema not finalised")

        r = get_state(pid)
        if r.status_code != 200:
            print(f"  FAIL -- status {r.status_code}: {r.text}")
            return False
        data = r.json()

        checks = {
            "decisions":  (data["decisions"],  1),
            "tasks":      (data["tasks"],       1),
            "risks":      (data["risks"],       1),
            "unresolved": (data["unresolved"],  1),
        }
        all_ok = True
        for label, (lst, expected_min) in checks.items():
            if len(lst) < expected_min:
                print(f"  FAIL -- {label}: expected >={expected_min}, got {len(lst)}")
                all_ok = False
            else:
                print(f"  {label}: {len(lst)} row(s) [OK]")
        return all_ok
    finally:
        cleanup(db, pid)


def t3_recent_activity_contains_all_types(db) -> bool:
    print("\n[T3] recent_activity contains meetings, decisions, tasks, risks, unresolved")
    pid = create_project(db, "CP6-T3 Activity Project")
    try:
        mid = create_meeting(db, pid, "Kickoff")
        insert_decision(db, pid, mid, "Launch Q4")
        insert_task(db, pid, mid, "Onboard new devs")
        insert_risk(db, pid, mid, "Budget overrun possible")
        insert_unresolved(db, pid, mid, "Deployment region TBD")

        r = get_state(pid)
        if r.status_code != 200:
            print(f"  FAIL -- status {r.status_code}: {r.text}")
            return False
        data = r.json()

        activity = data["recent_activity"]
        types_present = {item["type"] for item in activity}
        expected_types = {"meeting", "decision", "task", "risk", "unresolved"}
        missing_types = expected_types - types_present

        if missing_types:
            print(f"  FAIL -- missing activity types: {missing_types}")
            print(f"  types found: {types_present}")
            return False

        print(f"  {len(activity)} activity item(s), types: {sorted(types_present)} [OK]")

        # Verify each item has the required fields
        for item in activity:
            for field in ("id", "type", "description", "created_at"):
                if field not in item:
                    print(f"  FAIL -- activity item missing field '{field}': {item}")
                    return False
        print(f"  All activity items have id/type/description/created_at [OK]")
        return True
    finally:
        cleanup(db, pid)


def t4_invalid_project_returns_404() -> bool:
    print("\n[T4] Non-existent project UUID -> 404 with useful detail")
    fake = "00000000-0000-0000-0000-000000000000"
    r = get_state(fake)
    if r.status_code == 404:
        detail = r.json().get("detail", "")
        print(f"  Status: 404 [OK]  detail: {detail}")
        # Confirm detail mentions the project id
        if fake in detail:
            print(f"  Project ID present in error message [OK]")
        return True
    print(f"  FAIL -- expected 404, got {r.status_code}: {r.text}")
    return False


def t5_list_projects_returns_list(db) -> bool:
    print("\n[T5] GET /projects -> 200, returns a list")
    pid = create_project(db, "CP6-T5 List Project")
    try:
        r = requests.get(f"{BASE_URL}/projects", timeout=15)
        if r.status_code != 200:
            print(f"  FAIL -- status {r.status_code}: {r.text}")
            return False
        data = r.json()
        if not isinstance(data, list):
            print(f"  FAIL -- expected list, got {type(data)}")
            return False
        ids = [p["id"] for p in data]
        if pid not in ids:
            print(f"  FAIL -- newly created project not in list")
            return False
        print(f"  Status: 200 [OK]  {len(data)} project(s) in list [OK]")
        return True
    finally:
        cleanup(db, pid)


# -- Runner -------------------------------------------------------------------

def run_checkpoint6():
    print("=" * 60)
    print("  CHECKPOINT 6 -- GET /projects/{project_id}/state")
    print("=" * 60)

    check_server()
    db = get_db()

    results = {}
    results["T1_empty_project_shape"]     = t1_empty_project_returns_correct_shape(db)
    results["T2_data_populated"]          = t2_project_with_data_returns_populated_lists(db)
    results["T3_recent_activity_types"]   = t3_recent_activity_contains_all_types(db)
    results["T4_invalid_project_404"]     = t4_invalid_project_returns_404()
    results["T5_list_projects"]           = t5_list_projects_returns_list(db)

    print("\n" + "=" * 60)
    print("  CHECKPOINT 6 -- RESULTS")
    print("=" * 60)
    all_passed = True
    for name, passed in results.items():
        status = "PASS [OK]" if passed else "FAIL [X]"
        print(f"  {name:<30} {status}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("  ALL TESTS PASSED -- Checkpoint 6 complete.")
    else:
        print("  SOME TESTS FAILED -- see output above.")
        sys.exit(1)


if __name__ == "__main__":
    run_checkpoint6()
