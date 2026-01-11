# Bug Fix Specification Template

Copy to `.ralph/specs/[bug-name].md` and fill placeholders.

---

```markdown
# Bug: [BUG_TITLE]

## Problem
[Clear description of bug and user impact]

### Expected
[What should happen]

### Actual
[What happens instead]

## Reproduction

### Prerequisites
- [Required state]

### Steps
1. [Action]
2. [Action]
3. Observe: [bug manifests]

### Environment
| Factor | Value |
|--------|-------|
| Browser | [version] |
| OS | [version] |

## Root Cause
[If known/suspected]

## Proposed Fix
[Approach description]

### Files Affected
| File | Change |
|------|--------|
| `src/[file].ts` | [what changes] |

## Verification
- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Existing tests pass
- [ ] Lint/build pass

## Ralph Prompt

```
Fix bug per spec at `.ralph/specs/[file].md`.

Process:
1. Add failing test reproducing bug
2. Confirm test fails
3. Implement fix
4. Confirm test passes
5. Run full suite

Output:
```json
{
  "rootCause": "[description]",
  "fix": "[what changed]",
  "testAdded": "[test name]"
}
```

Output `<promise>BUG_FIXED</promise>` when verified.

Escape: After 15 iterations, output `<promise>BLOCKED</promise>` with notes.

Max iterations: 15
```
```
