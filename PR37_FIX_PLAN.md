# PR #37 Bug Fix Plan

## Overview
This plan addresses 9 critical issues identified in PR #37 related to race conditions, edge cases, and resource management in the inline visualization system.

---

## Issue 1: Widget Store Empty Array Handling
**File:** `src/services/strudelEngine.ts:96-98`
**Severity:** Medium
**Current Code:**
```typescript
if (state.widgets) {
  widgetStore.setWidgets(state.widgets);
}
```

**Problem:**
- The check `if (state.widgets)` doesn't explicitly handle the case where `state.widgets` is `undefined` vs an empty array
- While empty arrays are truthy and will pass this check, the intent is unclear
- Should always notify listeners when widgets change, including when cleared

**Fix:**
```typescript
// Always notify listeners about widget updates, including empty arrays
widgetStore.setWidgets(state.widgets || []);
```

**Rationale:**
- Explicitly handles `undefined` case
- Ensures listeners are always notified
- Empty array properly clears widgets in subscribers

---

## Issue 2: Empty Widget Array Cleanup ✅
**File:** `src/hooks/useWidgetUpdates.ts:40-52`
**Status:** ALREADY FIXED

**Analysis:**
The code now properly handles empty widget arrays by:
- Clearing slider and visualization widgets from CodeMirror
- Unregistering all widgets from the visualization manager
- Clearing the registered widgets set

**No action needed.**

---

## Issue 3: Function Reference Instability ✅
**File:** `src/hooks/useWidgetUpdates.ts:114`
**Status:** ALREADY FIXED

**Analysis:**
- `getView` is wrapped in `useCallback` in `StrudelRepl.tsx:192`
- Dependency array is stable
- No unnecessary re-renders

**No action needed.**

---

## Issue 4: Canvas Detection "Most Recently Added" Heuristic
**File:** `src/hooks/useWidgetUpdates.ts:121-134`
**Severity:** HIGH
**Current Code:**
```typescript
function findCanvasForWidget(view: EditorView, _widget: WidgetConfig): HTMLCanvasElement | null {
  const canvases = view.dom.querySelectorAll('canvas');
  if (canvases.length > 0) {
    const canvas = canvases[canvases.length - 1] as HTMLCanvasElement;
    return canvas;
  }
  return null;
}
```

**Problem:**
- When multiple widgets are added simultaneously, all get assigned the same canvas (the last one)
- No positional matching or unique identification
- Fails with concurrent widget creation

**Fix:**
Use Strudel's `setWidget` registry to track canvas elements by ID:
```typescript
function findCanvasForWidget(view: EditorView, widget: WidgetConfig): HTMLCanvasElement | null {
  // Strategy 1: Try to find canvas by data attribute matching widget position
  const canvases = view.dom.querySelectorAll('canvas');

  // Find the canvas closest to the widget's position in the document
  for (const canvas of canvases) {
    const canvasElement = canvas as HTMLCanvasElement;

    // Check if canvas position in document matches widget.from position
    const linePos = view.state.doc.lineAt(widget.from);
    const canvasLinePos = view.posAtDOM(canvasElement.parentElement || canvasElement);

    // If the canvas is within the same line or nearby
    if (Math.abs(canvasLinePos - linePos.from) < 100) {
      return canvasElement;
    }
  }

  // Fallback: Return unregistered canvas if only one exists
  if (canvases.length === 1) {
    return canvases[0] as HTMLCanvasElement;
  }

  return null;
}
```

**Alternative Approach:**
Store widget-to-canvas mapping using data attributes:
```typescript
// In getCanvasWidget (StrudelRepl.tsx):
canvas.dataset.widgetPosition = options.from?.toString() || '';

// In findCanvasForWidget:
const widgetId = widget.from?.toString() || '';
const canvas = view.dom.querySelector(`canvas[data-widget-position="${widgetId}"]`);
return canvas as HTMLCanvasElement | null;
```

**Recommended:** Use the alternative approach with data attributes for reliable mapping.

---

## Issue 5: 100ms setTimeout Creates Race Conditions
**File:** `src/hooks/useWidgetUpdates.ts:69-102`
**Severity:** HIGH
**Current Code:**
```typescript
setTimeout(() => {
  visualizations.forEach((widget, index) => {
    // ... registration logic
  });
}, 100);
```

**Problem:**
- If code is re-evaluated within 100ms, setTimeout fires after widgets are already replaced
- Multiple pending timeouts can fire simultaneously
- No cleanup of pending timeouts when effect re-runs

**Fix:**
1. Track and cancel pending timeouts
2. Use CodeMirror's update listener instead of setTimeout
3. Use ResizeObserver to detect when canvas is actually rendered

**Recommended Solution:**
```typescript
useEffect(() => {
  const view = getView();
  if (!view) return;

  // ... existing widget update logic ...

  // Use ResizeObserver to detect when canvas is actually rendered
  if (visualizations.length > 0) {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const canvas = entry.target as HTMLCanvasElement;
        const widgetPos = canvas.dataset.widgetPosition;

        if (widgetPos && !registeredWidgets.current.has(widgetPos)) {
          const widget = visualizations.find(w => w.from?.toString() === widgetPos);
          if (widget) {
            registerWidgetWithManager(widget, canvas);
          }
        }
      });
    });

    // Observe all canvases
    view.dom.querySelectorAll('canvas').forEach(canvas => {
      observer.observe(canvas);
    });

    return () => observer.disconnect();
  }
}, [getView, widgets]);
```

**Alternative (simpler):** Use `requestAnimationFrame` for next-frame registration:
```typescript
if (visualizations.length > 0) {
  const rafId = requestAnimationFrame(() => {
    visualizations.forEach((widget, index) => {
      // ... registration logic
    });
  });

  return () => cancelAnimationFrame(rafId);
}
```

---

## Issue 6: Widget ID Collisions
**File:** `src/hooks/useWidgetUpdates.ts:72`
**Severity:** MEDIUM
**Current Code:**
```typescript
const widgetId = widget.from?.toString() || `widget-${index}`;
```

**Problem:**
- If multiple widgets don't have `from` property, they get `widget-0`, `widget-1`, etc.
- On re-evaluation, index can change, causing ID collisions
- No guarantee of stable IDs across re-renders

**Fix:**
Generate stable unique IDs using widget type and position:
```typescript
// Use a combination of type, from, and to for unique ID
const widgetId = widget.from !== undefined
  ? `${widget.type}-${widget.from}-${widget.to}`
  : `${widget.type}-${index}-${Date.now()}`;
```

**Better Alternative:**
Store widget ID in the widget config itself during transpilation, or use a WeakMap:
```typescript
const widgetIdMap = new WeakMap<WidgetConfig, string>();
let nextWidgetId = 0;

function getWidgetId(widget: WidgetConfig): string {
  if (!widgetIdMap.has(widget)) {
    widgetIdMap.set(widget, `widget-${nextWidgetId++}`);
  }
  return widgetIdMap.get(widget)!;
}
```

**Recommended:** Use the combination approach with type, from, and to.

---

## Issue 7: Animation Loop Runs Continuously
**File:** `src/services/visualizationManager.ts:109-119`
**Severity:** MEDIUM (Performance Impact)
**Current Code:**
```typescript
private animate = (): void => {
  if (!this.isRunning) return;

  this.widgets.forEach((widget) => {
    this.renderWidget(widget);
  });

  this.animationFrameId = requestAnimationFrame(this.animate);
};
```

**Problem:**
- Animation loop runs as long as widgets exist, even when audio is stopped
- Wastes CPU/GPU resources rendering static visualizations
- No playback state awareness

**Fix:**
Connect to audio playback state:
```typescript
class VisualizationManager {
  private isPlaying = false;

  /**
   * Set playback state (called from engine when audio starts/stops)
   */
  setPlaybackState(playing: boolean): void {
    this.isPlaying = playing;

    // Start/stop animation based on playback
    if (playing && this.widgets.size > 0 && !this.isRunning) {
      this.start();
    } else if (!playing && this.isRunning) {
      this.stop();
    }
  }

  private animate = (): void => {
    if (!this.isRunning || !this.isPlaying) return;

    this.widgets.forEach((widget) => {
      this.renderWidget(widget);
    });

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
```

**Integration:**
In `strudelEngine.ts`, connect playback state:
```typescript
onUpdateState: (state: StrudelState) => {
  // Update widget store
  widgetStore.setWidgets(state.widgets || []);

  // Update playback state
  visualizationManager.setPlaybackState(state.started);
}
```

---

## Issue 8: Canvas Reuse with Detached DOM Elements
**File:** `src/components/StrudelRepl.tsx:55`
**Severity:** HIGH
**Current Code:**
```typescript
let canvas = document.getElementById(id) as HTMLCanvasElement || document.createElement('canvas');
```

**Problem:**
- `getElementById` can return a canvas that was removed from the DOM
- Detached canvases don't render properly
- No validation that element is currently in document

**Fix:**
Check if canvas is actually in the document:
```typescript
function getCanvasWidget(id: string, options: any = {}) {
  const { width = 500, height = 60, pixelRatio = window.devicePixelRatio } = options;

  // Try to get existing canvas, but verify it's still in the document
  let canvas = document.getElementById(id) as HTMLCanvasElement;

  if (canvas && !document.body.contains(canvas)) {
    // Canvas exists but is detached - remove old ID reference
    canvas.removeAttribute('id');
    canvas = null;
  }

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
  }

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.dataset.widgetPosition = options.from?.toString() || '';

  setWidget(id, canvas);
  return canvas;
}
```

---

## Issue 9: Pattern.prototype Modification Timing
**File:** `src/components/StrudelRepl.tsx:64-100`
**Severity:** MEDIUM
**Current Code:**
```typescript
const WindowPattern = (window as any).Pattern;
if (WindowPattern) {
  WindowPattern.prototype._scope = function(this: any, id?: string, options: any = {}) {
    // ...
  };
}
```

**Problem:**
- Code runs at module load time
- `window.Pattern` might not be initialized yet
- No retry mechanism if Pattern isn't available

**Fix:**
Move to useEffect with retry logic:
```typescript
export const StrudelRepl = ({ ... }: Props): JSX.Element => {
  // Register Pattern.prototype methods when component mounts
  useEffect(() => {
    const registerPatternMethods = (): boolean => {
      const WindowPattern = (window as any).Pattern;

      if (!WindowPattern) {
        console.warn('window.Pattern not yet available');
        return false;
      }

      // Only register if not already registered
      if (!WindowPattern.prototype._scope) {
        WindowPattern.prototype._scope = function(this: any, id?: string, options: any = {}) {
          id = id || 'scope';
          options = { width: 500, height: 60, pos: 0.5, scale: 1, ...options };
          const ctx = getCanvasWidget(id, { ...options, from: this.from }).getContext('2d');
          return this.tag(id).scope({ ...options, ctx, id });
        };

        WindowPattern.prototype._pianoroll = function(this: any, id?: string, options: any = {}) {
          id = id || 'pianoroll';
          const ctx = getCanvasWidget(id, { ...options, from: this.from }).getContext('2d');
          return this.tag(id).pianoroll({ fold: 1, ...options, ctx, id });
        };

        WindowPattern.prototype._punchcard = function(this: any, id?: string, options: any = {}) {
          id = id || 'punchcard';
          const ctx = getCanvasWidget(id, { ...options, from: this.from }).getContext('2d');
          return this.tag(id).punchcard({ fold: 1, ...options, ctx, id });
        };

        WindowPattern.prototype._spiral = function(this: any, id?: string, options: any = {}) {
          id = id || 'spiral';
          let _size = options.size || 275;
          options = { width: _size, height: _size, ...options, size: _size / 5, from: this.from };
          const ctx = getCanvasWidget(id, options).getContext('2d');
          return this.tag(id).spiral({ ...options, ctx, id });
        };

        console.log('Pattern.prototype methods registered successfully');
      }

      return true;
    };

    // Try to register immediately
    if (!registerPatternMethods()) {
      // If Pattern not available, retry every 100ms for up to 2 seconds
      let attempts = 0;
      const maxAttempts = 20;

      const retryInterval = setInterval(() => {
        attempts++;

        if (registerPatternMethods() || attempts >= maxAttempts) {
          clearInterval(retryInterval);

          if (attempts >= maxAttempts) {
            console.error('Failed to register Pattern.prototype methods - window.Pattern never became available');
          }
        }
      }, 100);

      return () => clearInterval(retryInterval);
    }
  }, []); // Run once on mount

  // ... rest of component
}
```

---

## Implementation Priority

### Critical (Fix First):
1. **Issue 8:** Canvas reuse with detached DOM elements
2. **Issue 4:** Canvas detection heuristic
3. **Issue 5:** setTimeout race conditions

### High Priority:
4. **Issue 6:** Widget ID collisions
5. **Issue 7:** Animation loop efficiency

### Medium Priority:
6. **Issue 1:** Widget store empty array handling
7. **Issue 9:** Pattern.prototype initialization timing

---

## Testing Strategy

After implementing fixes:

1. **Race Condition Test:**
   - Rapidly re-evaluate code with multiple widgets (Shift+Enter spam)
   - Verify no duplicate registrations or crashes

2. **Multiple Widget Test:**
   - Add 3-4 different visualization types in one pattern
   - Verify each gets correct canvas and renders independently

3. **Widget Cleanup Test:**
   - Evaluate code with widgets, then evaluate code without widgets
   - Verify all canvases are properly removed and unregistered

4. **Performance Test:**
   - Stop audio playback
   - Verify animation loop stops (check CPU usage)

5. **Initialization Test:**
   - Refresh page and immediately evaluate widget code
   - Verify Pattern.prototype methods are available

---

## Rollout Plan

1. Create fixes on branch `claude/fetch-pr-comments-N0vlZ`
2. Implement critical fixes first
3. Test each fix independently
4. Run full regression test suite
5. Commit with descriptive message
6. Push to remote branch
7. Update PR #37 with fix details
