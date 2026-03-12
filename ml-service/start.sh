#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
# Start FastAPI using uvicorn on port 5001
uvicorn main:app --host 0.0.0.0 --port 5001 --workers 8
