import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from app.services.database_service import get_db

def run_test():
    try:
        db = get_db()
        print("Successfully connected to Supabase!")

        # 1. Insert test project
        project_data = {
            "name": "Test Persistence Project",
            "description": "Validating Supabase schema and routing"
        }
        proj_res = db.table("projects").insert(project_data).execute()
        assert len(proj_res.data) > 0, "Failed to insert project"
        project = proj_res.data[0]
        project_id = project["id"]
        print(f"Created project: {project_id}")

        # 2. Insert test meeting
        meeting_data = {
            "project_id": project_id,
            "title": "Weekly Sync",
        }
        meet_res = db.table("meetings").insert(meeting_data).execute()
        assert len(meet_res.data) > 0, "Failed to insert meeting"
        meeting = meet_res.data[0]
        meeting_id = meeting["id"]
        print(f"Created meeting: {meeting_id}")

        # 3. Insert test decision
        decision_data = {
            "project_id": project_id,
            "meeting_id": meeting_id,
            "content": "Decided to run automated tests before merge"
        }
        dec_res = db.table("decisions").insert(decision_data).execute()
        assert len(dec_res.data) > 0, "Failed to insert decision"
        print("Created decision")

        # 4. Insert test task
        task_data = {
            "project_id": project_id,
            "meeting_id": meeting_id,
            "title": "Write test cases for database persistence",
            "status": "pending",
            "assignee": "Ayyush"
        }
        task_res = db.table("tasks").insert(task_data).execute()
        assert len(task_res.data) > 0, "Failed to insert task"
        print("Created task")

        print("\nAll data inserted successfully!")
        print(f"PROJECT_ID={project_id}")

    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_test()
