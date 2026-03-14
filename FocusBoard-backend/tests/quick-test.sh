#!/bin/bash

echo "[Test] Checking services..."

# Check backend
if curl -s http://localhost:4000/health > /dev/null; then
    echo "[Backend] Running on port 4000"
else
    echo "[Backend] Not running"
fi

# Check ML service
if curl -s http://localhost:5001/health > /dev/null; then
    echo "[ML Service] Running on port 5001"
else
    echo "[ML Service] Not running (may still be loading model)"
fi

echo ""
echo "[Test] Creating test tracking rule..."
curl -s -X POST http://localhost:4000/api/tracking-rules \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "test-cat-123",
    "pattern": "code",
    "matchType": "app_name",
    "priority": 100
  }' | head -c 200

echo ""
echo ""
echo "[Test] System ready for testing"
