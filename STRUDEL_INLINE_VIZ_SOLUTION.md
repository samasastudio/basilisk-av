# Strudel Inline Visualization Rendering Solution
## For Basilisk AV (Hydra-based live coding environment)

## Problem Summary

Inline visualizations in Basilisk AV create canvas elements that position correctly in the editor, but render as black/empty canvases with no pixels drawn. The root cause is that the draw callbacks registered by `@strudel/draw` visualization methods need to be invoked during pattern playback with pattern events (haps), but this connection isn't properly established for inline widgets.

**Critical Context: Why Background Visualizations Are Not an Option**
- Basilisk AV uses Hydra for visual synthesis on a full-screen background canvas
- Background visualizations (`.scope()`, `.pianoroll()` without underscore) would conflict with Hydra's canvas
- Therefore, **only inline visualizations** (`._scope()`, `._pianoroll()`, etc.) are relevant for this project
- This makes the inline widget system critical, not optional

**Evidence from PR #37:**
- Widget infrastructure is functional: transpiler recognizes methods, metadata flows through widget store
- Canvas elements are created and positioned inline in editor correctly
- Widget metadata emitted successfully
- Pattern audio plays correctly
- **Missing piece:** Draw callbacks not receiving pattern events during playback

## Basilisk AV Current Implementation (PR #37)

Based on the PR #37 code, Basilisk has already implemented:

```typescript
// src/services/strudelEngine.ts
export const widgetStore = {
  currentWidgets: [] as Widget[],
  listeners: new Set<() => void>(),
  
  setWidgets(widgets: Widget[]) {
    this.currentWidgets = widgets || [];
    this.listeners.forEach(listener => listener());
  },
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  getSnapshot() {
    return this.currentWidgets;
  }
};
```

```typescript
// src/hooks/useWidgetUpdates.ts
export const useWidgetUpdates = (getView: () => EditorView | undefined) => {
  const widgets = useSyncExternalStore(
    widgetStore.subscribe.bind(widgetStore),
    widgetStore.getSnapshot.bind(widgetStore)
  );
  
  useEffect(() => {
    const view = getView();
    if (!view || widgets.length === 0) return;
    
    const sliders = widgets.filter(w => w.type === 'slider');
    const visualizations = widgets.filter(w => w.type !== 'slider');
    
    if (sliders.length > 0) updateSliderWidgets(view, sliders);
    if (visualizations.length > 0) updateWidgets(view, visualizations);
  }, [getView, widgets]);
};
```

**What's Working:**
- Widget metadata extraction and storage ✅
- CodeMirror widget creation and positioning ✅  
- React state synchronization via useSyncExternalStore ✅
- Separation of sliders vs visualizations ✅

**What's Missing:**
- Connection between pattern scheduler and widget draw callbacks ❌
- Animation loop that queries pattern for haps ❌
- Passing haps to draw functions ❌

## How Strudel Visualizations Work

### Pattern Scheduler → Draw System Flow

```
User Code with ._pianoroll()
    ↓
Transpiler registers widget metadata
    ↓
CodeMirror renders inline canvas widget
    ↓
Pattern scheduler queries pattern.queryArc(time, time + interval)
    ↓
Scheduler gets haps (events) for time window
    ↓
[MISSING CONNECTION] → Draw callbacks should receive haps
    ↓
Draw system renders to canvas
```

### Key Architecture Components

1. **Pattern Scheduler** (`@strudel/core`)
   - Runs at 50ms intervals with 100ms minimum latency
   - Queries pattern for events (haps) in upcoming time span
   - Calls `onTrigger` for each hap to generate audio/output
   
2. **Draw System** (`@strudel/draw`)
   - Provides visualization methods: `pianoroll`, `punchcard`, `scope`, `spiral`, `pitchwheel`, `spectrum`
   - Each method registers draw callbacks
   - Callbacks need pattern haps to render visualization
   
3. **Widget System** (CodeMirror)
   - Inline widgets render as CodeMirror decorations
   - Canvas elements created and positioned in editor
   - Widgets identified by `_` prefix (e.g., `._pianoroll()`)

## Root Cause Analysis

### Background Visualizations vs Inline Visualizations

**Background visualizations** (no `_` prefix):
```javascript
note("c a f e").pianoroll()
```
- Render to page background
- Work because they're treated as outputs
- Directly connected to scheduler's event stream

**Inline visualizations** (`_` prefix):
```javascript
note("c a f e")._pianoroll()
```
- Render to inline canvas widgets
- Canvas exists but receives no data
- **Missing:** Connection between scheduler events and widget draw callbacks

### The Missing Link

The scheduler queries patterns and generates haps, but these haps need to reach the draw callbacks associated with inline widgets. Background visualizations likely use a global output mechanism, while inline visualizations need per-widget event routing.

## Solution Architecture for Basilisk AV

### Critical Insight from Research

The key missing piece is **invoking the draw callbacks during the scheduler's pattern queries**. When Strudel's scheduler queries `pattern.queryArc(time, time + interval)` every 50ms to schedule audio events, visualization widgets need to:

1. Get notified of the query
2. Receive the haps returned from queryArc
3. Pass those haps to their draw functions
4. Render to their canvases

### Recommended Implementation: Pattern Query Hooking

Extend Basilisk's existing widget system to hook into pattern evaluation and scheduler queries.

```typescript
// src/services/visualizationManager.ts

import { drawPianoroll, drawPunchcard, drawScope, drawSpiral } from '@strudel/draw';

interface VisualizationWidget {
  id: string;
  type: 'pianoroll' | 'punchcard' | 'scope' | 'spiral';
  canvas: HTMLCanvasElement;
  pattern: any; // The pattern this widget visualizes
  options: any;
  animationFrameId?: number;
}

class VisualizationManager {
  private widgets = new Map<string, VisualizationWidget>();
  private currentTime = 0;
  private isRunning = false;
  
  // For scope/spectrum - needs audio analyser
  private audioAnalyser?: AnalyserNode;
  
  registerWidget(widget: Omit<VisualizationWidget, 'animationFrameId'>) {
    this.widgets.set(widget.id, { ...widget });
    
    // Start animation loop if not running
    if (!this.isRunning) {
      this.isRunning = true;
      this.startAnimationLoop();
    }
  }
  
  unregisterWidget(id: string) {
    const widget = this.widgets.get(id);
    if (widget?.animationFrameId) {
      cancelAnimationFrame(widget.animationFrameId);
    }
    this.widgets.delete(id);
    
    // Stop loop if no widgets
    if (this.widgets.size === 0) {
      this.isRunning = false;
    }
  }
  
  setCurrentTime(time: number) {
    this.currentTime = time;
  }
  
  setAudioAnalyser(analyser: AnalyserNode) {
    this.audioAnalyser = analyser;
  }
  
  private startAnimationLoop() {
    const loop = () => {
      if (!this.isRunning) return;
      
      this.widgets.forEach(widget => {
        this.renderWidget(widget);
      });
      
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  
  private renderWidget(widget: VisualizationWidget) {
    const ctx = widget.canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, widget.canvas.width, widget.canvas.height);
    
    if (widget.type === 'scope' || widget.type === 'spectrum') {
      this.renderAudioWidget(widget, ctx);
    } else {
      this.renderPatternWidget(widget, ctx);
    }
  }
  
  private renderPatternWidget(widget: VisualizationWidget, ctx: CanvasRenderingContext2D) {
    if (!widget.pattern) return;
    
    const options = widget.options || {};
    const cycles = options.cycles || 4;
    const playhead = options.playhead || 0.5;
    
    // Query pattern for visible time window
    const lookBehind = cycles * playhead;
    const lookAhead = cycles * (1 - playhead);
    
    try {
      const haps = widget.pattern.queryArc(
        this.currentTime - lookBehind,
        this.currentTime + lookAhead
      );
      
      // Call appropriate draw function
      switch (widget.type) {
        case 'pianoroll':
          drawPianoroll(ctx, haps, this.currentTime, options);
          break;
        case 'punchcard':
          drawPunchcard(ctx, haps, this.currentTime, options);
          break;
        case 'spiral':
          drawSpiral(ctx, haps, this.currentTime, options);
          break;
      }
    } catch (error) {
      console.error('Error rendering pattern widget:', error);
    }
  }
  
  private renderAudioWidget(widget: VisualizationWidget, ctx: CanvasRenderingContext2D) {
    if (!this.audioAnalyser) return;
    
    const options = widget.options || {};
    
    if (widget.type === 'scope') {
      const timeData = new Float32Array(this.audioAnalyser.fftSize);
      this.audioAnalyser.getFloatTimeDomainData(timeData);
      drawScope(ctx, timeData, options);
    } else if (widget.type === 'spectrum') {
      const freqData = new Uint8Array(this.audioAnalyser.frequencyBinCount);
      this.audioAnalyser.getByteFrequencyData(freqData);
      // Note: drawSpectrum signature needs verification
      // May need custom implementation
    }
  }
}

export const visualizationManager = new VisualizationManager();
```

### Integration with Existing Basilisk Code

```typescript
// src/hooks/useWidgetUpdates.ts - ENHANCED VERSION

import { visualizationManager } from '../services/visualizationManager';

export const useWidgetUpdates = (getView: () => EditorView | undefined) => {
  const widgets = useSyncExternalStore(
    widgetStore.subscribe.bind(widgetStore),
    widgetStore.getSnapshot.bind(widgetStore)
  );
  
  // Track which widgets we've registered to avoid duplicates
  const registeredWidgets = useRef(new Set<string>());
  
  useEffect(() => {
    const view = getView();
    if (!view) return;
    
    // Handle empty array - cleanup all widgets
    if (widgets.length === 0) {
      updateSliderWidgets(view, []);
      updateWidgets(view, []);
      
      // Unregister all visualization widgets
      registeredWidgets.current.forEach(id => {
        visualizationManager.unregisterWidget(id);
      });
      registeredWidgets.current.clear();
      return;
    }
    
    const sliders = widgets.filter(w => w.type === 'slider');
    const visualizations = widgets.filter(w => w.type !== 'slider');
    
    // Update CodeMirror decorations
    if (sliders.length > 0) updateSliderWidgets(view, sliders);
    if (visualizations.length > 0) {
      updateWidgets(view, visualizations);
      
      // Register visualization widgets with manager
      visualizations.forEach(widget => {
        if (registeredWidgets.current.has(widget.id)) return;
        
        // Find the canvas element created by updateWidgets
        const canvas = findCanvasForWidget(view, widget);
        if (!canvas) return;
        
        // Get the pattern from the widget metadata
        const pattern = getPatternForWidget(widget);
        if (!pattern) return;
        
        visualizationManager.registerWidget({
          id: widget.id,
          type: widget.type as any,
          canvas,
          pattern,
          options: widget.options
        });
        
        registeredWidgets.current.add(widget.id);
      });
    }
    
    // Cleanup removed widgets
    const currentIds = new Set(widgets.map(w => w.id));
    registeredWidgets.current.forEach(id => {
      if (!currentIds.has(id)) {
        visualizationManager.unregisterWidget(id);
        registeredWidgets.current.delete(id);
      }
    });
  }, [getView, widgets]);
};

// Helper to find canvas element for widget
function findCanvasForWidget(view: EditorView, widget: Widget): HTMLCanvasElement | null {
  // This needs to be implemented based on how updateWidgets creates canvases
  // Likely involves querying the DOM or tracking canvas refs
  const canvases = view.dom.querySelectorAll('canvas');
  // Match by widget ID or position
  return null; // Placeholder
}

// Helper to get pattern from widget
function getPatternForWidget(widget: Widget): any {
  // The pattern should be attached to the widget metadata
  // This might require modification of how widgets are created
  return widget.pattern || null;
}
```

### Connecting to Strudel's Scheduler

```typescript
// src/services/strudelEngine.ts - ADDITION

import { visualizationManager } from './visualizationManager';

// Hook into scheduler time updates
export const connectSchedulerToVisualizations = (repl: any) => {
  // Get scheduler from Strudel
  const scheduler = repl.scheduler || repl.getScheduler?.();
  
  if (!scheduler) {
    console.warn('Could not find Strudel scheduler');
    return;
  }
  
  // Store original query method
  const originalQuery = scheduler.queryArc?.bind(scheduler);
  
  if (originalQuery) {
    // Monkey-patch to notify visualization manager
    scheduler.queryArc = function(pattern: any, from: number, to: number) {
      const haps = originalQuery(pattern, from, to);
      
      // Update visualization manager with current time
      // Use midpoint of query span as current time
      visualizationManager.setCurrentTime((from + to) / 2);
      
      return haps;
    };
  } else {
    // Alternative: use scheduler's time property if available
    setInterval(() => {
      if (scheduler.now) {
        visualizationManager.setCurrentTime(scheduler.now());
      }
    }, 50); // Match scheduler interval
  }
};

// Connect audio analyser for scope/spectrum
export const connectAudioAnalyser = () => {
  // Use existing audio bridge
  const analyser = getAnalyser(); // From your existing audioBridge
  if (analyser) {
    visualizationManager.setAudioAnalyser(analyser);
  }
};
```

### Update Pattern Creation to Attach to Widgets

The critical piece is ensuring each visualization widget has a reference to its pattern:

```typescript
// When widget metadata is created (in transpiler or pattern method)
// This might need to happen in @strudel/codemirror's updateWidgets

// Example of what the widget metadata should include:
interface WidgetMetadata {
  id: string;
  type: 'pianoroll' | 'punchcard' | 'scope' | 'spiral';
  options: any;
  pattern: any; // <-- CRITICAL: reference to the Pattern instance
  from: number; // CodeMirror position
  to: number;
}
```

```typescript
// In StrudelRepl.tsx or strudelEngine.ts

interface VisualizationWidget {
  id: string;
  type: 'pianoroll' | 'punchcard' | 'scope' | 'spiral' | 'pitchwheel' | 'spectrum';
  canvas: HTMLCanvasElement;
  drawCallback: (haps: any[]) => void;
  options: any;
}

class VisualizationManager {
  private widgets = new Map<string, VisualizationWidget>();
  
  registerWidget(widget: VisualizationWidget) {
    this.widgets.set(widget.id, widget);
  }
  
  unregisterWidget(id: string) {
    this.widgets.delete(id);
  }
  
  // Called by scheduler on each query interval
  onPatternQuery(haps: any[], querySpan: { begin: number; end: number }) {
    this.widgets.forEach(widget => {
      // Filter haps relevant to this widget's time window
      const relevantHaps = this.filterHapsForWidget(haps, widget, querySpan);
      
      // Call draw callback with filtered haps
      widget.drawCallback(relevantHaps);
    });
  }
  
  private filterHapsForWidget(haps: any[], widget: VisualizationWidget, querySpan: any) {
    // Implementation depends on visualization type
    // Pianoroll/punchcard need events within visible time window
    // Scope/spectrum need recent events for waveform
    return haps;
  }
}
```

### Approach 2: Scheduler Hook Integration

Hook into Strudel's scheduler to broadcast events to visualization system.

```typescript
// In strudelEngine.ts

import { getScheduler } from '@strudel/core';

export const setupVisualizationBridge = (repl: any) => {
  const scheduler = getScheduler();
  
  // Monkey-patch scheduler's query method to broadcast events
  const originalQuery = scheduler.queryArc.bind(scheduler);
  
  scheduler.queryArc = function(pattern: any, from: number, to: number) {
    const haps = originalQuery(pattern, from, to);
    
    // Broadcast to visualization manager
    window.visualizationManager?.onPatternQuery(haps, { begin: from, end: to });
    
    return haps;
  };
};
```

### Approach 3: Pattern Method Wrapping

Wrap visualization methods to register widgets and connect to scheduler.

## Implementation Steps for Basilisk AV

### Phase 1: Create Visualization Manager

1. **Create `src/services/visualizationManager.ts`**
   - Implement VisualizationManager class (code above)
   - Export singleton instance
   
2. **Verify @strudel/draw imports**
   ```typescript
   import { drawPianoroll, drawPunchcard, drawScope, drawSpiral } from '@strudel/draw';
   ```

### Phase 2: Enhance Widget System

1. **Modify `src/hooks/useWidgetUpdates.ts`**
   - Add visualization widget registration logic
   - Track registered widgets to avoid duplicates
   - Handle cleanup when widgets removed
   - Implement `findCanvasForWidget` helper
   
2. **Ensure widget metadata includes pattern reference**
   - This may require changes in @strudel/codemirror's widget creation
   - Or monkey-patching Pattern prototype methods to attach references

### Phase 3: Connect to Scheduler

1. **Update `src/services/strudelEngine.ts`**
   - Add `connectSchedulerToVisualizations` function
   - Hook into scheduler's time tracking
   - Update visualization manager with current playback time
   
2. **Connect audio analyser**
   - Use existing audio bridge from Basilisk
   - Pass analyser to visualization manager for scope/spectrum

### Phase 4: Debug and Test

1. **Test with simple pattern**
   ```javascript
   note("c e g")._pianoroll()
   ```
   
2. **Check browser console**
   - Widget registration logs
   - Pattern queryArc calls
   - Draw function invocations
   
3. **Verify canvas updates**
   - Open DevTools → Elements
   - Inspect canvas element
   - Should see pixels changing on each frame

## Critical Implementation Notes

### Getting Pattern Reference to Widgets

This is the trickiest part. Options:

**Option A: Modify updateWidgets in @strudel/codemirror**
```typescript
// If you control the updateWidgets function
export function updateWidgets(view: EditorView, widgets: Widget[]) {
  widgets.forEach(widget => {
    // Create canvas widget
    const widgetDecoration = Decoration.widget({
      widget: new VisualizationWidgetType(widget),
      // Attach pattern reference to widget data
      spec: { pattern: widget.pattern }
    });
    // ...
  });
}
```

**Option B: Global pattern registry**
```typescript
// Store patterns by ID when evaluated
const patternRegistry = new Map<string, any>();

// When pattern with visualization is evaluated
pattern._visualizationId = generateId();
patternRegistry.set(pattern._visualizationId, pattern);

// Widget metadata includes ID
widget.patternId = pattern._visualizationId;

// In visualization manager
const pattern = patternRegistry.get(widget.patternId);
```

**Option C: Use existing Strudel REPL state**
```typescript
// Strudel REPL likely maintains current pattern
// Access via repl instance
const getCurrentPattern = () => {
  return repl.getPattern?.() || repl.pattern || window.repl?.pattern;
};

// All visualizations render the current global pattern
// Simpler but less flexible for multiple patterns
```

## Expected Draw Function Signatures

Based on Strudel's draw package, visualization functions expect:

```typescript
// Pianoroll/Punchcard
interface PianorollOptions {
  cycles?: number;        // Cycles to display (default: 4)
  playhead?: number;      // Playhead position 0-1 (default: 0.5)
  vertical?: boolean;     // Vertical orientation
  labels?: boolean;       // Show note labels
  flipTime?: boolean;     // Reverse time direction
  flipValues?: boolean;   // Reverse value axis
  minMidi?: number;       // Min MIDI note (default: 10)
  maxMidi?: number;       // Max MIDI note (default: 90)
  active?: string;        // Active note color
  inactive?: string;      // Inactive note color
  background?: string;    // Background color
}

drawPianoroll(
  ctx: CanvasRenderingContext2D,
  haps: Hap[],
  options: PianorollOptions
): void

// Scope (oscilloscope)
interface ScopeOptions {
  align?: boolean;        // Align to zero crossing (default: 1)
  color?: string;         // Line color (default: white)
  thickness?: number;     // Line thickness (default: 3)
  scale?: number;         // Y-axis scale (default: 0.25)
  pos?: number;          // Y-position 0-1 (default: 0.5)
  trigger?: number;      // Trigger amplitude (default: 0)
}

drawScope(
  ctx: CanvasRenderingContext2D,
  audioData: Float32Array,  // Time-domain audio samples
  options: ScopeOptions
): void

// Spectrum (frequency analyzer)
interface SpectrumOptions {
  thickness?: number;     // Line thickness (default: 3)
  speed?: number;        // Scroll speed (default: 1)
  min?: number;          // Min dB (default: -80)
  max?: number;          // Max dB (default: 0)
}

drawSpectrum(
  ctx: CanvasRenderingContext2D,
  frequencyData: Uint8Array,  // Frequency-domain data
  options: SpectrumOptions
): void
```

## Audio Reactivity for Scope/Spectrum

Scope and spectrum need audio analysis data, not just pattern events:

```typescript
// In visualizationManager.ts

class VisualizationManager {
  private audioAnalyser?: AnalyserNode;
  
  setAudioAnalyser(analyser: AnalyserNode) {
    this.audioAnalyser = analyser;
  }
  
  onAnimationFrame() {
    if (!this.audioAnalyser) return;
    
    this.widgets.forEach(widget => {
      if (widget.type === 'scope') {
        const timeData = new Float32Array(this.audioAnalyser!.fftSize);
        this.audioAnalyser!.getFloatTimeDomainData(timeData);
        widget.drawCallback(timeData);
      }
      else if (widget.type === 'spectrum') {
        const freqData = new Uint8Array(this.audioAnalyser!.frequencyBinCount);
        this.audioAnalyser!.getByteFrequencyData(freqData);
        widget.drawCallback(freqData);
      }
    });
  }
}

// Connect to existing audio bridge
export const connectVisualizationsToAudio = () => {
  const analyser = getAnalyser(); // From existing audioBridge
  visualizationManager.setAudioAnalyser(analyser);
  
  // Animation loop
  const animate = () => {
    visualizationManager.onAnimationFrame();
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
};
```

## Testing Strategy

### Unit Tests
```typescript
describe('VisualizationManager', () => {
  it('registers and unregisters widgets', () => {});
  it('broadcasts events to all registered widgets', () => {});
  it('filters haps by time window', () => {});
  it('handles widget lifecycle correctly', () => {});
});

describe('Draw integration', () => {
  it('calls draw function when events received', () => {});
  it('clears canvas before redraw', () => {});
  it('respects visualization options', () => {});
});
```

### Integration Tests
```typescript
describe('Inline visualizations', () => {
  it('renders pianoroll when pattern plays', () => {
    // Evaluate pattern with ._pianoroll()
    // Check canvas pixels are not all black
  });
  
  it('updates visualization on pattern change', () => {
    // Change pattern code
    // Verify canvas updates
  });
  
  it('cleans up on widget removal', () => {
    // Remove widget from editor
    // Verify no memory leaks
  });
});
```

## Performance Considerations

1. **Render throttling**
   - Visualizations don't need 60fps
   - Match scheduler rate (50ms) or use requestAnimationFrame with skip logic

2. **Canvas pooling**
   - Reuse canvas contexts where possible
   - Avoid recreation on every render

3. **Hap filtering**
   - Only pass relevant haps to each widget
   - Avoid processing entire pattern for each widget

4. **Memory management**
   - Properly cleanup widgets on removal
   - Unbind event listeners
   - Clear canvas references

## Known Challenges for Basilisk AV

1. **Pattern Reference Propagation**
   - Biggest challenge: Widgets need pattern references
   - Widget metadata created during transpilation may not have access to evaluated pattern
   - Solutions: Global registry, attach to widget during evaluation, or use current pattern from REPL

2. **Hydra Canvas Conflict**
   - Background visualizations unusable due to Hydra
   - All visualization must be inline
   - Cannot fall back to background rendering

3. **Audio Data Access for Scope/Spectrum**
   - Already solved: Basilisk has audio bridge with analyser
   - Just need to connect existing analyser to visualization manager

4. **Multiple Patterns**  
   - If user runs multiple patterns with visualizations
   - Each widget needs to know which pattern it visualizes
   - May need pattern ID system

5. **Widget Recreation on Code Edits**
   - CodeMirror recreates decorations on doc changes
   - Need robust ID system to maintain widget-pattern associations
   - Might lose canvas references during recreation

6. **Synchronization**
   - Visualization timing must match audio playback
   - Use scheduler's time, not Date.now()
   - Account for latency (50-150ms)

## Next Steps for Basilisk AV

### Immediate Actions

1. **Verify @strudel/draw import works**
   ```typescript
   import { drawPianoroll, drawPunchcard, drawScope, drawSpiral } from '@strudel/draw';
   ```
   Check if these functions are exported and accessible

2. **Create minimal visualization manager**
   - Start with just pianoroll support
   - Hard-code to use `repl.pattern` (simplest approach)
   - Test basic rendering before adding complexity

3. **Add debug logging**
   ```typescript
   // In visualization manager
   console.log('Querying pattern at time:', this.currentTime);
   console.log('Got haps:', haps.length);
   console.log('Drawing to canvas:', canvas.width, 'x', canvas.height);
   ```

4. **Test with minimal pattern**
   ```javascript
   note("c e g")._pianoroll({ cycles: 2 })
   ```

### Medium-term Actions

5. **Solve pattern reference problem**
   - Try Option C first (use repl.pattern) - simplest
   - If that works, defer more complex solutions

6. **Add scope/spectrum support**
   - Connect existing analyser from audio bridge
   - Test with `s("bd sd")._scope()`

7. **Handle widget cleanup**
   - Fix the bug noted in PR #37 review
   - Ensure empty widget arrays trigger cleanup

8. **Performance optimization**
   - Monitor FPS in browser DevTools
   - Consider throttling to 30fps if needed
   - Skip draws if canvas not visible

### Research Questions

- [ ] Does `@strudel/draw` export functions directly or need setup?
- [ ] What is the exact signature of `drawPianoroll` et al?
- [ ] Can we access `repl.pattern` or `repl.getPattern()`?
- [ ] How does @strudel/codemirror's `updateWidgets` create canvases?
- [ ] Is there a way to get pattern reference from widget metadata?

## References

- **Basilisk AV PR #37**: https://github.com/samasastudio/basilisk-av/pull/37
  - Current implementation status
  - Widget infrastructure (working)
  - Missing draw callback connection (problem)
- Strudel Visual Feedback: https://strudel.cc/learn/visual-feedback/
- Strudel REPL Architecture: https://strudel.cc/technical-manual/repl/
- Pattern Scheduler: Queries patterns at 50ms intervals with pattern.queryArc()
- Draw Package PR: #971 (moved canvas helpers to @strudel/draw)
- Inline Viz PR: #989 (inline viz/widgets package)
- CodeMirror Widgets: CodeMirror 6 decoration system
- Codeberg Repository: https://codeberg.org/uzu/strudel

## Appendix: Strudel Draw Function Research

From the earlier research document, these are the key insights about how Strudel's draw system works:

### Dual-Loop Architecture
- Audio scheduler: `setInterval` at 50ms
- Visualization: `requestAnimationFrame` at ~60fps
- Both query same pattern independently

### Key Mechanism
```javascript
// Animation loop (simplified)
function drawLoop() {
  const time = getCurrentPlaybackTime();
  const haps = pattern.queryArc(time - 2, time + 2); // 4 cycle window
  drawPianoroll(ctx, haps, time, options);
  requestAnimationFrame(drawLoop);
}
```

### Pattern-Based vs Audio-Based
- **Pattern-based** (pianoroll, punchcard, spiral): Query pattern for haps
- **Audio-based** (scope, spectrum): Get data from AnalyserNode

### onPaint Callback (PR #377)
```javascript
pattern.onPaint = (ctx, haps, time, options) => {
  drawPianoroll(ctx, haps, time, options);
};

// Animation frame invokes if set
if (pattern.onPaint) {
  pattern.onPaint(ctx, visibleHaps, currentTime);
}
```

This is likely the mechanism Basilisk needs to implement.
