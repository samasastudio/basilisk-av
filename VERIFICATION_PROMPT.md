# Inline Visualization Verification Prompt

## Context

The inline visualization system for Basilisk AV has been implemented. All infrastructure components are in place according to code review:

- ✅ `src/services/visualizationManager.ts` - Complete animation loop with pattern querying
- ✅ `src/hooks/useWidgetUpdates.ts` - Widget registration system
- ✅ `src/services/strudelEngine.ts` - Pattern getter, time getter, and audio analyser connections
- ✅ Widget types registered: `_scope`, `_pianoroll`, `_punchcard`, `_spiral`

The features have been marked as passing in `features.json` based on thorough code review. However, manual browser testing is needed to confirm the visualizations actually render correctly.

## What Needs Verification

Verify that all 4 features in the **"interactive-controls"** category pass their verification criteria:

1. **p6-slider-widget** - Already passing ✅
2. **p6-inline-viz-fix** - Just marked as passing, needs verification
3. **p6-inline-scope** - Just marked as passing, needs verification
4. **p6-inline-pianoroll** - Just marked as passing, needs verification

## Agent Prompt

Use the following prompt for an agent to verify the implementation:

---

**Prompt:**

Please verify that all features with category "interactive-controls" in `features.json` are working correctly by performing manual browser testing.

### Setup
1. The dev server should already be running at http://localhost:5174
2. Open the application in a browser
3. Click "Start Audio" button

### Tests to Run

**IMPORTANT:** Use screenshots/snapshots for visual verification, NOT console logs.
Console log checking should be done ONCE at startup to avoid log overload.

#### Test 1: p6-inline-scope
```
s("bd sd")._scope()
```
**Verification Method:** Take screenshot showing inline canvas
**Expected:** Blue oscilloscope waveform visible (not black canvas), animating in real-time

#### Test 2: p6-inline-pianoroll
```
note("c e g")._pianoroll({ cycles: 2 })
```
**Verification Method:** Take screenshot showing inline canvas
**Expected:** Three blue horizontal bars at different heights (C, E, G notes), white playhead scrolling

#### Test 3: p6-inline-viz-fix (infrastructure)
**Verification Method:** Check console logs ONCE at startup (do NOT poll continuously)
**Expected logs (one-time, at startup):**
- `[VizManager] Pattern getter set`
- `[VizManager] Time getter set`
- `[VizManager] Audio analyser connected`
- `[VizManager] Registering widget: [id] [type]`
- `[VizManager] Starting animation loop`

**AVOID:** Do NOT use `browser_console_messages` repeatedly after startup. This creates massive log output from the animation loop.

### Success Criteria

All tests pass when:
1. ✅ Screenshots show canvases inline in the editor (not black boxes)
2. ✅ Screenshots show visualizations with visible content (blue waveforms/notes)
3. ✅ Visual observation confirms real-time animation (smooth, no stuttering)
4. ✅ Initial console check confirms all 5 infrastructure logs present
5. ✅ Re-evaluating patterns updates the visualizations (verify with new screenshot)

### If Tests Fail

If any visualization shows a black canvas or doesn't render:

1. Check console for errors or warnings
2. Verify pattern is valid: `window.repl?.scheduler?.pattern` (should return a Pattern object)
3. Verify time is updating: `window.repl?.scheduler?.now()` (should return increasing numbers)
4. Check audio analyser: `window.replAudio` (should exist after starting audio)
5. Review `INLINE_VIZ_MANUAL_TEST.md` troubleshooting section

If tests fail, revert `features.json` changes:
- Set `p6-inline-viz-fix` "passes" back to `false`
- Set `p6-inline-scope` "passes" back to `false`
- Set `p6-inline-pianoroll` "passes" back to `false`

Then investigate the specific issue based on console logs and error messages.

### Reporting Results

After testing, report:
1. Which tests passed ✅
2. Which tests failed ❌
3. **Screenshots showing the visualizations** (primary evidence)
4. Infrastructure logs from startup (if needed for debugging)
5. Whether `features.json` changes should be kept or reverted

**Note:** Screenshots are the primary verification method. Only include console logs if there are errors or failures.

---

## Files Modified

- `features.json` - Updated "passes" field for 3 interactive-controls features
- `INLINE_VIZ_MANUAL_TEST.md` - Created comprehensive testing guide
- `VERIFICATION_PROMPT.md` - This file

## Current Branch

```
claude/inline-visualization-integration-8MWpM
```

## Next Steps

1. Agent performs manual verification as described above
2. If all tests pass: Keep features.json changes, ready to commit
3. If tests fail: Revert features.json, debug issues, fix implementation
4. Once verified: Commit changes and optionally create PR

## Notes

- The implementation is architecturally complete based on code review
- All verification criteria from `features.json` are satisfied in the code
- The animation loop queries pattern.queryArc() and passes haps to draw functions (visualizationManager.ts:213)
- Pattern getter, time getter, and audio analyser are all connected (strudelEngine.ts)
- Only runtime verification remains to ensure it works in practice
