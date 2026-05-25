# FocusBoard ML Service (`ml-service/`)

FastAPI service used by FocusBoard backend for:
- text embeddings
- semantic category matching
- NSFW URL/title checks

## Prerequisites

- Python 3.11+
- pip

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 5001 --workers 1
```

Dev reload mode:

```bash
uvicorn main:app --host 0.0.0.0 --port 5001 --workers 1 --reload
```

Health:

```bash
curl http://localhost:5001/health
```

## Endpoints

- `GET /health`
- `GET /health/model`
- `GET /model/status`
- `GET /metrics`
- `POST /embed`
- `POST /embed/batch`
- `POST /find-similar`
- `POST /check-nsfw`

## Runtime Environment Variables

- `ML_WORKERS` (default `2`)
- `ML_MAX_QUEUE` (default `200`)
- `ML_MAX_BATCH_SIZE` (default `100`)
