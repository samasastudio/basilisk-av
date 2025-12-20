# Basilisk AV — Roadmap

## What's Built

**Project started**: November 23, 2025

### Core Platform ✅
- Vite + React + TypeScript
- Dark minimalist UI with glassmorphism
- Strudel REPL with CodeMirror
- Full-screen Hydra canvas

### Audio-Visual Bridge ✅
- Shared AudioContext via Web Audio API
- FFT analysis exposed as `a.fft[0-3]`
- Zero-latency audio → visual routing
- No microphone required

### Window Management ✅
- Draggable/resizable REPL panel
- Position persistence (localStorage)
- Glassmorphic design system

### Sample Browsers ✅
- Sound Browser (Strudel built-in samples)
- User Library (personal sample directories)
- Shared SamplePanel component
- Search, preview, insert workflow
- Panel exclusivity

### Code Quality ✅
- 150+ tests passing
- ESLint configured (42 rules)
- TypeScript strict mode
- Hooks and services extracted

### Documentation ✅
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical deep-dive
- [API.md](docs/API.md) — Public API reference
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) — Dev onboarding

---

## What's Next

See **[BACKLOG.md](BACKLOG.md)** for the full feature inventory.

**Currently interested in:**
- Strudel inline visuals (pianoroll, punchcard, spiral, etc.)
- MIDI I/O (controller input, Ableton integration)
- Multi-window (Hydra canvas on external display)
- Environment auto-load (samples dir, startup script)
- Dark mode & fullscreen REPL

---

## Architecture

```
src/
├── components/     # React UI
├── hooks/          # Custom hooks
├── services/       # Business logic
└── utils/          # Helpers
```

Key files:
- `patchSuperdough.ts` — Audio routing interceptor
- `strudelHydraBridge.ts` — FFT bridge to Hydra
- `useStrudelEngine.ts` — Engine lifecycle

---

## Running Locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Run tests
npm run build      # Production build
```

---

## Links

- [Strudel](https://strudel.cc) — Audio pattern language
- [Hydra](https://hydra.ojack.xyz) — Visual synthesis
