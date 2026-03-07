# Fullscreen REPL Specification

## Overview

Expand the REPL editor to fill the viewport for focused coding sessions. Hydra visuals continue running behind the editor (glassmorphism overlay), and the AppHeader compacts to a minimal bar with essential controls only.

## User Flows

### Flow 1: Enter Fullscreen from Floating REPL

1. User is working in the standard draggable/resizable REPL
2. User clicks the **expand button** (↗ icon) in the REPL toolbar — OR — presses **Ctrl+Shift+F**
3. REPL animates to fill the viewport (below the compact header)
4. AppHeader collapses to a slim bar: status indicator + theme toggle + collapse button
5. Hydra canvas continues rendering behind the semi-transparent REPL
6. Sound browser / user library panels remain functional within the fullscreen layout

### Flow 2: Exit Fullscreen

1. User presses **Escape** — OR — clicks the **collapse button** (↙ icon) in the REPL toolbar — OR — presses **Ctrl+Shift+F** again
2. REPL animates back to its previous floating position and size
3. AppHeader restores to its full layout
4. All editor state (code, cursor position, scroll) is preserved

### Flow 3: Toggle REPL Visibility While Fullscreen

1. User is in fullscreen REPL mode
2. User presses **Ctrl+H** (existing hide REPL shortcut)
3. REPL hides, fullscreen mode is exited, AppHeader restores
4. Pressing **Ctrl+H** again shows the REPL in its previous mode (floating, not fullscreen)

### Flow 4: First Launch / Persistence

1. User enters fullscreen mode, then closes the browser
2. On next visit, REPL opens in fullscreen mode (preference persisted to localStorage)
3. Floating position/size are also preserved separately for when user exits fullscreen

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Toggle fullscreen via button in REPL toolbar | Must |
| FR-2 | Toggle fullscreen via keyboard shortcut (Ctrl+Shift+F) | Must |
| FR-3 | Exit fullscreen via Escape key | Must |
| FR-4 | Hydra canvas continues rendering behind fullscreen REPL | Must |
| FR-5 | AppHeader compacts to slim bar in fullscreen mode | Must |
| FR-6 | Compact header shows: status indicator, theme toggle, exit-fullscreen button | Must |
| FR-7 | Sound browser and user library panels work in fullscreen layout | Must |
| FR-8 | Preserve editor state (code, cursor, scroll) across mode transitions | Must |
| FR-9 | Persist fullscreen preference to localStorage | Should |
| FR-10 | Restore previous floating position/size when exiting fullscreen | Must |
| FR-11 | Ctrl+H hides REPL and exits fullscreen simultaneously | Should |
| FR-12 | Smooth CSS transition when entering/exiting fullscreen | Should |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Mode transition completes in under 300ms | Should |
| NFR-2 | No Hydra frame drops during transition | Must |
| NFR-3 | Fullscreen REPL maintains glassmorphism styling (85% opacity, backdrop blur) | Must |
| NFR-4 | Keyboard shortcuts do not conflict with CodeMirror bindings | Must |
| NFR-5 | Accessible: fullscreen toggle has ARIA label and keyboard focus | Should |

[Technical Design — to be written]

[Implementation Tasks — to be written]

[Test Matrix — to be written]
