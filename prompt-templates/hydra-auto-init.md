# Feature Specification: Hydra Auto-Initialization

## Metadata

| Field | Value |
|-------|-------|
| Feature ID | FEAT-51 |
| Author | samasastudio |
| Created | 2025-01-11 |
| Status | Ready |
| Priority | P1 |
| Estimated Effort | 25 Ralph iterations |

---

## Summary

Automatically initialize Hydra when the Strudel audio engine starts, eliminating the need for users to manually call `await initHydra()` in their REPL code. This streamlines the user experience by making both audio and visuals ready simultaneously with a single action.

## User Story

**As a** live-coder
**I want** Hydra to initialize automatically when I start the audio engine
**So that** I can immediately write visual code without boilerplate initialization

---

## Requirements

### Functional Requirements

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-1 | Hydra initializes automatically when audio engine starts | Start engine, run `osc(10).out()` - visuals appear without any init call |
| FR-2 | Strudel patterns work immediately after engine start | Start engine, run `s("bd sd")` - audio plays |
| FR-3 | Hydra globals (`osc`, `src`, `noise`, `shape`, `gradient`, `voronoi`, `solid`) available on window after engine ready | Run any Hydra function in REPL without errors |
| FR-4 | FFT bridge (`a.fft[0-3]`) works with auto-initialized Hydra | Run `osc(() => a.fft[0]).out()` with audio playing - visuals react to audio |
| FR-5 | Default REPL code contains no `initHydra` boilerplate | Inspect default code - no `await initHydra()` call present; only Hydra visuals and Strudel patterns remain |
| FR-6 | Startup text guides user to start engine (not to call initHydra) | HydraCanvas shows "Start audio engine" messaging |
| FR-7 | Explicit `initHydra()` calls still work (backward compatibility) | Run `await initHydra(); osc().out()` - no errors, visuals work |
| FR-8 | Multiple `initHydra()` calls are idempotent | Call `initHydra()` twice - no errors or duplicate canvases |
| FR-9 | User sees error warning when Hydra fails to initialize | Mock Hydra failure - warning visible in UI |

### Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-1 | Performance: Startup time increase | < 500ms additional delay |
| NFR-2 | Graceful degradation: Hydra failure allows Strudel to continue | User sees error warning, can still run Strudel scripts |
| NFR-3 | Clean startup | No console errors or warnings (except Hydra failure case) |
| NFR-4 | All unit tests pass | `npm run test` exits 0 |
| NFR-5 | Linter passes | `npm run lint` exits 0 |
| NFR-6 | TypeScript compiles | `npm run typecheck` exits 0 |
| NFR-7 | Production build succeeds | `npm run build` exits 0 |

---

## Acceptance Criteria

### Scenario 1: Happy Path - Auto-Initialization

```gherkin
GIVEN the application is loaded
WHEN the user clicks "Start Audio" or presses Ctrl+Shift+Space
THEN the Strudel REPL initializes
  AND Hydra initializes with window dimensions
  AND engineStatus becomes 'ready'
  AND Hydra global functions are available on window
```

### Scenario 2: Hydra Code Without Manual Init

```gherkin
GIVEN Hydra has been auto-initialized
WHEN the user runs `osc(10).out()` without calling initHydra
THEN the visual output appears on the Hydra canvas
```

### Scenario 3: Backward Compatibility

```gherkin
GIVEN Hydra has been auto-initialized
WHEN the user runs code containing `await initHydra()`
THEN no error occurs (idempotent behavior)
  AND visuals work normally
```

### Scenario 4: Graceful Degradation on Hydra Failure

```gherkin
GIVEN Hydra initialization fails
WHEN the user starts the audio engine
THEN the engine still reaches 'ready' status
  AND user sees an error warning in the UI
  AND user can still run Strudel scripts (e.g., `s("bd sd")` plays audio)
```

---

## Technical Design

### Files to Create

None - use Playwright MCP server for browser verification instead of creating e2e test files.

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/hooks/useStrudelEngine.ts` | Import `initHydra`, call after REPL init in `startEngine()`, add error state for Hydra failures |
| `src/components/StrudelRepl.tsx` | Remove `await initHydra()` call from default code string; keep only Hydra visuals and Strudel patterns |
| `src/components/HydraCanvas.tsx` | Update startup text to "Press Ctrl+Shift+Space or click Start Audio" |
| `src/hooks/__tests__/useStrudelEngine.test.ts` | Add tests for auto-init, mock `initHydra` |
| `src/components/__tests__/StrudelRepl.test.ts` | Verify default code has no initHydra |
| `src/components/__tests__/HydraCanvas.test.tsx` | Verify new startup text |

### Dependencies

| Package | Version | Purpose | Already Installed? |
|---------|---------|---------|-------------------|
| `@strudel/hydra` | existing | Hydra initialization | Yes |
| Playwright MCP | existing | Browser verification via MCP server | Yes (configured) |

### Key Files Reference

| File | Current Role |
|------|--------------|
| `src/hooks/useStrudelEngine.ts` | Engine lifecycle, bridge callback registration |
| `src/components/StrudelRepl.tsx` | Exposes `initHydra` globally, default code calls it |
| `src/components/HydraCanvas.tsx` | Canvas container, startup text |
| `src/utils/patchSuperdough.ts` | Audio routing interceptor |
| `src/utils/strudelHydraBridge.ts` | FFT bridge for `window.a.fft[0-3]` |

### Implementation Approach

**Option A: Initialize in startEngine() (Chosen)**

This approach was selected because:
1. **Clear mental model**: "Start Audio" starts everything
2. **Both systems ready simultaneously**: No timing confusion
3. **Simplest UX**: Single action enables all functionality
4. **Single initialization point**: Easy to maintain

```typescript
// In useStrudelEngine.ts startEngine()
const repl = await StrudelEngine.initializeStrudel();
window.repl = repl;

// Auto-initialize Hydra with current window dimensions
try {
  await initHydra({
    width: window.innerWidth,
    height: window.innerHeight
  });
} catch (hydraError) {
  console.warn('Hydra initialization failed, audio-only mode:', hydraError);
  setHydraError('Hydra failed to initialize. Visuals unavailable.');
  // Continue - audio should still work
}

setEngineStatus('ready');
```

### Default REPL Script Update

The default script in `StrudelRepl.tsx` must be updated to remove the `await initHydra()` initialization call since Hydra will now be auto-initialized when the engine starts.

**Current default script (contains init):**
```javascript
await initHydra({ width: window.innerWidth, height: window.innerHeight })

// Audio-reactive feedback loop...
src(o0)
  .saturate(1.01)
  // ... rest of visuals

s("bd sd, hh*4")
```

**New default script (no init required):**
```javascript
// Audio-reactive feedback loop with noise modulation
src(o0)
  .saturate(1.01)
  .scale(0.99)
  .color(1.01,1.01,1.01)
  .hue(() => a.fft[3])
  .modulateHue(src(o1).hue(.3).posterize(-1).contrast(.7),2)
  .layer(src(o1)
         .luma()
         .mult(gradient(1)
               .saturate(.9)))
  .out(o0)

noise(1, .2)
  .rotate(2,.5)
  .layer(src(o0)
         .scrollX(.2))
  .out(o1)

render(o0)

// Audio pattern
s("bd sd, hh*4")
```

The user can now simply start the engine and run the code - Hydra visuals and Strudel audio will work immediately.

---

## Out of Scope

Explicitly NOT included in this feature:

- [ ] Window resize handling for Hydra canvas (separate enhancement)
- [ ] Lazy initialization option (initialize Hydra only when visuals are used)
- [ ] Configuration option to disable auto-init
- [ ] Canvas dimension customization UI

---

## Regression Testing

### Unit Test Regression Coverage

Tests to add/verify in `src/hooks/__tests__/useStrudelEngine.test.ts`:

| Test Case | What to Verify |
|-----------|----------------|
| Auto-init called | `initHydra` is called during `startEngine()` after REPL init |
| Init params correct | `initHydra` called with `{ width: window.innerWidth, height: window.innerHeight }` |
| Error handling | `initHydra` error is caught, logged, and doesn't throw |
| Engine ready on Hydra failure | Engine reaches 'ready' status even if Hydra init fails |
| Hydra error state | `hydraError` state is set with user-friendly message on failure |
| No double init | `initHydra` not called if engine already initialized |

Tests to add/verify in `src/components/__tests__/StrudelRepl.test.ts`:

| Test Case | What to Verify |
|-----------|----------------|
| No initHydra in default | Default code string does not contain `initHydra` or `await initHydra` |
| Hydra visuals present | Default code contains Hydra functions (`src`, `osc`, `noise`, etc.) |
| Strudel patterns present | Default code contains Strudel patterns (`s("...")`) |

Tests to add/verify in `src/components/__tests__/HydraCanvas.test.tsx`:

| Test Case | What to Verify |
|-----------|----------------|
| New startup text | Startup text matches new copy (no mention of `initHydra`) |
| Startup text visibility | Text shown before engine ready, hidden after |

### Playwright MCP Browser Verification

Use the Playwright MCP server (already configured) to verify the feature works in a real browser. Do NOT create e2e test files - use interactive MCP browser tools instead.

**IMPORTANT: Clean up any previous e2e test attempts**
- Delete `e2e/` directory if it exists
- Delete `playwright.config.ts` if it was created for this feature
- Remove any e2e-related scripts from `package.json` if added

#### Verification Scenarios (via Playwright MCP)

Run these scenarios interactively using `mcp__playwright__*` tools:

**Scenario 1: Happy Path - Auto-Init and Execute Hydra Code**
1. `mcp__playwright__browser_navigate` to http://localhost:5173
2. `mcp__playwright__browser_snapshot` - verify startup text is displayed
3. `mcp__playwright__browser_click` on "Start Audio" button
4. `mcp__playwright__browser_snapshot` - verify engine status 'ready', startup text hidden
5. Type Hydra code in REPL: `osc(10).out()`
6. Execute code (Ctrl+Enter)
7. `mcp__playwright__browser_console_messages` - verify no errors
8. `mcp__playwright__browser_take_screenshot` - verify canvas is rendering

**Scenario 2: Combo Test - Hydra + Strudel Together**
1. Navigate to app, start engine
2. Type combo script in REPL:
   ```
   osc(10, 0.1, () => a.fft[0] * 2).color(1.2, 0.5, 0.8).out()
   s("bd sd, hh*4")
   ```
3. Execute code
4. Verify via snapshot/screenshot: canvas rendering, no console errors

**Scenario 3: Backward Compatibility - Explicit initHydra**
1. Start engine
2. Run code WITH explicit initHydra call:
   ```
   await initHydra({ width: 800, height: 600 })
   osc(5).out()
   ```
3. Verify: No errors (idempotent behavior), visuals work

**Scenario 4: Startup Text Verification**
1. Before start: snapshot shows startup text with correct copy (no mention of initHydra)
2. After engine ready: snapshot shows startup text hidden
3. After code run: screenshot shows canvas has visuals

### Manual Regression Checklist

For edge cases difficult to automate:

- [ ] **Browser compatibility**: Test in Chrome, Firefox, Edge
- [ ] **Tab backgrounding**: Start engine, background tab, foreground - visuals resume?
- [ ] **DevTools open**: Start with DevTools open - any timing issues?
- [ ] **Slow network**: Throttle network - graceful handling?
- [ ] **Multiple tabs**: Two tabs open - no cross-tab interference?
- [ ] **Memory leaks**: Start/stop 10 times - memory stable in DevTools?
- [ ] **Mobile viewport**: Resize to mobile - canvas dimensions correct?
- [ ] **Refresh during init**: Refresh while initializing - clean recovery?

### Performance Regression Checks

| Metric | Baseline | Max Acceptable |
|--------|----------|----------------|
| Time to 'ready' status | [measure before] | +500ms |
| Memory after init | [measure before] | +10MB |
| First visual frame | [measure before] | +200ms |
| Bundle size | [measure before] | +5KB |

---

## Success Metrics

### Completion Criteria (All Must Pass)

- [ ] All functional requirements (FR-1 through FR-9) implemented
- [ ] All acceptance criteria scenarios pass
- [ ] Test coverage ≥ 80% for new code
- [ ] No regressions in existing tests
- [ ] Lint passes with 0 errors
- [ ] TypeScript compiles with 0 errors
- [ ] Build succeeds
- [ ] Playwright MCP browser verification passes (all 4 scenarios)
- [ ] Any previous e2e test files cleaned up

### Quality Gates

| Gate | Threshold |
|------|-----------|
| Unit test pass | `npm run test` exits 0 |
| Lint pass | `npm run lint` exits 0 |
| TypeScript pass | `npm run typecheck` exits 0 |
| Build pass | `npm run build` exits 0 |
| Playwright MCP verification | All 4 scenarios pass via interactive browser testing |
| Cleanup complete | No `e2e/` directory, no `playwright.config.ts` for this feature |

---

## Ralph Prompt

Copy this prompt to start the Ralph loop:

```markdown
Implement feature FEAT-51 per spec at `.ralph/specs/hydra-auto-init.md`.

FIRST: Clean up any previous e2e test attempts:
- Delete `e2e/` directory if it exists
- Delete `playwright.config.ts` if it was created for this feature
- Delete `tsconfig.e2e.json` if it exists
- Remove any e2e-related scripts from `package.json` if added

Workflow:
1. Read this spec thoroughly, especially the Regression Testing section
2. Clean up previous e2e attempts (see above)
3. Modify useStrudelEngine.ts to auto-init Hydra with error handling
4. Update StrudelRepl.tsx default code (remove initHydra) and HydraCanvas.tsx startup text
5. Add/update unit tests for all modified files (see Unit Test Regression Coverage table)
6. Use Playwright MCP server to verify feature in browser (do NOT create e2e test files)

Phase checkpoints:
- After cleanup of previous e2e attempts: `<promise>CLEANUP_DONE</promise>`
- After useStrudelEngine.ts changes with error handling: `<promise>PHASE1_LOGIC_DONE</promise>`
- After UI updates (StrudelRepl default code, HydraCanvas text): `<promise>PHASE2_UI_DONE</promise>`
- After unit tests pass (all cases from regression table): `<promise>PHASE3_UNIT_TESTS_DONE</promise>`
- After Playwright MCP browser verification passes (all 4 scenarios): `<promise>FEATURE_COMPLETE</promise>`

Verification (run before each promise):
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Browser verification (use Playwright MCP tools, NOT e2e test files):
1. Start dev server: `npm run dev`
2. Use `mcp__playwright__browser_navigate` to open http://localhost:5173
3. Run through the 4 verification scenarios in the spec
4. Use `mcp__playwright__browser_console_messages` to check for errors
5. Use `mcp__playwright__browser_take_screenshot` to verify visuals

IMPORTANT:
- Do NOT create e2e test files - use Playwright MCP server for browser verification
- Delete any existing e2e/ directory or playwright.config.ts from previous attempts
- Hydra init failure should NOT block engine startup - user sees error warning but can still run Strudel scripts
- initHydra must be idempotent - verify existing code with explicit calls still works
- Do NOT modify any test assertions to make them pass - fix the implementation instead

Max iterations: 25

Escape hatch: If blocked for 5+ iterations, document in `.ralph/blockers.md` and output `<promise>BLOCKED</promise>`.
```

---

## Notes

- Related Issue: GitHub Issue #51
- The `initHydra` function from `@strudel/hydra` should be idempotent - verify this behavior
- Current startup text: "Run code with `await initHydra()` to start visuals"
- New startup text: "Press Ctrl+Shift+Space or click Start Audio"
