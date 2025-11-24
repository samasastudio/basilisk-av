# Basilisk – Live‑Coding Audio‑Visual Playground

## Overview
Basilisk is a **Vite + React + TypeScript** playground that tightly couples the **Strudel REPL** (live‑coding audio) with **Hydra‑Synth** (real‑time visuals).  It showcases a seamless audio‑to‑visual pipeline where Strudel’s WebAudio output drives a gorgeous "Egg of the Phoenix" shader, and the user can switch visual modes, tweak parameters, and even add custom Hydra scripts.

### Key Features
- **Strudel REPL** embedded side‑by‑side with Hydra canvas.
- Shared `AudioContext` so Strudel audio can be analysed without extra nodes.
- Real‑time `AnalyserNode` feeds a `Uint8Array` of frequency data to Hydra.
- Two visual modes:
  - **default** – subtle speed/scale modulation.
  - **bass** – aggressive speed, scale and colour changes reacting to low‑frequency energy.
- High‑resolution Hydra canvas that respects the actual canvas size and device pixel ratio.
- Clean, component‑driven architecture (`App.tsx`, `HydraCanvas.tsx`, `StrudelRepl.tsx`).

## Getting Started
```bash
# 1️⃣ Clone the repository
git clone <repo‑url>
cd test   # the workspace folder

# 2️⃣ Install dependencies
npm install

# 3️⃣ Run the development server
npm run dev
```
The app will be available at `http://localhost:5173`.  The Vite dev server supports hot‑module replacement, so any change to the source files instantly updates the UI.

## Project Structure
```
src/
├─ App.tsx               # Root component – wires Strudel, Hydra, UI controls
├─ components/
│   ├─ HydraCanvas.tsx   # Hydra initialization & visual logic
│   └─ StrudelRepl.tsx   # Strudel REPL web component wrapper
├─ index.css             # Global styles (dark mode, glass‑morphism, etc.)
└─ index.tsx             # React entry point
```

## How It Works
1. **Audio Context Sharing** – `App.tsx` creates a single `AudioContext` that is passed to both Strudel and Hydra.
2. **AnalyserNode** – An `AnalyserNode` captures FFT data each animation frame and stores it in React state (`audioData`).
3. **Hydra Reactivity** – `HydraCanvas` receives `audioData` and `visualMode` as props.  The default "Egg of the Phoenix" shader now uses `window.audioAmp` (updated each frame) to modulate `modulateScale`.
4. **Visual Modes** – Selecting a mode from the dropdown changes the shader behaviour in real‑time.

## Customising the Visuals
- Open `src/components/HydraCanvas.tsx`.
- Replace the default shader chain with any Hydra script you like – just make sure to keep the `hydraInstance.current` reference.
- To expose additional audio‑reactive parameters, update the `window.audioAmp` assignment in the `useEffect` that processes `props.audioData`.

## Testing & Debugging
- The **Testing Guide** (`TESTING_GUIDE.md`) lists a checklist for verifying audio‑visual sync, UI responsiveness, and performance.
- Console logs in `App.tsx` will show when the Strudel engine is successfully initialized.

## License
This project is licensed under the **MIT License**.  The Hydra "Egg of the Phoenix" shader is licensed under **CC BY‑NC‑SA 4.0** – attribution is retained in the source code.
