# FocusBoard Backend Tests (`FocusBoard-backend/tests/`)

This folder contains integration/performance scripts for manual backend validation.

## Important Port Note

Most scripts in this folder are currently hardcoded to `http://localhost:3000`.
Backend default is `5000`, so run backend on `3000` for these scripts, or update script constants first.

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. ML service running on `http://localhost:5001`
3. MongoDB configured and reachable from backend

## Run Individual Scripts

From `FocusBoard-backend/`:

```bash
node tests/real-data-test.js
node tests/performance-bulk-test.js
node tests/3-tier-comprehensive-test.js
```

## Run Batch Script

```bash
./tests/run-all-tests.sh
```

## Seed Categories in a Remote Environment

```bash
export BACKEND_URL=https://your-backend.example.com
node tests/seed-production.js
```

## Legacy Script Warning

`tests/quick-test.sh` targets port `4000` and is not aligned with current backend defaults.
