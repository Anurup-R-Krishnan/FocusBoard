# Standalone Rust Monitor Binary — Plan

## Problem
`monitor.rs` lives inside the Tauri process — tracking dies when the app closes. To track 24/7, we need it as an independent systemd service.

## Approach
Refactor `monitor.rs` to split detection logic from output. Add a new binary target that POSTs to the backend directly.

## Architecture

```
┌──────────────────────────────────────────────────┐
│  systemd --user                                  │
│  ├─ focusboard-backend.service (Node.js)         │
│  │   └─ node server.js                           │
│  └─ focusboard-monitor.service (Rust binary)     │
│       └─ focusboard-monitor                      │
│           └─ POST /api/activities ◄──────┐       │
│                                          │       │
│  Tauri app (on demand)                   │       │
│  ├─ also calls POST /api/activities ─────┘       │
│  └─ frontend reads GET /api/metrics/...          │
│                                                  │
│  Data flows: monitor → backend → NeDB            │
│  UI: Tauri app reads backend API                 │
└──────────────────────────────────────────────────┘
```

## File changes

| File | Change |
|------|--------|
| `src-tauri/Cargo.toml` | Add `ureq` dep. Add `[[bin]] name="focusboard-monitor" path="src/monitor_bin.rs"` |
| `src-tauri/src/monitor.rs` | Refactor: extract core loop into `run_monitor_loop<F>(on_activity: F, shutdown_rx)` where `F: Fn(&ActivityEvent)`. `start_monitor()` wraps it with Tauri `app.emit()`. |
| `src-tauri/src/monitor_bin.rs` | **New**. `main()` calls `run_monitor_loop` with closure that POSTs to `http://localhost:5000/api/activities` via `ureq`. Catches SIGTERM/SIGINT. Config via env vars. |
| `src-tauri/src/lib.rs` | No change — still calls `start_monitor()` for Tauri path |
| `FocusBoard/aur/focusboard-monitor.service` | **New**. systemd user service file |
| `FocusBoard/aur/focusboard-backend.service` | **New**. systemd user service file |
| `FocusBoard/aur/focusboard.desktop` | **New**. Static desktop file |
| `FocusBoard/aur/PKGBUILD` | Build both binaries. Install both + service files + backend |
| `src/App.tsx` | Add backend health check on mount. If down, show `<SetupWizard>` |
| `src/components/SetupWizard.tsx` | **New**. [Enable Services] button → invokes Rust command |
| `src-tauri/src/systemd.rs` | **New**. `setup_systemd_service` Tauri command via `std::process::Command` |

## Key decisions

- **`ureq`** over `reqwest` — sync, ~100KB vs reqwest's ~2MB. Monitor loop is already sync.
- **`start_monitor()` untouched** — Tauri app still runs its own monitor for immediate feedback.
- **No code duplication** — `run_monitor_loop()` is the shared core. Both Tauri and standalone provide different callbacks.
- **std::process::Command** for `systemctl` — no `tauri-plugin-shell` needed, consistent with existing `try_hyprctl_active_window` pattern.

## Remaining work (dependency order)

### 1. Standalone monitor binary (`focusboard-monitor`)
- Extract `run_monitor_loop()` from `monitor.rs` (shared core)
- Create `monitor_bin.rs` — main() calls the loop, POSTs to backend via `ureq`
- Add `[[bin]]` + `ureq` dep to `Cargo.toml`
- Add `setup_systemd_service` Tauri command in `systemd.rs`

### 2. AUR packaging files (new)
- `aur/focusboard-backend.service` — systemd user unit for Node.js backend
- `aur/focusboard-monitor.service` — systemd user unit for Rust monitor
- `aur/focusboard.desktop` — static desktop file

### 3. PKGBUILD rewrite
- Build both binaries (`focusboard` + `focusboard-monitor`)
- Install both to `/usr/bin/`
- Install both `.service` files to `/usr/lib/systemd/user/`
- Bundle Node.js backend at `/usr/share/focusboard/backend/`
- Generate `.env` with random `JWT_SECRET`
- Install desktop file + icon + license

### 4. Frontend setup wizard
- `<SetupWizard>` component: [Enable Services] button → invokes Rust → `systemctl --user enable --now`
- `App.tsx`: health check on mount, show wizard if backend down

### 5. Cleanup
- Remove stale scripts from `package.json` (`seedStudentDay`, `dedupeEvents`, `ensureEventIdIndex`, `generate-embeddings`)

### 6. Verification
- Build PKGBUILD locally with `makepkg`
- Install the built package
- Test full flow: start services, launch app, verify tracking

## Open questions

1. Should the standalone monitor poll less aggressively than the current 1-5s?
2. How to handle duplicate POSTs when Tauri app opens while standalone monitor is also running?
