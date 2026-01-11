# Refactor Specification: [REFACTOR_NAME]

> Replace bracketed placeholders with actual values. Delete this instruction block when complete.

## Metadata

| Field | Value |
|-------|-------|
| Refactor ID | REF-[NUMBER] |
| Author | [NAME] |
| Created | [DATE] |
| Status | Planned / In Progress / Complete |
| Estimated Effort | [X] Ralph iterations |
| Risk Level | Low / Medium / High |

---

## Motivation

### Why This Refactor?

[Explain the business/technical reason for this refactor]

### Current Problems

| Problem | Impact | Frequency |
|---------|--------|-----------|
| [Problem 1] | [How it hurts] | [Daily/Weekly/etc.] |
| [Problem 2] | [How it hurts] | [Daily/Weekly/etc.] |

### Benefits After Refactor

| Benefit | Measurable Improvement |
|---------|----------------------|
| [Benefit 1] | [Specific metric] |
| [Benefit 2] | [Specific metric] |

---

## Scope

### In Scope

Files/modules to be refactored:

| Path | Current State | Target State |
|------|---------------|--------------|
| `src/[path1]` | [Description] | [Description] |
| `src/[path2]` | [Description] | [Description] |

### Out of Scope

**Explicitly NOT changing:**

- [ ] `src/[path]` - [Why excluded]
- [ ] [Feature X] - Separate refactor
- [ ] [Pattern Y] - Not addressed in this pass

---

## Current State

### Architecture Overview

```
[ASCII diagram or description of current architecture]
```

### Code Patterns in Use

| Pattern | Location | Issues |
|---------|----------|--------|
| [Current pattern] | `src/[path]` | [What's wrong] |

### Metrics (Before)

| Metric | Current Value |
|--------|---------------|
| Bundle size | [X] KB |
| Test coverage | [X]% |
| Cyclomatic complexity | [X] |
| Files affected | [X] |

---

## Target State

### Architecture Overview

```
[ASCII diagram or description of target architecture]
```

### New Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| [New pattern] | [Why using it] | [Brief code example] |

### Metrics (Target)

| Metric | Target Value | Acceptable Range |
|--------|--------------|------------------|
| Bundle size | [X] KB | ±5% |
| Test coverage | [X]% | No decrease |
| Cyclomatic complexity | [X] | ≤ current |

---

## Constraints

### Absolute Requirements

- [ ] **Zero functional changes** - Behavior must be identical
- [ ] **All tests pass unchanged** - No modifying test assertions
- [ ] **No new dependencies** - Unless explicitly approved
- [ ] **Backwards compatible** - [If applicable: API contracts maintained]

### Performance Constraints

- [ ] Bundle size change < [X]%
- [ ] No runtime performance regression
- [ ] Build time increase < [X]%

---

## Migration Strategy

### Approach: [Incremental / Big Bang / Strangler Fig]

[Explain why this approach was chosen]

### Phases

#### Phase 1: [Foundation] (Iterations 1-[X])

**Goal:** [What this phase accomplishes]

**Changes:**
- [ ] [Change 1]
- [ ] [Change 2]

**Checkpoint:** `<promise>PHASE1_COMPLETE</promise>`

**Rollback point:** [How to revert if needed]

#### Phase 2: [Core Migration] (Iterations [X]-[Y])

**Goal:** [What this phase accomplishes]

**Changes:**
- [ ] [Change 1]
- [ ] [Change 2]

**Checkpoint:** `<promise>PHASE2_COMPLETE</promise>`

**Rollback point:** [How to revert if needed]

#### Phase 3: [Cleanup] (Iterations [Y]-[Z])

**Goal:** [What this phase accomplishes]

**Changes:**
- [ ] Remove deprecated code
- [ ] Update documentation
- [ ] Final verification

**Checkpoint:** `<promise>REFACTOR_COMPLETE</promise>`

---

## File-by-File Plan

| Order | File | Action | Dependencies | Est. Iterations |
|-------|------|--------|--------------|-----------------|
| 1 | `src/[file1].ts` | [Action] | None | 2 |
| 2 | `src/[file2].ts` | [Action] | #1 | 3 |
| 3 | `src/[file3].ts` | [Action] | #1, #2 | 2 |

---

## Verification

### Automated Checks

```bash
# Must all pass at every checkpoint
npm run typecheck     # 0 errors
npm run lint          # 0 errors  
npm run test          # All pass, no modifications
npm run build         # Succeeds
```

### Manual Verification

At each phase checkpoint:

- [ ] Smoke test critical user flows
- [ ] Verify no visual regressions
- [ ] Check browser console for new errors
- [ ] Validate performance metrics

### Comparison Testing

```bash
# Before refactor: capture baseline
npm run test:coverage > coverage-before.txt
npm run build && ls -la dist/ > bundle-before.txt

# After refactor: compare
npm run test:coverage > coverage-after.txt
npm run build && ls -la dist/ > bundle-after.txt

diff coverage-before.txt coverage-after.txt
diff bundle-before.txt bundle-after.txt
```

---

## Risk Management

### Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High | [Strategy] |
| [Risk 2] | Low/Med/High | Low/Med/High | [Strategy] |

### Rollback Plan

**If refactor fails:**

1. `git reset --hard [checkpoint-commit]`
2. [Additional cleanup steps]
3. Document what went wrong in `.ralph/post-mortem.md`

---

## Success Criteria

### Phase Completion

| Phase | Criteria |
|-------|----------|
| Phase 1 | [Specific measurable criteria] |
| Phase 2 | [Specific measurable criteria] |
| Phase 3 | [Specific measurable criteria] |

### Final Verification

- [ ] All original tests pass without modification
- [ ] No new linter errors
- [ ] Build succeeds
- [ ] Bundle size within acceptable range
- [ ] Performance benchmarks pass
- [ ] Documentation updated

---

## Ralph Prompt

Copy this prompt to start the Ralph loop:

```markdown
Execute refactor REF-[NUMBER] per spec at `.ralph/specs/[this-file].md`.

Critical rules:
- Make ONE type of change per iteration
- Run tests after EVERY file modification
- NEVER modify test assertions
- NEVER remove existing tests
- Create git-committable state every 10 iterations

Progress tracking:
Update `.ralph/state.json` after each iteration:
```json
{
  "iteration": N,
  "phase": "1|2|3",
  "filesCompleted": ["file1.ts"],
  "filesRemaining": ["file2.ts", "file3.ts"],
  "testsStatus": "passing",
  "blockers": []
}
```

Checkpoints:
- Phase 1 complete: `<promise>PHASE1_COMPLETE</promise>`
- Phase 2 complete: `<promise>PHASE2_COMPLETE</promise>`
- All done: `<promise>REFACTOR_COMPLETE</promise>`

Verification (run at each checkpoint):
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Escape hatch: If same error 3 times, document in `.ralph/blockers.md` and try alternative approach. If blocked 10+ iterations, output `<promise>REFACTOR_BLOCKED</promise>`.

Max iterations: [50-100 based on scope]
```

---

## Notes

[Additional context, related ADRs, team discussions, etc.]
