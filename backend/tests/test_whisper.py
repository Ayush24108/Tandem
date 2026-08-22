import sys
import os
import wave
import struct

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from app.services.whisper_service import transcribe_audio

def create_dummy_wav(path: str):
    print(f"Generating synthetic silent audio file at: {path}...")
    with wave.open(path, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(16000)
        # 1 second of silence
        for _ in range(16000):
            data = struct.pack('<h', 0)
            wav_file.writeframesraw(data)

def run_tests():
    dummy_audio_path = os.path.join(os.path.dirname(__file__), "dummy_audio.wav")
    create_dummy_wav(dummy_audio_path)

    # Test 1: Explicit Mock Fallback
    print("\n--- Test 1: Mock Fallback Mode (USE_MOCK_TRANSCRIPT=true) ---")
    os.environ["USE_MOCK_TRANSCRIPT"] = "true"
    # Re-import / force override check
    import app.services.whisper_service
    app.services.whisper_service.USE_MOCK_TRANSCRIPT = True
    
    try:
        mock_transcript = transcribe_audio(dummy_audio_path)
        print("Success! Mock transcript returned:")
        print(f"'{mock_transcript}'")
    except Exception as e:
        print(f"Mock test failed: {e}")

    # Test 2: Real Whisper Mode (USE_MOCK_TRANSCRIPT=false)
    print("\n--- Test 2: Real Whisper Mode (USE_MOCK_TRANSCRIPT=false) ---")
    app.services.whisper_service.USE_MOCK_TRANSCRIPT = False
    
    try:
        print("Attempting local Whisper transcription (this may download the tiny model)...")
        real_transcript = transcribe_audio(dummy_audio_path)
        print("Success! Real transcript returned:")
        print(f"'{real_transcript}'")
    except Exception as e:
        print("\nCaught expected error or failure:")
        print(str(e))
        
        # Clean up
        if os.path.exists(dummy_audio_path):
            os.remove(dummy_audio_path)
            print("\nCleaned up dummy_audio.wav")

if __name__ == "__main__":
    run_tests()
