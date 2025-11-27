# Strudel + Hydra Audio Reactivity - Status & Solutions

## Current Status

### ✅ What Works:
1. Strudel engine initializes correctly
2. Hydra canvas renders visuals
3. Audio plays through Strudel
4. Both REPLs function independently
5. The `a` object (audio bridge) is created and exposed globally
6. FFT tick loop runs continuously

### ❌ What Doesn't Work:
1. **Audio analyser is not connected to Strudel's audio output**
2. `a.fft[]` values remain at 0 (no audio data captured)
3. Hydra visuals don't react to Strudel audio

## Root Cause

**Strud's internal audio architecture (`superdough`) doesn't expose its Web Audio output nodes in an accessible way.**

We've tried:
- ✗ Direct connection to `strudel.output` (doesn't exist)
- ✗ Connection to `scheduler.output` (doesn't exist) 
- ✗ Monkey-patching `AudioContext.createGain()` (Strudel creates its own context)
- ✗ Using `initHydra({detectAudio:true})` (function not properly exported/accessible)

## Potential Solutions

### Option A: Manual Audio Connection (Requires Strudel Source Investigation)
Investigate Strudel's source code to find where the final audio output node is created and expose it.

### Option B: Use Native Browser Audio Capture
Connect an analyser to the browser's audio destination using `getUserMedia()` or similar APIs to capture system audio.

### Option C: Modify Hydra Visuals to Use Fake Data
For demonstration purposes, manually populate `a.fft` with generated values:
```javascript
// In browser console or a custom function
setInterval(() => {
  window.a.fft = [Math.random(), Math.random(), Math.random(), Math.random()];
}, 100);
```

### Option D: Fork/Modify Strudel
Create a custom build of Strudel that exposes the audio output node.

### Option E: Alternative Architecture - Combined REPL
Following the official Strudel+Hydra pattern, combine both into a single REPL where Str udel's built-in Hydra integration handles the audio routing automatically.

## Recommended Next Step

**Test Option C (Fake Data)** to verify that the Hydra rendering pipeline works correctly, then decide whether to:
1. Investigate Strudel's source for audio routing
2. Use a combined REPL approach
3. Accept separate audio/visual workflows
