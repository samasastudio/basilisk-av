# Basilisk – Audio-Reactive Live Coding Environment

## Overview
Basilisk is a live-coding playground that combines **Strudel** (audio patterns) and **Hydra** (visual synthesis) in a single React application with real-time audio-reactive visuals. Write rhythmic patterns in Strudel and watch them drive stunning visuals in Hydra—all in one unified REPL.

## Features
- ✅ **Strudel REPL** with CodeMirror editor (syntax highlighting, line numbers)
- ✅ **Hydra canvas** with audio-reactive FFT bridge
- ✅ **Draggable/resizable REPL window** (using react-rnd)
- ✅ **Dev mode HUD** showing real-time FFT data
- ✅ **Zero-latency audio→visual routing** (no microphone required)
- ✅ **Unified code execution** - Run both Strudel and Hydra code in the same editor

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

### 1. Start the Audio Engine
Click the **"Start Audio"** button in the top-right header.

### 2. Run Strudel Patterns
Type a Strudel pattern in the REPL:
```javascript
s("bd*4, ~ sd, hh*8")
```

Press **Execute ▶** or **Shift+Enter** to run.

### 3. Initialize Hydra
In the same REPL, initialize Hydra:
```javascript
await initHydra({
  width: window.innerWidth,
  height: window.innerHeight
})
```

### 4. Create Audio-Reactive Visuals
Now write Hydra code that reacts to Strudel's audio via `a.fft`:
```javascript
// Bass-reactive oscillator
osc(10, 0.1, () => a.fft[0] * 2)
  .rotate(() => a.fft[1], 0.1)
  .kaleid(() => Math.floor(a.fft[2] * 8))
  .out()

// Keep the Strudel beat going
s("bd sd, hh*8")
```

The visuals will pulse, rotate, and morph in sync with your audio!

## Architecture

- **Built with**: Vite + React + TypeScript
- **Audio Engine**: Strudel (using @strudel/web)
- **Visual Engine**: Hydra (using @strudel/hydra)
- **Audio Bridge**: Web Audio API monkey-patching for zero-latency FFT routing

See [ARCHITECTURE.md](ARCHITECTURE.md) for a comprehensive technical deep-dive (588 lines of implementation details, diagrams, and debugging guides).

## Project Structure

```
src/
├── App.tsx                     # Main app component
├── components/
│   ├── StrudelRepl.tsx         # CodeMirror-based REPL
│   └── ui/Button.tsx           # UI components
└── utils/
    ├── patchSuperdough.ts      # Audio routing interceptor (CRITICAL: loads before Strudel)
    ├── strudelHydraBridge.ts   # FFT analysis bridge
    └── patternPresets.ts       # Example patterns
```

## Audio Bridge (`window.a`)

The audio bridge exposes real-time frequency data to Hydra:

| Property | Frequency Range | Typical Use |
|----------|-----------------|-------------|
| `a.fft[0]` | 0-128 Hz | Bass drums, sub bass |
| `a.fft[1]` | 128-256 Hz | Snares, toms |
| `a.fft[2]` | 256-512 Hz | Vocals, synths |
| `a.fft[3]` | 512+ Hz | Hi-hats, cymbals |

Values are normalized to `0-1` range.

## Example Patterns

### Simple Bass Kick
```javascript
await initHydra()
osc(10, 0.1, () => a.fft[0] * 3).out()
s("bd*4")
```

### Multi-Band Reactivity
```javascript
await initHydra()
osc(3.762, () => (a.fft[3] * 0.05) + 0.01, -3.794)
  .rotate()
  .kaleid()
  .colorama(() => a.fft[0] / 1e4)
  .pixelate(128)
  .out()

s("bd sd, hh*4")
```

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical implementation details, performance metrics, debugging
- **[REFACTOR_PLAN.md](REFACTOR_PLAN.md)** - Planned improvements and testing strategy
- **[roadmap.md](roadmap.md)** - Feature roadmap
- **[archive/](archive/)** - Historical documentation (outdated but preserved)

## Development

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Testing (Coming Soon)
```bash
npm test           # Run Vitest unit tests
npm test:ui        # Open Vitest UI
npm test:coverage  # Generate coverage report
```

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 89+     | ✅ Fully supported |
| Firefox | 88+     | ✅ Fully supported |
| Safari  | 14.1+   | ✅ Fully supported* |
| Edge    | 89+     | ✅ Fully supported |

*Safari requires a user gesture (button click) to start the AudioContext.

## Troubleshooting

### "a is not defined" error
**Cause**: Audio bridge not initialized yet.
**Solution**: Click "Execute" to run Strudel code (triggers bridge creation).

### Visuals not reacting to audio
**Cause**: `a.fft` values are all zeros.
**Solution**: Make sure Strudel pattern is playing (`s("bd*4")`) and use arrow functions in Hydra (`() => a.fft[0]`).

### Black screen on Hydra canvas
**Cause**: Hydra not initialized.
**Solution**: Run `await initHydra()` in the REPL first.

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed debugging guides.

## License

MIT

## Credits

- **Strudel**: [https://strudel.cc](https://strudel.cc)
- **Hydra**: [https://hydra.ojack.xyz](https://hydra.ojack.xyz)
- **Built with**: Vite, React, TypeScript, CodeMirror
