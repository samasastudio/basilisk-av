# Feature Specification: [FEATURE_NAME]

> Replace bracketed placeholders with actual values. Delete this instruction block when complete.

## Metadata

| Field | Value |
|-------|-------|
| Feature ID | FEAT-[NUMBER] |
| Author | [NAME] |
| Created | [DATE] |
| Status | Draft / Ready / In Progress / Complete |
| Priority | P0 / P1 / P2 / P3 |
| Estimated Effort | [X] Ralph iterations |

---

## Summary

[One paragraph description of what this feature does and why it matters]

## User Story

**As a** [type of user]
**I want** [capability/action]
**So that** [benefit/value]

---

## Requirements

### Functional Requirements

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-1 | [Requirement description] | [How to verify] |
| FR-2 | [Requirement description] | [How to verify] |
| FR-3 | [Requirement description] | [How to verify] |

### Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-1 | Performance: [description] | [measurable target] |
| NFR-2 | Accessibility: [description] | [WCAG level] |
| NFR-3 | Security: [description] | [specific control] |

---

## Acceptance Criteria

### Scenario 1: [Happy Path Name]

```gherkin
GIVEN [initial context/state]
  AND [additional context if needed]
WHEN [action performed]
THEN [expected outcome]
  AND [additional outcome if needed]
```

### Scenario 2: [Edge Case Name]

```gherkin
GIVEN [initial context/state]
WHEN [action performed]
THEN [expected outcome]
```

### Scenario 3: [Error Case Name]

```gherkin
GIVEN [initial context/state]
WHEN [invalid action performed]
THEN [error handling outcome]
```

---

## Technical Design

### Files to Create

| File Path | Purpose | Estimated Lines |
|-----------|---------|-----------------|
| `src/components/[Name].tsx` | Main component | ~100 |
| `src/hooks/use[Name].ts` | State/logic hook | ~50 |
| `src/types/[name].ts` | TypeScript types | ~30 |
| `src/__tests__/[Name].test.tsx` | Unit tests | ~150 |

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/routes/index.tsx` | Add route for new feature |
| `src/components/Nav.tsx` | Add navigation link |

### Dependencies

| Package | Version | Purpose | Already Installed? |
|---------|---------|---------|-------------------|
| [package-name] | ^x.x.x | [why needed] | Yes / No |

### API Changes

**New Endpoints:**
- `GET /api/[resource]` - [description]
- `POST /api/[resource]` - [description]

**Modified Endpoints:**
- `PUT /api/[existing]` - [what changes]

### Data Model

```typescript
interface [FeatureName] {
  id: string;
  // Add fields
}
```

---

## Out of Scope

Explicitly NOT included in this feature:

- [ ] [Thing that might be assumed but isn't included]
- [ ] [Related feature that's separate work]
- [ ] [Edge case being deferred]

---

## Success Metrics

### Completion Criteria (All Must Pass)

- [ ] All functional requirements implemented
- [ ] All acceptance criteria scenarios pass
- [ ] Test coverage ≥ 80% for new code
- [ ] No regressions in existing tests
- [ ] Lint passes with 0 errors
- [ ] TypeScript compiles with 0 errors
- [ ] Build succeeds
- [ ] Documentation updated

### Quality Gates

| Gate | Threshold |
|------|-----------|
| Unit test coverage | ≥ 80% |
| Integration test coverage | ≥ 60% |
| Bundle size increase | < 10KB |
| Lighthouse performance | ≥ 90 |

---

## Ralph Prompt

Copy this prompt to start the Ralph loop:

```markdown
Implement feature FEAT-[NUMBER] per spec at `.ralph/specs/[this-file].md`.

Workflow:
1. Read this spec thoroughly
2. Create TypeScript types first
3. Implement hook with core logic
4. Implement component using hook
5. Write comprehensive tests
6. Run full verification suite

Phase checkpoints:
- After types/hook: `<promise>PHASE1_LOGIC_DONE</promise>`
- After component: `<promise>PHASE2_UI_DONE</promise>`
- After tests pass: `<promise>FEATURE_COMPLETE</promise>`

Verification (run before each promise):
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Max iterations: [20-50 based on complexity]

Escape hatch: If blocked for 5+ iterations, document in `.ralph/blockers.md` and output `<promise>BLOCKED</promise>`.
```

---

## Notes

[Any additional context, links to designs, related tickets, etc.]
