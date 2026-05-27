#!/bin/bash
# FocusBoard launcher script
# Ensures backend and ML services are running before launching the desktop app

set -e

# Function to check if a service is running
check_service() {
    local port=$1
    local name=$2
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✓ $name is running on port $port"
        return 0
    else
        return 1
    fi
}

# Function to wait for a service with timeout
wait_for_service() {
    local port=$1
    local name=$2
    local timeout=60
    local elapsed=0
    
    echo "Waiting for $name (port $port)..."
    while ! check_service "$port" "$name"; do
        if [ $elapsed -ge $timeout ]; then
            echo "✗ $name failed to start within ${timeout}s"
            return 1
        fi
        sleep 1
        ((elapsed++))
        echo -n "."
    done
    echo ""
    return 0
}

# Check if services are already running
echo "Checking FocusBoard services..."

backend_running=false
ml_running=false

if check_service 5000 "Backend API"; then
    backend_running=true
fi

if check_service 5001 "ML Service"; then
    ml_running=true
fi

# Start services if not running
if [ "$backend_running" = false ] || [ "$ml_running" = false ]; then
    echo ""
    echo "Starting required services..."
    
    # Start ML service first (backend depends on it)
    if [ "$ml_running" = false ]; then
        echo "Starting ML Service..."
        systemctl --user start focusboard-ml.service || {
            echo "Warning: Failed to start ML service via systemd"
            echo "Attempting to start manually..."
            cd /usr/share/focusboard/ml-service
            /usr/share/focusboard/ml-service/venv/bin/uvicorn main:app --host 127.0.0.1 --port 5001 &
            ML_PID=$!
        }
    fi
    
    # Start backend
    if [ "$backend_running" = false ]; then
        echo "Starting Backend API..."
        systemctl --user start focusboard-backend.service || {
            echo "Warning: Failed to start backend via systemd"
            echo "Attempting to start manually..."
            cd /usr/share/focusboard/backend
            /usr/bin/node server.js &
            BACKEND_PID=$!
        }
    fi
    
    # Wait for services to be ready
    echo ""
    if ! wait_for_service 5001 "ML Service"; then
        echo "Error: ML Service failed to start"
        exit 1
    fi
    
    if ! wait_for_service 5000 "Backend API"; then
        echo "Error: Backend API failed to start"
        exit 1
    fi
    
    echo ""
    echo "All services are ready!"
    echo ""
else
    echo ""
    echo "All services are already running."
    echo ""
fi

# Create JWT secret if it doesn't exist
JWT_SECRET_FILE="$HOME/.config/focusboard/jwt-secret"
if [ ! -f "$JWT_SECRET_FILE" ]; then
    mkdir -p "$(dirname "$JWT_SECRET_FILE")"
    openssl rand -base64 32 > "$JWT_SECRET_FILE"
    chmod 600 "$JWT_SECRET_FILE"
fi

# Launch the desktop app
echo "Launching FocusBoard..."
exec /usr/bin/focusboard-bin "$@"
