FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (ffmpeg for Whisper audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy root files needed by backend and AI modules
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY ai/ /app/ai/
COPY shared/ /app/shared/

ENV PYTHONPATH=/app
WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
