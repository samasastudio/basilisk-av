# Bug Fix Specification: [BUG_TITLE]

> Replace bracketed placeholders with actual values. Delete this instruction block when complete.

## Metadata

| Field | Value |
|-------|-------|
| Bug ID | BUG-[NUMBER] |
| Reporter | [NAME] |
| Created | [DATE] |
| Severity | Critical / High / Medium / Low |
| Status | Open / Investigating / In Progress / Fixed / Verified |
| Affected Version | [VERSION] |

---

## Problem Statement

[Clear, concise description of the bug and its user impact]

### Expected Behavior

[What should happen]

### Actual Behavior

[What actually happens]

### User Impact

- **Frequency:** [How often does this occur?]
- **Scope:** [How many users affected?]
- **Workaround:** [Is there a workaround? What is it?]

---

## Reproduction Steps

### Prerequisites

- [Required state/data/configuration]
- [User role/permissions needed]

### Steps

1. [First action]
2. [Second action]
3. [Third action]
4. **Observe:** [What to look for]

### Environment

| Factor | Value |
|--------|-------|
| Browser | [Chrome 120 / Firefox 121 / etc.] |
| OS | [Windows 11 / macOS 14 / etc.] |
| Screen Size | [Desktop / Mobile / Specific resolution] |
| User Role | [Admin / User / Guest] |

### Reproduction Rate

- [ ] 100% reproducible
- [ ] Intermittent (~X% of attempts)
- [ ] Rare (specific conditions only)

---

## Root Cause Analysis

### Suspected Cause

[If known or suspected, describe the likely root cause]

### Investigation Notes

[Any debugging done, logs examined, hypotheses tested]

### Related Code

| File | Lines | Relevance |
|------|-------|-----------|
| `src/[file1].ts` | 45-67 | [Why relevant] |
| `src/[file2].ts` | 120-135 | [Why relevant] |

---

## Proposed Solution

### Approach

[High-level description of fix approach]

### Changes Required

| File | Change |
|------|--------|
| `src/[file].ts` | [Description of change] |

### Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| [Potential regression] | Low/Med/High | [How to prevent] |

---

## Verification Plan

### Test Cases

#### TC-1: Bug No Longer Reproducible

```gherkin
GIVEN [initial state that triggers bug]
WHEN [action that caused bug]
THEN [correct behavior occurs]
  AND [bug behavior does NOT occur]
```

#### TC-2: Regression Test

```gherkin
GIVEN [related functionality state]
WHEN [related action]
THEN [existing behavior unchanged]
```

### Automated Tests

| Test Type | File | Description |
|-----------|------|-------------|
| Unit | `src/__tests__/[file].test.ts` | [What it tests] |
| Integration | `src/__tests__/integration/[file].test.ts` | [What it tests] |

### Manual Verification

- [ ] Reproduce original bug (should fail)
- [ ] Apply fix
- [ ] Verify bug no longer reproducible
- [ ] Test related functionality for regressions

---

## Success Criteria

### Must Pass

- [ ] Bug no longer reproducible via original steps
- [ ] Regression test added and passing
- [ ] All existing tests pass
- [ ] Lint passes with 0 errors
- [ ] Build succeeds

### Should Verify

- [ ] No performance degradation
- [ ] Related features unaffected
- [ ] Edge cases handled

---

## Ralph Prompt

Copy this prompt to start the Ralph loop:

```markdown
Fix bug BUG-[NUMBER] per spec at `.ralph/specs/[this-file].md`.

Process:
1. Read spec and understand reproduction steps
2. Add failing test that reproduces the bug
3. Run test to confirm it fails
4. Implement fix
5. Run test to confirm it passes
6. Run full test suite for regressions
7. Run verification suite

Verification:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Output format on completion:
```json
{
  "rootCause": "[description]",
  "fix": "[what was changed]",
  "filesModified": ["file1.ts", "file2.ts"],
  "testAdded": "[test name]",
  "regressionRisk": "low|medium|high"
}
```

Output `<promise>BUG_FIXED</promise>` when verified.

Escape hatch: After 15 iterations without fix, output `<promise>BUG_BLOCKED</promise>` with investigation notes in `.ralph/blockers.md`.

Max iterations: 15
```

---

## Related Issues

- [Link to related bugs]
- [Link to related features]
- [Link to customer reports]

## Notes

[Any additional context, screenshots, error logs, etc.]
