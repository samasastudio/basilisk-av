---
name: ralph-development
description: Autonomous development loops with Claude Code using the Ralph Wiggum plugin. Use when (1) implementing features that benefit from iterative refinement, (2) running long-running agentic coding sessions, (3) executing refactors or migrations, (4) batch processing multiple development tasks, (5) TDD workflows, or (6) any task where Claude should loop until completion criteria are met. Provides spec templates, prompt patterns, Windows configuration, iteration limits, and lifecycle workflows.
---

# Ralph Development Skill

Ralph Wiggum is a Claude Code plugin that forces iterative development loops, preventing early exits until explicit completion criteria are met.

## Core Concept

Ralph intercepts Claude's exit attempts via Stop hooks, re-feeds the original prompt, and continues until:
- A completion promise is detected (e.g., `<promise>FEATURE_COMPLETE</promise>`)
- Max iterations reached
- Manual cancellation

The prompt stays constant; the codebase evolves. Each iteration, Claude sees its own previous changes.

## Quick Start

```bash
claude --dangerously-skip-permissions
/ralph-loop "Implement feature X. Output <promise>DONE</promise> when complete." --max-iterations 15
```

## Workflow Selection

| Task Type | Iterations | Use When |
|-----------|------------|----------|
| Quick fix | 3-5 | Single-file, obvious changes |
| Standard feature | 10-20 | New component, hook, utility |
| Complex feature | 25-50 | Multi-file, state management |
| Large refactor | 50-100 | Framework migration, pattern changes |

## Prompt Structure

Every Ralph prompt requires:

```markdown
[ACTION] [TARGET] per spec at [PATH].

Requirements:
- [Measurable requirement 1]
- [Measurable requirement 2]

Verification:
npm run typecheck && npm run lint && npm run test && npm run build

Output `<promise>[PROMISE]</promise>` when [specific criteria].
Max iterations: [N]
```

**Critical:** Vague prompts fail. Avoid "nice", "clean", "good". Use measurable criteria.

## Completion Promises

| Promise | Use When |
|---------|----------|
| `<promise>QUICK_FIX_COMPLETE</promise>` | Simple fixes |
| `<promise>FEATURE_COMPLETE</promise>` | Full feature |
| `<promise>BUG_FIXED</promise>` | Bug verified fixed |
| `<promise>REFACTOR_COMPLETE</promise>` | Refactor done |
| `<promise>PHASE1_DONE</promise>` | Checkpoint reached |
| `<promise>BLOCKED</promise>` | Cannot proceed |

## Verification Suite

**Always run before any promise:**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Progress Tracking

Update `.ralph/state.json` each iteration:

```json
{
  "iteration": 5,
  "phase": "implementation",
  "filesModified": ["src/Feature.tsx"],
  "testsStatus": "passing",
  "blockers": []
}
```

## Convergence Rules

| Condition | Action |
|-----------|--------|
| Same error 3× | Try alternative approach |
| No progress 5 iterations | Re-read requirements |
| Tests fail 5× consecutive | Document and escalate |

**Forbidden:** Deleting tests, disabling linter rules, modifying assertions to match bugs.

## Escape Hatches

When blocked, create `.ralph/blockers.md` with problem description, attempted solutions, and recommended next steps. Then output `<promise>BLOCKED</promise>`.

## Resources

- `references/windows-setup.md` - Windows (non-WSL) configuration
- `references/feature-spec.md` - Feature specification template
- `references/bugfix-spec.md` - Bug fix specification template  
- `references/refactor-spec.md` - Refactor specification template
- `references/prompt-templates.md` - Ready-to-use prompt patterns
- `assets/claude-settings.json` - Windows `.claude/settings.json` template
- `assets/ralph-state.json` - Initial `.ralph/state.json` template

## Phased Development

For complex work, use checkpoints:

```markdown
Phase 1 (iter 1-15): Core → `<promise>PHASE1_DONE</promise>`
Phase 2 (iter 16-30): Tests → `<promise>PHASE2_DONE</promise>`
Phase 3 (iter 31-40): Polish → `<promise>FEATURE_COMPLETE</promise>`
```

## Parallel Development

Use git worktrees:

```bash
git worktree add ../project-auth -b feature/auth
git worktree add ../project-api -b feature/api
# Run separate Ralph loops in each
```

## Cost Estimates

| Scenario | Est. Cost |
|----------|-----------|
| Quick fix (5 iter) | $0.50-2 |
| Feature (20 iter) | $5-15 |
| Complex (50 iter) | $15-40 |
| Refactor (100 iter) | $40-100 |

## Emergency Stop

- `Ctrl+C` - Keyboard interrupt
- `/ralph-loop:cancel-ralph` - Command
- `taskkill /F /IM node.exe` - Windows force kill
