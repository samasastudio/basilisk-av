# Basilisk Roadmap

## Project Timeline

**Project Start**: November 23, 2025
**Current Status**: Phase 5 complete, Phase 6 (UX Polish & Production Mode) is next

---

## ✅ Phase 1: Foundation & Core Integration (COMPLETED)
**Status**: Shipped
**Completed**: November 23-26, 2025

- ✅ Vite + React + TypeScript setup
- ✅ Dark minimalist UI with glassmorphism effects
- ✅ Embedded StrudelRepl with CodeMirror
- ✅ Full-screen Hydra canvas background
- ✅ Basic layout with header and floating REPL panel

---

## ✅ Phase 2: Audio-Visual Bridging (COMPLETED)
**Status**: Shipped
**Completed**: November 26-28, 2025

- ✅ Shared AudioContext via Web Audio API monkey-patching
- ✅ FFT analysis via AnalyserNode
- ✅ Exposed audio parameters to Hydra (`a.fft[0-3]`)
- ✅ Real-time audio-reactive visuals with zero latency
- ✅ Automatic bridge initialization (no user configuration needed)
- ✅ Dev mode HUD showing real-time FFT values

**Technical Achievement**: Successfully intercepted Strudel's internal AudioWorklet connections to route audio through our analyser without modifying Strudel's code. See [ARCHITECTURE.md](ARCHITECTURE.md) for full implementation details.

---

## ✅ Phase 3: Window Management & UX (COMPLETED)
**Status**: Shipped
**Completed**: December 2-4, 2025 (PR #15)

### Completed
- ✅ Draggable REPL panel (using react-rnd)
- ✅ Resizable REPL with min/max bounds
- ✅ Minimal UI chrome with status indicators
- ✅ Glassmorphic design system (backdrop blur, transparency)
- ✅ Active line highlighting in editor
- ✅ Startup text that disappears after first execution
- ✅ Persistent window position and size (localStorage via `usePersistedState`)
- ✅ Decomposed App.tsx into focused UI components (AppHeader, HydraCanvas, REPLWindow)
- ✅ 66% reduction in App.tsx complexity (165 lines → ~60 lines)

### Future Enhancements
- ⏳ Minimize/maximize REPL window
- ⏳ Snap-to-edges for REPL positioning
- ⏳ Multi-monitor support for pop-out window

*Note: Full-screen Hydra mode and keyboard shortcuts moved to Phase 6*

---

## ✅ Phase 4: Testing & Refactoring (COMPLETED)
**Status**: Shipped
**Completed**: December 2-5, 2025 (PR #15, #16)

### Testing Infrastructure
- ✅ Vitest + React Testing Library setup
- ✅ Test configuration (vitest.config.ts)
- ✅ Test setup file with mocks (test/setup.ts, test/mocks.ts)
- ✅ Baseline tests for current behavior (App.baseline.test.tsx)
- ✅ Unit tests for audio bridge (36 tests)
- ✅ Component tests for UI (21+ tests across components)
- ✅ **150 total tests passing** with 0 ESLint errors

### Custom Hooks Extracted
- ✅ `useStrudelEngine()` - Engine initialization and control (17 tests)
- ✅ `useHydraHUD()` - Dev mode FFT visualization (6 tests)
- ✅ `useREPLWindow()` - Window position and resize management (11 tests)
- ✅ `usePersistedState()` - Generic localStorage persistence hook (8 tests)

### Service Modules Extracted
- ✅ `src/services/strudelEngine.ts` - Pure engine functions (16 tests)
- ✅ `src/services/audioBridge.ts` - Bridge abstraction layer (36 tests, including 11 for `initHydraBridge`)

### UI Components Extracted
- ✅ `AppHeader.tsx` - Header with status indicators (21 tests)
- ✅ `HydraCanvas.tsx` - Canvas with startup text and HUD (6 tests)
- ✅ `REPLWindow.tsx` - Rnd wrapper with window management (8 tests)
- ✅ `HydraRepl.tsx` - Code editor with presets

### Code Quality Improvements
- ✅ Removed unused state (`audioContext`, `strudelReplRef`)
- ✅ Implemented EngineStatus state machine (`idle` | `initializing` | `ready` | `error`)
- ✅ Added localStorage persistence for window position and size
- ✅ State machine helper functions (`canStartEngine`, `isEngineReady`, `isEngineInitializing`)
- ✅ DRY principle enforcement across components
- ✅ Comprehensive ESLint configuration (42 rules enforced)

### PR Review Fixes (Post-PR #15)
- ✅ Added `testMode` property to HydraBridge type for test data injection
- ✅ Optimized `usePersistedState` hook (removed useEffect, uses synchronous localStorage writes)
- ✅ Fixed DRY violations (AppHeader now uses `canStartEngine` helper)
- ✅ Added comprehensive tests for `initHydraBridge` function (11 new tests)
- ✅ Fixed test pollution in localStorage-dependent tests

**Achievement**: Reduced App.tsx from 165 lines → 60 lines while achieving **150 passing tests** (exceeded 80% coverage goal)

---

## ✅ Phase 5: Documentation (COMPLETED)
**Status**: Shipped
**Completed**: November 28 - December 3, 2025

### Documentation Files
- ✅ [ARCHITECTURE.md](ARCHITECTURE.md) - Comprehensive technical documentation (588 lines)
- ✅ [README.md](README.md) - User-facing overview and quick start
- ✅ [REFACTOR_PLAN.md](REFACTOR_PLAN.md) - Testing and refactoring strategy
- ✅ [API.md](API.md) - Public API reference (`window.a`, `window.repl`)
- ✅ [CONTRIBUTING.md](CONTRIBUTING.md) - Developer onboarding guide
- ✅ roadmap.md - This file
- ✅ Archived outdated documentation (archive/ folder)

### Future Additions
- ⏳ Example patterns library (searchable, categorized)
- ⏳ Video tutorials / GIFs for README

---

## 🚀 Phase 6: UX Polish & Production Mode (NEXT)
**Status**: Not started

### REPL Theming
- ⏳ Dark mode toggle for REPL editor
- ⏳ Syntax highlighting color schemes (adapts to Hydra visuals)
- ⏳ Custom CodeMirror themes for better readability

### Sound Browser
- ✅ Sound menu showing all loaded Strudel samples
- ✅ Searchable/filterable sound list
- ✅ Preview sounds on click
- ✅ Replace "Test" button with Sound Browser toggle
- ⏳ Layer preview (play samples without stopping current patterns)
- ⏳ Insert sample name into editor on double-click
- ⏳ Display custom user sounds alongside defaults

### Keyboard Shortcuts
- ⏳ Start engine (key command)
- ⏳ Execute code (beyond Shift+Enter)
- ⏳ Halt/stop audio (emergency stop)
- ⏳ Hide/show REPL toggle
- ⏳ Keyboard shortcut help overlay

### Production HUD
- ⏳ Compact analyzer graph per `a.fft` band (4 mini visualizers)
- ⏳ CPU/processing power percentage display
- ⏳ FPS counter
- ⏳ Toggle HUD visibility in production mode
- ⏳ Minimal, non-intrusive design

---

## 📚 Phase 7: Content & Features (FUTURE)
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

---

## 🎵 Phase 8: Advanced Audio Features (FUTURE)
**Status**: Not started

- ⏳ MIDI controller support (Web MIDI API)
- ⏳ Beat detection (onset detection)
- ⏳ Audio input routing (microphone)
- ⏳ Multiple audio sources (mix Strudel + mic)
- ⏳ Waveform visualization (alongside FFT)

---

## ✨ Phase 9: Visual Enhancements (FUTURE)
**Status**: Not started

- ⏳ Multiple Hydra outputs (o0, o1, o2, o3)
- ⏳ Visual preset manager
- ⏳ Shader hot-reloading
- ⏳ Visual effect library browser

---

## ⚡ Phase 10: Performance & Polish (FUTURE)
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

---

## 🌐 Phase 11: Community & Ecosystem (FUTURE)
**Status**: Not started

- ⏳ Real-time collaborative editing (WebRTC)
- ⏳ Share session via link
- ⏳ Spectator mode (view-only)
- ⏳ Example gallery website
- ⏳ User-contributed pattern library
- ⏳ Tutorial series
- ⏳ Discord community
- ⏳ Monthly coding jams / competitions

---

## Timeline Summary

| Phase | Status | Dates |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | Nov 23-26, 2025 |
| Phase 2: Audio-Visual Bridge | ✅ Complete | Nov 26-28, 2025 |
| Phase 3: Window Management | ✅ Complete | Dec 2-4, 2025 |
| Phase 4: Testing & Refactoring | ✅ Complete | Dec 2-5, 2025 |
| Phase 5: Documentation | ✅ Complete | Nov 28 - Dec 3, 2025 |
| Phase 6: UX Polish & Production Mode | 🚀 Next | TBD |
| Phase 7: Content & Features | 💡 Future | TBD |
| Phase 8: Advanced Audio | 💡 Future | TBD |
| Phase 9: Visual Enhancements | 💡 Future | TBD |
| Phase 10: Performance & Polish | 💡 Future | TBD |
| Phase 11: Community | 💡 Future | TBD |

**Total Development Time (Phases 1-5)**: ~2 weeks (Nov 23 - Dec 5, 2025)

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Tests | 150+ |
| ESLint Errors | 0 |
| TypeScript Coverage | 100% |
| App.tsx Reduction | 66% (165 → 60 lines) |
| Custom Hooks | 4 |
| Service Modules | 2 |
| UI Components | 5 major + 4 primitives |
| Documentation Files | 6 |

---

## Contributing

Interested in contributing? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

For technical details on how everything works, read [ARCHITECTURE.md](ARCHITECTURE.md).
