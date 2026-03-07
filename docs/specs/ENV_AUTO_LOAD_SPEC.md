# Environment-Based Auto-Load Specification

## Overview

This specification defines two environment variables that enable automatic loading of a startup script and default sound library when Basilisk AV launches. This feature improves developer workflow by eliminating repetitive manual setup steps for consistent development environments.

| Variable | Purpose | Type |
|----------|---------|------|
| `VITE_DEFAULT_SCRIPT` | Path to Strudel script file | URL or public path |
| `VITE_DEFAULT_SOUND_LIBRARY` | Path to sound library directory | URL or public path |

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | When `VITE_DEFAULT_SCRIPT` is set, load the script into the REPL on startup | Must |
| FR-2 | When `VITE_DEFAULT_SCRIPT` is not set, REPL shows empty or default code | Must |
| FR-3 | When `VITE_DEFAULT_SOUND_LIBRARY` is set, auto-register samples on engine ready | Must |
| FR-4 | When `VITE_DEFAULT_SOUND_LIBRARY` is not set, no library is pre-loaded | Must |
| FR-5 | Display loading state while fetching script or scanning library | Should |
| FR-6 | Display error state if script fetch or library load fails | Must |
| FR-7 | Both environment variables work independently | Must |
| FR-8 | User can still manually load different scripts/libraries after auto-load | Must |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Script fetch should complete within 5 seconds or timeout | Should |
| NFR-2 | Library loading should not block REPL interaction | Must |
| NFR-3 | Environment variables follow Vite naming convention (`VITE_` prefix) | Must |
| NFR-4 | Configuration is documented in README | Should |

## Technical Design

### Environment Variable Strategy

Vite exposes environment variables via `import.meta.env`. Variables must be prefixed with `VITE_` to be included in the client bundle.

```
# .env or .env.local
VITE_DEFAULT_SCRIPT=/scripts/startup.js
VITE_DEFAULT_SOUND_LIBRARY=https://cdn.example.com/samples
```

**Path Resolution:**
- Relative paths (e.g., `/scripts/startup.js`) resolve to Vite's `public/` directory
- Absolute URLs (e.g., `https://...`) are fetched directly
- File system paths are NOT supported (browser security restriction)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          .env File                               │
│  VITE_DEFAULT_SCRIPT=/scripts/startup.js                        │
│  VITE_DEFAULT_SOUND_LIBRARY=https://cdn.example.com/samples     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Vite Build                                │
│  import.meta.env.VITE_DEFAULT_SCRIPT                            │
│  import.meta.env.VITE_DEFAULT_SOUND_LIBRARY                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
        ┌───────────────────┐   ┌───────────────────────┐
        │  useDefaultScript │   │ useDefaultSoundLibrary│
        │       Hook        │   │         Hook          │
        └─────────┬─────────┘   └───────────┬───────────┘
                  │                         │
                  ▼                         ▼
        ┌───────────────────┐   ┌───────────────────────┐
        │   StrudelRepl     │   │    useUserLibrary     │
        │  (initial code)   │   │   (auto-register)     │
        └───────────────────┘   └───────────────────────┘
```

### Data Flow: Default Script

```
┌──────────┐    ┌──────────────────┐    ┌───────────────┐    ┌────────────┐
│  App.tsx │───▶│ useDefaultScript │───▶│ fetch(script) │───▶│ StrudelRepl│
│  mount   │    │                  │    │               │    │ setCode()  │
└──────────┘    └──────────────────┘    └───────────────┘    └────────────┘
                        │
                        ├── loading: true
                        ├── error: null | string
                        └── content: string | null
```

### Data Flow: Default Sound Library

```
┌──────────┐    ┌─────────────────────────┐    ┌────────────────┐    ┌──────────────┐
│  App.tsx │───▶│ useDefaultSoundLibrary  │───▶│ CDN fetch      │───▶│ useUserLibrary│
│  mount   │    │ (immediate on mount)    │    │ samples.json   │    │              │
└──────────┘    └─────────────────────────┘    └────────────────┘    └──────┬───────┘
                                                                           │
                                                          ┌────────────────┘
                                                          ▼
                                               ┌──────────────────────┐
                                               │ Sample Registration  │
                                               │ (waits for engine)   │
                                               └──────────────────────┘
```

### New Hook: `useDefaultScript`

Uses TanStack Query (already configured in App.tsx) for clean data fetching without manual useEffect.

```typescript
// src/hooks/useDefaultScript.ts

import { useQuery } from '@tanstack/react-query';

interface UseDefaultScriptReturn {
  /** Script content if loaded successfully */
  content: string | null;
  /** Whether script is currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Path/URL of the script (for display) */
  source: string | null;
}

/**
 * Fetch script content from a URL/path.
 * Throws on HTTP errors for React Query to handle.
 */
const fetchScript = async (scriptPath: string): Promise<string> => {
  const response = await fetch(scriptPath);

  if (!response.ok) {
    throw new Error(`Failed to load script: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

/**
 * Hook to load a default script from environment variable.
 * Uses TanStack Query for caching, loading states, and automatic cleanup.
 * 
 * @returns Script content, loading state, and error state
 * 
 * @example
 * // In .env: VITE_DEFAULT_SCRIPT=/scripts/startup.js
 * const { content, isLoading, error } = useDefaultScript();
 */
export const useDefaultScript = (): UseDefaultScriptReturn => {
  const scriptPath = import.meta.env.VITE_DEFAULT_SCRIPT as string | undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ['defaultScript', scriptPath],
    queryFn: () => fetchScript(scriptPath!),
    enabled: Boolean(scriptPath),
    staleTime: Infinity,  // Never refetch - script doesn't change
    gcTime: Infinity,     // Keep cached forever
    retry: false,         // Don't retry on failure
  });

  return {
    content: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    source: scriptPath ?? null,
  };
};
```

**Why TanStack Query?**
- No manual `useState` or `useEffect`
- Automatic request cancellation on unmount
- Built-in caching (won't refetch on remount)
- Consistent loading/error state handling
- Already configured in App.tsx with `QueryClientProvider`

### New Hook: `useDefaultSoundLibrary`

Uses lazy initialization with a ref to avoid useEffect. The `linkCDN` function already manages
its own loading/error state in `useUserLibrary`, so we just need to trigger it once.

```typescript
// src/hooks/useDefaultSoundLibrary.ts

import { useRef } from 'react';

import type { UseUserLibraryReturn } from './useUserLibrary';

interface UseDefaultSoundLibraryReturn {
  /** Base URL of the library (for display) */
  libraryUrl: string | null;
  /** Whether library is configured via env */
  isConfigured: boolean;
  /** Whether library is currently being loaded */
  isLoading: boolean;
  /** Error message if load failed */
  error: string | null;
  /** Number of samples registered */
  registeredCount: number;
  /** Whether registration is complete */
  isRegistered: boolean;
}

/**
 * Hook to auto-load a sound library from environment variable.
 * 
 * Uses lazy initialization pattern - triggers linkCDN on first render when conditions are met.
 * No useEffect needed because:
 * - linkCDN manages its own loading/error state in useUserLibrary
 * - ref tracks whether we've attempted load (survives re-renders)
 * - Sample registration is handled by useUserLibrary when engine becomes ready
 * 
 * @param userLibrary - The useUserLibrary return object
 * @returns Loading/registration state (delegated to useUserLibrary)
 */
export const useDefaultSoundLibrary = (
  userLibrary: UseUserLibraryReturn
): UseDefaultSoundLibraryReturn => {
  const hasAttemptedLoad = useRef(false);
  const libraryUrl = import.meta.env.VITE_DEFAULT_SOUND_LIBRARY as string | undefined;

  // Lazy initialization: trigger on first render if conditions met
  // This runs during render (not in an effect) - safe because linkCDN is async
  // and doesn't directly update this component's state
  if (
    libraryUrl &&
    !hasAttemptedLoad.current &&
    userLibrary.source === null
  ) {
    hasAttemptedLoad.current = true;
    void userLibrary.linkCDN(libraryUrl);
  }

  return {
    libraryUrl: libraryUrl ?? null,
    isConfigured: Boolean(libraryUrl),
    isLoading: userLibrary.isLoading,
    error: userLibrary.error,
    registeredCount: userLibrary.registeredCount,
    isRegistered: userLibrary.isRegistered,
  };
};
```

**Why no useEffect?**
- `linkCDN` is a fire-and-forget async call that manages state in `useUserLibrary`
- The ref prevents double-triggering across re-renders
- Loading/error states are delegated to `useUserLibrary` (single source of truth)
- Follows React's principle: derive state, don't synchronize it

### Integration with StrudelRepl

The `StrudelRepl` component needs to accept an optional `initialCode` prop:

```typescript
// src/components/StrudelRepl.tsx (changes)

type Props = {
  className?: string;
  engineReady: boolean;
  onHalt?: () => void;
  onExecute?: () => void;
  onSave?: (code: string) => void;
  statusLabel?: string;
  soundBrowser: UseSoundBrowserReturn;
  userLibrary: UseUserLibraryReturn;
  panelState: UsePanelExclusivityReturn;
  /** Optional initial code to load (from env or prop) */
  initialCode?: string | null;
  /** Loading state for initial code */
  isLoadingInitialCode?: boolean;
};

// Inside component:
const [code, setCode] = useState(defaultCode);

// Effect to handle initial code prop changes
useEffect(() => {
  if (initialCode !== null && initialCode !== undefined) {
    setCode(initialCode);
  }
}, [initialCode]);
```

### Integration with App.tsx

```typescript
// src/App.tsx (changes)

import { useDefaultScript } from './hooks/useDefaultScript';
import { useDefaultSoundLibrary } from './hooks/useDefaultSoundLibrary';

export const App = (): React.ReactElement => {
  // ... existing state ...

  // Default script loading
  const { 
    content: defaultScriptContent, 
    isLoading: isLoadingScript, 
    error: scriptError 
  } = useDefaultScript();

  // User library hook (moved up for default library integration)
  const userLibrary = useUserLibrary({ 
    panelState, 
    engineReady: engineInitialized 
  });

  // Default sound library loading (starts immediately, registration waits for engine)
  const { 
    isLoading: isLoadingLibrary, 
    error: libraryError 
  } = useDefaultSoundLibrary(userLibrary);

  // ... rest of component ...

  // Pass to REPLWindow
  <REPLWindow
    engineReady={engineInitialized}
    initialCode={defaultScriptContent}
    isLoadingInitialCode={isLoadingScript}
    // ... other props
  />
};
```

### Environment File Setup

```bash
# .env.example
# Default Strudel script to load on startup (optional)
# Can be a path in public/ or an absolute URL
# VITE_DEFAULT_SCRIPT=/scripts/startup.js

# Default sound library to auto-load (optional)
# Must be a URL to a CDN-style sample library with samples.json manifest
# VITE_DEFAULT_SOUND_LIBRARY=https://cdn.example.com/samples
```

### Type Definitions

```typescript
// src/types/env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Path or URL to default Strudel script */
  readonly VITE_DEFAULT_SCRIPT?: string;
  /** URL to default sound library (CDN-style with samples.json) */
  readonly VITE_DEFAULT_SOUND_LIBRARY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Loading State UI

```
┌─────────────────────────────────────────────────────────────────┐
│ ○ Loading script...                          Execute ▶  Halt ■  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ⟳ Loading startup script from /scripts/startup.js      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Error State UI

```
┌─────────────────────────────────────────────────────────────────┐
│ ○ Script load failed                         Execute ▶  Halt ■  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠ Failed to load default script: 404 Not Found                │
│    Path: /scripts/startup.js                                    │
│                                                                 │
│    [Dismiss]  [Retry]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## React Patterns Used

This implementation follows the codebase conventions in `CLAUDE.md` regarding React patterns:

| Pattern | Where Used | Why |
|---------|------------|-----|
| **TanStack Query** | `useDefaultScript` | Data fetching with automatic caching, cleanup, and state management. Eliminates manual `useState`/`useEffect` boilerplate. |
| **Lazy initialization with ref** | `useDefaultSoundLibrary` | Trigger a one-time action on mount without useEffect. The ref survives re-renders to prevent double-triggering. |
| **Derive don't sync** | `StrudelRepl` | Instead of syncing `initialCode` prop to `code` state with useEffect, derive `displayedCode` from both. User edits take priority via `userEdits ?? initialCode ?? defaultCode`. |
| **Single source of truth** | `useDefaultSoundLibrary` | Loading/error states are delegated to `useUserLibrary`, not duplicated in this hook. |

**No useEffect in this feature.** All patterns use React Query, refs, or derived values instead.

## Component Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/useDefaultScript.ts` | **New** | Hook using TanStack Query to fetch default script |
| `src/hooks/useDefaultSoundLibrary.ts` | **New** | Hook using lazy init pattern to auto-load library |
| `src/types/env.d.ts` | **New** | TypeScript definitions for env variables |
| `src/components/StrudelRepl.tsx` | **Modify** | Add `initialCode` prop, derive displayed code |
| `src/components/REPLWindow.tsx` | **Modify** | Pass through `initialCode` props |
| `src/App.tsx` | **Modify** | Wire up new hooks, pass props to REPL |
| `.env.example` | **New** | Document available environment variables |
| `README.md` | **Modify** | Add environment configuration section |

## Implementation Tasks

### Task 1: Create Environment Type Definitions

**Description:** Create TypeScript definitions for Vite environment variables.

**Files:**
- Create `src/types/env.d.ts`

**Code:**
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_SCRIPT?: string;
  readonly VITE_DEFAULT_SOUND_LIBRARY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Validation Gate:**
- [ ] TypeScript compilation succeeds with no errors
- [ ] `import.meta.env.VITE_DEFAULT_SCRIPT` has proper type inference in IDE
- [ ] `import.meta.env.VITE_DEFAULT_SOUND_LIBRARY` has proper type inference in IDE

---

### Task 2: Implement useDefaultScript Hook

**Description:** Create hook to fetch and manage default script loading from environment variable.

**Files:**
- Create `src/hooks/useDefaultScript.ts`
- Create `src/hooks/__tests__/useDefaultScript.test.ts`

**Acceptance Criteria:**
- Returns `{ content, isLoading, error, source }`
- Uses TanStack Query (`useQuery`) for data fetching
- Fetches script when `VITE_DEFAULT_SCRIPT` is set
- Returns `null` content when env var is not set (query disabled)
- Handles HTTP errors gracefully
- Request automatically cancelled on unmount (handled by React Query)
- Caches result (won't refetch on remount)

**Validation Gate:**
- [ ] Unit tests pass: `npm test -- useDefaultScript`
- [ ] Manual test: Set `VITE_DEFAULT_SCRIPT=/test.js`, create `public/test.js`, verify content loads
- [ ] Manual test: Set to invalid path, verify error displays
- [ ] Manual test: Unset variable, verify no fetch occurs

---

### Task 3: Implement useDefaultSoundLibrary Hook

**Description:** Create hook to auto-load sound library using lazy initialization pattern (no useEffect).

**Files:**
- Create `src/hooks/useDefaultSoundLibrary.ts`
- Create `src/hooks/__tests__/useDefaultSoundLibrary.test.ts`

**Acceptance Criteria:**
- Uses lazy initialization with `useRef` (no useEffect)
- Triggers `linkCDN` on first render when conditions are met
- Does not override user-selected library (`userLibrary.source !== null`)
- Only attempts load once per session (tracked by ref)
- Delegates loading/error state to `useUserLibrary` (single source of truth)
- Sample registration handled by `useUserLibrary` when engine becomes ready

**Validation Gate:**
- [ ] Unit tests pass: `npm test -- useDefaultSoundLibrary`
- [ ] Manual test: Set `VITE_DEFAULT_SOUND_LIBRARY` to valid CDN, verify samples register
- [ ] Manual test: Verify user can manually link different library after auto-load
- [ ] Manual test: Verify no load attempt when env var unset

---

### Task 4: Update StrudelRepl to Accept Initial Code

**Description:** Modify `StrudelRepl` component to accept and display initial code from props.

**Files:**
- Modify `src/components/StrudelRepl.tsx`
- Update `src/components/__tests__/StrudelRepl.test.tsx`

**Changes:**
```typescript
// New props
initialCode?: string | null;
isLoadingInitialCode?: boolean;

// State tracks user edits ONLY (null = "no edits yet, use initial/default")
const [userEdits, setUserEdits] = useState<string | null>(null);

// Derive displayed code: user edits take priority, then initialCode, then default
// No useEffect needed - this follows React's "derive don't sync" principle
//
// Timeline:
// 1. Mount (loading):    userEdits=null, initialCode=null  → shows defaultCode
// 2. Script loaded:      userEdits=null, initialCode="..." → shows initialCode
// 3. User types:         userEdits="...", initialCode="..." → shows userEdits
const displayedCode = userEdits ?? initialCode ?? defaultCode;

// CodeMirror onChange handler
<CodeMirror
  value={displayedCode}
  onChange={(val) => setUserEdits(val)}
  // ... other props
/>

// Loading state display in editor area
{isLoadingInitialCode && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
    <span className="text-zinc-400">Loading script...</span>
  </div>
)}
```

**Validation Gate:**
- [ ] Existing tests still pass: `npm test -- StrudelRepl`
- [ ] New tests pass for derived code behavior (`userEdits ?? initialCode ?? defaultCode`)
- [ ] Manual test: With `initialCode=null`, verify defaultCode displays
- [ ] Manual test: With `initialCode="// loaded"`, verify loaded script displays
- [ ] Manual test: After typing, verify user edits persist (not overwritten by initialCode)
- [ ] Manual test: Verify loading overlay displays when `isLoadingInitialCode=true`

---

### Task 5: Update REPLWindow to Pass Through Props

**Description:** Update `REPLWindow` component to forward initial code props to `StrudelRepl`.

**Files:**
- Modify `src/components/REPLWindow.tsx`
- Update `src/components/__tests__/REPLWindow.test.tsx`

**Validation Gate:**
- [ ] Tests pass: `npm test -- REPLWindow`
- [ ] Props flow through correctly (manual verification with React DevTools)

---

### Task 6: Integrate Hooks in App.tsx

**Description:** Wire up the new hooks in the main App component.

**Files:**
- Modify `src/App.tsx`
- Update `src/__tests__/App.baseline.test.tsx`

**Changes:**
- Import and call `useDefaultScript`
- Import and call `useDefaultSoundLibrary`
- Pass `initialCode` and `isLoadingInitialCode` to `REPLWindow`
- Display any errors in appropriate location

**Validation Gate:**
- [ ] App compiles without errors
- [ ] Baseline tests pass: `npm test -- App.baseline`
- [ ] Manual test: Full flow with `.env.local` configured
- [ ] Manual test: App works normally without `.env` file

---

### Task 7: Create .env.example and Documentation

**Description:** Create example environment file and update README with configuration instructions.

**Files:**
- Create `.env.example`
- Modify `README.md`

**Content for `.env.example`:**
```bash
# Basilisk AV Environment Configuration
# Copy this file to .env.local and customize

# Default Strudel script to load on startup (optional)
# Path relative to public/ directory or absolute URL
# Example: /scripts/my-startup.js
# Example: https://gist.githubusercontent.com/user/id/raw/script.js
# VITE_DEFAULT_SCRIPT=

# Default sound library to auto-load (optional)  
# Must be a URL to a CDN-style sample library with samples.json manifest
# Example: https://cdn.freesound.org/my-samples
# VITE_DEFAULT_SOUND_LIBRARY=
```

**Validation Gate:**
- [ ] `.env.example` exists and is properly formatted
- [ ] README includes "Environment Configuration" section
- [ ] Documentation explains both variables with examples

---

### Task 8: Add Error Boundary for Load Failures

**Description:** Add user-friendly error display when script or library fails to load.

**Files:**
- Modify `src/components/StrudelRepl.tsx` or create `src/components/LoadError.tsx`

**Design:**
```tsx
interface LoadErrorProps {
  title: string;
  message: string;
  source?: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

const LoadError = ({ title, message, source, onDismiss, onRetry }: LoadErrorProps) => (
  <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
    <h4 className="text-red-400 font-medium">{title}</h4>
    <p className="text-red-300/70 text-sm mt-1">{message}</p>
    {source && <p className="text-red-300/50 text-xs mt-1">Source: {source}</p>}
    <div className="flex gap-2 mt-3">
      <Button onClick={onDismiss} size="sm" variant="secondary">Dismiss</Button>
      {onRetry && <Button onClick={onRetry} size="sm" variant="secondary">Retry</Button>}
    </div>
  </div>
);
```

**Validation Gate:**
- [ ] Error component renders correctly
- [ ] Dismiss clears error and shows default code
- [ ] Retry re-attempts the fetch
- [ ] Error does not block app usage

---

### Task 9: End-to-End Testing

**Description:** Create Playwright tests for the complete auto-load flow.

**Files:**
- Create `e2e/env-auto-load.spec.ts`

**Test Cases:**
1. App loads normally without env vars set
2. Script auto-loads when `VITE_DEFAULT_SCRIPT` is configured
3. Error displays when script path is invalid
4. Sound library auto-loads when `VITE_DEFAULT_SOUND_LIBRARY` is configured
5. User can override auto-loaded script
6. User can link different library after auto-load

**Validation Gate:**
- [ ] All Playwright tests pass: `npx playwright test env-auto-load`
- [ ] Tests run in CI pipeline

---

## Test Matrix

| Scenario | VITE_DEFAULT_SCRIPT | VITE_DEFAULT_SOUND_LIBRARY | Expected Behavior |
|----------|---------------------|----------------------------|-------------------|
| Clean start | Not set | Not set | Default code, no library |
| Script only | Valid path | Not set | Script loads, no library |
| Library only | Not set | Valid URL | Default code, library loads |
| Both set | Valid path | Valid URL | Both load |
| Script error | Invalid path | Not set | Error shown, dismissible |
| Library error | Not set | Invalid URL | Error shown, dismissible |
| User override | Valid path | Not set | Script loads, user can modify |

## Security Considerations

1. **No File System Access**: Environment variables point to URLs or public paths, not local file system paths. This is a browser security requirement.

2. **Cross-Origin Requests**: If `VITE_DEFAULT_SOUND_LIBRARY` points to an external CDN, CORS must be properly configured on that server.

3. **Script Injection**: The loaded script is treated as user code (evaluated in Strudel context), same as manually typed code. No additional security risk.

4. **Sensitive Data**: Do not store sensitive information in `.env` files committed to version control. Use `.env.local` for personal configuration.

## Future Enhancements (Out of Scope)

- Multiple startup scripts (playlist)
- Script/library presets in a dropdown
- Cloud-synced configurations
- Remote configuration fetching
- Hot reload of env variables during development

## Glossary

| Term | Definition |
|------|------------|
| CDN | Content Delivery Network - server hosting sample files |
| REPL | Read-Eval-Print Loop - the code editor component |
| Strudel | Algorithmic music live-coding language |
| Vite | Build tool and development server |
| samples.json | Manifest file listing available samples in a library |
