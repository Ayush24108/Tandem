import os
import logging
from dotenv import load_dotenv

# Load env vars
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

USE_MOCK_TRANSCRIPT = os.getenv("USE_MOCK_TRANSCRIPT", "false").lower() == "true"
MOCK_TRANSCRIPT_CONTENT = (
    "Rahul: Let's use PostgreSQL for our primary database because our data is relational.\n"
    "Priya: Agreed. PostgreSQL fits our ACID requirements.\n"
    "Manit: I will implement the FastAPI endpoints and routes.\n"
    "Rahul: I'll design the database schema and migration scripts.\n"
    "Priya: Authentication integration might be delayed if we evaluate custom JWT."
)

# Global model cache
model = None

def get_whisper_model():
    global model
    if model is None:
        try:
            import whisper
        except ImportError as e:
            raise RuntimeError(
                "Whisper package ('openai-whisper') or PyTorch is not installed in the environment. "
                "Set USE_MOCK_TRANSCRIPT=true in backend/.env to use the mock transcript engine."
            ) from e
        logging.info("Loading Whisper 'tiny' model...")
        model = whisper.load_model("tiny")
    return model

def transcribe_audio(audio_path: str) -> str:
    """
    Transcribes the audio file at the given audio_path using local Whisper.
    If USE_MOCK_TRANSCRIPT is True, returns a mock transcript.
    Otherwise, attempts local transcription using the Whisper 'tiny' model.
    """
    if USE_MOCK_TRANSCRIPT:
        logging.info(f"[DEVELOPMENT FALLBACK] Returning mock transcript for {audio_path}")
        return MOCK_TRANSCRIPT_CONTENT

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    try:
        whisper_model = get_whisper_model()
        logging.info(f"Transcribing audio file: {audio_path}...")
        result = whisper_model.transcribe(audio_path)
        return result.get("text", "").strip()
    except FileNotFoundError as e:
        # FileNotFoundError in whisper.transcribe usually indicates ffmpeg is missing
        raise RuntimeError(
            "Whisper transcription failed because ffmpeg/ffprobe is not installed on this system. "
            "Please install ffmpeg and make sure it is added to your PATH. "
            "Alternatively, set USE_MOCK_TRANSCRIPT=true in backend/.env for development fallback."
        ) from e
    except Exception as e:
        raise RuntimeError(f"Whisper transcription failed: {str(e)}") from e
