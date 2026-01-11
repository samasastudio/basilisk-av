# Ralph Development Framework for Claude Code

> A comprehensive development lifecycle optimized for Windows (non-WSL), featuring spec templates, scenario-based workflows, and production-ready configurations.

---

## Table of Contents

1. [Windows Environment Setup](#1-windows-environment-setup)
2. [Project Configuration](#2-project-configuration)
3. [Spec & Requirements Format](#3-spec--requirements-format)
4. [Development Scenarios](#4-development-scenarios)
5. [Prompt Templates](#5-prompt-templates)
6. [Lifecycle Workflows](#6-lifecycle-workflows)
7. [Safety & Cost Management](#7-safety--cost-management)

---

## 1. Windows Environment Setup

### Prerequisites

```powershell
# Install jq (REQUIRED - undocumented dependency)
winget install jqlang.jq

# Verify installation
jq --version

# Install Node.js LTS
winget install OpenJS.NodeJS.LTS

# Install Claude Code globally
npm install -g @anthropic-ai/claude-code
```

### Windows-Specific Configuration

Create `.claude/settings.json` in your project root:

```json
{
  "permissions": {
    "allow": [
      "Bash(C:\\Program Files\\Git\\usr\\bin\\bash.exe:*)",
      "Bash(C:\\Windows\\System32\\cmd.exe:*)",
      "Read(*)",
      "Write(*)"
    ],
    "deny": []
  },
  "hooks": {
    "shell": "C:\\Program Files\\Git\\usr\\bin\\bash.exe"
  }
}
```

### Path Configuration for Git Bash

Add to your `~/.bashrc` or run before Ralph sessions:

```bash
export PATH="/c/Program Files/Git/usr/bin:$PATH"
export PATH="/c/Program Files/nodejs:$PATH"
```

### CVE-2025-54795 Workaround

For Claude Code v1.0.20+, multi-line bash commands fail. Use the Write tool approach:

```json
{
  "hooks": {
    "stopHook": {
      "useWriteTool": true,
      "stateFile": ".ralph/state.json"
    }
  }
}
```

---

## 2. Project Configuration

### Directory Structure

```
project/
├── .claude/
│   ├── settings.json      # Permissions and hooks
│   └── commands/          # Custom slash commands
├── .ralph/
│   ├── state.json         # Loop state tracking
│   ├── prompts/           # Reusable prompt templates
│   └── specs/             # Feature specifications
├── CLAUDE.md              # Project context for Claude
├── RALPH_CONFIG.md        # Ralph-specific instructions
└── src/
```

### CLAUDE.md Template

```markdown
# Project: [NAME]

## Overview
[Brief description of the project, its purpose, and architecture]

## Tech Stack
- Runtime: [Node.js 20 / Python 3.12 / etc.]
- Framework: [React 19 / FastAPI / etc.]
- Testing: [Vitest / pytest / etc.]
- Linting: [ESLint / Ruff / etc.]

## Key Commands
```bash
npm run dev          # Start development server
npm run test         # Run test suite
npm run lint         # Run linter
npm run build        # Production build
```

## Architecture Notes
[Key patterns, folder structure conventions, naming conventions]

## Constraints
- [List any hard constraints: no external APIs, specific versions, etc.]
- [Performance requirements]
- [Security considerations]
```

### RALPH_CONFIG.md Template

```markdown
# Ralph Configuration

## Loop Behavior
- Default max iterations: 15
- Completion detection: Look for `<promise>COMPLETE</promise>`
- Escape hatch: After 10 iterations without progress, document blockers

## Verification Commands
Before marking complete, always run:
1. `npm run lint` - Must pass with 0 errors
2. `npm run test` - Must pass all tests
3. `npm run build` - Must compile successfully

## Progress Tracking
Update `.ralph/state.json` after each iteration with:
- Files modified
- Tests added/passing
- Current blockers

## Convergence Rules
- If same error repeats 3 times, try alternative approach
- If tests fail 5 consecutive iterations, pause and document
- Never remove existing tests to make suite pass
```

---

## 3. Spec & Requirements Format

### Feature Spec Template

Save as `.ralph/specs/FEATURE_TEMPLATE.md`:

```markdown
# Feature: [FEATURE_NAME]

## Summary
[One paragraph description of what this feature does]

## User Story
As a [role], I want [capability] so that [benefit].

## Requirements

### Functional
- [ ] FR-1: [Specific, testable requirement]
- [ ] FR-2: [Specific, testable requirement]
- [ ] FR-3: [Specific, testable requirement]

### Non-Functional
- [ ] NFR-1: [Performance/security/accessibility requirement]
- [ ] NFR-2: [Performance/security/accessibility requirement]

## Acceptance Criteria

```gherkin
GIVEN [precondition]
WHEN [action]
THEN [expected result]
```

## Technical Design

### Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| `src/components/Feature.tsx` | Create | Main component |
| `src/hooks/useFeature.ts` | Create | State management |
| `src/components/Feature.test.tsx` | Create | Unit tests |

### Dependencies
- [List any new packages needed]

### API Changes
- [List any API endpoints affected]

## Out of Scope
- [Explicitly list what this feature does NOT include]

## Success Metrics
- All acceptance criteria pass
- Test coverage >= 80% for new code
- No regression in existing tests
- Lint passes with 0 errors
```

### Bug Fix Spec Template

Save as `.ralph/specs/BUGFIX_TEMPLATE.md`:

```markdown
# Bug Fix: [BUG_TITLE]

## Problem Statement
[Clear description of the bug and its impact]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual behavior]

## Root Cause Analysis
[If known, describe the suspected cause]

## Proposed Solution
[High-level approach to fixing]

## Files Likely Affected
- `src/[file1]`
- `src/[file2]`

## Verification
- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Existing tests still pass
- [ ] No new linter errors

## Escape Hatch
If unable to fix after 15 iterations:
1. Document all attempted approaches
2. List specific blockers
3. Suggest alternative investigation paths
```

### Refactor Spec Template

Save as `.ralph/specs/REFACTOR_TEMPLATE.md`:

```markdown
# Refactor: [REFACTOR_NAME]

## Motivation
[Why this refactor is needed - tech debt, performance, maintainability]

## Scope

### In Scope
- [Specific files/modules to refactor]
- [Specific patterns to change]

### Out of Scope
- [What NOT to touch]

## Target State
[Description of code after refactor]

## Constraints
- Zero functional changes
- All existing tests must pass unchanged
- No new dependencies unless approved

## Verification
- [ ] All tests pass (no modifications to test assertions)
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Bundle size delta < 5%

## Incremental Checkpoints
1. [First safe stopping point]
2. [Second safe stopping point]
3. [Final state]
```

---

## 4. Development Scenarios

### Scenario Matrix

| Scenario | Iterations | Time Est. | Risk | Best For |
|----------|------------|-----------|------|----------|
| Quick Fix | 3-5 | 5-15 min | Low | Typos, config changes |
| Standard Feature | 10-20 | 30-60 min | Medium | New components, APIs |
| Complex Feature | 25-50 | 2-4 hours | High | Multi-file features |
| Large Refactor | 50-100 | 4-8 hours | High | Framework migrations |
| Overnight Batch | 100+ | 8+ hours | High | Major rewrites |

### Scenario: Quick Fix (3-5 iterations)

**Use when:** Single-file changes, obvious fixes, documentation updates

```markdown
# Quick Fix Prompt

Fix [SPECIFIC_ISSUE] in [FILE_PATH].

Requirements:
- Change [X] to [Y]
- Preserve existing behavior

Verification:
- `npm run test -- [test_file]` passes
- `npm run lint` passes

Output `<promise>QUICK_FIX_COMPLETE</promise>` when done.
Max iterations: 5
```

### Scenario: Standard Feature (10-20 iterations)

**Use when:** New component, new API endpoint, new utility

```markdown
# Standard Feature Prompt

Implement [FEATURE_NAME] per spec at `.ralph/specs/[SPEC_FILE].md`.

Workflow:
1. Read spec thoroughly
2. Create file stubs
3. Implement core logic
4. Write tests (aim for 80% coverage)
5. Run full verification suite

Verification:
- All spec requirements checked off
- `npm run test` passes
- `npm run lint` passes
- `npm run build` succeeds

Output `<promise>FEATURE_COMPLETE</promise>` when all criteria met.
Max iterations: 20
```

### Scenario: Complex Feature (25-50 iterations)

**Use when:** Multi-component features, significant state management, integrations

```markdown
# Complex Feature Prompt

Implement [FEATURE_NAME] per spec at `.ralph/specs/[SPEC_FILE].md`.

Phase 1 (iterations 1-15): Core Implementation
- Implement all functional requirements
- Basic happy-path tests
- Output `<promise>PHASE1_CORE_DONE</promise>`

Phase 2 (iterations 16-35): Edge Cases & Polish
- Add edge case handling
- Comprehensive test coverage
- Error states and loading states
- Output `<promise>PHASE2_POLISH_DONE</promise>`

Phase 3 (iterations 36-50): Integration & Verification
- Integration tests
- Full lint/test/build verification
- Documentation updates
- Output `<promise>FEATURE_COMPLETE</promise>`

Escape hatch: If blocked for 5+ iterations on same issue, document in `.ralph/blockers.md` and continue with other work.

Max iterations: 50
```

### Scenario: Large Refactor (50-100 iterations)

**Use when:** Framework migrations, architectural changes, pattern standardization

```markdown
# Large Refactor Prompt

Execute refactor per spec at `.ralph/specs/[SPEC_FILE].md`.

Rules:
- Make ONE type of change per iteration
- Run tests after each file modification
- Commit-worthy state after every 10 iterations
- NEVER modify test assertions to make tests pass

Checkpoints:
- Iteration 25: Core files migrated, tests green → `<promise>CHECKPOINT_25</promise>`
- Iteration 50: Secondary files migrated → `<promise>CHECKPOINT_50</promise>`
- Iteration 75: Edge cases handled → `<promise>CHECKPOINT_75</promise>`
- Iteration 100: Full verification → `<promise>REFACTOR_COMPLETE</promise>`

Progress tracking:
After each iteration, update `.ralph/state.json`:
```json
{
  "iteration": N,
  "filesCompleted": ["file1.ts", "file2.ts"],
  "filesRemaining": ["file3.ts"],
  "testsStatus": "passing|failing",
  "blockers": []
}
```

Max iterations: 100
```

### Scenario: Overnight Batch (100+ iterations)

**Use when:** Major version upgrades, comprehensive rewrites, multi-project work

```markdown
# Overnight Batch Prompt

Execute tasks defined in `.ralph/batch-tasks.md`.

Task Queue:
1. [Task 1 with completion promise TASK1_DONE]
2. [Task 2 with completion promise TASK2_DONE]
3. [Task 3 with completion promise TASK3_DONE]

Rules:
- Complete tasks sequentially
- On task failure after 30 iterations, log to `.ralph/failures.md` and proceed
- Create git commit after each task completion
- Total budget: 150 iterations

Final output: `<promise>BATCH_COMPLETE</promise>` with summary in `.ralph/batch-summary.md`
```

---

## 5. Prompt Templates

### Template: TDD Feature Development

```markdown
# TDD Feature: [NAME]

Implement [FEATURE] using strict Test-Driven Development.

Cycle:
1. Write ONE failing test
2. Run `npm run test` - confirm failure
3. Write minimal code to pass
4. Run `npm run test` - confirm pass
5. Refactor if needed
6. Repeat until feature complete

Requirements:
[List specific requirements]

Test file: `src/__tests__/[feature].test.ts`
Implementation: `src/[feature].ts`

Output `<promise>TDD_COMPLETE</promise>` when:
- All requirements implemented
- All tests passing
- Coverage > 80%
```

### Template: Bug Investigation

```markdown
# Bug Investigation: [BUG_TITLE]

Investigate and fix bug described in `.ralph/specs/[BUG_SPEC].md`.

Process:
1. Reproduce the bug (add failing test)
2. Identify root cause
3. Implement fix
4. Verify fix (test passes)
5. Check for regressions

Output format:
```json
{
  "rootCause": "description",
  "filesModified": ["file1", "file2"],
  "testAdded": "test name",
  "regressionRisk": "low|medium|high"
}
```

Output `<promise>BUG_FIXED</promise>` when verified.

Escape: After 15 iterations, output `<promise>BUG_BLOCKED</promise>` with investigation notes.
```

### Template: Code Review Response

```markdown
# Code Review Response

Address review feedback in `.ralph/review-feedback.md`.

For each feedback item:
1. Understand the concern
2. Implement the fix OR document why alternative approach is better
3. Mark item as resolved

Constraints:
- Do not introduce new features
- Maintain existing test coverage
- Follow project conventions

Output `<promise>REVIEW_COMPLETE</promise>` when all items addressed.
```

### Template: Documentation Generation

```markdown
# Documentation: [SCOPE]

Generate/update documentation for [SCOPE].

Tasks:
- [ ] API documentation (JSDoc/TSDoc)
- [ ] README updates
- [ ] Usage examples
- [ ] Migration guide (if applicable)

Quality criteria:
- All public APIs documented
- Examples are runnable
- No broken links

Output `<promise>DOCS_COMPLETE</promise>` when all tasks done.
Max iterations: 10
```

---

## 6. Lifecycle Workflows

### Workflow A: Feature Development (Start to Finish)

```
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE DEVELOPMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SPEC CREATION (Human)                                    │
│     └─> Create .ralph/specs/feature-name.md                 │
│     └─> Define requirements, acceptance criteria            │
│                                                              │
│  2. IMPLEMENTATION (Ralph Loop)                              │
│     └─> claude --dangerously-skip-permissions               │
│     └─> /ralph-loop "Implement per spec..." --max-iter 20   │
│     └─> Monitor: Check .ralph/state.json periodically       │
│                                                              │
│  3. REVIEW (Human)                                           │
│     └─> Review generated code                               │
│     └─> Add feedback to .ralph/review-feedback.md           │
│                                                              │
│  4. REVISION (Ralph Loop)                                    │
│     └─> /ralph-loop "Address review..." --max-iter 10       │
│                                                              │
│  5. MERGE (Human)                                            │
│     └─> Final review                                        │
│     └─> Merge to main                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Workflow B: Parallel Feature Development (Git Worktrees)

```powershell
# Setup worktrees for parallel development
git worktree add ../project-feature-auth -b feature/auth
git worktree add ../project-feature-api -b feature/api

# Terminal 1: Auth feature
cd ../project-feature-auth
claude --dangerously-skip-permissions
# /ralph-loop "Implement auth per spec" --max-iterations 30

# Terminal 2: API feature (simultaneously)
cd ../project-feature-api
claude --dangerously-skip-permissions
# /ralph-loop "Implement API per spec" --max-iterations 30

# After completion, merge individually
cd ../project-feature-auth && git checkout main && git merge feature/auth
cd ../project-feature-api && git checkout main && git merge feature/api
```

### Workflow C: Incremental Refactor

```
Week 1: Assessment
├─> Run Ralph for codebase analysis
├─> Generate refactor plan in .ralph/specs/refactor-plan.md
└─> Human review and approval

Week 2-3: Execution (phases)
├─> Phase 1: Core module migration (50 iterations)
├─> Human checkpoint review
├─> Phase 2: Secondary modules (50 iterations)  
├─> Human checkpoint review
└─> Phase 3: Cleanup and verification (25 iterations)

Week 4: Stabilization
├─> Integration testing
├─> Performance validation
└─> Documentation updates
```

### Workflow D: CI/CD Integration

```yaml
# .github/workflows/ralph-assisted.yml
name: Ralph-Assisted Development

on:
  issue_comment:
    types: [created]

jobs:
  ralph-fix:
    if: contains(github.event.comment.body, '/ralph-fix')
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Environment
        run: |
          winget install jqlang.jq --silent
          npm install -g @anthropic-ai/claude-code
          
      - name: Extract Issue Details
        id: issue
        run: |
          echo "body=${{ github.event.issue.body }}" >> $GITHUB_OUTPUT
          
      - name: Run Ralph Fix
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude --dangerously-skip-permissions --print "
          Fix issue: ${{ steps.issue.outputs.body }}
          
          Max iterations: 15
          Output <promise>FIX_COMPLETE</promise> when done.
          "
          
      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          title: "fix: Ralph-assisted fix for #${{ github.event.issue.number }}"
          branch: ralph-fix-${{ github.event.issue.number }}
```

---

## 7. Safety & Cost Management

### Iteration Limits by Risk Level

| Risk Level | Max Iterations | Review Frequency | Rollback Strategy |
|------------|----------------|------------------|-------------------|
| Low | 5-10 | Post-completion | Git reset |
| Medium | 15-30 | Every 10 iterations | Branch checkpoint |
| High | 50-100 | Every 25 iterations | Worktree isolation |
| Critical | N/A | Every iteration | Manual only |

### Cost Estimation

```
Approximate costs (Claude Sonnet):
- Quick fix (5 iter): $0.50 - $2
- Standard feature (20 iter): $5 - $15
- Complex feature (50 iter): $15 - $40
- Large refactor (100 iter): $40 - $100
- Overnight batch (150 iter): $75 - $200

Factors affecting cost:
- Codebase size (context window usage)
- File read/write frequency
- Test suite execution time
```

### Safety Checklist

Before starting any Ralph loop:

- [ ] Git branch created and pushed
- [ ] `.ralph/state.json` initialized
- [ ] Max iterations set appropriately
- [ ] Completion promise defined
- [ ] Escape hatch documented
- [ ] Cost estimate reviewed
- [ ] Review checkpoint schedule set

### Emergency Stop Procedures

```powershell
# Method 1: Keyboard interrupt
Ctrl+C (may need multiple presses)

# Method 2: Cancel command
/ralph-loop:cancel-ralph

# Method 3: Kill process
taskkill /F /IM node.exe

# Method 4: Reset state
Remove-Item .ralph/state.json
```

### Recovery from Failed Loops

```powershell
# 1. Check what changed
git status
git diff

# 2. Review Ralph's progress
Get-Content .ralph/state.json | ConvertFrom-Json

# 3. Options:
# A) Keep changes and continue manually
git add -A && git commit -m "WIP: Ralph progress"

# B) Discard and restart
git reset --hard HEAD
Remove-Item .ralph/state.json

# C) Partial keep (interactive)
git add -p
```

---

## Appendix: Quick Reference Card

### Starting a Loop

```bash
claude --dangerously-skip-permissions
/ralph-loop "<prompt>" --max-iterations N
```

### Essential Flags

| Flag | Purpose |
|------|---------|
| `--max-iterations N` | Safety limit (ALWAYS SET) |
| `--completion-promise "TEXT"` | Exact match to stop |
| `--monitor` | Live progress dashboard |

### Completion Promise Patterns

```markdown
<promise>QUICK_FIX_COMPLETE</promise>
<promise>FEATURE_COMPLETE</promise>
<promise>PHASE1_DONE</promise>
<promise>BUG_FIXED</promise>
<promise>REFACTOR_COMPLETE</promise>
<promise>BATCH_COMPLETE</promise>
```

### Verification Commands (Always Include)

```bash
npm run lint      # 0 errors
npm run test      # All pass
npm run build     # Succeeds
```
