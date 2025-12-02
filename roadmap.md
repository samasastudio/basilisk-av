# Basilisk Roadmap

## ✅ Phase 1: Foundation & Core Integration (COMPLETED)
**Status**: Shipped

- ✅ Vite + React + TypeScript setup
- ✅ Dark minimalist UI with glassmorphism effects
- ✅ Embedded StrudelRepl with CodeMirror
- ✅ Full-screen Hydra canvas background
- ✅ Basic layout with header and floating REPL panel

## ✅ Phase 2: Audio-Visual Bridging (COMPLETED)
**Status**: Shipped

- ✅ Shared AudioContext via Web Audio API monkey-patching
- ✅ FFT analysis via AnalyserNode
- ✅ Exposed audio parameters to Hydra (`a.fft[0-3]`)
- ✅ Real-time audio-reactive visuals with zero latency
- ✅ Automatic bridge initialization (no user configuration needed)
- ✅ Dev mode HUD showing real-time FFT values

**Technical Achievement**: Successfully intercepted Strudel's internal AudioWorklet connections to route audio through our analyser without modifying Strudel's code. See [ARCHITECTURE.md](ARCHITECTURE.md) for full implementation details.

## ⚡ Phase 3: Window Management & UX (IN PROGRESS)
**Status**: Partially complete

### Completed
- ✅ Draggable REPL panel (using react-rnd)
- ✅ Resizable REPL with min/max bounds
- ✅ Minimal UI chrome with status indicators
- ✅ Glassmorphic design system (backdrop blur, transparency)
- ✅ Active line highlighting in editor
- ✅ Startup text that disappears after first execution

### Planned
- ⏳ Persistent window position (localStorage)
- ⏳ Full-screen Hydra mode (hide REPL)
- ⏳ REPL keyboard shortcuts (beyond Shift+Enter)
- ⏳ Minimize/maximize REPL window
- ⏳ Snap-to-edges for REPL positioning
- ⏳ Multi-monitor support for pop-out window

## 🧪 Phase 4: Testing & Refactoring (PLANNED)
**Status**: Not started (see [REFACTOR_PLAN.md](REFACTOR_PLAN.md))

### Phase 0: Testing Infrastructure
- ⏳ Vitest + React Testing Library setup
- ⏳ Test configuration (vitest.config.ts)
- ⏳ Test setup file with mocks
- ⏳ Baseline tests for current behavior
- ⏳ Unit tests for audio bridge
- ⏳ Component tests for UI

### Phase 1: Extract Custom Hooks
- ⏳ `useStrudelEngine()` - Engine initialization and control
- ⏳ `useHydraHUD()` - Dev mode FFT visualization
- ⏳ `useREPLWindow()` - Window position and resize management

### Phase 2: Extract Service Modules
- ⏳ `src/services/strudelEngine.ts` - Pure engine functions
- ⏳ `src/services/audioBridge.ts` - Bridge abstraction layer

### Phase 3: Extract UI Components
- ⏳ `AppHeader.tsx` - Header with status indicators
- ⏳ `HydraCanvas.tsx` - Canvas with startup text and HUD
- ⏳ `REPLWindow.tsx` - Rnd wrapper with window management

### Phase 4: Code Cleanup
- ⏳ Remove unused state (`audioContext`, `strudelReplRef`)
- ⏳ Simplify state management with state machines
- ⏳ Add localStorage persistence for window position

**Goal**: Reduce App.tsx from 165 lines → 50-60 lines of clean composition while achieving 80%+ test coverage.

**Estimated Time**: 8-12 hours total

## 📚 Phase 5: Documentation (IN PROGRESS)
**Status**: Partially complete

### Completed
- ✅ ARCHITECTURE.md (comprehensive technical documentation)
- ✅ REFACTOR_PLAN.md (testing and refactoring strategy)
- ✅ Updated README.md with current features
- ✅ Updated roadmap.md (this file)
- ✅ Archived outdated documentation

### Planned
- ⏳ API.md - Public API reference (window.a, window.repl)
- ⏳ CONTRIBUTING.md - Developer onboarding guide
- ⏳ Example patterns library (markdown file with code snippets)
- ⏳ Video tutorials / GIFs for README

## 🚀 Phase 6: Content & Features (FUTURE)
**Status**: Not started

### Code Library & Presets
- ⏳ Pre-loaded demo scripts (accessible via UI)
- ⏳ Pattern library browser (searchable examples)
- ⏳ Visual preset gallery
- ⏳ Import/export code snippets

### Workspace Management
- ⏳ Save/load workspace state (code + window position)
- ⏳ Multiple workspace tabs
- ⏳ Session history (undo/redo for executed code)
- ⏳ Auto-save drafts to localStorage

### Export & Recording
- ⏳ Export canvas to video (MediaRecorder API)
- ⏳ Export audio to WAV
- ⏳ Screenshot Hydra canvas
- ⏳ Share workspace via URL (encode in query params)

### Advanced Audio Features
- ⏳ MIDI controller support (Web MIDI API)
- ⏳ Beat detection (onset detection)
- ⏳ Audio input routing (microphone)
- ⏳ Multiple audio sources (mix Strudel + mic)
- ⏳ Waveform visualization (alongside FFT)

### Visual Enhancements
- ⏳ Multiple Hydra outputs (o0, o1, o2, o3)
- ⏳ Visual preset manager
- ⏳ Shader hot-reloading
- ⏳ Visual effect library browser

### Collaboration Features
- ⏳ Real-time collaborative editing (WebRTC)
- ⏳ Share session via link
- ⏳ Spectator mode (view-only)

## 🔬 Phase 7: Performance & Polish (FUTURE)
**Status**: Not started

### Performance Optimization
- ⏳ Lazy load Strudel samples
- ⏳ Code splitting for Hydra
- ⏳ Optimize FFT update rate (adaptive based on FPS)
- ⏳ Worker threads for heavy computations
- ⏳ Canvas resolution scaling for low-end devices

### Accessibility
- ⏳ Keyboard navigation for all controls
- ⏳ Screen reader support
- ⏳ High contrast mode
- ⏳ Reduced motion mode (disable animations)

### Error Handling
- ⏳ Better error messages for Strudel syntax errors
- ⏳ Visual error indicators in editor
- ⏳ Fallback UI for broken Hydra code
- ⏳ Recovery from AudioContext suspension

## 🌐 Phase 8: Community & Ecosystem (FUTURE)
**Status**: Not started

- ⏳ Example gallery website
- ⏳ User-contributed pattern library
- ⏳ Tutorial series
- ⏳ Discord community
- ⏳ Monthly coding jams / competitions

---

## Timeline

| Phase | Status | Estimated Completion |
|-------|--------|---------------------|
| Phase 1 | ✅ Complete | Q4 2024 |
| Phase 2 | ✅ Complete | Q4 2024 |
| Phase 3 | ⚡ In Progress | Q1 2025 |
| Phase 4 | 📋 Planned | Q1 2025 |
| Phase 5 | ⚡ In Progress | Q1 2025 |
| Phase 6 | 💡 Future | Q2 2025 |
| Phase 7 | 💡 Future | Q3 2025 |
| Phase 8 | 💡 Future | Q4 2025 |

---

## Contributing

Interested in contributing? See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon) for guidelines.

For technical details on how everything works, read [ARCHITECTURE.md](ARCHITECTURE.md).
