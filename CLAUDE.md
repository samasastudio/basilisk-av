# Basilisk AV

Audio-visual live-coding platform combining Strudel (algorithmic music) with Hydra (visual synthesis).

## Quick Context

- **Stack**: Vite + React + TypeScript
- **Audio**: Strudel REPL with CodeMirror
- **Visuals**: Hydra canvas with FFT reactivity via `a.fft[0-3]`
- **Style**: Tailwind + glassmorphism (85% opacity, backdrop blur)

## Code Conventions

- Functional programming — no mutation or recursion (except in reduce accumulators)
- TypeScript strict mode
- Services in `src/services/`, hooks in `src/hooks/`, components in `src/components/`

## React Patterns

### useEffect: Think Twice

Effects are an escape hatch for synchronizing with **external systems** (browser APIs, third-party widgets, network). Most other uses are wrong.

**You probably don't need useEffect for:**
- Transforming data for rendering → Calculate during render instead
- Handling user events → Use event handlers
- Resetting state when props change → Use `key` prop to remount
- Updating state based on other state → Derive it during render
- Notifying parent of state changes → Call parent's callback in event handler

**Legitimate useEffect uses:**
- Synchronizing with external APIs (Web Audio, MIDI, WebSocket)
- Subscriptions to external stores (use `useSyncExternalStore` when possible)
- Analytics on component mount
- Data fetching (with cleanup to avoid race conditions)

```typescript
// ❌ Bad: Derived state in effect
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ Good: Calculate during render
const fullName = firstName + ' ' + lastName;
```

### State & Re-renders: Be Intentional

Every `setState` triggers a re-render. Think critically about state structure.

**Principles:**
- **Derive don't store** — If computable from existing state/props, don't add new state
- **Lift state up** — When syncing state between components, move it to common ancestor
- **Use `useMemo`** — For expensive calculations that shouldn't run on every render
- **Colocate state** — Keep state as close to where it's used as possible
- **Batch updates** — Multiple setState calls in event handlers are batched automatically

```typescript
// ❌ Bad: Redundant state that must stay in sync
const [items, setItems] = useState([]);
const [selectedItem, setSelectedItem] = useState(null);
useEffect(() => {
  // Must clear selection when items change
  setSelectedItem(null);
}, [items]);

// ✅ Good: Store ID, derive the object
const [items, setItems] = useState([]);
const [selectedId, setSelectedId] = useState(null);
const selectedItem = items.find(item => item.id === selectedId) ?? null;
```

**Questions before adding state:**
1. Can this be calculated from existing props/state?
2. Does this cause unnecessary re-renders in child components?
3. Should this state live higher in the tree?
4. Is this duplicating data that exists elsewhere?

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/patchSuperdough.ts` | Audio routing interceptor — loads before Strudel |
| `src/utils/strudelHydraBridge.ts` | FFT bridge exposing `a.fft[0-3]` to Hydra |
| `src/hooks/useStrudelEngine.ts` | Engine lifecycle management |
| `BACKLOG.md` | Feature inventory with priorities |
| `docs/ARCHITECTURE.md` | Technical deep-dive |

## Audio-Visual Bridge

```javascript
// Hydra visuals react to Strudel audio
osc(10, 0.1, () => a.fft[0] * 2)  // Bass-reactive
  .rotate(() => a.fft[1])          // Mid-reactive rotation
  .out()

s("bd sd, hh*8")  // Strudel pattern
```

| Band | Frequency | Use |
|------|-----------|-----|
| `a.fft[0]` | 0-128 Hz | Bass, kicks |
| `a.fft[1]` | 128-256 Hz | Snares, toms |
| `a.fft[2]` | 256-512 Hz | Vocals, synths |
| `a.fft[3]` | 512+ Hz | Hi-hats, cymbals |

## Current Priorities

1. **Strudel inline visuals** — `_pianoroll()`, `_punchcard()`, `_spiral()`, etc.
2. **MIDI I/O** — Controller input, Ableton integration
3. **Multi-window** — Hydra canvas on external display
4. **ENV auto-load** — Sample directory and startup script from environment
5. **Dark mode** — System-wide theme toggle
6. **Fullscreen REPL** — Expand editor to viewport

See `BACKLOG.md` for full feature inventory.

## Testing

```bash
npm test           # Vitest unit tests (150+)
npm run build      # Verify production build
npm run lint       # ESLint check
```

## Aesthetic: Algorithmic Minimalism

- Monochrome UI contrasting with Hydra's color palette
- Meditative, slow motion
- Tight audio-visual coupling
- Influences: Four Tet, OPN, Autechre, Eno, Tycho, BoC
