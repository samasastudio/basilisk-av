# Ralph Prompt Templates

> Ready-to-use prompts for common scenarios. Copy, customize the bracketed values, and run.

---

## Quick Fixes (3-5 iterations)

### Typo / Text Fix

```markdown
Fix typo in [FILE_PATH].

Change: "[INCORRECT_TEXT]" → "[CORRECT_TEXT]"

Verification:
- `npm run lint` passes
- `npm run build` succeeds

Output `<promise>QUICK_FIX_COMPLETE</promise>` when done.
Max iterations: 3
```

### Config Change

```markdown
Update configuration in [CONFIG_FILE].

Change:
- [SETTING_NAME]: [OLD_VALUE] → [NEW_VALUE]

Verification:
- `npm run lint` passes
- `npm run build` succeeds
- [SPECIFIC_VERIFICATION if needed]

Output `<promise>QUICK_FIX_COMPLETE</promise>` when done.
Max iterations: 5
```

### Dependency Update

```markdown
Update [PACKAGE_NAME] from [OLD_VERSION] to [NEW_VERSION].

Steps:
1. Update package.json
2. Run `npm install`
3. Fix any breaking changes (check changelog)
4. Run tests

Verification:
- `npm run lint` passes
- `npm run test` passes
- `npm run build` succeeds

Output `<promise>QUICK_FIX_COMPLETE</promise>` when done.
Max iterations: 5
```

---

## Standard Features (10-20 iterations)

### New React Component

```markdown
Create new React component: [COMPONENT_NAME]

Location: `src/components/[category]/[ComponentName].tsx`

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Props interface:
```typescript
interface [ComponentName]Props {
  [prop1]: [type];
  [prop2]?: [type];
}
```

Include:
- TypeScript types
- Unit tests (≥80% coverage)
- Storybook story (if UI component)

Verification:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Output `<promise>FEATURE_COMPLETE</promise>` when all criteria met.
Max iterations: 15
```

### New API Hook

```markdown
Create React Query hook for [API_ENDPOINT].

Location: `src/hooks/use[ResourceName].ts`

Endpoint: [METHOD] [URL]

Request type:
```typescript
interface [ResourceName]Request {
  [field]: [type];
}
```

Response type:
```typescript
interface [ResourceName]Response {
  [field]: [type];
}
```

Include:
- TypeScript types in `src/types/api/[resource].ts`
- Hook with proper error handling
- Loading and error states
- Unit tests

Verification:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Output `<promise>FEATURE_COMPLETE</promise>` when done.
Max iterations: 15
```

### New Utility Function

```markdown
Create utility function: [FUNCTION_NAME]

Location: `src/lib/[category]/[functionName].ts`

Signature:
```typescript
function [functionName]([params]): [returnType]
```

Behavior:
- [Behavior 1]
- [Behavior 2]
- Handle edge case: [edge case]

Include:
- JSDoc documentation
- Comprehensive unit tests
- Export from `src/lib/index.ts`

Verification:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Output `<promise>FEATURE_COMPLETE</promise>` when done.
Max iterations: 10
```

---

## Bug Fixes (5-15 iterations)

### Standard Bug Fix

```markdown
Fix bug: [BUG_DESCRIPTION]

Reproduction:
1. [Step 1]
2. [Step 2]
3. Bug occurs: [what happens]

Expected: [correct behavior]

Process:
1. Add failing test that reproduces bug
2. Confirm test fails
3. Implement fix
4. Confirm test passes
5. Run full suite for regressions

Verification:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Output `<promise>BUG_FIXED</promise>` when verified.
Max iterations: 15

Escape: If not fixed after 10 iterations, document investigation in `.ralph/blockers.md` and output `<promise>BUG_BLOCKED</promise>`.
```

### Performance Bug

```markdown
Fix performance issue: [DESCRIPTION]

Current behavior: [X] ms / [metric]
Target: [Y] ms / [metric]

Suspected cause: [hypothesis]

Process:
1. Add performance test/benchmark
2. Measure baseline
3. Implement optimization
4. Measure improvement
5. Verify no functional regression

Do NOT:
- Sacrifice correctness for speed
- Remove features
- Add complexity without measurable gain

Verification:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Output `<promise>PERF_FIX_COMPLETE</promise>` with before/after metrics.
Max iterations: 20
```

---

## Refactors (25-100 iterations)

### Pattern Migration

```markdown
Migrate [OLD_PATTERN] to [NEW_PATTERN] in [SCOPE].

Files to migrate:
- `src/[file1].ts`
- `src/[file2].ts`
- `src/[file3].ts`

Rules:
- ONE file per iteration
- Run tests after each file
- NEVER modify test assertions
- NEVER remove tests

Before pattern:
```typescript
[example of old pattern]
```

After pattern:
```typescript
[example of new pattern]
```

Progress tracking:
Update `.ralph/state.json` after each file:
```json
{
  "iteration": N,
  "filesCompleted": ["file1.ts"],
  "filesRemaining": ["file2.ts", "file3.ts"],
  "testsStatus": "passing"
}
```

Verification (after each file):
```bash
npm run typecheck && npm run lint && npm run test
```

Final verification:
```bash
npm run build
```

Checkpoints:
- 25% complete: `<promise>MIGRATION_25</promise>`
- 50% complete: `<promise>MIGRATION_50</promise>`
- 75% complete: `<promise>MIGRATION_75</promise>`
- Done: `<promise>REFACTOR_COMPLETE</promise>`

Max iterations: 50
```

### Framework Migration

```markdown
Migrate from [OLD_FRAMEWORK] to [NEW_FRAMEWORK].

Scope: [describe what's being migrated]

Phase 1: Setup (iterations 1-10)
- Install new framework
- Create adapter/shim layer
- Verify existing tests still pass
- Output `<promise>PHASE1_SETUP_DONE</promise>`

Phase 2: Core migration (iterations 11-50)
- Migrate files one at a time
- Update imports
- Remove shim usage where possible
- Output `<promise>PHASE2_CORE_DONE</promise>` at iteration 50

Phase 3: Cleanup (iterations 51-75)
- Remove old framework
- Remove shim layer
- Update documentation
- Output `<promise>REFACTOR_COMPLETE</promise>`

Rules:
- Keep both frameworks working until Phase 3
- Test after every file change
- Document any incompatibilities

Verification at each phase:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Max iterations: 75
```

---

## TDD Workflows

### TDD Feature

```markdown
Implement [FEATURE] using strict TDD.

Red-Green-Refactor cycle:
1. Write ONE failing test
2. `npm run test` - confirm RED
3. Write minimal code to pass
4. `npm run test` - confirm GREEN
5. Refactor if needed
6. `npm run test` - confirm still GREEN
7. Repeat

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Test file: `src/__tests__/[feature].test.ts`
Implementation: `src/[feature].ts`

Coverage target: ≥90%

Output `<promise>TDD_COMPLETE</promise>` when:
- All requirements implemented
- All tests passing
- Coverage target met

Max iterations: 20
```

---

## Documentation

### API Documentation

```markdown
Generate API documentation for [SCOPE].

Tasks:
- Add JSDoc to all public functions
- Add @param, @returns, @throws annotations
- Add @example for complex functions
- Update README if needed

Style:
```typescript
/**
 * Brief description of function.
 *
 * Longer description if needed.
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = functionName(arg);
 * ```
 */
```

Verification:
- `npm run lint` passes (JSDoc rules)
- `npm run build` succeeds

Output `<promise>DOCS_COMPLETE</promise>` when done.
Max iterations: 10
```

### README Update

```markdown
Update README.md for [SCOPE/FEATURE].

Sections to update:
- [ ] Installation instructions
- [ ] Usage examples
- [ ] API reference
- [ ] Configuration options

Requirements:
- All code examples must be runnable
- No broken links
- Consistent formatting

Output `<promise>DOCS_COMPLETE</promise>` when done.
Max iterations: 5
```

---

## Batch Operations

### Multi-Task Batch

```markdown
Execute task queue from `.ralph/batch-tasks.md`.

Rules:
- Complete tasks sequentially
- Git commit after each task
- On task failure after 20 iterations, log and proceed
- Total budget: [N] iterations

Task format in batch-tasks.md:
```markdown
## Task 1: [Name]
[Description]
Promise: TASK1_DONE

## Task 2: [Name]
[Description]  
Promise: TASK2_DONE
```

Progress: Update `.ralph/batch-progress.json` after each task.

Final: Output `<promise>BATCH_COMPLETE</promise>` with summary.
Max iterations: [total budget]
```
