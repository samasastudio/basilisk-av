# Dark Mode Specification

Design reference for Basilisk AV dark mode implementation, inspired by [hydra.ojack.xyz](https://hydra.ojack.xyz).

## Design Philosophy

The **dark mode** prioritizes **transparency** to let Hydra visuals show through UI elements. This creates an immersive live-coding experience where the code floats over the visual output.

The **light mode** (default) preserves the original solid dark REPL appearance for situations where maximum code readability is preferred.

Key principles:
- **Light mode** = Original solid dark REPL (default, best for coding focus)
- **Dark mode** = Semi-transparent glassmorphism (immersive visual experience)
- Muted syntax colors in dark mode to avoid competing with Hydra's palette
- Toggle via sun/moon icon in header

## Theme Semantics

| Theme | Visual Style | Use Case | Default |
|-------|-------------|----------|---------|
| Light | Solid dark REPL, original styling | Coding focus, readability | Yes |
| Dark | Semi-transparent, glassmorphism | Immersive visuals, performance | No |

### Icon Behavior

| Current Theme | Icon Shown | Click Action |
|---------------|------------|--------------|
| Light | Sun ☀️ | Switch to dark mode |
| Dark | Moon 🌙 | Switch to light mode |

## Color Tokens

### Background Colors

| Component | Light Mode (default) | Dark Mode |
|-----------|---------------------|-----------|
| REPL | Original Tailwind (`bg-basilisk-gray-800/50`) | `rgba(0,0,0,0.75)` |
| REPL Header | `bg-basilisk-gray-800/50 border-basilisk-gray-700` | `bg-black/40 border-white/10` |
| Header | Current styling (no change) | `rgba(0,0,0,0.4)` |
| HUD | Current styling | `rgba(0,0,0,0.9)` |

### Border Colors

| Component | Light Mode | Dark Mode |
|-----------|------------|-----------|
| REPL | `border-basilisk-gray-700` | `rgba(255,255,255,0.1)` |
| Header | Current styling | `rgba(255,255,255,0.1)` |

### Text Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary | Current (`text-basilisk-gray-400`) | `#e0e0e0` |
| Secondary | Current | `#a0a0a0` |
| Muted | Current | `#6a737d` |

### Syntax Highlighting (CodeMirror)

Dark mode uses muted colors to not compete with Hydra visuals:

| Token | Dark Mode | Notes |
|-------|-----------|-------|
| Keyword | `#c792ea` | Muted purple |
| String | `#c3e88d` | Muted green |
| Number | `#f78c6c` | Soft orange |
| Comment | `#6a737d` | Gray, italic |
| Function | `#82aaff` | Soft blue |
| Operator | `#89ddff` | Cyan |
| Variable | `#e0e0e0` | Default text |

### Editor Elements (Dark Mode)

| Element | Dark Mode |
|---------|-----------|
| Cursor | `#ffffff` |
| Selection | `rgba(255,255,255,0.15)` |
| Active line | `rgba(255,255,255,0.05)` |
| Gutter | `transparent` |
| Line numbers | `#6a737d` |

## Component Styling Patterns

### ThemeContext Usage

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  // Light = original styling, Dark = glassmorphism
  const containerClass = isLight
    ? 'original-tailwind-classes'
    : 'glassmorphism-classes backdrop-blur-md';

  const containerStyle = isLight
    ? undefined  // No inline styles needed
    : { backgroundColor: 'rgba(0,0,0,0.75)' };

  return (
    <div className={containerClass} style={containerStyle}>
      ...
    </div>
  );
}
```

### Conditional Class Pattern

```tsx
// Light mode: original Tailwind classes
// Dark mode: glassmorphism with inline styles
const isLightTheme = theme === 'light';

const containerClass = isLightTheme
  ? `flex flex-col h-full w-full ${className ?? ''}`
  : `flex flex-col h-full w-full backdrop-blur-md rounded-lg border ${className ?? ''}`;

const containerStyle = isLightTheme
  ? undefined
  : {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    };
```

## CodeMirror Theme Definition

```typescript
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const basiliskDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: '#e0e0e0',
  },
  '.cm-content': {
    caretColor: '#ffffff',
  },
  '.cm-cursor': {
    borderLeftColor: '#ffffff',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: '#6a737d',
    border: 'none',
  },
  '.cm-lineNumbers': {
    color: '#6a737d',
  },
}, { dark: true });

export const basiliskDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#c792ea' },
  { tag: tags.string, color: '#c3e88d' },
  { tag: tags.number, color: '#f78c6c' },
  { tag: tags.comment, color: '#6a737d', fontStyle: 'italic' },
  { tag: tags.function(tags.variableName), color: '#82aaff' },
  { tag: tags.operator, color: '#89ddff' },
  { tag: tags.variableName, color: '#e0e0e0' },
  { tag: tags.propertyName, color: '#e0e0e0' },
  { tag: tags.bool, color: '#ff5370' },
]);

export const basiliskDark = [
  basiliskDarkTheme,
  syntaxHighlighting(basiliskDarkHighlight),
];
```

## CSS Class Structure

```
html.dark                    ← Root class toggle (added when theme === 'dark')
├── .app-header              ← Header component
│   └── .theme-toggle        ← Sun/moon button
├── .repl-container          ← StrudelRepl wrapper
│   └── .cm-editor           ← CodeMirror editor
│       ├── .cm-content
│       ├── .cm-gutters
│       └── .cm-activeLine
└── .hud                     ← HUD component
    └── .fft-visualizer
```

## Implementation Checklist

1. **ThemeContext** (`src/contexts/ThemeContext.tsx`) ✅
   - Create context with `theme` state and `toggleTheme` function
   - Initialize from `localStorage.getItem('basilisk-theme')` or default to `'light'`
   - Persist to localStorage on change
   - Add `dark` class to `document.documentElement` when theme is dark

2. **Toggle Button** (`src/components/AppHeader.tsx`) ✅
   - Import sun/moon icons (inline SVG)
   - Show sun icon in light mode (click to go dark)
   - Show moon icon in dark mode (click to go light)
   - Add tooltip: "Switch to dark/light mode"

3. **REPL Background** (`src/components/StrudelRepl.tsx`) ✅
   - Use `useTheme()` to get current theme
   - Light mode: original Tailwind classes, no inline styles
   - Dark mode: glassmorphism with `rgba(0,0,0,0.75)` background
   - Dark mode only: `backdrop-filter: blur(12px)`, rounded corners

4. **CodeMirror Theme** (`src/themes/codemirrorDark.ts`) ⏳
   - Export theme extension for dark mode
   - Apply conditionally based on theme context
   - May need to reconfigure Strudel's editor on theme change

5. **Header Adaptation** (`src/components/AppHeader.tsx`) ⏳
   - Light mode: retain current styling
   - Dark mode: conditional background/border colors with transparency
   - Ensure button icons visible in both modes

6. **HUD Styling** (`src/components/Hud.tsx`) ⏳
   - Light mode: retain current styling
   - Dark mode: higher opacity (90%) for readability, muted text color

7. **CSS Fallbacks** (`src/styles/dark-mode.css`) ⏳
   - Override any Strudel components that don't accept theme props
   - Target `.dark .strudel-*` selectors

## Playwright MCP Verification Patterns

Each verification step maps to a Playwright MCP operation:

| Verification Step | Playwright MCP Pattern |
|-------------------|------------------------|
| "X visible in Y" | `browser_snapshot` → check accessibility tree |
| "Click toggles between themes" | `browser_click` → `browser_snapshot` |
| "Theme persists after reload" | `browser_evaluate(localStorage)` → `browser_navigate` → verify |
| "rgba(x,x,x,x) background" | `browser_evaluate(getComputedStyle(el).background)` |
| "X uses color Y" | `browser_evaluate(getComputedStyle)` |

## References

- [hydra.ojack.xyz](https://hydra.ojack.xyz) - Visual inspiration
- [CodeMirror 6 Themes](https://codemirror.net/examples/styling/) - Theme API
- [Material Palenight](https://github.com/material-theme/vsc-material-theme) - Color palette reference
