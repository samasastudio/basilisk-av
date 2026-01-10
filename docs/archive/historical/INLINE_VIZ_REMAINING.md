# Inline Visualization - Remaining Implementation

## Status: 2025-12-18

### Current State

| Widget | Status | Notes |
|--------|--------|-------|
| `._scope()` | **Working** | Oscilloscope waveform from audio analyser |
| `._pianoroll()` | **Working** | Pattern notes displayed horizontally |
| `._punchcard()` | **Working** | Pattern notes displayed vertically |
| `._spiral()` | **Placeholder** | Shows "TODO" text, no actual rendering |
| `._spectrum()` | **Not Implemented** | Method doesn't exist |

---

## Investigation Findings

### `._spiral()` - Registered But Not Rendering

**Root Cause:** The `renderSpiral()` method in `visualizationManager.ts:272-300` contains only a placeholder:

```typescript
private renderSpiral(widget: VisualizationWidget, ctx: CanvasRenderingContext2D): void {
  // ... setup code ...

  // TODO: Implement spiral drawing - for now, draw a placeholder
  ctx.fillStyle = '#75baff';
  ctx.font = '14px monospace';
  ctx.fillText('Spiral visualization (TODO)', 10, widget.canvas.height / 2);
}
```

**Infrastructure in place:**
- `StrudelRepl.tsx:90-96` - `_spiral` registered on `Pattern.prototype`
- `strudelEngine.ts:9` - Type includes `'_spiral'`
- `strudelEngine.ts:91` - `registerWidgetType('_spiral')` called
- `visualizationManager.ts:9` - Type includes `'_spiral'`
- `visualizationManager.ts:141` - Switch case routes to `renderSpiral()`

**Challenge:** Unlike `__pianoroll`, there is no standalone `__spiral` draw function exported from `@strudel/draw`. The spiral drawing logic is embedded in:

```
node_modules/@strudel/draw/spiral.mjs
├── spiralSegment() - internal function, draws arc segments
├── xyOnSpiral() - converts angle to x,y coordinates
├── fromPolar() - polar to cartesian conversion
└── Pattern.prototype.spiral - sets up draw loop using above
```

---

### `._spectrum()` - Not Implemented

**Root Cause:** The `_spectrum` method was never added to our codebase.

**What exists in Strudel:**
- `@strudel/codemirror/widget.mjs` - Registers `_spectrum` widget
- `@strudel/webaudio/spectrum.mjs` - Contains `Pattern.prototype.spectrum` and `drawSpectrum()`

**How Strudel's spectrum works:**
```javascript
// From @strudel/webaudio/spectrum.mjs
Pattern.prototype.spectrum = function (config = {}) {
  return this.analyze(id).draw(
    (haps) => {
      drawSpectrum(analysers[id], config);
    },
    { id },
  );
};

function drawSpectrum(analyser, { thickness, speed, min, max, ctx, color }) {
  const dataArray = getAnalyzerData('frequency', id);  // FFT frequency bins
  // ... scrolling spectrogram rendering
}
```

**Key difference from `_scope`:**
- `_scope`: Uses `AnalyserNode.getFloatTimeDomainData()` - waveform amplitude over time
- `_spectrum`: Uses `AnalyserNode.getFloatFrequencyData()` - frequency magnitude (FFT)
- `_spectrum` also implements a scrolling spectrogram effect (maintains frame history)

---

## Implementation Plan

### Phase 1: `_spectrum` (Recommended First)

**Rationale:** Similar to existing `_scope` implementation - both use audio analyser data.

#### Files to Modify

**1. `src/components/StrudelRepl.tsx`** (+6 lines)
```typescript
// Add after _spiral registration (~line 96)
WindowPattern.prototype._spectrum = function(this: any, id?: string, options: any = {}) {
    id = id || 'spectrum';
    let _size = options.size || 200;
    options = { width: _size, height: _size, ...options };
    const ctx = getCanvasWidget(id, options).getContext('2d');
    return this.tag(id).spectrum({ ...options, ctx, id });
};
```

**2. `src/services/strudelEngine.ts`** (+2 lines)
```typescript
// Line 9 - Add to WidgetConfig type
type: 'slider' | '_scope' | '_pianoroll' | '_punchcard' | '_spiral' | '_spectrum';

// Line 92 - Add registration
registerWidgetType('_spectrum');
```

**3. `src/hooks/useWidgetUpdates.ts`** (+1 line)
```typescript
// Line 91 - Add to type cast
type: widget.type as '_scope' | '_pianoroll' | '_punchcard' | '_spiral' | '_spectrum',
```

**4. `src/services/visualizationManager.ts`** (+45 lines)
```typescript
// Line 9 - Add to VisualizationWidget type
type: '_scope' | '_pianoroll' | '_punchcard' | '_spiral' | '_spectrum';

// Line 141 - Add case in renderWidget()
} else if (widget.type === '_spectrum') {
  this.renderSpectrum(widget, ctx);
}

// Add new method after renderSpiral() (~line 300)
private renderSpectrum(widget: VisualizationWidget, ctx: CanvasRenderingContext2D): void {
  if (!this.audioAnalyser) {
    return;
  }

  const bufferLength = this.audioAnalyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  this.audioAnalyser.getFloatFrequencyData(dataArray);

  const width = widget.canvas.width;
  const height = widget.canvas.height;
  const barWidth = width / bufferLength;
  const minDb = -100;
  const maxDb = -30;

  ctx.fillStyle = '#75baff';

  for (let i = 0; i < bufferLength; i++) {
    // Normalize dB value to 0-1 range
    const db = dataArray[i];
    const normalized = (db - minDb) / (maxDb - minDb);
    const barHeight = Math.max(0, normalized * height);

    const x = i * barWidth;
    const y = height - barHeight;

    ctx.fillRect(x, y, barWidth - 1, barHeight);
  }
}
```

**Estimated:** ~55 lines total

---

### Phase 2: `_spiral`

#### Option A: Adapt Spiral Logic (Recommended)

Copy and adapt the spiral drawing functions from `@strudel/draw/spiral.mjs`:

**`src/services/visualizationManager.ts`** (+50 lines)
```typescript
// Add helper functions
private fromPolar(angle: number, radius: number, cx: number, cy: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [cx + Math.cos(radians) * radius, cy + Math.sin(radians) * radius];
}

private xyOnSpiral(angle: number, margin: number, cx: number, cy: number, rotate = 0): [number, number] {
  return this.fromPolar((angle + rotate) * 360, margin * angle, cx, cy);
}

// Replace renderSpiral implementation
private renderSpiral(widget: VisualizationWidget, ctx: CanvasRenderingContext2D): void {
  if (!this.getCurrentPattern || !this.getCurrentTime) return;

  const pattern = this.getCurrentPattern();
  if (!pattern?.queryArc) return;

  const time = this.getCurrentTime();
  const options = widget.options || {};
  const margin = (options.margin as number) || 15;
  const cx = widget.canvas.width / 2;
  const cy = widget.canvas.height / 2;

  try {
    const haps = pattern.queryArc(time - 4, time);

    ctx.lineWidth = margin / 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#75baff';

    haps.forEach((hap: any) => {
      const from = hap.whole?.begin || 0;
      const to = hap.whole?.end || from + 0.25;
      const rotate = time;

      ctx.beginPath();
      let [sx, sy] = this.xyOnSpiral(from, margin, cx, cy, rotate);
      ctx.moveTo(sx, sy);

      for (let angle = from; angle <= to; angle += 1/60) {
        const [x, y] = this.xyOnSpiral(angle, margin, cx, cy, rotate);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  } catch (error) {
    console.error('[VizManager] Error rendering spiral:', error);
  }
}
```

**Estimated:** ~50 lines (replacing existing placeholder)

#### Option B: Use Pattern.spiral() Directly

Less code but may conflict with our animation loop:

```typescript
// In renderSpiral - delegate to pattern's spiral method
const pattern = this.getCurrentPattern();
pattern.spiral({ ctx, ...widget.options });
```

**Risk:** Pattern.spiral() creates its own requestAnimationFrame loop, potentially conflicting with our VisualizationManager loop.

---

## Summary

| Task | Lines | Lift | Dependencies |
|------|-------|------|--------------|
| `_spectrum` | ~55 | Medium | None - uses existing audioAnalyser |
| `_spiral` | ~50 | Medium | None - self-contained math |
| **Total** | **~105** | | |

### Recommended Order

1. **`_spectrum` first** - Lower risk, similar to existing `_scope`
2. **`_spiral` second** - Requires adapting geometry code

### Testing Commands

After implementation:
```javascript
// Test spectrum
s("bd sd hh sd")._spectrum()

// Test spiral
note("c e g b")._spiral()
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/components/StrudelRepl.tsx` | Pattern.prototype method registration |
| `src/services/strudelEngine.ts` | Widget type definitions + registration |
| `src/hooks/useWidgetUpdates.ts` | Widget-to-canvas connection |
| `src/services/visualizationManager.ts` | Rendering logic |
| `node_modules/@strudel/draw/spiral.mjs` | Reference implementation |
| `node_modules/@strudel/webaudio/spectrum.mjs` | Reference implementation |
