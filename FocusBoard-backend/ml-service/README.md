# ML Service - Embedding & NSFW Detection

Deprecated: use the root-level `ml-service` FastAPI service instead. This folder remains for historical reference.

Python microservice for activity categorization using sentence embeddings and NSFW content detection.

## Setup

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python app.py
```

Service runs on `http://localhost:5001`

## Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{"status": "healthy"}
```

### POST /embed
Generate embedding vector for text.

**Request:**
```json
{"text": "Visual Studio Code"}
```

**Response:**
```json
{"embedding": [0.123, -0.456, ...]}  // 384-dimensional vector
```

### POST /find-similar
Find most similar category based on embeddings.

**Request:**
```json
{
  "text": "Visual Studio Code",
  "categories": [
    {"_id": "cat1", "embedding": [...]},
    {"_id": "cat2", "embedding": [...]}
  ]
}
```

**Response:**
```json
{"categoryId": "cat1", "similarity": 0.85}
```

### POST /check-nsfw
Check if URL or window title contains NSFW content.

**Request:**
```json
{
  "url": "https://example.com",
  "window_title": "Example Page"
}
```

**Response:**
```json
{
  "flagged": false,
  "reason": "",
  "confidence": 0
}
```
