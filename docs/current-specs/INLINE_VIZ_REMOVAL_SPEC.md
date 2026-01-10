# Inline Visualization Removal Specification

> **Status:** Draft
> **Author:** Claude
> **Date:** 2026-01-10
> **Scope:** Remove all Strudel inline visualizations except slider

---

## Executive Summary

This document specifies the complete removal of Strudel inline visualizations (`_scope`, `_pianoroll`, `_punchcard`, `_spiral`, `_spectrum`) from the Basilisk AV codebase while retaining slider functionality. The refactoring eliminates ~950 lines of code (79% reduction in affected files), removes 2 service files entirely, and simplifies the widget system architecture from 3 layers to 1.

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Target State](#2-target-state)
3. [Files to Delete](#3-files-to-delete)
4. [Files to Modify](#4-files-to-modify)
5. [Dependency Graph Changes](#5-dependency-graph-changes)
6. [Implementation Steps](#6-implementation-steps)
7. [Testing Strategy](#7-testing-strategy)
8. [Risk Assessment](#8-risk-assessment)
9. [Rollback Plan](#9-rollback-plan)

---

## 1. Current State

### 1.1 Inline Visualization Types

| Visualization | Method | Rendering Engine | Lines of Code |
|---------------|--------|------------------|---------------|
| Oscilloscope | `._scope()` | Web Audio AnalyserNode | ~35 |
| Piano Roll | `._pianoroll()` | @strudel/draw `__pianoroll` | ~40 |
| Punchcard | `._punchcard()` | @strudel/draw `__pianoroll` (vertical) | ~40 |
| Spiral | `._spiral()` | Custom canvas arcs | ~120 |
| Spectrum | `._spectrum()` | Strudel's `analyze().draw()` | ~10 |
| **Slider** | `slider()` | @strudel/codemirror (retained) | N/A |

### 1.2 Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Layer                               │
│  ┌─────────────────┐    ┌──────────────────────────────────┐    │
│  │ StrudelRepl.tsx │───▶│ useWidgetUpdates.ts (227 lines)  │    │
│  │   (391 lines)   │    │ - Subscribes to widgetStore      │    │
│  └────────┬────────┘    │ - Separates sliders from viz     │    │
│           │             │ - Finds canvas elements          │    │
│           │             │ - Registers with vizManager      │    │
│           │             │ - Manages animation frames       │    │
│           │             └──────────────┬───────────────────┘    │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              useStrudelEngine.ts (130 lines)            │    │
│  │  - Initializes Strudel REPL                             │    │
│  │  - Connects audio analyser to viz manager               │    │
│  └─────────────────────────┬───────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    Services Layer                                │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              strudelEngine.ts (223 lines)               │    │
│  │  - Registers 6 widget types with Strudel               │    │
│  │  - Manages widgetStore (external store pattern)        │    │
│  │  - Connects visualizationManager to REPL               │    │
│  │  - Connects audio analyser for scope/spectrum          │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          visualizationManager.ts (592 lines)            │    │
│  │  - Singleton managing all visualization widgets        │    │
│  │  - Animation loop with requestAnimationFrame           │    │
│  │  - Pattern querying for hap events                     │    │
│  │  - Render methods: scope, pianoroll, punchcard, spiral │    │
│  │  - Canvas lifecycle management                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │        patternWidgetRegistration.ts (122 lines)         │    │
│  │  - Extends Pattern.prototype with viz methods          │    │
│  │  - Canvas widget creation helpers                      │    │
│  │  - Default dimensions and options                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Current File Metrics

| File | Lines | Purpose | Fate |
|------|-------|---------|------|
| `src/services/visualizationManager.ts` | 592 | Visualization rendering | **DELETE** |
| `src/utils/patternWidgetRegistration.ts` | 122 | Pattern method registration | **DELETE** |
| `src/hooks/useWidgetUpdates.ts` | 227 | Widget lifecycle management | **SIMPLIFY** |
| `src/services/strudelEngine.ts` | 223 | Engine initialization | **SIMPLIFY** |
| `src/hooks/useStrudelEngine.ts` | 130 | React hook for engine | **SIMPLIFY** |
| `src/components/StrudelRepl.tsx` | 391 | REPL component | **SIMPLIFY** |

**Total lines in scope:** ~1,685

---

## 2. Target State

### 2.1 Retained Functionality

Only the `slider()` function remains:

```javascript
// These patterns will continue to work
sine(slider(0.5, 4, 0.1)).play()
note("c e g").gain(slider(0, 1, 0.8))
```

### 2.2 Removed Functionality

```javascript
// These patterns will no longer work (methods will be undefined)
s("bd sd hh sd")._scope()
note("c e g")._pianoroll({ cycles: 2 })
note("c a f e").euclid(5,8)._punchcard()
note("c e g b")._spiral()
s("bd sd hh sd")._spectrum()
```

### 2.3 Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Layer                               │
│  ┌─────────────────┐    ┌──────────────────────────────────┐    │
│  │ StrudelRepl.tsx │───▶│ useWidgetUpdates.ts (~30 lines)  │    │
│  │   (~380 lines)  │    │ - Subscribes to widgetStore      │    │
│  └────────┬────────┘    │ - Applies slider widgets only    │    │
│           │             └──────────────────────────────────┘    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              useStrudelEngine.ts (~115 lines)           │    │
│  │  - Initializes Strudel REPL                             │    │
│  └─────────────────────────┬───────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    Services Layer                                │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              strudelEngine.ts (~120 lines)              │    │
│  │  - Registers slider widget type only                   │    │
│  │  - Manages widgetStore (external store pattern)        │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 Target File Metrics

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `src/services/visualizationManager.ts` | 592 | 0 | **-100%** |
| `src/utils/patternWidgetRegistration.ts` | 122 | 0 | **-100%** |
| `src/hooks/useWidgetUpdates.ts` | 227 | ~30 | **-87%** |
| `src/services/strudelEngine.ts` | 223 | ~120 | **-46%** |
| `src/hooks/useStrudelEngine.ts` | 130 | ~115 | **-12%** |
| `src/components/StrudelRepl.tsx` | 391 | ~380 | **-3%** |

**Total lines removed:** ~949 (56% of affected code)

---

## 3. Files to Delete

### 3.1 `src/services/visualizationManager.ts`

**Current responsibility:** Central visualization rendering engine

**Key exports being removed:**
```typescript
export const visualizationManager: {
  registerWidget(widget: VisualizationWidget): void;
  unregisterWidget(id: string): void;
  setPatternGetter(getter: () => Pattern | null): void;
  setTimeGetter(getter: () => number): void;
  setAudioAnalyser(analyser: AnalyserNode): void;
  setPlaybackState(isPlaying: boolean): void;
}

export interface VisualizationWidget {
  id: string;
  type: '_scope' | '_pianoroll' | '_punchcard' | '_spiral' | '_spectrum';
  canvas: HTMLCanvasElement;
  options: Record<string, unknown>;
}
```

**Imports to remove from consumers:**
- `src/hooks/useWidgetUpdates.ts` (line 7)
- `src/services/strudelEngine.ts` (line 7)

**Reason for deletion:** All functionality is visualization-specific with no reuse for sliders.

---

### 3.2 `src/utils/patternWidgetRegistration.ts`

**Current responsibility:** Extend `Pattern.prototype` with visualization methods

**Key exports being removed:**
```typescript
export const registerPatternMethods: () => boolean;
export const getCanvasWidget: (id: string, options: object) => HTMLCanvasElement;

// Methods added to Pattern.prototype:
Pattern.prototype._scope
Pattern.prototype._pianoroll
Pattern.prototype._punchcard
Pattern.prototype._spiral
Pattern.prototype._spectrum
```

**Imports to remove from consumers:**
- `src/components/StrudelRepl.tsx` (line 18)

**Reason for deletion:** Sliders are handled natively by `@strudel/codemirror` and don't require Pattern prototype extension.

---

## 4. Files to Modify

### 4.1 `src/hooks/useWidgetUpdates.ts`

**Current lines:** 227
**Target lines:** ~30

#### Remove

| Lines | Code | Reason |
|-------|------|--------|
| 7 | `import { visualizationManager } from '../services/visualizationManager'` | Service deleted |
| 14-17 | `registeredWidgets`, `pendingRegistration`, `widgetIdCounter`, `widgetIdMap` refs | Viz lifecycle tracking |
| 91-92 | Visualization widget filtering logic | No viz widgets |
| 100-154 | Visualization registration loop | No viz widgets |
| 157-165 | Visualization cleanup logic | No viz widgets |
| 168-173 | Animation frame cancellation | No animation loop |
| 181-226 | `findCanvasForWidget()` helper function | Canvas discovery for viz |

#### Keep

| Lines | Code | Reason |
|-------|------|--------|
| 1-6 | Core imports (useSyncExternalStore, etc.) | Still needed |
| 28-31 | `useSyncExternalStore` subscription | Slider widgets use this |
| 96-97 | `updateSliderWidgets(view, sliders)` | Core slider functionality |

#### New Implementation

```typescript
import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { EditorView } from '@codemirror/view';
import { updateSliderWidgets } from '@strudel/codemirror';
import { widgetStore } from '../services/strudelEngine';

/**
 * Hook to apply slider widgets to the CodeMirror editor.
 * Subscribes to the widget store and updates the editor when widgets change.
 */
export const useWidgetUpdates = (
  getView: () => EditorView | undefined
): void => {
  const widgets = useSyncExternalStore(
    widgetStore.subscribe,
    widgetStore.getSnapshot
  );

  useEffect(() => {
    const view = getView();
    if (!view || widgets.length === 0) return;

    // Apply slider widgets to CodeMirror
    updateSliderWidgets(view, widgets);
  }, [getView, widgets]);
};
```

---

### 4.2 `src/services/strudelEngine.ts`

**Current lines:** 223
**Target lines:** ~120

#### Remove

| Lines | Code | Reason |
|-------|------|--------|
| 7 | `import { visualizationManager } from './visualizationManager'` | Service deleted |
| 16 | Visualization types from `WidgetConfig` union | No viz types |
| 92-99 | `registerWidgetType()` calls for viz types | No viz registration |
| 123-144 | `connectVisualizationManager()` function | Service deleted |
| 150-170 | `connectAudioAnalyser()` function | No viz needs analyser |
| 109, 114 | Visualization manager state updates in `onUpdateState` | No viz manager |

#### Keep

| Lines | Code | Reason |
|-------|------|--------|
| 1-6 | Core Strudel imports | Still needed |
| 15 | Slider type in `WidgetConfig` | Sliders still work |
| 56-81 | `widgetStore` external store | Sliders use this |
| 83-90 | `initializeStrudel()` core logic | Engine init |
| 100-105 | Slider widget type registration | Sliders need this |
| 175-180 | `getReplInstance()` | Component access |

#### Type Changes

```typescript
// Before
export interface WidgetConfig {
  type: 'slider' | '_scope' | '_pianoroll' | '_punchcard' | '_spiral' | '_spectrum';
  from: number;
  to: number;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
}

// After
export interface WidgetConfig {
  type: 'slider';
  from: number;
  to: number;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
}
```

---

### 4.3 `src/hooks/useStrudelEngine.ts`

**Current lines:** 130
**Target lines:** ~115

#### Remove

| Lines | Code | Reason |
|-------|------|--------|
| ~73 | `connectAudioAnalyser(analyser)` call | No viz needs analyser |
| ~8 | Import of `connectAudioAnalyser` if separate | Unused |

#### Keep

All other logic remains—audio bridge initialization for Hydra reactivity is unaffected.

---

### 4.4 `src/components/StrudelRepl.tsx`

**Current lines:** 391
**Target lines:** ~380

#### Remove

| Lines | Code | Reason |
|-------|------|--------|
| 5-6 | `import * as StrudelDraw from '@strudel/draw'` | No viz drawing |
| 18 | `import { registerPatternMethods } from '../utils/patternWidgetRegistration'` | File deleted |
| 58 | `StrudelDraw` in `Object.assign(window, ...)` | No viz methods |
| 203-223 | Pattern methods registration and retry loop | No pattern methods |

#### Keep

All REPL functionality, CodeMirror integration, and slider support remains.

---

## 5. Dependency Graph Changes

### 5.1 Import Dependencies Removed

```
useWidgetUpdates.ts ─────✕────▶ visualizationManager.ts
strudelEngine.ts ────────✕────▶ visualizationManager.ts
useStrudelEngine.ts ─────✕────▶ strudelEngine.connectAudioAnalyser
StrudelRepl.tsx ─────────✕────▶ patternWidgetRegistration.ts
StrudelRepl.tsx ─────────✕────▶ @strudel/draw
```

### 5.2 Remaining Dependencies

```
StrudelRepl.tsx
    │
    ├──▶ useWidgetUpdates (hook)
    │       └──▶ widgetStore (from strudelEngine)
    │       └──▶ @strudel/codemirror.updateSliderWidgets
    │
    └──▶ useStrudelEngine (hook)
            └──▶ strudelEngine.initializeStrudel
            └──▶ audioBridge (for Hydra FFT)
```

### 5.3 Package Dependencies

#### May Be Removable

```json
{
  "@strudel/draw": "^x.x.x"  // Check if used elsewhere
}
```

#### Must Keep

```json
{
  "@strudel/codemirror": "^x.x.x",  // updateSliderWidgets
  "@strudel/web": "^x.x.x",          // registerWidgetType
  "@strudel/core": "^x.x.x"          // Pattern, etc.
}
```

---

## 6. Implementation Steps

### Phase 1: Preparation

1. **Create feature branch**
   ```bash
   git checkout -b refactor/remove-inline-visualizations
   ```

2. **Verify current test coverage**
   ```bash
   npm test -- --coverage
   ```

3. **Document current slider behavior** (manual testing)
   - Verify `slider(min, max, default)` works in REPL
   - Verify slider updates affect pattern in real-time
   - Screenshot/record expected behavior

### Phase 2: Remove Visualization Manager

1. **Update `useWidgetUpdates.ts`**
   - Remove `visualizationManager` import
   - Remove all visualization-specific logic
   - Keep only slider application code
   - Run tests

2. **Update `strudelEngine.ts`**
   - Remove `visualizationManager` import
   - Remove `connectVisualizationManager()` function
   - Remove `connectAudioAnalyser()` function
   - Remove visualization type registrations
   - Simplify `WidgetConfig` type
   - Run tests

3. **Delete `visualizationManager.ts`**
   ```bash
   git rm src/services/visualizationManager.ts
   ```

### Phase 3: Remove Pattern Registration

1. **Update `StrudelRepl.tsx`**
   - Remove `@strudel/draw` import
   - Remove `patternWidgetRegistration` import
   - Remove `StrudelDraw` from window assignment
   - Remove registration retry loop
   - Run tests

2. **Delete `patternWidgetRegistration.ts`**
   ```bash
   git rm src/utils/patternWidgetRegistration.ts
   ```

### Phase 4: Cleanup

1. **Update `useStrudelEngine.ts`**
   - Remove `connectAudioAnalyser` call
   - Verify audio bridge still works for Hydra

2. **Check for orphaned imports**
   ```bash
   npm run lint
   ```

3. **Check `@strudel/draw` usage**
   ```bash
   grep -r "@strudel/draw" src/
   ```
   If no other usage, remove from `package.json`

4. **Run full test suite**
   ```bash
   npm test
   npm run build
   ```

### Phase 5: Verification

1. **Manual testing checklist**
   - [ ] Sliders render in REPL
   - [ ] Slider values update pattern
   - [ ] Hydra FFT reactivity works
   - [ ] No console errors
   - [ ] Production build succeeds

2. **Create PR with before/after metrics**

---

## 7. Testing Strategy

### 7.1 Unit Tests

#### Tests to Update

| File | Changes |
|------|---------|
| `src/hooks/__tests__/useWidgetUpdates.test.ts` | Remove viz widget tests, keep slider tests |
| `src/services/__tests__/strudelEngine.test.ts` | Remove viz registration tests |

#### Tests to Delete

| File | Reason |
|------|--------|
| `src/services/__tests__/visualizationManager.test.ts` | Service deleted |
| Any viz-specific integration tests | Feature removed |

### 7.2 Integration Tests

```typescript
// Slider functionality must still pass
describe('Slider widgets', () => {
  it('renders slider in CodeMirror editor', () => {
    // Verify updateSliderWidgets is called
  });

  it('updates pattern when slider value changes', () => {
    // Verify slider callback updates pattern
  });
});
```

### 7.3 Manual Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Slider renders | Enter `sine(slider(0.5, 4, 0.1)).play()` | Slider appears inline |
| Slider interacts | Drag slider handle | Audio frequency changes |
| Viz methods undefined | Enter `s("bd")._scope()` | Error: `_scope is not a function` |
| Hydra FFT works | Run Hydra with `a.fft[0]` | Visual reacts to audio |
| Build succeeds | `npm run build` | No errors |

---

## 8. Risk Assessment

### 8.1 Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Break slider functionality | Low | High | Comprehensive slider tests before/after |
| Break Hydra FFT bridge | Low | High | Audio bridge is independent of viz manager |
| Orphaned imports cause build failure | Medium | Low | Lint and TypeScript will catch |
| Runtime errors from missing viz methods | Low | Low | Expected—methods simply won't exist |
| Package.json has unused dependencies | Medium | Low | Audit after removal |

### 8.2 Breaking Changes

**User-facing breaking changes:**

1. `._scope()` will throw `TypeError: _scope is not a function`
2. `._pianoroll()` will throw `TypeError: _pianoroll is not a function`
3. `._punchcard()` will throw `TypeError: _punchcard is not a function`
4. `._spiral()` will throw `TypeError: _spiral is not a function`
5. `._spectrum()` will throw `TypeError: _spectrum is not a function`

**Migration path:** Users must remove these method calls from their patterns.

---

## 9. Rollback Plan

### 9.1 Git-Based Rollback

```bash
# If issues discovered post-merge
git revert <merge-commit-sha>
```

### 9.2 Feature Flag Option (Alternative)

If gradual rollout is preferred, implement a feature flag:

```typescript
// src/config/features.ts
export const ENABLE_INLINE_VISUALIZATIONS = false;

// In strudelEngine.ts
if (ENABLE_INLINE_VISUALIZATIONS) {
  registerWidgetType('_scope');
  // ... etc
}
```

This allows toggling visualizations without code changes.

### 9.3 Preserved Artifacts

Before deletion, the following will be preserved in git history:
- `src/services/visualizationManager.ts` (commit sha: TBD)
- `src/utils/patternWidgetRegistration.ts` (commit sha: TBD)

To restore:
```bash
git show <commit-sha>:src/services/visualizationManager.ts > src/services/visualizationManager.ts
```

---

## Appendix A: Visualization Manager API Reference

For historical reference, the deleted visualization manager exposed:

```typescript
interface VisualizationManager {
  // Widget lifecycle
  registerWidget(widget: VisualizationWidget): void;
  unregisterWidget(id: string): void;

  // Strudel integration
  setPatternGetter(getter: () => Pattern | null): void;
  setTimeGetter(getter: () => number): void;

  // Audio integration
  setAudioAnalyser(analyser: AnalyserNode): void;

  // Playback state
  setPlaybackState(isPlaying: boolean): void;
}

interface VisualizationWidget {
  id: string;
  type: '_scope' | '_pianoroll' | '_punchcard' | '_spiral' | '_spectrum';
  canvas: HTMLCanvasElement;
  options: Record<string, unknown>;
}
```

---

## Appendix B: Visualization Render Methods

For historical reference, each visualization type had a dedicated render method:

| Method | Source | Canvas API Used |
|--------|--------|-----------------|
| `renderScope()` | Lines 228-263 | `lineTo()`, `stroke()` |
| `renderPianoroll()` | Lines 268-305 | `@strudel/draw.__pianoroll` |
| `renderPunchcard()` | Lines 310-346 | `@strudel/draw.__pianoroll` (vertical) |
| `renderSpiral()` | Lines 494-574 | `arc()`, `fill()` |
| `renderSpectrum()` | Skipped (line 200) | Handled by Strudel |

---

## Appendix C: File Checksums (Pre-Removal)

For verification of correct file identification:

```bash
# Generate before removal
sha256sum src/services/visualizationManager.ts
sha256sum src/utils/patternWidgetRegistration.ts
sha256sum src/hooks/useWidgetUpdates.ts
sha256sum src/services/strudelEngine.ts
```

---

*End of specification*
