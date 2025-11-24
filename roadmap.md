# Basilisk Roadmap

## Phase 1: Foundation & Core Integration
- **Goal**: Establish the React environment and basic integration of Strudel and Hydra.
- **Features**:
    - [ ] Vite + React Setup with TypeScript.
    - [ ] Basic Layout with "Dark Postmodern" aesthetic.
    - [ ] Embedded Strudel REPL (Read-Eval-Print Loop).
    - [ ] Embedded Hydra Canvas.

## Phase 2: Audio-Visual Bridging
- **Goal**: Connect the audio output from Strudel to the visual input of Hydra.
- **Features**:
    - [ ] Audio Context management.
    - [ ] FFT / Waveform analysis of Strudel output.
    - [ ] Exposing audio parameters to Hydra (`a.fft`, `a.vol`, etc.).

## Phase 3: Window Management & UX
- **Goal**: Implement the pop-out functionality and refine the user interface.
- **Features**:
    - [ ] Detachable Hydra window (using `window.open` and portal rendering or canvas stream transfer).
    - [ ] Resizable panes for code editing.
    - [ ] "Postmodern" terminal styling (crt effects, glowing text, minimal chrome).

## Phase 4: Content & Polish
- **Goal**: Add default content and ensure a smooth user experience.
- **Features**:
    - [ ] Pre-loaded demo scripts for Strudel and Hydra.
    - [ ] Documentation / Help overlay.
    - [ ] Performance optimization.
