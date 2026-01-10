# Basilisk API Reference

This document describes the public APIs available in Basilisk for live-coding audio-reactive visuals.

---

## Global Objects

Basilisk exposes two main global objects for interacting with the audio and visual engines:

### `window.repl`

The Strudel REPL instance, available after the audio engine starts.

**Availability**: After clicking "Start Audio" button

**Type**: `StrudelRepl`

#### Methods

##### `repl.evaluate(code: string): Promise<void>`
Execute Strudel pattern code.

```javascript
await window.repl.evaluate('s("bd*4, ~ sd")')
```

**Parameters**:
- `code` (string) - Strudel pattern code to execute

**Returns**: Promise that resolves when evaluation completes

**Example**:
```javascript
// Play a simple kick pattern
window.repl.evaluate('s("bd*4")')

// Chain multiple patterns
window.repl.evaluate(`
  stack(
    s("bd*4"),
    s("~ sd"),
    s("hh*8")
  )
`)
```

##### `repl.stop(): void`
Stop all audio playback.

```javascript
window.repl.stop()
```

**Example**:
```javascript
// Stop all audio
window.repl.stop()

// Alternative: hush via pattern
window.repl.evaluate('hush()')
```

---

### `window.a`

The Hydra audio bridge, available after first code execution.

**Availability**: After first `Execute` in REPL (triggers bridge initialization)

**Type**: `HydraBridge`

#### Properties

##### `a.fft: number[]`
Real-time frequency data from Strudel's audio output.

**Type**: `number[]` (normalized to 0-1 range)

**Default Length**: 4 bins

| Index | Frequency Range | Typical Instruments |
|-------|----------------|---------------------|
| `a.fft[0]` | 0-128 Hz | Bass drum, sub bass |
| `a.fft[1]` | 128-256 Hz | Snare, toms, bass guitar |
| `a.fft[2]` | 256-512 Hz | Vocals, guitar, synths |
| `a.fft[3]` | 512+ Hz | Hi-hats, cymbals, highs |

**Example**:
```javascript
// Use in Hydra code
osc(10, 0.1, () => a.fft[0] * 2).out()

// Log current FFT values
console.log(a.fft) // [0.12, 0.34, 0.08, 0.02]
```

##### `a.analyser: AnalyserNode`
The underlying Web Audio AnalyserNode.

**Type**: `AnalyserNode`

**Example**:
```javascript
// Access analyser properties
console.log(a.analyser.fftSize) // 1024
console.log(a.analyser.frequencyBinCount) // 512
console.log(a.analyser.smoothingTimeConstant) // 0.8
```

##### `a.gainNode: GainNode`
The gain node used for audio routing.

**Type**: `GainNode`

**Example**:
```javascript
// Check gain value
console.log(a.gainNode.gain.value) // 1.0

// Adjust volume (not recommended)
a.gainNode.gain.value = 0.5
```

##### `a.bins: number`
Number of frequency bins in `a.fft`.

**Type**: `number`

**Default**: `4`

**Example**:
```javascript
console.log(a.bins) // 4
console.log(a.fft.length) // 4
```

#### Methods

##### `a.setBins(bins: number): void`
Change the number of frequency bins.

**Parameters**:
- `bins` (number) - Number of frequency bins (minimum 1)

**Example**:
```javascript
// Use more frequency bands
a.setBins(8)
console.log(a.fft.length) // 8

// Access new bins in Hydra
osc(() => a.fft[7] * 10).out()
```

##### `a.tick(): void`
Manually update FFT data (usually not needed).

The bridge automatically updates FFT data at 60 FPS via `requestAnimationFrame`. This method is useful for debugging or manual control.

**Example**:
```javascript
// Manually trigger FFT update
a.tick()
console.log(a.fft) // Updated values
```

##### `a.disconnect(): void`
Disconnect the audio bridge (stops FFT analysis).

**Warning**: This will break audio-reactive visuals. Only use if you need to completely shut down the bridge.

**Example**:
```javascript
// Stop audio analysis
a.disconnect()

// a.fft will no longer update
```

---

## Hydra Functions

Basilisk uses `@strudel/hydra`, which exposes Hydra functions globally. These are available after calling `initHydra()`.

### `initHydra(options?): Promise<void>`

Initialize the Hydra visual engine.

**Parameters**:
- `options` (object, optional) - Hydra configuration
  - `width` (number) - Canvas width (default: `window.innerWidth`)
  - `height` (number) - Canvas height (default: `window.innerHeight`)

**Returns**: Promise that resolves when Hydra is initialized

**Example**:
```javascript
// Initialize with full window size
await initHydra({
  width: window.innerWidth,
  height: window.innerHeight
})

// Initialize with default size
await initHydra()
```

### Audio-Reactive Patterns

Use **arrow functions** to make Hydra code react to audio in real-time.

#### Why Arrow Functions?

Hydra evaluates code continuously at ~60 FPS. Arrow functions are re-evaluated each frame, allowing values to change dynamically.

```javascript
// ❌ WRONG - Static value (evaluated once)
osc(10, 0.1, a.fft[0]).out()

// ✅ CORRECT - Dynamic value (evaluated every frame)
osc(10, 0.1, () => a.fft[0]).out()
```

#### Examples

##### Bass-Reactive Brightness
```javascript
await initHydra()

// Oscillator brightness reacts to bass
osc(10, 0.1, () => a.fft[0] * 3).out()

s("bd*4")
```

##### Multi-Band Modulation
```javascript
await initHydra()

// Different frequencies control different parameters
osc(10, 0.1, () => a.fft[0] * 2)      // Bass → brightness
  .rotate(() => a.fft[1], 0.1)         // Mid → rotation
  .kaleid(() => Math.floor(a.fft[2] * 8)) // High-mid → kaleidoscope
  .modulateScale(osc(8), () => a.fft[3]) // Highs → scale
  .out()

s("bd sd, hh*8, ~ cp")
```

##### Conditional Effects
```javascript
await initHydra()

// Trigger effect when bass exceeds threshold
osc(10, 0.1, 0.8)
  .rotate(() => a.fft[0] > 0.5 ? 0.5 : 0)
  .out()

s("bd*4")
```

##### Smooth Transitions
```javascript
await initHydra()

// Smooth bass value to avoid jitter
let smoothBass = 0
setInterval(() => {
  smoothBass = smoothBass * 0.8 + a.fft[0] * 0.2
}, 16)

osc(10, 0.1, () => smoothBass * 3).out()

s("bd*4")
```

---

## Strudel Functions

All Strudel functions are available globally after the engine starts. See [Strudel documentation](https://strudel.cc) for the full API.

### Common Functions

#### `s(pattern: string)`
Play samples.

```javascript
s("bd*4")
s("bd sd, ~ cp")
s("hh*8").gain(0.5)
```

#### `note(pattern: string)`
Play notes (requires sample that supports pitch).

```javascript
note("c3 e3 g3").s("piano")
note("c a f e").s("sawtooth")
```

#### `stack(...patterns)`
Layer multiple patterns.

```javascript
stack(
  s("bd*4"),
  s("~ sd"),
  s("hh*8")
)
```

#### `.gain(amount: number)`
Adjust volume.

```javascript
s("bd*4").gain(0.8)
s("hh*8").gain(0.3)
```

#### `.slow(factor: number)`
Slow down pattern.

```javascript
s("bd*4").slow(2)  // Half speed
```

#### `.fast(factor: number)`
Speed up pattern.

```javascript
s("bd*4").fast(2)  // Double speed
```

---

## Helper Functions

### Console Debugging

```javascript
// Check if bridge is active
console.log(typeof window.a) // "object" (if active)

// Monitor FFT values
setInterval(() => console.log(a.fft), 500)

// Check REPL status
console.log(window.repl) // StrudelRepl instance
```

### Custom FFT Processing

```javascript
// Get average of all FFT bins
function averageFFT() {
  return a.fft.reduce((sum, val) => sum + val, 0) / a.fft.length
}

// Use in Hydra
osc(10, 0.1, () => averageFFT() * 3).out()
```

```javascript
// Detect bass kicks (threshold crossing)
let lastBass = 0
function detectKick(threshold = 0.5) {
  const kick = a.fft[0] > threshold && lastBass <= threshold
  lastBass = a.fft[0]
  return kick
}

// Trigger visual effect on kick
let kickFlash = 0
setInterval(() => {
  if (detectKick()) kickFlash = 1.0
  kickFlash *= 0.9 // Decay
}, 16)

osc(10, 0.1, () => kickFlash).out()
s("bd*4")
```

---

## TypeScript Types

If using TypeScript, here are the type definitions:

```typescript
interface HydraBridge {
  analyser: AnalyserNode
  gainNode: GainNode
  fft: number[]
  bins: number
  tick: () => void
  setBins: (bins: number) => void
  disconnect: () => void
}

interface StrudelRepl {
  evaluate: (code: string) => Promise<void>
  stop: () => void
}

declare global {
  interface Window {
    repl: StrudelRepl
    a: HydraBridge
  }
}
```

---

## Best Practices

### 1. Always Use Arrow Functions for Audio Reactivity

```javascript
// ✅ GOOD
osc(() => a.fft[0] * 10).out()

// ❌ BAD
osc(a.fft[0] * 10).out()
```

### 2. Normalize FFT Values

```javascript
// Scale FFT to useful ranges
osc(10, 0.1, () => a.fft[0] * 5)       // 0-5 range
.rotate(() => a.fft[1] * Math.PI * 2)  // 0-2π range
```

### 3. Handle Missing Bridge Gracefully

```javascript
// Check if bridge exists before using
if (window.a) {
  osc(() => a.fft[0] * 10).out()
} else {
  osc(10, 0.1, 0.5).out() // Fallback
}
```

### 4. Smooth Noisy FFT Data

```javascript
// Use smoothing for less jittery visuals
let smooth = Array(4).fill(0)
setInterval(() => {
  smooth = smooth.map((s, i) => s * 0.8 + a.fft[i] * 0.2)
}, 16)

osc(() => smooth[0] * 10).out()
```

---

## Troubleshooting

### `a is not defined`
**Cause**: Bridge not initialized yet
**Solution**: Click "Execute" to run Strudel code

### `a.fft` shows all zeros
**Cause**: No audio playing
**Solution**: Run a Strudel pattern: `s("bd*4")`

### Visuals not reacting
**Cause**: Not using arrow functions
**Solution**: Use `() => a.fft[0]` instead of `a.fft[0]`

### "repl is not defined"
**Cause**: Audio engine not started
**Solution**: Click "Start Audio" button first

---

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical implementation details
- [README.md](README.md) - Quick start guide
- [Strudel Documentation](https://strudel.cc) - Full Strudel API
- [Hydra Documentation](https://hydra.ojack.xyz/docs) - Full Hydra API
