# FocusBoard Desktop Client (`FocusBoard/`)

Tauri v2 + React frontend for FocusBoard.

## Prerequisites

- Bun
- Rust toolchain (`rustup`)
- Tauri system dependencies for your OS

## Install

```bash
bun install
```

## Run

Desktop (Tauri):

```bash
bun run tauri dev
```

Frontend-only (Vite on port `1420`):

```bash
bun run dev
```

Build:

```bash
bun run build
bun run tauri build
```

## API Configuration

Frontend uses `VITE_API_BASE_URL` (or `VITE_API_BASE`) when provided.
Default backend base is `http://localhost:5000/api` in Tauri dev.
WebSocket override: `VITE_WS_URL`.

Example:

```bash
VITE_API_BASE_URL=http://localhost:5000/api bun run tauri dev
```

WebSocket example:

```bash
VITE_WS_URL=ws://localhost:5000 bun run tauri dev
```

## Arch Linux (AUR)

See `FocusBoard/docs/arch-aur.md` for packaging notes and dependencies.

## Test Commands

```bash
bun run test
bun run cypress:open
bun run cypress:run
```
