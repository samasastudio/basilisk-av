# Hydra Auto-Initialization Specification

## Overview

This document specifies the changes required to automatically initialize Hydra when the Strudel audio engine starts, eliminating the need for users to manually call `await initHydra()` in their REPL code.

## Current Behavior

### Initialization Flow

```
User clicks "Start Audio"
        ↓
useStrudelEngine.startEngine()
        ↓
StrudelEngine.initializeStrudel()
        ↓
Strudel REPL ready (engineStatus = 'ready')
        ↓
User runs code with audio (e.g., s("bd sd"))
        ↓
patchSuperdough.ts intercepts first audio connection
        ↓
initHydraBridge() creates FFT bridge (window.a.fft available)
        ↓
User must manually call: await initHydra({ width, height })
        ↓
Hydra canvas initialized, global functions available (osc, src, etc.)
```

### Key Files Involved

| File | Role |
|------|------|
| `src/hooks/useStrudelEngine.ts` | Engine lifecycle, bridge callback registration |
| `src/components/StrudelRepl.tsx` | Exposes `initHydra` globally, default code calls it |
| `src/components/HydraCanvas.tsx` | Canvas container, startup text |
| `src/utils/patchSuperdough.ts` | Audio routing interceptor |
| `src/utils/strudelHydraBridge.ts` | FFT bridge for `window.a.fft[0-3]` |

### Current User Experience

1. User starts audio engine (Ctrl+Shift+Space or button)
2. User must include `await initHydra()` at the top of their code
3. User runs code to see visuals
4. Startup text shows: "Run code with `await initHydra()` to start visuals"

## Proposed Behavior

### New Initialization Flow

```
User clicks "Start Audio"
        ↓
useStrudelEngine.startEngine()
        ↓
StrudelEngine.initializeStrudel()
        ↓
initHydra() called automatically  ← NEW
        ↓
Strudel REPL + Hydra both ready (engineStatus = 'ready')
        ↓
User runs Hydra code immediately (no init needed)
```

### New User Experience

1. User starts audio engine
2. Hydra is ready immediately - user can write visuals without boilerplate
3. Startup text updated or removed

## Implementation Options

### Option A: Initialize in startEngine() (Recommended)

Call `initHydra` immediately after Strudel initializes, before setting engine status to ready.

**Pros:**
- Hydra ready as soon as engine is ready
- Single initialization point
- User code is cleaner

**Cons:**
- Slight increase in startup time
- Hydra initializes even if user only wants audio

**Changes Required:**

#### 1. Modify `useStrudelEngine.ts`

```typescript
import { initHydra } from '@strudel/hydra';

const startEngine = async (): Promise<void> => {
  if (!canStartEngine(engineStatus)) { return; }

  setEngineStatus('initializing');
  setInitError(null);

  try {
    setBridgeInitializer((audioContext) => {
      setHydraLinked(true);
      setHydraStatus('Strudel (a.fft)');
      window.replAudio = audioContext;
      StrudelEngine.connectAudioAnalyser();
    });

    const repl = await StrudelEngine.initializeStrudel();
    window.repl = repl;

    // NEW: Auto-initialize Hydra
    await initHydra({
      width: window.innerWidth,
      height: window.innerHeight
    });

    setEngineStatus('ready');
  } catch (error) {
    // ... error handling
  }
};
```

#### 2. Update default code in `StrudelRepl.tsx`

Remove the `initHydra` boilerplate from default code:

```typescript
const defaultCode = `// Audio-reactive feedback loop with noise modulation
src(o0)
 .saturate(1.01)
 .scale(0.99)
 .color(1.01,1.01,1.01)
 .hue(() => a.fft[3])
 .modulateHue(src(o1).hue(.3).posterize(-1).contrast(.7),2)
  .layer(src(o1)
         .luma()
         .mult(gradient(1)
               .saturate(.9)))
  .out(o0)

noise(1, .2)
  .rotate(2,.5)
  .layer(src(o0)
  .scrollX(.2))
  .out(o1)

render(o0)

// Audio pattern
s("bd sd, hh*4")`;
```

#### 3. Update `HydraCanvas.tsx` startup text

Option 3a - Remove startup text entirely:
```typescript
{showStartupText && (
  <div className="w-full h-full flex items-center justify-center text-basilisk-gray-400 text-sm font-sans pointer-events-none">
    Start the audio engine to begin
  </div>
)}
```

Option 3b - Show different message based on engine state:
```typescript
{showStartupText && (
  <div className="...">
    Press <kbd>Ctrl+Shift+Space</kbd> or click Start Audio
  </div>
)}
```

### Option B: Initialize in Bridge Callback

Call `initHydra` when the audio bridge first connects (after first audio plays).

**Pros:**
- Hydra only initializes when audio is actually used
- Lazy initialization

**Cons:**
- Delay between running code and Hydra being available
- User still needs to wait for first audio before visuals work
- More complex timing

**Changes Required:**

```typescript
setBridgeInitializer(async (audioContext) => {
  setHydraLinked(true);
  setHydraStatus('Strudel (a.fft)');
  window.replAudio = audioContext;
  StrudelEngine.connectAudioAnalyser();

  // Initialize Hydra when bridge connects
  await initHydra({
    width: window.innerWidth,
    height: window.innerHeight
  });
});
```

### Option C: Initialize on Component Mount

Initialize Hydra in `HydraCanvas` component when it mounts.

**Pros:**
- Hydra available immediately on page load
- Decoupled from audio engine

**Cons:**
- Hydra available before audio (can't use `a.fft` until engine starts)
- Potential confusion about what's ready when

## Recommendation

**Option A** is recommended because:

1. Clear mental model: "Start Audio" starts everything
2. Both systems ready at the same time
3. Simplest user experience
4. Single point of initialization to maintain

## Additional Considerations

### Window Resize Handling

Hydra canvas dimensions are set at initialization. Consider adding resize handling:

```typescript
// In App.tsx or HydraCanvas.tsx
useEffect(() => {
  const handleResize = () => {
    // Hydra's resize method if available, or reinitialize
    if (window.H?.setResolution) {
      window.H.setResolution(window.innerWidth, window.innerHeight);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Error Handling

If Hydra fails to initialize, should the engine still be considered "ready"? Options:

1. **Fail completely** - Set engineStatus to 'error'
2. **Partial success** - Engine ready, but show warning about Hydra
3. **Silent fallback** - Log warning, continue without Hydra

Recommendation: Option 2 - audio should still work even if Hydra fails.

### Backward Compatibility

Users with existing code that calls `initHydra()` should not break. The `initHydra` function should be idempotent (calling it twice is safe). Verify this behavior in `@strudel/hydra`.

### Testing

Update tests in:
- `src/hooks/__tests__/useStrudelEngine.test.ts`
- `src/components/__tests__/HydraCanvas.test.tsx`
- `src/components/__tests__/StrudelRepl.test.tsx`

Mock `initHydra` from `@strudel/hydra` in tests.

## Migration Checklist

- [ ] Add `initHydra` import to `useStrudelEngine.ts`
- [ ] Call `initHydra` in `startEngine()` after REPL init
- [ ] Update default code in `StrudelRepl.tsx`
- [ ] Update startup text in `HydraCanvas.tsx`
- [ ] Add resize handling (optional)
- [ ] Update/add tests
- [ ] Verify `initHydra` is idempotent for backward compatibility
- [ ] Update documentation (`README.md`, `docs/ARCHITECTURE.md`)

## Timeline

No time estimates provided - implementation is straightforward once approach is chosen.
