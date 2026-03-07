# ROADMAP.md

Execution-focused priorities for current development. Detailed inventory stays in [BACKLOG.md](BACKLOG.md).

## Active Priorities

### 1. MIDI I/O and Mapping (In Progress)

Goal:
- Connect hardware MIDI input, map CC/notes to actions, and generate reusable mapping code.

Acceptance criteria:
- MIDI input discovery and connection state are visible in UI.
- CC and note bindings can be created, edited, and persisted.
- Generated mapping output is copy-ready and deterministic.
- Unit tests cover parse/store/codegen/hook behavior.

### 2. Fullscreen REPL (Ready)

Goal:
- Toggle REPL to fullscreen for performance workflows.

Acceptance criteria:
- Enter/exit fullscreen from UI and keyboard.
- Header and non-essential chrome are hidden in fullscreen mode.
- Escape exits fullscreen reliably.
- Existing REPL drag/resize behavior remains intact when not fullscreen.

### 3. Multi-Window Hydra Output (Planned)

Goal:
- Render Hydra on a separate display window while keeping REPL controls in the main app.

Acceptance criteria:
- Secondary window lifecycle is managed (open, reconnect, close).
- Render sync remains stable between main and secondary windows.
- Main app remains usable if secondary window is blocked or closed.

## Stabilization Work (Immediate)

### 4. Test Harness and Dev Loop Reliability

Goal:
- Keep local verification reliable for Codex-driven iteration.

Acceptance criteria:
- Default-env hook tests are deterministic when env vars are unset.
- Vitest teardown completes without global cleanup errors.
- Verification gate passes locally (`typecheck`, `lint`, `test --run`, `build`).

## Completed Baseline

- Unified Strudel + Hydra REPL.
- Audio-reactive bridge (`a.fft[0-3]`).
- Draggable/resizable REPL window.
- Sound browser and user library flows.
- Environment auto-load support for script and sound library.
- Dark mode support.

## Tracking

- Implementation details and future candidates: [BACKLOG.md](BACKLOG.md)
- Active feature specs: [docs/specs](docs/specs)
- Technical architecture: [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)
