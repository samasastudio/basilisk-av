# Refactor Specification Template

Copy to `.ralph/specs/[refactor-name].md` and fill placeholders.

---

```markdown
# Refactor: [REFACTOR_NAME]

## Motivation
[Why this refactor is needed]

## Scope

### In Scope
| Path | Current | Target |
|------|---------|--------|
| `src/[path]` | [pattern] | [new pattern] |

### Out of Scope
- [Explicitly excluded]

## Constraints
- Zero functional changes
- All tests pass unchanged (no assertion modifications)
- No new dependencies

## Migration Plan

### Phase 1: [Foundation] (iter 1-25)
- [Changes]
- Checkpoint: `<promise>PHASE1_COMPLETE</promise>`

### Phase 2: [Core] (iter 26-50)
- [Changes]
- Checkpoint: `<promise>PHASE2_COMPLETE</promise>`

### Phase 3: [Cleanup] (iter 51-75)
- [Changes]
- Final: `<promise>REFACTOR_COMPLETE</promise>`

## File Order
| Order | File | Est. Iterations |
|-------|------|-----------------|
| 1 | `src/[file1].ts` | 3 |
| 2 | `src/[file2].ts` | 5 |

## Success Criteria
- [ ] All tests pass (unmodified)
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Bundle size delta < 5%

## Ralph Prompt

```
Execute refactor per spec at `.ralph/specs/[file].md`.

Rules:
- ONE file per iteration
- Run tests after each file
- NEVER modify test assertions
- NEVER delete tests

Progress: Update `.ralph/state.json`:
```json
{
  "iteration": N,
  "phase": "1|2|3",
  "filesCompleted": [],
  "filesRemaining": [],
  "testsStatus": "passing"
}
```

Checkpoints:
- Phase 1: `<promise>PHASE1_COMPLETE</promise>`
- Phase 2: `<promise>PHASE2_COMPLETE</promise>`
- Done: `<promise>REFACTOR_COMPLETE</promise>`

Verification: npm run typecheck && npm run lint && npm run test && npm run build

Max iterations: 75
```
```
