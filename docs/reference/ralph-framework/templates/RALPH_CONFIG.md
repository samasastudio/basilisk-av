# Ralph Configuration

> This file configures Ralph loop behavior for this project. Place in project root alongside CLAUDE.md.

## Loop Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| Default Max Iterations | 15 | Balance between completion and cost |
| Completion Detection | `<promise>*</promise>` pattern | Explicit completion signals |
| State File | `.ralph/state.json` | Track progress across iterations |

## Verification Suite

**Run these commands before ANY completion promise:**

```bash
# 1. Linting (must pass with 0 errors)
npm run lint

# 2. Type checking (must pass with 0 errors)  
npm run typecheck

# 3. Tests (must all pass)
npm run test

# 4. Build (must succeed)
npm run build
```

**Verification is NOT optional.** Never output a completion promise without running the full suite.

## Progress Tracking

Update `.ralph/state.json` after each iteration:

```json
{
  "iteration": 1,
  "startedAt": "2025-01-10T10:00:00Z",
  "lastUpdated": "2025-01-10T10:05:00Z",
  "phase": "implementation",
  "filesModified": [
    "src/components/Feature.tsx",
    "src/hooks/useFeature.ts"
  ],
  "filesCreated": [
    "src/__tests__/Feature.test.tsx"
  ],
  "testsStatus": {
    "total": 45,
    "passing": 43,
    "failing": 2,
    "newlyAdded": 5
  },
  "lintStatus": "passing",
  "buildStatus": "passing",
  "currentFocus": "Fixing failing edge case tests",
  "blockers": [],
  "completionEstimate": "3-5 more iterations"
}
```

## Convergence Rules

### Retry Strategies

| Condition | Action |
|-----------|--------|
| Same error 3 times | Try alternative approach |
| Test failure 5 consecutive iterations | Document and escalate |
| No file changes 3 iterations | Re-read requirements |
| Build failure after code change | Revert and retry differently |

### Forbidden Actions

- **NEVER** delete existing tests to make suite pass
- **NEVER** disable linter rules to fix errors
- **NEVER** skip verification steps
- **NEVER** modify test assertions to match buggy behavior
- **NEVER** add `@ts-ignore` without explicit justification

### Escape Hatches

When blocked, create `.ralph/blockers.md`:

```markdown
# Blocker Report

## Iteration: [N]
## Timestamp: [ISO timestamp]

### Problem
[Clear description of what's blocking progress]

### Attempted Solutions
1. [Approach 1] - [Why it failed]
2. [Approach 2] - [Why it failed]
3. [Approach 3] - [Why it failed]

### Root Cause Hypothesis
[Best guess at underlying issue]

### Recommended Next Steps
1. [Human action needed]
2. [Alternative investigation path]

### Files for Review
- `src/problematic/file.ts` - Lines 45-67
- `src/__tests__/failing.test.ts` - Test "should handle edge case"
```

## Completion Promises

### Standard Promises

| Promise | Use When |
|---------|----------|
| `<promise>QUICK_FIX_COMPLETE</promise>` | Simple fixes, < 5 iterations |
| `<promise>FEATURE_COMPLETE</promise>` | Full feature implementation |
| `<promise>BUG_FIXED</promise>` | Bug fix verified |
| `<promise>REFACTOR_COMPLETE</promise>` | Refactoring done |
| `<promise>DOCS_COMPLETE</promise>` | Documentation updated |

### Phased Promises

| Promise | Use When |
|---------|----------|
| `<promise>PHASE1_CORE_DONE</promise>` | Core implementation complete |
| `<promise>PHASE2_TESTS_DONE</promise>` | Test coverage complete |
| `<promise>PHASE3_POLISH_DONE</promise>` | Edge cases and polish done |
| `<promise>CHECKPOINT_N</promise>` | Reached iteration checkpoint |

### Failure Promises

| Promise | Use When |
|---------|----------|
| `<promise>BLOCKED</promise>` | Cannot proceed, needs human |
| `<promise>INVESTIGATION_COMPLETE</promise>` | Research done, no fix found |
| `<promise>PARTIAL_COMPLETE</promise>` | Some tasks done, others blocked |

## Git Integration

### Commit Conventions

When reaching checkpoints, stage meaningful commits:

```bash
# Feature progress
git add -A
git commit -m "feat(scope): description [ralph:iter-N]"

# Bug fix progress  
git add -A
git commit -m "fix(scope): description [ralph:iter-N]"

# Refactor progress
git add -A
git commit -m "refactor(scope): description [ralph:iter-N]"
```

### Branch Strategy

- Work on feature branches, never main
- Branch naming: `ralph/[type]/[description]`
- Examples: `ralph/feat/user-auth`, `ralph/fix/login-bug`

## Cost Awareness

### Per-Iteration Estimates

| Codebase Size | Est. Cost/Iteration |
|---------------|---------------------|
| Small (< 10 files) | $0.10 - $0.25 |
| Medium (10-50 files) | $0.25 - $0.75 |
| Large (50-200 files) | $0.75 - $2.00 |
| Very Large (200+ files) | $2.00 - $5.00 |

### Budget Alerts

If estimated session cost exceeds $50:
1. Pause and checkpoint
2. Review progress
3. Consider breaking into smaller tasks

## Monitoring

### Health Checks

Every 5 iterations, self-assess:

1. **Progress:** Are we closer to completion than 5 iterations ago?
2. **Velocity:** Are iterations getting faster or slower?
3. **Quality:** Are we introducing new issues?
4. **Focus:** Are we still aligned with original requirements?

### Warning Signs

| Sign | Interpretation | Action |
|------|----------------|--------|
| Same files modified repeatedly | Possible infinite loop | Step back, re-read spec |
| Test count decreasing | Tests being deleted | Stop immediately |
| Build time increasing | Possible bloat | Review changes |
| No new tests added | Coverage gap | Add tests before proceeding |
