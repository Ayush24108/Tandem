"""
LLM Service for Tandem.
Handles calling LLM APIs (OpenAI-compatible, Gemini, etc.), formatting prompts,
parsing structured JSON outputs, and falling back gracefully when offline.
"""

from __future__ import annotations
import json
import logging
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

from ai.schemas import validate_project_intelligence

logger = logging.getLogger(__name__)

# Default prompt paths
PROMPTS_DIR = Path(__file__).parent / "prompts"
MEETING_ANALYSIS_PROMPT_PATH = PROMPTS_DIR / "meeting_analysis.txt"


def _load_dotenv_if_exists() -> None:
    """Reads .env file from ai/.env or project root .env without third-party dependencies."""
    candidates = [
        Path(__file__).parent / ".env",
        Path(__file__).parent.parent / ".env",
    ]
    for env_path in candidates:
        if env_path.exists() and env_path.is_file():
            try:
                for line in env_path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"\'')
                    if key and key not in os.environ:
                        os.environ[key] = val
            except Exception:
                pass


_load_dotenv_if_exists()


def load_prompt_template(path: Optional[Path | str] = None) -> str:
    """Loads a prompt template file from disk."""
    target_path = Path(path) if path else MEETING_ANALYSIS_PROMPT_PATH
    if not target_path.exists():
        raise FileNotFoundError(f"Prompt template file not found at: {target_path}")
    return target_path.read_text(encoding="utf-8")


def _extract_json_from_text(text: str) -> Dict[str, Any]:
    """
    Safely extracts a JSON dictionary from LLM response text,
    handling markdown code blocks (```json ... ```) or leading/trailing text.
    """
    text = text.strip()

    # If wrapped in markdown code blocks, strip them
    markdown_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if markdown_match:
        text = markdown_match.group(1).strip()

    # Try direct parse
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    # Find the outermost JSON object bounds: first '{' to last '}'
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace : last_brace + 1]
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse valid JSON from LLM response: {text[:200]}...")


def call_llm_api(prompt: str, system_message: Optional[str] = None, timeout: int = 30) -> str:
    """
    Dispatches a prompt to the configured LLM provider using standard HTTP requests.
    Supports GitHub Models (GITHUB_TOKEN), OpenAI-compatible APIs, and Google Gemini.
    """
    github_token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    # 1. GitHub Models (Marketplace / Azure AI endpoint)
    if github_token:
        base_url = os.getenv("GITHUB_MODELS_BASE_URL", "https://models.inference.ai.azure.com").rstrip("/")
        model = os.getenv("GITHUB_MODEL", os.getenv("LLM_MODEL", "gpt-4o-mini"))
        url = f"{base_url}/chat/completions"

        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {github_token}",
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=timeout) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as http_err:
            # If model does not support response_format json_object, retry without it
            if http_err.code == 400:
                payload.pop("response_format", None)
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=timeout) as retry_res:
                    res_data = json.loads(retry_res.read().decode("utf-8"))
                    return res_data["choices"][0]["message"]["content"]
            raise http_err

    # 2. OpenAI-compatible Chat Completions API
    if openai_api_key:
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        model = os.getenv("LLM_MODEL", os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
        url = f"{base_url}/chat/completions"

        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_api_key}",
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["choices"][0]["message"]["content"]

    # 3. Google Gemini API
    if gemini_api_key:
        preferred_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        candidate_models = [preferred_model, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-pro"]
        # deduplicate while preserving order
        unique_models = []
        for m in candidate_models:
            if m not in unique_models:
                unique_models.append(m)

        last_error = None
        for model_name in unique_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_api_key}"
            payload = {
                "contents": [{"parts": [{"text": f"{system_message}\n\n{prompt}" if system_message else prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    return res_data["candidates"][0]["content"]["parts"][0]["text"]
            except urllib.error.HTTPError as http_err:
                last_error = http_err
                # If 503 (high demand) or 404 (model not found), try next available model
                if http_err.code in (503, 404, 429):
                    continue
                raise http_err
            except Exception as err:
                last_error = err
                continue

        if last_error:
            raise last_error

    raise ConnectionError("No LLM API key configured. Please set GITHUB_TOKEN, OPENAI_API_KEY, or GEMINI_API_KEY.")


def extract_project_intelligence(
    transcript: str,
    prompt_template_path: Optional[Path | str] = None,
    allow_fallback: bool = True,
) -> Dict[str, Any]:
    """
    Extracts structured project intelligence from a meeting transcript using an LLM.
    Validates output against shared/schemas/intelligence.json and falls back to deterministic
    extraction if the LLM is offline or fails.

    Args:
        transcript: Raw text of the meeting transcript.
        prompt_template_path: Optional custom path to a prompt template.
        allow_fallback: If True, falls back to deterministic extraction on API failure.

    Returns:
        JSON-compatible dictionary conforming to shared/schemas/intelligence.json.
    """
    if not transcript or not transcript.strip():
        return {
            "decisions": [],
            "tasks": [],
            "risks": [],
            "unresolved": [],
        }

    try:
        template = load_prompt_template(prompt_template_path)
        prompt = template.replace("{{TRANSCRIPT}}", transcript.strip())

        raw_response = call_llm_api(
            prompt=prompt,
            system_message="You are the Tandem AI Intelligence Engine. Return ONLY valid JSON matching the schema.",
        )

        parsed_json = _extract_json_from_text(raw_response)
        validated_data = validate_project_intelligence(parsed_json)
        return validated_data

    except Exception as exc:
        logger.warning("LLM extraction failed or API unavailable (%s). Using fallback engine.", exc)
        if allow_fallback:
            from ai.ropa_service import deterministic_extract_intelligence
            return deterministic_extract_intelligence(transcript)
        raise exc
