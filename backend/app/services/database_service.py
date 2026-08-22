import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from backend/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    if SUPABASE_URL != "your_supabase_url_here" and SUPABASE_KEY != "your_supabase_service_role_key_here":
        # Normalize URL: strip trailing slashes and /rest/v1 suffix
        normalized_url = SUPABASE_URL.rstrip("/")
        if normalized_url.endswith("/rest/v1"):
            normalized_url = normalized_url[:-8].rstrip("/")
        supabase = create_client(normalized_url, SUPABASE_KEY)

def get_db() -> Client:
    if supabase is None:
        raise RuntimeError(
            "Supabase client is not initialized. Please configure valid credentials in backend/.env"
        )
    return supabase
