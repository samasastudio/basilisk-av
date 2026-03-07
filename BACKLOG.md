# Basilisk AV — Feature Backlog

A flat, flexible inventory of features organized by domain. Pick what excites you.

---

## 🔥 Up Next

### MIDI I/O
Full MIDI integration for hardware control and DAW communication:
- Receive MIDI CC/notes from controllers
- Send MIDI to external apps (Ableton Live, etc.)
- MIDI clock sync (send/receive)
- MIDI learn for parameter mapping

### Fullscreen REPL
Expand REPL to fill viewport:
- Toggle button or shortcut
- Hide header when fullscreen
- Quick exit (Esc)

### Multi-Window / External Display
Pop Hydra canvas to separate window:
- REPL on one monitor, visuals on another
- Window communication for sync
- Fullscreen visuals window option

---

## ✅ Shipped

Core platform is functional:
- Vite + React + TypeScript foundation
- Strudel REPL with CodeMirror
- Full-screen Hydra canvas
- Audio-visual bridge (`a.fft[0-3]`)
- Draggable/resizable REPL panel
- Window position persistence
- Sound Browser (Strudel samples)
- User Library (personal samples)
- 150+ tests, clean ESLint
- Inline Strudel visualizations (`_pianoroll`, `_punchcard`, `_spiral`, `_scope`, `_spectrum`)
- Environment auto-load (default script + sound library via env vars)
- Dark mode (system toggle, persisted preference, OS default)

---

## 🎹 Keyboard & Controls

Essential shortcuts for live performance.

| Feature | Description | Why |
|---------|-------------|-----|
| **Emergency halt** | Stop all audio instantly (Esc or Ctrl+.) | Safety-critical for live |
| **Hide REPL** | Toggle REPL visibility | Clean visuals for performance |
| **Start engine** | Keyboard shortcut to init audio | Hands-free startup |
| **Shortcut help** | Overlay showing all shortcuts | Discoverability |

---

## ✅ Sound Browser (Shipped)

Browse and insert Strudel's built-in samples.

- Sample list with categories
- Real-time search
- Click to preview
- Double-click to insert
- Header toggle button

---

## ✅ User Library (Shipped)

Browse your own sample directories.

- SamplePanel shared component
- Header button with waveform icon
- Directory tree panel
- File System Access API linking
- Click to preview
- Double-click to insert
- Search across directories
- Panel exclusivity (one browser at a time)

---

## 📊 Performance HUD

Monitoring tools for development and debugging.

| Feature | Description |
|---------|-------------|
| **FFT bands** | 4 mini visualizers for `a.fft[0-3]` |
| **FPS counter** | Frame rate with low-FPS warning |
| **CPU meter** | Processing load percentage |
| **HUD toggle** | Show/hide entire HUD |
| **HUD styling** | Glassmorphism, non-intrusive |

---

## 🎨 Editor Theming

Customize the REPL appearance.

| Feature | Description |
|---------|-------------|
| **Dark/light toggle** | Switch editor theme |
| **Syntax theme** | Colors that don't clash with Hydra |

---

## 💾 Workspace

Save and manage your work.

| Feature | Description |
|---------|-------------|
| **Auto-save** | Draft to localStorage |
| **Save/load** | Full workspace state |
| **Multiple tabs** | Work on several patterns |
| **Session history** | Undo/redo executed code |

---

## 📚 Pattern Library

Discover and share patterns.

| Feature | Description |
|---------|-------------|
| **Demo scripts** | Pre-loaded examples in UI |
| **Pattern browser** | Searchable example library |
| **Visual presets** | Gallery of Hydra effects |
| **Import/export** | Share code snippets |

---

## 🎬 Recording & Export

Capture your performances.

| Feature | Description |
|---------|-------------|
| **Video export** | Canvas to MP4 (MediaRecorder) |
| **Audio export** | Pattern to WAV |
| **Screenshot** | Capture Hydra frame |
| **Share URL** | Encode workspace in URL |

---

## 🎛️ Advanced Audio

Extended audio capabilities.

| Feature | Description |
|---------|-------------|
| **Beat detection** | Onset detection for sync |
| **Mic input** | Route microphone to visuals |
| **Waveform viz** | Oscilloscope alongside FFT |
| **Multiple sources** | Mix Strudel + mic + external |

---

## ✨ Visual Enhancements

Advanced Hydra features.

| Feature | Description |
|---------|-------------|
| **Multi-output** | Use o0, o1, o2, o3 |
| **Preset manager** | Save/load visual presets |
| **Shader hot-reload** | Edit shaders live |

---

## ⚡ Performance

Optimization for smooth playback.

| Feature | Description |
|---------|-------------|
| **Lazy load samples** | Load Strudel sounds on demand |
| **Code splitting** | Chunk Hydra separately |
| **Adaptive FFT** | Reduce rate when FPS drops |
| **Resolution scaling** | Lower canvas res on slow devices |

---

## 🪟 Window Management

REPL panel improvements.

| Feature | Description |
|---------|-------------|
| **Minimize/maximize** | Collapse REPL to title bar |
| **Snap to edges** | Magnetic positioning |

---

## ♿ Accessibility

Make Basilisk usable by everyone.

| Feature | Description |
|---------|-------------|
| **Keyboard navigation** | Tab through all controls |
| **Screen reader** | ARIA labels |
| **High contrast** | Accessibility mode |
| **Reduced motion** | Disable animations |

---

## 🌐 Community (Someday)

Social and collaborative features.

| Feature | Description |
|---------|-------------|
| **Live collab** | Real-time editing (WebRTC) |
| **Share session** | Invite link |
| **Spectator mode** | View-only access |
| **Gallery site** | Public pattern showcase |
| **User contributions** | Submit to pattern library |

---

## Quick Reference

**Priority (Up Next section):**
- MIDI I/O
- Fullscreen REPL
- Multi-window display

**Ready to build now (no dependencies):**
- Emergency halt shortcut
- Hide REPL shortcut
- Start engine shortcut
- FFT bands HUD
- FPS counter

**Quick wins:**
- Keyboard shortcuts (small, self-contained)
- HUD components (isolated)
- Fullscreen REPL (layout-focused)
