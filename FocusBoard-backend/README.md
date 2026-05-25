# FocusBoard Backend (`FocusBoard-backend/`)

Express + Socket.IO API service for FocusBoard.

## Prerequisites

- Node.js 18+
- MongoDB (URI in `MONGODB_URL`)
- ML service running at `ML_SERVICE_URL` (default `http://localhost:5001`)

## Install

Use one package manager consistently:

```bash
npm install
```

or

```bash
bun install
```

## Configure

```bash
cp .env.example .env
```

Minimum required:
- `MONGODB_URL`
- `JWT_SECRET`

Common optional:
- `PORT` (default `5000`)
- `ML_SERVICE_URL` (default `http://localhost:5001`)
- `WORKERS` (cluster worker count)

## Run

Production-style local run:

```bash
npm run start
```

Watch mode (Bun):

```bash
bun run dev
```

Health check:

```bash
curl http://localhost:5000/health
```

## Useful Scripts

```bash
npm run test
npm run generate-embeddings
npm run dedupe-events
npm run ensure-event-id-index
npm run seed-student-day
```

## API Surface

Mounted route groups include:
- `/api/activities`
- `/api/goals`
- `/api/events`
- `/api/categories`
- `/api/auth`
- `/api/tracking-rules`
- `/api/projects`
- `/api/clients`
- `/api/tasks`
- `/api/teams`
- `/api/metrics`
