## Strudel + Hydra Audio Linking Strategy

The issue: Strudel creates its Web Audio graph dynamically, and we can't find the output node to connect our analyser.

### Solution: Use getAudioContext() and getDestination()

Instead of trying to find Strudel's internal audio nodes, we should:

1. Import `getAudioContext` and `getDestination` from `@strudel/webaudio`
2. Call `getDestination()` after pattern evaluation to get Strudel's output node
3. Connect that to the Hydra analyser

### Implementation:

In `strudelHydraBridge.ts`, add a method to connect after Strudel starts.
In `StrudelRepl.tsx`, call `getDestination()` and connect it after `evaluate()`.

This is the official Strudel way to access audio routing.
