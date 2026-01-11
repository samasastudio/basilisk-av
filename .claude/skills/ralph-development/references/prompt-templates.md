# Ralph Prompt Templates

Ready-to-use prompts. Copy and customize bracketed values.

---

## Quick Fix (3-5 iterations)

```markdown
Fix [ISSUE] in [FILE_PATH].

Change: [OLD] → [NEW]

Verification: npm run lint && npm run build

Output `<promise>QUICK_FIX_COMPLETE</promise>` when done.
Max iterations: 5
```

## New Component (10-15 iterations)

```markdown
Create React component [NAME] at `src/components/[Name].tsx`.

Props:
- [prop1]: [type]
- [prop2]?: [type]

Behavior:
- [Behavior 1]
- [Behavior 2]

Include:
- TypeScript types
- Unit tests (≥80% coverage)

Verification: npm run typecheck && npm run lint && npm run test && npm run build

Output `<promise>FEATURE_COMPLETE</promise>` when done.
Max iterations: 15
```

## New Hook (10-15 iterations)

```markdown
Create hook `use[Name]` at `src/hooks/use[Name].ts`.

Signature: `function use[Name]([params]): [ReturnType]`

Behavior:
- [Behavior 1]
- [Behavior 2]

Include tests in `src/__tests__/use[Name].test.ts`.

Verification: npm run typecheck && npm run lint && npm run test && npm run build

Output `<promise>FEATURE_COMPLETE</promise>` when done.
Max iterations: 15
```

## Bug Fix (10-15 iterations)

```markdown
Fix bug: [DESCRIPTION]

Reproduction:
1. [Step]
2. [Step]
3. Bug: [what happens]

Process:
1. Add failing test
2. Confirm failure
3. Fix
4. Confirm pass
5. Run full suite

Verification: npm run typecheck && npm run lint && npm run test && npm run build

Output `<promise>BUG_FIXED</promise>` when verified.

Escape: After 10 iterations, document in `.ralph/blockers.md` and output `<promise>BLOCKED</promise>`.
Max iterations: 15
```

## TDD Feature (15-20 iterations)

```markdown
Implement [FEATURE] using strict TDD.

Cycle:
1. Write ONE failing test
2. `npm run test` - confirm RED
3. Minimal code to pass
4. `npm run test` - confirm GREEN
5. Refactor if needed
6. Repeat

Requirements:
- [Requirement 1]
- [Requirement 2]

Coverage target: ≥90%

Output `<promise>TDD_COMPLETE</promise>` when all requirements implemented and tests pass.
Max iterations: 20
```

## Pattern Migration (30-50 iterations)

```markdown
Migrate [OLD_PATTERN] → [NEW_PATTERN].

Files:
- `src/[file1].ts`
- `src/[file2].ts`

Rules:
- ONE file per iteration
- Test after each file
- NEVER modify assertions

Before:
```typescript
[old pattern example]
```

After:
```typescript
[new pattern example]
```

Progress: Update `.ralph/state.json` after each file.

Checkpoints:
- 50%: `<promise>MIGRATION_50</promise>`
- Done: `<promise>REFACTOR_COMPLETE</promise>`

Verification: npm run typecheck && npm run lint && npm run test && npm run build
Max iterations: 50
```

## Documentation (5-10 iterations)

```markdown
Generate documentation for [SCOPE].

Tasks:
- [ ] JSDoc on public functions
- [ ] README updates
- [ ] Usage examples

Style:
```typescript
/**
 * Brief description.
 * @param name - Description
 * @returns Description
 * @example
 * ```typescript
 * example()
 * ```
 */
```

Output `<promise>DOCS_COMPLETE</promise>` when done.
Max iterations: 10
```

## Batch Tasks (varies)

```markdown
Execute tasks in `.ralph/batch-tasks.md`.

Rules:
- Complete sequentially
- Git commit after each
- On failure after 20 iter, log and proceed

Format in batch-tasks.md:
## Task 1: [Name]
[Description]
Promise: TASK1_DONE

Final: `<promise>BATCH_COMPLETE</promise>` with summary.
Max iterations: [total budget]
```
