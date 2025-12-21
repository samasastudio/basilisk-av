# Dark Mode Specification

Design reference for Basilisk AV dark mode implementation, inspired by [hydra.ojack.xyz](https://hydra.ojack.xyz).

## Design Philosophy

The dark mode prioritizes **transparency** to let Hydra visuals show through UI elements. This creates an immersive live-coding experience where the code floats over the visual output.

Key principles:
- Semi-transparent backgrounds (75% black for REPL)
- Muted syntax colors to avoid competing with Hydra's palette
- Solid backgrounds only where readability is critical (HUD: 90% black)
- Dark as default theme (matches basilisk aesthetic)

## Color Tokens

### Background Colors

| Component | Dark Mode | Light Mode |
|-----------|-----------|------------|
| REPL | `rgba(0,0,0,0.75)` | `rgba(255,255,255,0.85)` |
| Header | `rgba(0,0,0,0.4)` | `rgba(255,255,255,0.85)` |
| HUD | `rgba(0,0,0,0.9)` | `rgba(255,255,255,0.9)` |

### Border Colors

| Component | Dark Mode | Light Mode |
|-----------|-----------|------------|
| REPL | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` |
| Header | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` |

### Text Colors

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Primary | `#e0e0e0` | `#1a1a1a` |
| Secondary | `#a0a0a0` | `#666666` |
| Muted | `#6a737d` | `#999999` |

### Syntax Highlighting (CodeMirror)

| Token | Dark Mode | Notes |
|-------|-----------|-------|
| Keyword | `#c792ea` | Muted purple |
| String | `#c3e88d` | Muted green |
| Number | `#f78c6c` | Soft orange |
| Comment | `#6a737d` | Gray, italic |
| Function | `#82aaff` | Soft blue |
| Operator | `#89ddff` | Cyan |
| Variable | `#e0e0e0` | Default text |

### Editor Elements

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Cursor | `#ffffff` | `#000000` |
| Selection | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.15)` |
| Active line | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.05)` |
| Gutter | `transparent` | `transparent` |
| Line numbers | `#6a737d` | `#999999` |

## Component Styling Patterns

### ThemeContext Usage

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
      color: isDark ? '#e0e0e0' : '#1a1a1a'
    }}>
      ...
    </div>
  );
}
```

### CSS Class Pattern

```css
/* Base styles (light mode) */
.repl-container {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
}

/* Dark mode overrides */
.dark .repl-container {
  background: rgba(0, 0, 0, 0.75);
  border-color: rgba(255, 255, 255, 0.1);
}
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
html.dark                    ← Root class toggle
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

1. **ThemeContext** (`src/contexts/ThemeContext.tsx`)
   - Create context with `theme` state and `toggleTheme` function
   - Initialize from `localStorage.getItem('basilisk-theme')` or default to `'dark'`
   - Persist to localStorage on change
   - Add `dark` class to `document.documentElement` when theme is dark

2. **Toggle Button** (`src/components/AppHeader.tsx`)
   - Import sun/moon icons (lucide-react or similar)
   - Show sun icon in dark mode (click to go light)
   - Show moon icon in light mode (click to go dark)
   - Add tooltip: "Switch to light/dark mode"

3. **REPL Background** (`src/components/StrudelRepl.tsx`)
   - Use `useTheme()` to get current theme
   - Apply conditional background color
   - Ensure `backdrop-filter: blur(12px)` in both modes

4. **CodeMirror Theme** (`src/themes/codemirrorDark.ts`)
   - Export theme extension
   - Apply conditionally based on theme context
   - May need to reconfigure Strudel's editor on theme change

5. **Header Adaptation** (`src/components/AppHeader.tsx`)
   - Conditional background/border colors
   - Ensure button icons visible in both modes

6. **HUD Styling** (`src/components/Hud.tsx`)
   - Higher opacity (90%) for production readability
   - Muted text color in dark mode

7. **CSS Fallbacks** (`src/styles/dark-mode.css`)
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
