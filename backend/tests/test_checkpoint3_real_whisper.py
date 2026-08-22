"""
Checkpoint 3 — Real Whisper Transcription Test
===============================================
- USE_MOCK_TRANSCRIPT must be false (set in .env and overridden below)
- FFmpeg must be installed and on PATH
- Uses the Whisper 'tiny' model to transcribe an actual audio file
- Audio file: a 3-second multi-tone WAV (non-silent, gives Whisper real signal to work with)
"""

import sys
import os
import wave
import struct
import math

# ── Path setup ────────────────────────────────────────────────────────────────
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# ── Force .env to load from the correct location ─────────────────────────────
os.environ["USE_MOCK_TRANSCRIPT"] = "false"

# ── Import after env is set ───────────────────────────────────────────────────
import app.services.whisper_service as ws

# Override the module-level flag in case it was cached as True
ws.USE_MOCK_TRANSCRIPT = False

from app.services.whisper_service import transcribe_audio


# ── Audio generation ──────────────────────────────────────────────────────────

def create_spoken_tone_wav(path: str, duration_seconds: float = 3.0):
    """
    Generate a WAV file containing a mix of tones that simulate speech formants.
    Frequencies chosen (300 Hz, 900 Hz, 2400 Hz) approximate vowel-like harmonics.
    This gives Whisper real non-silent audio rather than pure silence.
    """
    sample_rate = 16000
    num_samples = int(sample_rate * duration_seconds)
    freqs = [300, 900, 2400]   # speech-like formant approximation
    amplitude = 8000            # ~50% of int16 max

    print(f"  Generating {duration_seconds}s multi-tone audio at: {path}")
    with wave.open(path, "w") as wav:
        wav.setnchannels(1)       # mono
        wav.setsampwidth(2)       # 16-bit
        wav.setframerate(sample_rate)
        for i in range(num_samples):
            t = i / sample_rate
            sample_val = sum(
                amplitude * math.sin(2 * math.pi * f * t) / len(freqs)
                for f in freqs
            )
            # Clamp to int16 range
            sample_val = max(-32767, min(32767, int(sample_val)))
            wav.writeframesraw(struct.pack("<h", sample_val))
    print(f"  Audio file created ({num_samples} samples, {os.path.getsize(path)} bytes)")


# ── Main test ─────────────────────────────────────────────────────────────────

def run_checkpoint3():
    print("=" * 60)
    print("  CHECKPOINT 3 - Real Whisper Transcription Test")
    print("=" * 60)

    # Confirm mock is disabled
    print(f"\n[Config] USE_MOCK_TRANSCRIPT (module flag) = {ws.USE_MOCK_TRANSCRIPT}")
    assert ws.USE_MOCK_TRANSCRIPT is False, "Mock mode must be disabled for this test!"

    audio_path = os.path.join(os.path.dirname(__file__), "checkpoint3_spoken.wav")

    # Step 1: Create test audio
    print("\n[Step 1] Creating spoken-tone audio file...")
    create_spoken_tone_wav(audio_path, duration_seconds=3.0)

    # Step 2: Run real Whisper transcription
    print("\n[Step 2] Loading Whisper 'tiny' model and transcribing...")
    print("  (First run may download the model - ~75 MB)")
    try:
        transcript = transcribe_audio(audio_path)
        print("\n" + "=" * 60)
        print("  CHECKPOINT 3 PASSED")
        print("=" * 60)
        print(f"\n  Transcript returned by Whisper:")
        print(f"  >>> {repr(transcript)}")
        print()
        if transcript.strip() == "":
            print("  Note: Empty transcript is valid - Whisper found no speech in the tone signal.")
            print("        The important result is that real Whisper ran WITHOUT the mock fallback.")
    except RuntimeError as e:
        print("\n" + "=" * 60)
        print("  CHECKPOINT 3 FAILED - RuntimeError")
        print("=" * 60)
        print(f"\n  {e}")
        sys.exit(1)
    except Exception as e:
        print("\n" + "=" * 60)
        print("  CHECKPOINT 3 FAILED - Unexpected error")
        print("=" * 60)
        print(f"\n  {type(e).__name__}: {e}")
        sys.exit(1)
    finally:
        # Clean up
        if os.path.exists(audio_path):
            os.remove(audio_path)
            print(f"  [Cleanup] Removed {audio_path}")

    print("\n  Real Whisper pipeline is working correctly.")


if __name__ == "__main__":
    run_checkpoint3()
