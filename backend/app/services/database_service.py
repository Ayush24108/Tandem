import os
import uuid
import sqlite3
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from backend/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
LOCAL_DB_PATH = os.path.join(backend_dir, "tandem_local.db")

class QueryResult:
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data

class SqliteTableQuery:
    def __init__(self, client: "SqliteSupabaseClient", table_name: str):
        self.client = client
        self.table_name = table_name
        self.filters: List[tuple[str, Any]] = []
        self.order_col: Optional[str] = None
        self.order_desc: bool = False
        self.limit_val: Optional[int] = None
        self._action: str = "select"
        self._insert_data: Optional[List[Dict[str, Any]]] = None
        self._update_data: Optional[Dict[str, Any]] = None

    def select(self, columns: str = "*"):
        self._action = "select"
        return self

    def insert(self, data: Any):
        self._action = "insert"
        self._insert_data = data if isinstance(data, list) else [data]
        return self

    def update(self, data: Dict[str, Any]):
        self._action = "update"
        self._update_data = data
        return self

    def delete(self):
        self._action = "delete"
        return self

    def eq(self, col: str, val: Any):
        self.filters.append((col, val))
        return self

    def order(self, col: str, desc: bool = False):
        self.order_col = col
        self.order_desc = desc
        return self

    def limit(self, val: int):
        self.limit_val = val
        return self

    def execute(self) -> QueryResult:
        conn = self.client.get_connection()
        cursor = conn.cursor()

        if self._action == "insert":
            inserted = []
            for item in (self._insert_data or []):
                row = dict(item)
                if "id" not in row or not row["id"]:
                    row["id"] = str(uuid.uuid4())
                if "created_at" not in row or not row["created_at"]:
                    row["created_at"] = datetime.now(timezone.utc).isoformat()

                cols = list(row.keys())
                placeholders = ["?"] * len(cols)
                values = [row[c] for c in cols]
                sql = f"INSERT INTO {self.table_name} ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"
                cursor.execute(sql, values)
                inserted.append(row)
            conn.commit()
            return QueryResult(data=inserted)

        # Build WHERE clause
        where_clauses = []
        params = []
        for col, val in self.filters:
            where_clauses.append(f"{col} = ?")
            params.append(str(val))
        where_str = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        if self._action == "delete":
            # First select to return deleted rows
            select_sql = f"SELECT * FROM {self.table_name}{where_str}"
            cursor.execute(select_sql, params)
            deleted = [dict(r) for r in cursor.fetchall()]

            del_sql = f"DELETE FROM {self.table_name}{where_str}"
            cursor.execute(del_sql, params)
            conn.commit()
            return QueryResult(data=deleted)

        if self._action == "update":
            set_clauses = [f"{k} = ?" for k in (self._update_data or {}).keys()]
            set_values = list((self._update_data or {}).values())
            update_sql = f"UPDATE {self.table_name} SET {', '.join(set_clauses)}{where_str}"
            cursor.execute(update_sql, set_values + params)
            conn.commit()

            select_sql = f"SELECT * FROM {self.table_name}{where_str}"
            cursor.execute(select_sql, params)
            updated = [dict(r) for r in cursor.fetchall()]
            return QueryResult(data=updated)

        # SELECT
        order_str = ""
        if self.order_col:
            direction = "DESC" if self.order_desc else "ASC"
            order_str = f" ORDER BY {self.order_col} {direction}"

        limit_str = f" LIMIT {self.limit_val}" if self.limit_val is not None else ""

        sql = f"SELECT * FROM {self.table_name}{where_str}{order_str}{limit_str}"
        cursor.execute(sql, params)
        rows = [dict(r) for r in cursor.fetchall()]
        return QueryResult(data=rows)

class SqliteSupabaseClient:
    def __init__(self, db_path: str = LOCAL_DB_PATH):
        self.db_path = db_path
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                tagline TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                date TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS meeting_transcripts (
                id TEXT PRIMARY KEY,
                meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
                transcript TEXT NOT NULL,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS decisions (
                id TEXT PRIMARY KEY,
                project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
                meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
                content TEXT NOT NULL,
                reason TEXT,
                status TEXT DEFAULT 'confirmed',
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
                meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                assignee TEXT,
                priority TEXT DEFAULT 'medium',
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS risks (
                id TEXT PRIMARY KEY,
                project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
                meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
                description TEXT NOT NULL,
                mitigation TEXT,
                severity TEXT DEFAULT 'medium',
                status TEXT DEFAULT 'open',
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS unresolved_issues (
                id TEXT PRIMARY KEY,
                project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
                meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
                description TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                created_at TEXT
            );
        """)
        conn.commit()

        # Seed initial projects if table is empty
        cursor.execute("SELECT COUNT(*) as count FROM projects")
        if cursor.fetchone()["count"] == 0:
            now = datetime.now(timezone.utc).isoformat()
            cursor.executemany("""
                INSERT INTO projects (id, name, description, tagline, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, [
                (
                    "project-alpha",
                    "Project Alpha",
                    "Clinical documentation intelligence system assisting physicians with real-time audio analysis and medical summary generation.",
                    "AI Healthcare Assistant",
                    now
                ),
                (
                    "campus-connect",
                    "CampusConnect",
                    "Peer-to-peer learning network facilitating project matchmaking, study groups, and cross-department collaboration.",
                    "Student Collaboration Platform",
                    now
                ),
                (
                    "eco-track",
                    "EcoTrack",
                    "Automated ESG reporting and carbon footprint tracking across Tier 1 and Tier 2 manufacturing partners.",
                    "Supply Chain Carbon Platform",
                    now
                )
            ])
            cursor.execute("""
                INSERT INTO meetings (id, project_id, title, created_at)
                VALUES (?, ?, ?, ?)
            """, ("meeting-alpha-1", "project-alpha", "Architecture & Engineering Sync", now))
            conn.commit()

    def table(self, table_name: str) -> SqliteTableQuery:
        return SqliteTableQuery(self, table_name)

supabase_client: Any = None
_local_db = SqliteSupabaseClient()

if SUPABASE_URL and SUPABASE_KEY:
    if SUPABASE_URL != "your_supabase_url_here" and SUPABASE_KEY != "your_supabase_service_role_key_here":
        try:
            normalized_url = SUPABASE_URL.rstrip("/")
            if normalized_url.endswith("/rest/v1"):
                normalized_url = normalized_url[:-8].rstrip("/")
            supabase_client = create_client(normalized_url, SUPABASE_KEY)
            logging.info("Connected to remote Supabase database.")
        except Exception as e:
            logging.warning(f"Could not connect to remote Supabase ({e}), using local persistent database.")
            supabase_client = None

def get_db() -> Any:
    if supabase_client is not None:
        return supabase_client
    return _local_db
