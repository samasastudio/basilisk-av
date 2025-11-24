Nice, that’s a great stack for this.

Yes: you can absolutely have a Strudel REPL and a Hydra canvas running side-by-side in a Vite/React app. Here’s a concrete way to wire it up.

---

## 1. Install the deps

In your Vite/React project:

```bash
npm install hydra-synth @strudel/repl
# or
pnpm add hydra-synth @strudel/repl
```

* `@strudel/repl` gives you the Strudel REPL as a web component. ([Strudel][1])
* `hydra-synth` is the standalone Hydra engine. ([NPM][2])

---

## 2. Register the Strudel REPL web component

Strudel’s REPL is exposed as a custom element (`<strudel-editor>`). If you import the package once, it registers the element globally. ([Strudel][1])

### `main.tsx` (or `main.jsx`)

```ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// this side-effect import registers <strudel-editor> as a custom element
import '@strudel/repl'

import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### (Optional, but nice) TypeScript JSX typings

Create `src/strudel.d.ts` so TS stops complaining about the custom element:

```ts
// src/strudel.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'strudel-editor': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export {}
```

If you’re JS-only, you can skip this file.

---

## 3. A small Hydra React component

We’ll run Hydra in **non-global mode** (`makeGlobal: false`) so it doesn’t spray functions onto `window` and accidentally clash with anything Strudel is doing. Hydra’s own docs show this pattern using `new Hydra({ makeGlobal: false, detectAudio: false }).synth`. ([hydra.ojack.xyz][3])

```tsx
// src/components/HydraCanvas.tsx
import { useEffect, useRef } from 'react'
import Hydra from 'hydra-synth'

export function HydraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create hydra instance bound to this canvas
    const hydraSynth = new (Hydra as any)({
      canvas: canvasRef.current,
      detectAudio: false,   // Strudel will handle audio
      makeGlobal: false,    // stay scoped to this component
    }).synth

    // Simple test visual
    hydraSynth
      .osc(10, 0.1, 1.2)
      .kaleid(3)
      .modulateRotate(hydraSynth.noise(3, 0.1), 0.2)
      .out()

    // No perfect official "cleanup" API yet; letting the instance be GC'd is fine
    return () => {
      // Optional: clear the canvas
      const ctx = canvasRef.current?.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
```

---

## 4. Put Strudel + Hydra side-by-side in `App`

```tsx
// src/App.tsx
import './App.css'
import { HydraCanvas } from './components/HydraCanvas'

function App() {
  return (
    <div className="app-root">
      <div className="pane pane-audio">
        <h2>Strudel REPL</h2>
        {/* The REPL UI lives inside this custom element */}
        <strudel-editor style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="pane pane-visuals">
        <h2>Hydra Visuals</h2>
        <HydraCanvas />
      </div>
    </div>
  )
}

export default App
```

### Simple layout CSS

```css
/* src/App.css */
.app-root {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-template-rows: 100vh;
  gap: 0.5rem;
  padding: 0.5rem;
  box-sizing: border-box;
}

.pane {
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0.5rem;
  background: #050508;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane h2 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #aaa;
}

.pane-audio strudel-editor {
  flex: 1;
  min-height: 0;
}

.pane-visuals canvas {
  flex: 1;
  min-height: 0;
}
```

---

## 5. How it behaves

* **Audio**

  * Strudel uses Web Audio internally when you write patterns and hit play in the REPL. ([Strudel][4])
  * Hydra has `detectAudio: false`, so it doesn’t do anything with the microphone or its own audio analysis loop.

* **Visuals**

  * Hydra renders continuously into the canvas using WebGL. ([hydra.ojack.xyz][3])
  * You can swap out the simple `osc(...).out()` patch in `HydraCanvas` with whatever shader chain you want.

* **No global-namespace fight**


## 1. Install the deps

In your Vite/React project:

```bash
npm install hydra-synth @strudel/repl
# or
pnpm add hydra-synth @strudel/repl
```

* `@strudel/repl` gives you the Strudel REPL as a web component. ([Strudel][1])
* `hydra-synth` is the standalone Hydra engine. ([NPM][2])

---

## 2. Register the Strudel REPL web component

Strudel’s REPL is exposed as a custom element (`<strudel-editor>`). If you import the package once, it registers the element globally. ([Strudel][1])

### `main.tsx` (or `main.jsx`)

```ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// this side-effect import registers <strudel-editor> as a custom element
import '@strudel/repl'

import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### (Optional, but nice) TypeScript JSX typings

Create `src/strudel.d.ts` so TS stops complaining about the custom element:

```ts
// src/strudel.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'strudel-editor': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export {}
```

If you’re JS-only, you can skip this file.

---

## 3. A small Hydra React component

We’ll run Hydra in **non-global mode** (`makeGlobal: false`) so it doesn’t spray functions onto `window` and accidentally clash with anything Strudel is doing. Hydra’s own docs show this pattern using `new Hydra({ makeGlobal: false, detectAudio: false }).synth`. ([hydra.ojack.xyz][3])

```tsx
// src/components/HydraCanvas.tsx
import { useEffect, useRef } from 'react'
import Hydra from 'hydra-synth'

export function HydraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create hydra instance bound to this canvas
    const hydraSynth = new (Hydra as any)({
      canvas: canvasRef.current,
      detectAudio: false,   // Strudel will handle audio
      makeGlobal: false,    // stay scoped to this component
    }).synth

    // Simple test visual
    hydraSynth
      .osc(10, 0.1, 1.2)
      .kaleid(3)
      .modulateRotate(hydraSynth.noise(3, 0.1), 0.2)
      .out()

    // No perfect official "cleanup" API yet; letting the instance be GC'd is fine
    return () => {
      // Optional: clear the canvas
      const ctx = canvasRef.current?.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
```

---

## 4. Put Strudel + Hydra side-by-side in `App`

```tsx
// src/App.tsx
import './App.css'
import { HydraCanvas } from './components/HydraCanvas'

function App() {
  return (
    <div className="app-root">
      <div className="pane pane-audio">
        <h2>Strudel REPL</h2>
        {/* The REPL UI lives inside this custom element */}
        <strudel-editor style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="pane pane-visuals">
        <h2>Hydra Visuals</h2>
        <HydraCanvas />
      </div>
    </div>
  )
}

export default App
```

### Simple layout CSS

```css
/* src/App.css */
.app-root {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-template-rows: 100vh;
  gap: 0.5rem;
  padding: 0.5rem;
  box-sizing: border-box;
}

.pane {
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0.5rem;
  background: #050508;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane h2 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #aaa;
}

.pane-audio strudel-editor {
  flex: 1;
  min-height: 0;
}

.pane-visuals canvas {
  flex: 1;
  min-height: 0;
}
```

---

## 5. How it behaves

* **Audio**

  * Strudel uses Web Audio internally when you write patterns and hit play in the REPL. ([Strudel][4])
  * Hydra has `detectAudio: false`, so it doesn’t do anything with the microphone or its own audio analysis loop.

* **Visuals**

  * Hydra renders continuously into the canvas using WebGL. ([hydra.ojack.xyz][3])
  * You can swap out the simple `osc(...).out()` patch in `HydraCanvas` with whatever shader chain you want.

* **No global-namespace fight**

  * Hydra is in non-global mode.
  * Strudel’s REPL is isolated in its web component.

---

If you want, next step I can show you how to make Hydra react to Strudel's audio (FFT-based modulation, beat-synced patterns, etc.) inside this same React/Vite setup.

[1]: https://strudel.cc/technical-manual/project-start/?utm_source=chatgpt.com "Using Strudel in Your Project"
[2]: https://www.npmjs.com/package/hydra-synth?utm_source=chatgpt.com "hydra-synth"
[3]: https://hydra.ojack.xyz/docs/docs/learning/guides/how-to/hydra-in-a-webpage/?utm_source=chatgpt.com "Embed Hydra on your webpage | hydra video synth"
[4]: https://strudel.cc/workshop/getting-started/?utm_source=chatgpt.com "Getting Started 🌀 Strudel"

---

## 6. Connecting Hydra to the Strudel REPL UI

Now that we have both systems running side-by-side, let's connect them so Hydra can:
1. **Sync visuals to Strudel's audio** using FFT/frequency data
2. **Expose visual controls** in the UI (mode switchers, parameters)
3. **Route UI events** from the REPL to Hydra shaders

### 6.1 Audio Analysis & Syncing

First, we need to extract audio data from Strudel's AudioContext and feed it to Hydra.

#### Update `App.tsx` to create an AnalyserNode:

```tsx
import { useState, useEffect, useRef } from 'react';

function App() {
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startEngine = async () => {
    // ... existing initStrudel code ...
    
    const sharedAudioContext = (repl as any).audioContext || new AudioContext();
    
    // Create analyser node
    const analyser = sharedAudioContext.createAnalyser();
    analyser.fftSize = 256; // 128 frequency bins
    analyserRef.current = analyser;
    
    // Connect to Strudel's output (or destination as fallback)
    if ((repl as any).output) {
      (repl as any).output.connect(analyser);
    } else {
      sharedAudioContext.destination.connect(analyser);
    }
    
    // Animation loop to continuously extract frequency data
    const updateAudioData = () => {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(dataArray);
      }
      animationRef.current = requestAnimationFrame(updateAudioData);
    };
    updateAudioData();
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (analyserRef.current) analyserRef.current.disconnect();
    };
  }, []);
}
```

### 6.2 Visual Mode Controls

Add a UI control to switch between different Hydra visual modes:

```tsx
function App() {
  const [visualMode, setVisualMode] = useState<'default' | 'bass'>('default');
  
  return (
    <div>
      {/* Visual mode selector */}
      <select
        value={visualMode}
        onChange={(e) => setVisualMode(e.target.value as 'default' | 'bass')}
      >
        <option value="default">Default</option>
        <option value="bass">Bass-Responsive</option>
      </select>
      
      {/* Pass props to HydraCanvas */}
      <HydraCanvas
        audioContext={sharedAudioContext}
        audioData={audioData}
        visualMode={visualMode}
      />
    </div>
  );
}
```

### 6.3 Update HydraCanvas to React to Audio

Modify `HydraCanvas.tsx` to accept and use the audio data:

```tsx
type Props = {
  className?: string;
  audioContext?: AudioContext;
  audioData?: Uint8Array;
  visualMode?: 'default' | 'bass';
};

export default function HydraCanvas(props: Props) {
  const { className, audioContext } = props;
  const hydraInstance = useRef<any>(null);
  
  // Initialize Hydra once
  useEffect(() => {
    if (!canvasRef.current || hydraInstance.current) return;
    
    hydraInstance.current = new Hydra({
      canvas: canvasRef.current,
      audioContext,
      detectAudio: false,
      makeGlobal: false,
    }).synth;
    
    // Initial visual
    hydraInstance.current.osc(10, 0.1, 0.8).kaleid().out();
  }, [audioContext]);
  
  // Update visuals when audio data or mode changes
  useEffect(() => {
    if (!hydraInstance.current) return;
    
    // Calculate average amplitude from frequency data
    const avgAmplitude = props.audioData ?
      props.audioData.reduce((sum: number, val: number) => sum + val, 0) / 
      props.audioData.length / 255 : 0.5;
    
    const mode = props.visualMode ?? 'default';
    
    if (mode === 'bass') {
      // Bass-responsive: use low-frequency bins for modulation
      hydraInstance.current
        .osc(5, 0.2, avgAmplitude * 2)
        .kaleid(4)
        .modulateScale(hydraInstance.current.noise(2, 0.1), avgAmplitude)
        .out();
    } else {
      // Default: subtle audio-driven animation
      hydraInstance.current
        .osc(10, 0.1, 0.8 + avgAmplitude * 0.2)
        .rotate(0, 0.1)
        .kaleid()
        .out();
    }
  }, [props.audioData, props.visualMode]);
  
  return <canvas ref={canvasRef} className={className} />;
}
```

### 6.4 How It Works

**Audio Flow:**
```
Strudel Pattern → AudioContext → AnalyserNode → Frequency Data (Uint8Array)
                                                        ↓
                                              React State (audioData)
                                                        ↓
                                              HydraCanvas (visual modulation)
```

**Key Points:**

- **Shared AudioContext**: Both Strudel and Hydra use the same `AudioContext`, preventing conflicts
- **AnalyserNode**: Extracts real-time frequency data without affecting audio playback
- **requestAnimationFrame**: Continuously updates `audioData` state (~60fps)
- **Reactive Visuals**: Hydra shaders re-compile when `audioData` or `visualMode` changes
- **Non-blocking**: Audio analysis runs in parallel with rendering

### 6.5 Advanced: Custom Visual Parameters

You can expose more granular controls by extending the props:

```tsx
type Props = {
  // ... existing props
  kaleidoscope?: number;  // Number of mirrors
  rotation?: number;      // Rotation speed
  colorShift?: number;    // Hue offset
};

// In the effect:
hydraInstance.current
  .osc(10, 0.1, 0.8 + avgAmplitude * 0.2)
  .rotate(props.rotation ?? 0.1)
  .kaleid(props.kaleidoscope ?? 3)
  .color(props.colorShift ?? 0, 1, 1)
  .out();
```

Then add sliders in your UI:

```tsx
<input
  type="range"
  min="2"
  max="12"
  value={kaleidoscope}
  onChange={(e) => setKaleidoscope(Number(e.target.value))}
/>
```

---

## 7. Next Steps

- **Beat Detection**: Use onset detection libraries to trigger visual events on beats
- **MIDI Control**: Map MIDI controllers to both Strudel patterns and Hydra parameters
- **Preset System**: Save/load combinations of Strudel code + Hydra shader configs
- **Recording**: Capture the canvas output using MediaRecorder API
