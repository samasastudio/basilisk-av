# Basilisk AV

Audio-reactive live coding with Strudel (music) and Hydra (visuals) in one REPL.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Contributor Essentials

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

Project verification gate:

```bash
npm run typecheck && npm run lint && npm test -- --run && npm run build
```

Core references:
- [Architecture](docs/reference/ARCHITECTURE.md)
- [API](docs/reference/API.md)
- [Contributing](docs/development/CONTRIBUTING.md)
- [Roadmap](ROADMAP.md)
- [Backlog](BACKLOG.md)

## What It Does

- Unified REPL for Strudel and Hydra code execution.
- Hydra visuals react to Strudel audio through `window.a.fft[0-3]`.
- Draggable and resizable REPL window.
- Default startup script and sound-library autoload via environment variables.
- MIDI mapping subsystem in active development.

## Environment Configuration

Copy `.env.example` to `.env.local` and set optional defaults:

```bash
VITE_DEFAULT_SCRIPT=/scripts/my-startup.js
VITE_DEFAULT_SOUND_LIBRARY=https://cdn.example.com/samples
```

Notes:
- Relative paths resolve from `public/`.
- Absolute URLs are fetched directly.
- Browser runtime does not support local filesystem paths.

## Minimal Usage

1. Start audio in the UI.
2. Run Strudel:

```javascript
s("bd*4, ~ sd, hh*8")
```

3. Initialize Hydra:

```javascript
await initHydra({ detectAudio: true })
```

4. Add audio-reactive visuals:

```javascript
osc(10, 0.1, () => a.fft[0] * 2)
  .rotate(() => a.fft[1], 0.1)
  .out();
```

## Repo Layout

```text
src/
|- components/    # UI
|- hooks/         # React hooks
|- services/      # business logic
|- types/         # TypeScript models
`- utils/         # bridge and utility code
```

## Documentation Index

- [docs/README.md](docs/README.md): docs directory guide
- [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md): implementation deep dive
- [docs/reference/API.md](docs/reference/API.md): public contracts
- [docs/development/TYPE_SAFETY.md](docs/development/TYPE_SAFETY.md): type rules
- [docs/specs](docs/specs): active implementation specs

## Example Assets

- Startup script example: [docs/examples/startup-script.example.js](docs/examples/startup-script.example.js)
- Visual references: [docs/assets/strudel-examples](docs/assets/strudel-examples)

## Troubleshooting

- `a is not defined`: run code once to initialize the bridge.
- Visuals do not react: ensure a Strudel pattern is playing and use callbacks (`() => a.fft[0]`).
- No audio in browser: start audio from a user gesture.
