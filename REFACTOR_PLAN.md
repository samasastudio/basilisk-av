# App.tsx Refactoring Plan

## Executive Summary
App.tsx currently manages ~10 pieces of state, bridge initialization logic, engine setup, HUD animations, and complex JSX. This refactoring will improve testability, maintainability, and developer experience by extracting custom hooks, service modules, and UI components.

---

## Current State Analysis

### State & Refs (12 total)
1. ✅ `engineInitialized` - boolean, tracks if Strudel engine is ready
2. ✅ `isInitializing` - boolean, loading state during engine startup
3. ✅ `hydraLinked` - boolean, if Hydra connected to audio
4. ❌ `audioContext` - **NEVER READ** (only setter called) - can be removed
5. ✅ `hydraStatus` - string, display text for Hydra connection status
6. ✅ `hydraHudValue` - number, real-time FFT value (dev mode only)
7. ✅ `hasExecutedCode` - boolean, tracks if user executed code once
8. ✅ `replPosition` - {x, y}, REPL window position
9. ✅ `replSize` - {width, height}, REPL window dimensions
10. ❌ `strudelReplRef` - **UNUSED** (everything accesses `window.repl` instead)
11. ✅ `hudAnimationRef` - ref for requestAnimationFrame cleanup

### Issues Identified

#### 1. **Unused State**
- `audioContext` setter called but value never read
- `strudelReplRef.current` set but never accessed

#### 2. **Tightly Coupled Logic**
- Engine initialization embedded in component (hard to test)
- Bridge setup callback embedded in `startEngine()`
- HUD animation logic mixed with component lifecycle
- Helper functions (`playTestPattern`, `hushAudio`) defined inline

#### 3. **JSX Bloat (165 lines)**
- Hydra canvas + startup text + dev HUD = 25+ lines
- Header bar with status indicators = 25+ lines
- REPL window wrapper with Rnd config = 30+ lines

#### 4. **Window Global Coupling**
- Multiple direct accesses to `(window as any).repl`
- Multiple accesses to `(window as any).a.fft`
- No abstraction layer for global state

#### 5. **Testability**
- Cannot test engine initialization without mounting App
- Cannot test helper functions in isolation
- Cannot test bridge setup logic independently

---

## Refactoring Phases

### Phase 1: Extract Custom Hooks
**Goal:** Move stateful logic into reusable, testable hooks

#### 1.1 Create `src/hooks/useStrudelEngine.ts`
**Responsibilities:**
- Engine initialization state and logic
- Hydra bridge connection state
- Test pattern and hush functions
- Error handling

**Returns:**
```typescript
{
  engineInitialized: boolean;
  isInitializing: boolean;
  hydraLinked: boolean;
  hydraStatus: string;
  startEngine: () => Promise<void>;
  playTestPattern: () => void;
  hushAudio: () => void;
}
```

**Benefits:**
- Testable in isolation with React Testing Library hooks
- Reusable across other components if needed
- Cleaner App.tsx (removes 50+ lines)

#### 1.2 Create `src/hooks/useHydraHUD.ts`
**Responsibilities:**
- HUD animation loop (dev mode only)
- FFT value polling from `window.a`
- Animation frame cleanup

**Returns:**
```typescript
{
  hudValue: number;
}
```

**Benefits:**
- Only runs in dev mode
- Self-contained animation logic
- Easy to disable/enable

#### 1.3 Create `src/hooks/useREPLWindow.ts`
**Responsibilities:**
- REPL position and size state
- Drag/resize handlers
- Window bounds calculations

**Returns:**
```typescript
{
  position: { x: number; y: number };
  size: { width: number; height: number };
  handleDragStop: (e, d) => void;
  handleResizeStop: (e, direction, ref, delta, position) => void;
}
```

**Benefits:**
- Isolates window management logic
- Could add localStorage persistence later
- Testable handlers

---

### Phase 2: Extract Service Modules
**Goal:** Create pure, testable service functions

#### 2.1 Create `src/services/strudelEngine.ts`
**Pure functions for engine operations:**

```typescript
export async function initializeStrudel() {
  const repl = await initStrudel({
    prebake: () => (window as any).samples('github:tidalcycles/dirt-samples')
  });
  return repl;
}

export function playTestPattern(repl: any) {
  if (!repl?.evaluate) return;
  repl.evaluate('s("bd*4").gain(0.8)');
}

export function hushAudio(repl: any) {
  if (!repl?.stop) repl.stop();
}

export function getReplInstance() {
  return (window as any).repl;
}
```

**Benefits:**
- **Unit testable** with Jest (no React needed)
- Can mock window.repl easily
- Clear single-responsibility functions

#### 2.2 Consolidate `src/services/audioBridge.ts`
**Bridge abstraction layer:**
- Combine existing bridge utilities
- Add getter functions for bridge state
- Remove window global coupling

```typescript
export function getBridgeFFT(index: number = 0): number {
  return (window as any).a?.fft?.[index] ?? 0;
}

export function isBridgeActive(): boolean {
  return !!(window as any).a;
}
```

---

### Phase 3: Extract UI Components
**Goal:** Break down 165-line JSX into focused, reusable components

#### 3.1 Create `src/components/HydraCanvas.tsx`
**Props:**
```typescript
{
  showStartupText: boolean;
}
```

**Renders:**
- Canvas container (`#hydra-container`)
- Conditional startup text
- Dev HUD (uses `useHydraHUD()` hook internally)

**Benefits:**
- Isolates canvas/visual layer
- Self-contained HUD logic
- ~40 lines removed from App.tsx

#### 3.2 Create `src/components/AppHeader.tsx`
**Props:**
```typescript
{
  engineInitialized: boolean;
  isInitializing: boolean;
  hydraLinked: boolean;
  hydraStatus: string;
  onStartEngine: () => void;
}
```

**Renders:**
- BASILISK branding
- Status indicators
- Start Audio button

**Benefits:**
- Reusable header component
- Easy to add more controls later
- ~25 lines removed from App.tsx

#### 3.3 Create `src/components/REPLWindow.tsx`
**Props:**
```typescript
{
  engineReady: boolean;
  onTestPattern: () => void;
  onHalt: () => void;
  onExecute: () => void;
}
```

**Renders:**
- Rnd wrapper with drag/resize config
- StrudelRepl component
- Uses `useREPLWindow()` hook internally

**Benefits:**
- Encapsulates REPL window management
- Could add window controls (minimize, maximize)
- ~30 lines removed from App.tsx

---

### Phase 4: State Cleanup
**Goal:** Remove unused state and simplify state management

#### 4.1 Remove Dead Code
- ❌ Remove `audioContext` state (unused)
- ❌ Remove `strudelReplRef` (everything uses `window.repl`)

#### 4.2 Simplify State Derivation
- Consider state machine for engine status:
  ```typescript
  type EngineStatus = 'idle' | 'initializing' | 'ready' | 'error';
  ```
  This would replace both `engineInitialized` and `isInitializing`

#### 4.3 Consider LocalStorage Persistence
- Persist `replPosition` and `replSize`
- Persist `hasExecutedCode` to hide startup text on reload

---

## Phased Implementation Order

### **Phase 0: Testing Infrastructure** (Foundation) ⭐ NEW
**Why:** Provides safety net for refactoring and enables TDD approach

#### 0.1 Install Vitest + React Testing Library
```bash
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### 0.2 Create `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

#### 0.3 Create `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia (used by some UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.requestAnimationFrame (used by HUD animation)
global.requestAnimationFrame = vi.fn((cb) => {
  cb(0);
  return 0;
});

global.cancelAnimationFrame = vi.fn();
```

#### 0.4 Add Test Scripts to `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### 0.5 Write Baseline Tests (Pre-Refactor)
**Goal:** Document current behavior before refactoring

**`src/test/App.baseline.test.tsx`** - Integration test for current App
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock Strudel/Hydra imports
vi.mock('@strudel/web', () => ({
  initStrudel: vi.fn().mockResolvedValue({
    evaluate: vi.fn(),
    stop: vi.fn(),
  }),
}));

describe('App - Baseline Behavior', () => {
  it('renders startup text by default', () => {
    render(<App />);
    expect(screen.getByText(/Run code with/i)).toBeInTheDocument();
  });

  it('shows engine as stopped initially', () => {
    render(<App />);
    expect(screen.getByText(/Audio: stopped/i)).toBeInTheDocument();
  });

  it('shows Hydra as disconnected initially', () => {
    render(<App />);
    expect(screen.getByText(/Hydra: none/i)).toBeInTheDocument();
  });

  it('Start Audio button is enabled initially', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Start Audio/i });
    expect(button).not.toBeDisabled();
  });
});
```

**`src/utils/__tests__/strudelHydraBridge.test.ts`** - Unit test for bridge
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initHydraBridge } from '../strudelHydraBridge';

describe('strudelHydraBridge', () => {
  let mockAudioContext: any;

  beforeEach(() => {
    mockAudioContext = {
      createAnalyser: vi.fn(() => ({
        fftSize: 0,
        smoothingTimeConstant: 0,
        frequencyBinCount: 512,
        connect: vi.fn(),
        getByteFrequencyData: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1.0 },
        connect: vi.fn(),
      })),
      destination: {},
    };
  });

  it('creates bridge with analyser and gain nodes', () => {
    const bridge = initHydraBridge(mockAudioContext);
    expect(bridge).not.toBeNull();
    expect(bridge?.analyser).toBeDefined();
    expect(bridge?.gainNode).toBeDefined();
  });

  it('exposes bridge globally as window.a', () => {
    initHydraBridge(mockAudioContext);
    expect((window as any).a).toBeDefined();
    expect((window as any).a.fft).toBeDefined();
  });

  it('initializes with 4 FFT bins', () => {
    const bridge = initHydraBridge(mockAudioContext);
    expect(bridge?.bins).toBe(4);
    expect(bridge?.fft).toHaveLength(4);
  });
});
```

**Benefits:**
- ✅ Documents current behavior before any changes
- ✅ Catches regressions immediately during refactoring
- ✅ Baseline tests become the "spec" for new hooks/services
- ✅ Can run `npm test` after each phase to verify nothing broke

---

### **Phase 1: Hooks First** (Low Risk)
1. Create `useHydraHUD.ts` (simplest, dev-only)
   - Write tests first
   - Extract hook
   - Tests pass = success
2. Create `useREPLWindow.ts` (self-contained)
   - Write tests first
   - Extract hook
   - Tests pass = success
3. Create `useStrudelEngine.ts` (most complex)
   - Write tests first (mock bridge initialization)
   - Extract hook
   - Tests pass = success

### **Phase 2: Services** (Medium Risk)
1. Create `strudelEngine.ts` service
2. Consolidate `audioBridge.ts` service
3. Update hooks to use services

### **Phase 3: Components** (Medium Risk)
1. Create `HydraCanvas.tsx` (uses `useHydraHUD`)
2. Create `AppHeader.tsx` (simple, no hooks)
3. Create `REPLWindow.tsx` (uses `useREPLWindow`)

### **Phase 4: Cleanup** (Low Risk)
1. Remove unused state
2. Simplify App.tsx to composition
3. Add tests for hooks and services

---

## Expected Outcome

### Before (Current App.tsx)
- **165 lines**
- **10 pieces of state**
- **2 useEffect blocks**
- **4 inline functions**
- **Complex JSX nesting**
- **Hard to test**

### After (Refactored App.tsx)
- **~50-60 lines** (composition only)
- **1 piece of state** (`hasExecutedCode` - could even be in hook)
- **0 useEffect blocks** (moved to hooks)
- **0 inline functions** (moved to hooks/services)
- **Clean JSX composition** (3 child components)
- **Highly testable** (hooks + services)

### Example After Structure:
```typescript
function App() {
  const engine = useStrudelEngine();
  const [hasExecutedCode, setHasExecutedCode] = useState(false);

  return (
    <div className="w-screen h-screen bg-basilisk-black text-basilisk-white overflow-hidden relative">
      <HydraCanvas showStartupText={!hasExecutedCode} />

      <AppHeader
        engineInitialized={engine.engineInitialized}
        isInitializing={engine.isInitializing}
        hydraLinked={engine.hydraLinked}
        hydraStatus={engine.hydraStatus}
        onStartEngine={engine.startEngine}
      />

      <REPLWindow
        engineReady={engine.engineInitialized}
        onTestPattern={engine.playTestPattern}
        onHalt={engine.hushAudio}
        onExecute={() => setHasExecutedCode(true)}
      />
    </div>
  );
}
```

---

## Testing Strategy

### Hooks (React Testing Library)
- Test `useStrudelEngine` initialization states
- Test `useHydraHUD` animation loop
- Test `useREPLWindow` drag/resize handlers

### Services (Jest Unit Tests)
- Test `playTestPattern` with mocked repl
- Test `hushAudio` with mocked repl
- Test `getBridgeFFT` with mocked window.a

### Components (React Testing Library)
- Test `HydraCanvas` conditional rendering
- Test `AppHeader` button states
- Test `REPLWindow` integration with StrudelRepl

---

## Migration Risks & Mitigation

### Risk 1: Breaking Bridge Initialization
- **Mitigation:** Keep bridge logic identical, just move location
- **Test:** Manual test audio-reactive visuals after each phase

### Risk 2: Window Global Timing Issues
- **Mitigation:** Ensure hooks initialize in same order
- **Test:** Add console logs to verify initialization sequence

### Risk 3: REPL Window Behavior Changes
- **Mitigation:** Keep exact same Rnd config
- **Test:** Test drag, resize, and bounds behavior

---

## TDD Workflow (Phase 0 Enables This!)

With testing infrastructure in place, we can use Test-Driven Development:

```
For each hook/service/component extraction:
1. Write test for desired behavior
2. Extract code from App.tsx
3. Run tests (they should pass)
4. Refactor if needed
5. Tests still pass? ✅ Move to next extraction
```

**Example: Extracting `useStrudelEngine`**
```bash
# 1. Write test
src/hooks/__tests__/useStrudelEngine.test.ts

# 2. Extract hook
src/hooks/useStrudelEngine.ts

# 3. Run tests
npm test

# 4. All tests pass? Commit!
git add .
git commit -m "feat: extract useStrudelEngine hook"
```

---

## Recommended Approach

### **Start with Phase 0** ⭐ RECOMMENDED
**Why:**
- ✅ Establishes testing foundation before refactoring
- ✅ Baseline tests document current behavior
- ✅ Immediate feedback when refactoring breaks something
- ✅ Enables TDD for all subsequent phases
- ✅ Prevents "it works but we're not sure why" scenarios

### **Then proceed sequentially**
1. **Phase 0: Testing Infrastructure** (1-2 hours)
   - Install dependencies
   - Setup Vitest config
   - Write baseline tests
   - **Milestone:** `npm test` runs and passes ✅

2. **Phase 1: Extract Hooks** (2-4 hours)
   - Start with `useHydraHUD` (simplest)
   - Then `useREPLWindow` (medium)
   - Finally `useStrudelEngine` (complex)
   - **Milestone:** App.tsx ~100 lines, all tests passing ✅

3. **Phase 2: Extract Services** (1-2 hours)
   - Create service modules
   - Update hooks to use services
   - **Milestone:** Business logic fully unit testable ✅

4. **Phase 3: Extract Components** (2-3 hours)
   - Break down JSX into child components
   - **Milestone:** App.tsx ~50 lines, clean composition ✅

5. **Phase 4: Cleanup** (1 hour)
   - Remove dead code
   - Add localStorage persistence
   - Final test run
   - **Milestone:** Full refactor complete, 80%+ test coverage ✅

### **Git Strategy**
- Each phase = separate commit
- Each hook/service/component = separate commit within phase
- Keep commits small and atomic
- Run tests before every commit

---

## Updated Recommendation

**Should we start with Phase 0 (Vitest setup)?**

**YES** - This is now the recommended first step because:
1. Zero tests currently exist
2. Refactoring without tests is risky
3. TDD approach makes refactoring safer and faster
4. Tests serve as documentation for new developers
5. Establishes good testing culture for the project

**Estimated Time:** ~1-2 hours for Phase 0
**Estimated Time:** ~10-14 hours total for all phases (including docs)

---

## Phase 5: Documentation Cleanup & Consolidation

**Goal:** Remove outdated docs, consolidate accurate information, establish single source of truth

### Documentation Audit Results

#### ✅ KEEP (Accurate & Current)
1. **`docs/AUDIO_BRIDGE_ARCHITECTURE.md`** (588 lines)
   - ✅ Comprehensive technical documentation
   - ✅ Accurate architecture diagrams
   - ✅ Current implementation details
   - ✅ Performance metrics
   - ✅ Debugging guides
   - **Action:** Move to root as `ARCHITECTURE.md`

2. **`REFACTOR_PLAN.md`** (this file)
   - ✅ Current refactoring strategy
   - **Action:** Keep in root

#### ⚠️ UPDATE (Partially Outdated)
3. **`README.md`** (58 lines)
   - ❌ References `HydraCanvas.tsx` component (doesn't exist)
   - ❌ Mentions visual mode dropdown (removed)
   - ❌ Describes old architecture (shared AudioContext pattern)
   - ✅ Good project structure overview
   - **Action:** Complete rewrite based on current codebase

4. **`roadmap.md`** (31 lines)
   - ✅ Phase 1: Foundation - COMPLETED ✅
   - ✅ Phase 2: Audio-Visual Bridge - COMPLETED ✅
   - ❌ Phase 3: Window Management - PARTIALLY DONE (Rnd, not pop-out)
   - ❌ Phase 4: Content & Polish - IN PROGRESS
   - **Action:** Update with actual progress, add Phase 5+ (tests, refactoring, features)

#### 📦 ARCHIVE (Outdated but Historical Value)
5. **`HOW_TO_STRUDEL_HYDRA.md`** (624 lines)
   - ❌ Duplicate content (appears twice in file)
   - ❌ References old `<strudel-editor>` web component approach
   - ❌ Describes visual mode controls that no longer exist
   - ✅ Some useful tutorial content
   - **Action:** Move to `archive/` folder (historical reference)

6. **`INTEGRATION_SUMMARY.md`** (109 lines)
   - ❌ References visual mode dropdown
   - ❌ Describes old App.tsx state (audioData, visualMode)
   - ❌ Architecture diagram doesn't match current code
   - ✅ Good high-level summary structure
   - **Action:** Move to `archive/` folder

7. **`TESTING_GUIDE.md`** (154 lines)
   - ❌ References "START_ENGINE" button (now "Start Audio")
   - ❌ Mentions visual mode switching (removed)
   - ❌ Describes old HydraCanvas component
   - ✅ Good testing checklist structure
   - **Action:** Move to `archive/` folder, will be replaced by Vitest tests

#### ❌ DELETE (Obsolete Development Notes)
8. **`AUDIO_REACTIVITY_DEBUGGING.md`** (277 lines)
   - Debugging prompt for a different approach
   - No longer relevant to current implementation
   - **Action:** Delete

9. **`STRUDEL_HYDRA_LINKING.md`** (19 lines)
   - Old linking strategy (getAudioContext/getDestination)
   - Superseded by current monkey-patching approach
   - **Action:** Delete

10. **`AUDIO_LINKING_SOLUTION.md`** (60 lines)
    - Old hijacking approach (createGain interception)
    - Superseded by AudioNode.connect patching
    - **Action:** Delete

---

### Phase 5 Implementation Plan

#### 5.1 Clean Up Obsolete Docs (10 min)
```bash
# Delete old development notes
rm AUDIO_REACTIVITY_DEBUGGING.md
rm STRUDEL_HYDRA_LINKING.md
rm AUDIO_LINKING_SOLUTION.md

# Create archive folder
mkdir -p archive

# Move outdated but historical docs
mv HOW_TO_STRUDEL_HYDRA.md archive/
mv INTEGRATION_SUMMARY.md archive/
mv TESTING_GUIDE.md archive/
```

#### 5.2 Reorganize Current Docs (5 min)
```bash
# Move architecture doc to root for visibility
mv docs/AUDIO_BRIDGE_ARCHITECTURE.md ARCHITECTURE.md

# Remove empty docs folder (if empty)
rmdir docs
```

#### 5.3 Rewrite README.md (30 min)
**New structure:**
```markdown
# Basilisk – Audio-Reactive Live Coding Environment

## Overview
Basilisk is a live-coding playground that combines Strudel (audio) and Hydra (visuals)
in a single React application with real-time audio-reactive visuals.

## Features
- ✅ Strudel REPL with CodeMirror editor
- ✅ Hydra canvas with audio-reactive FFT bridge
- ✅ Draggable/resizable REPL window
- ✅ Dev mode HUD showing real-time FFT data
- ✅ Zero-latency audio→visual routing

## Quick Start
npm install
npm run dev

## Architecture
- Built with Vite + React + TypeScript
- Audio bridge uses Web Audio API monkey-patching
- See ARCHITECTURE.md for technical deep-dive

## Usage
1. Click "Start Audio" to initialize Strudel engine
2. Write Strudel code in REPL (e.g., `s("bd*4")`)
3. Press Execute ▶ or Shift+Enter to run
4. Initialize Hydra: `await initHydra()`
5. Create audio-reactive visuals: `osc(() => a.fft[0] * 10).out()`

## Project Structure
src/
├── App.tsx              # Main app component
├── components/
│   ├── StrudelRepl.tsx  # CodeMirror-based REPL
│   └── ui/Button.tsx    # UI components
└── utils/
    ├── patchSuperdough.ts      # Audio routing interceptor
    ├── strudelHydraBridge.ts   # FFT analysis bridge
    └── patternPresets.ts       # Example patterns

## Documentation
- ARCHITECTURE.md - Technical implementation details
- REFACTOR_PLAN.md - Planned improvements and testing strategy
- roadmap.md - Feature roadmap

## Testing
npm test           # Run Vitest unit tests (coming in Phase 0)
npm test:ui        # Open Vitest UI
npm test:coverage  # Generate coverage report

## License
MIT
```

#### 5.4 Update roadmap.md (15 min)
**Update with current status:**
```markdown
# Basilisk Roadmap

## ✅ Phase 1: Foundation & Core Integration (COMPLETED)
- ✅ Vite + React + TypeScript setup
- ✅ Dark minimalist UI with glassmorphism
- ✅ Embedded StrudelRepl with CodeMirror
- ✅ Full-screen Hydra canvas

## ✅ Phase 2: Audio-Visual Bridging (COMPLETED)
- ✅ Shared AudioContext via monkey-patching
- ✅ FFT analysis via AnalyserNode
- ✅ Exposed audio parameters to Hydra (a.fft[0-3])
- ✅ Real-time audio-reactive visuals

## ⚡ Phase 3: Window Management & UX (IN PROGRESS)
- ✅ Draggable REPL panel (using react-rnd)
- ✅ Resizable REPL with bounds
- ✅ Minimal UI chrome with status indicators
- ⏳ Persistent window position (localStorage)
- ⏳ Full-screen Hydra mode
- ⏳ REPL keyboard shortcuts

## 🔄 Phase 4: Testing & Refactoring (PLANNED)
- ⏳ Vitest + React Testing Library setup
- ⏳ Unit tests for hooks and services
- ⏳ Component tests for UI
- ⏳ Extract useStrudelEngine hook
- ⏳ Extract useHydraHUD hook
- ⏳ Extract useREPLWindow hook
- ⏳ Create service modules for testability

## 📚 Phase 5: Documentation (IN PROGRESS)
- ✅ ARCHITECTURE.md (comprehensive technical docs)
- ⏳ Updated README.md
- ⏳ API documentation (window.a, window.repl)
- ⏳ CONTRIBUTING.md
- ⏳ Example patterns library

## 🚀 Phase 6: Content & Features (FUTURE)
- ⏳ Pre-loaded demo scripts
- ⏳ Pattern library browser
- ⏳ Save/load workspace state
- ⏳ Export canvas to video
- ⏳ MIDI controller support
- ⏳ Beat detection
- ⏳ Preset management
```

#### 5.5 Create New Documentation (30 min)

**`API.md`** - Document public APIs
```markdown
# Basilisk API Reference

## Global Objects

### `window.repl`
Strudel REPL instance, available after engine starts.

**Methods:**
- `repl.evaluate(code: string)` - Execute Strudel pattern
- `repl.stop()` - Stop all audio

### `window.a`
Hydra audio bridge, available after first code execution.

**Properties:**
- `a.fft: number[]` - Frequency data (0-1 range)
  - `a.fft[0]` - Bass (0-128 Hz)
  - `a.fft[1]` - Low-mid (128-256 Hz)
  - `a.fft[2]` - Mid (256-512 Hz)
  - `a.fft[3]` - High (512+ Hz)

**Methods:**
- `a.setBins(n: number)` - Change number of frequency bands
- `a.tick()` - Manually update FFT data
- `a.disconnect()` - Stop audio analysis

## Hydra Functions

### `initHydra(options?)`
Initialize Hydra visual engine.

**Example:**
await initHydra({ width: window.innerWidth, height: window.innerHeight })

### Audio-Reactive Patterns
Use arrow functions to make Hydra react to audio:
osc(() => a.fft[0] * 10).out()  // Bass-reactive oscillator
```

**`CONTRIBUTING.md`** - Developer guide
```markdown
# Contributing to Basilisk

## Development Setup
1. Fork and clone the repo
2. `npm install`
3. `npm run dev`

## Code Style
- TypeScript strict mode
- Functional React (hooks)
- ESLint + Prettier

## Testing
- Write tests for all new features
- Run `npm test` before committing
- Aim for 80%+ coverage

## Commit Messages
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code restructuring
- test: Test additions

## Pull Requests
1. Create feature branch
2. Write tests
3. Update docs
4. Submit PR with description
```

#### 5.6 Final Documentation Structure
```
basilisk-av/
├── README.md              ← Rewritten, user-facing
├── ARCHITECTURE.md        ← Moved from docs/, technical deep-dive
├── REFACTOR_PLAN.md       ← This file
├── roadmap.md             ← Updated with current progress
├── API.md                 ← NEW: Public API reference
├── CONTRIBUTING.md        ← NEW: Developer guide
└── archive/               ← NEW: Historical docs
    ├── HOW_TO_STRUDEL_HYDRA.md
    ├── INTEGRATION_SUMMARY.md
    └── TESTING_GUIDE.md
```

---

### Benefits of Documentation Cleanup

1. **Single Source of Truth**
   - ARCHITECTURE.md is the definitive technical reference
   - README.md is the user entry point
   - No conflicting information

2. **Developer Onboarding**
   - Clear API documentation
   - Contributing guidelines
   - Current roadmap

3. **Reduced Confusion**
   - No outdated docs misleading developers
   - Historical docs archived but accessible
   - Clear separation of current vs. obsolete

4. **Maintenance**
   - Fewer docs to keep updated
   - Each doc has a clear purpose
   - Easy to find information

---

## Updated Timeline

**Total Estimated Time: 10-14 hours**

1. **Phase 0: Testing Infrastructure** (1-2 hours)
2. **Phase 1: Extract Hooks** (2-4 hours)
3. **Phase 2: Extract Services** (1-2 hours)
4. **Phase 3: Extract Components** (2-3 hours)
5. **Phase 4: Cleanup** (1 hour)
6. **Phase 5: Documentation** (1.5 hours)

---

Would you like to proceed with Phase 0 (testing infrastructure setup)?
