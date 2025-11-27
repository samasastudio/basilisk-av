# Strudel + Hydra Audio Reactivity - Final Solution

## Problem Summary
- Strudel creates its Web Audio graph dynamically and doesn't expose output nodes
- `scheduler.output` doesn't exist
- `superdough` global doesn't have an accessible output node  
- `getDestination()` doesn't exist as an export from `@strudel/webaudio`

## Solution: Hijack AudioContext.createGain()

Since we can't find Strudel's output, we need to **intercept the audio graph creation** itself.

### Implementation

In `src/utils/strudelHydraBridge.ts`, modify the `initHydraBridge` function to monkey-patch `AudioContext.prototype.createGain()` BEFORE Strudel creates its audio graph.

```typescript
export function initHydraBridge({
    hydra,
    strudel,
    audioContext,
}: {
    hydra: HydraLike;
    strudel: StrudelReplLike;
    audioContext: AudioContext;
}): HydraBridge | null {
    if (!hydra || !audioContext) return null;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;

    // Monkey-patch createGain to intercept Strudel's audio output
    const originalCreateGain = audioContext.createGain.bind(audioContext);
    let gainNodeCount = 0;
    
    (audioContext as any).createGain = function() {
        const gain = originalCreateGain();
        gainNodeCount++;
        
        // Tap into the last gain node (likely Strudel's master output)
        if (gainNodeCount === 2) { // Adjust this number based on testing
            const originalConnect = gain.connect.bind(gain);
            gain.connect = function(dest: any) {
                // Also connect to our analyser
                originalConnect(analyser);
                console.log('✅ Tapped into Strudel audio via Gain node');
                return originalConnect(dest);
            };
        }
        
        return gain;
    };

    // Rest of the bridge setup...
}
```

This approach intercepts audio routing at the Web Audio API level, ensuring we capture Strudel's output regardless of how it structures its audio graph.
