# Inline Visualization Manual Testing Guide

This guide provides steps to manually verify that inline visualizations (_scope, _pianoroll, _punchcard, _spiral) are working correctly in Basilisk AV.

## Prerequisites

1. Start the dev server: `npm run dev`
2. Open http://localhost:5174 in your browser
3. Click "Start Audio" button
4. Open browser DevTools Console (F12) to view debug logs

## Test 1: Scope Visualization (p6-inline-scope)

### Steps:
1. Clear the editor (Ctrl+A, then type)
2. Enter: `s("bd sd")._scope()`
3. Click "Execute ▶" button

### Expected Results:
- ✅ Canvas element appears inline below the code
- ✅ Oscilloscope waveform displays (NOT a black canvas)
- ✅ Waveform updates in real-time (~60fps via requestAnimationFrame)
- ✅ Waveform reflects audio output accurately
- ✅ Console shows: `[VizManager] Drawing scope to canvas`
- ✅ Re-evaluating pattern updates the visualization
- ✅ Scope does not obstruct code editing

### Console Logs to Verify:
```
[VizManager] Pattern getter set
[VizManager] Time getter set
[VizManager] Audio analyser connected
[VizManager] Registering widget: [widget-id] _scope
[VizManager] Starting animation loop
[VizManager] Drawing scope to canvas: 600 x 200
```

## Test 2: Pianoroll Visualization (p6-inline-pianoroll)

### Steps:
1. Clear the editor
2. Enter: `note("c e g")._pianoroll({ cycles: 2 })`
3. Click "Execute ▶" button

### Expected Results:
- ✅ Canvas element appears inline below the code
- ✅ Piano roll displays three notes (NOT a black canvas)
- ✅ Notes appear at correct MIDI pitches (C, E, G as horizontal bars)
- ✅ Playhead (white vertical line) scrolls showing current position
- ✅ Notes are visible with active/inactive colors
- ✅ Console shows: `[VizManager] Drawing pianoroll - haps: [N]`
- ✅ Re-evaluating pattern updates the visualization
- ✅ Works with both `note()` and `n()` patterns

### Console Logs to Verify:
```
[VizManager] Registering widget: [widget-id] _pianoroll
[VizManager] Drawing pianoroll - haps: 3 time: [timestamp]
```

## Test 3: Punchcard Visualization

### Steps:
1. Clear the editor
2. Enter: `note("c a f e").euclid(5,8)._punchcard()`
3. Click "Execute ▶" button

### Expected Results:
- ✅ Canvas element appears inline below the code
- ✅ Punchcard displays (vertical pianoroll)
- ✅ Events show as colored bars
- ✅ Console shows: `[VizManager] Drawing punchcard`

## Test 4: Spiral Visualization

### Steps:
1. Clear the editor
2. Enter: `s("bd sd hh")._spiral()`
3. Click "Execute ▶" button

### Expected Results:
- ✅ Canvas element appears inline below the code
- ✅ Spiral visualization appears (or placeholder text if TODO)
- ✅ Console shows: `[VizManager] Drawing spiral`

## Verification Criteria (from features.json)

### p6-inline-viz-fix
All infrastructure components verified:
- [x] src/services/visualizationManager.ts exists
- [x] VisualizationManager manages widget-to-pattern connections
- [x] Animation loop queries current pattern for haps (line 213: `pattern.queryArc(...)`)
- [x] Draw functions receive haps and render to canvas (line 218: `__pianoroll({ ctx, haps, time, ... })`)
- [x] useWidgetUpdates.ts registers widgets with manager (line 94: `visualizationManager.registerWidget(...)`)
- [x] Audio analyser connected for scope/spectrum (strudelEngine.ts:149)
- [x] Pattern re-evaluation reconnects canvases to new pattern (useWidgetUpdates.ts handles this)
- [x] Console shows: '[VizManager] Drawing to canvas' logs

### p6-inline-scope
- [x] Infrastructure complete (custom waveform rendering using audio analyser)
- [ ] Manual test: Verify waveform displays and is not black

### p6-inline-pianoroll
- [x] Infrastructure complete (uses __pianoroll from @strudel/draw)
- [ ] Manual test: Verify three notes display for `note("c e g")._pianoroll()`

## Troubleshooting

### Black Canvas Issue
If you see a black canvas:
1. Check Console for warnings: "No pattern getter or time getter"
2. Verify audio engine is running (Audio status shows "running")
3. Check that pattern is playing (should hear audio)
4. Verify Console shows: `[VizManager] Drawing [type] - haps: [N]`

### No Canvas Appears
1. Check Console for: `[useWidgetUpdates] calling updateWidgets with: [...]`
2. Verify widget type is registered: `[initializeStrudel] Widget types registered`
3. Check that CodeMirror created the canvas (inspect DOM)

### No Haps Logged
1. Verify pattern is valid and playing
2. Check that pattern getter returns valid pattern: `window.repl?.scheduler?.pattern`
3. Verify time getter returns current time: `window.repl?.scheduler?.now()`

## Success Criteria

All tests pass when:
1. Canvases appear inline in the editor
2. Visualizations render (NOT black canvases)
3. Visualizations update in real-time
4. Console logs show widget registration and drawing activity
5. Re-evaluating patterns updates the visualizations
6. Multiple widgets can coexist in the same editor
