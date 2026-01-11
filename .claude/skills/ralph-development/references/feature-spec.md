# Feature Specification Template

Copy to `.ralph/specs/[feature-name].md` and fill placeholders.

---

```markdown
# Feature: [FEATURE_NAME]

## Summary
[One paragraph description]

## User Story
As a [role], I want [capability] so that [benefit].

## Requirements

### Functional
| ID | Requirement | Verification |
|----|-------------|--------------|
| FR-1 | [Description] | [How to test] |
| FR-2 | [Description] | [How to test] |

### Non-Functional
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Performance | [metric] |
| NFR-2 | Accessibility | [WCAG level] |

## Acceptance Criteria

```gherkin
GIVEN [context]
WHEN [action]
THEN [outcome]
```

## Technical Design

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/[Name].tsx` | Component |
| `src/hooks/use[Name].ts` | Logic hook |
| `src/__tests__/[Name].test.tsx` | Tests |

### Files to Modify
| File | Changes |
|------|---------|
| `src/routes.tsx` | Add route |

## Out of Scope
- [Explicitly excluded item]

## Success Criteria
- [ ] All FR implemented
- [ ] All acceptance criteria pass
- [ ] Coverage ≥ 80%
- [ ] Lint/typecheck/build pass

## Ralph Prompt

```
Implement [FEATURE_NAME] per spec at `.ralph/specs/[file].md`.

Phases:
1. Types and hook → `<promise>PHASE1_DONE</promise>`
2. Component → `<promise>PHASE2_DONE</promise>`  
3. Tests passing → `<promise>FEATURE_COMPLETE</promise>`

Verification: npm run typecheck && npm run lint && npm run test && npm run build

Max iterations: 20
```
```
