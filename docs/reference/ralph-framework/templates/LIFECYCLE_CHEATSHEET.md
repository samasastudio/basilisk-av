# Ralph Development Lifecycle - Quick Reference Card

## Starting a Session

```powershell
# 1. Navigate to project
cd C:\Projects\my-project

# 2. Ensure on feature branch
git checkout -b ralph/feat/my-feature

# 3. Start Claude Code with permissions
claude --dangerously-skip-permissions

# 4. Begin Ralph loop
/ralph-loop "<prompt>" --max-iterations N
```

---

## Iteration Limits Quick Guide

| Task Type | Iterations | Est. Time | Est. Cost |
|-----------|------------|-----------|-----------|
| Typo/Config | 3-5 | 5 min | $0.50 |
| Single function | 5-10 | 15 min | $2 |
| Component | 10-20 | 45 min | $10 |
| Feature | 20-40 | 2 hrs | $25 |
| Large refactor | 50-100 | 4+ hrs | $75 |

**Rule:** When in doubt, start with fewer iterations. You can always continue.

---

## Essential Commands

| Command | Purpose |
|---------|---------|
| `/ralph-loop "prompt"` | Start loop |
| `/ralph-loop:cancel-ralph` | Stop loop |
| `/ralph-loop:help` | Show help |
| `Ctrl+C` | Emergency stop |

---

## Completion Promises

```markdown
Quick: <promise>QUICK_FIX_COMPLETE</promise>
Feature: <promise>FEATURE_COMPLETE</promise>
Bug: <promise>BUG_FIXED</promise>
Refactor: <promise>REFACTOR_COMPLETE</promise>
Phase: <promise>PHASE1_DONE</promise>
Blocked: <promise>BLOCKED</promise>
```

---

## Verification Suite (Always Include)

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

---

## Prompt Structure

```markdown
[ACTION] [THING] per spec at [SPEC_PATH].

Requirements:
- [Specific requirement 1]
- [Specific requirement 2]

Verification:
[verification commands]

Output `<promise>[PROMISE]</promise>` when [criteria].

Max iterations: [N]
```

---

## State File Location

`.ralph/state.json`

```json
{
  "iteration": 5,
  "phase": "implementation",
  "filesModified": ["file.ts"],
  "testsStatus": "passing",
  "blockers": []
}
```

---

## Emergency Recovery

```powershell
# Stop everything
taskkill /F /IM node.exe

# Check damage
git status
git diff

# Options:
git reset --hard HEAD          # Discard all
git stash                      # Save for later
git add -A && git commit -m "WIP"  # Keep progress
```

---

## Workflow Selection

```
Is it a simple change? ─────Yes────► Quick Fix (3-5 iter)
         │
         No
         │
         ▼
Is it well-defined? ────────Yes────► Standard (10-20 iter)
         │
         No
         │
         ▼
Multiple components? ───────Yes────► Complex (25-50 iter)
         │
         No
         │
         ▼
Architecture change? ───────Yes────► Large Refactor (50-100)
         │
         No
         │
         ▼
                           ► Write better spec first
```

---

## Pre-Flight Checklist

Before EVERY Ralph session:

- [ ] On feature branch (not main)
- [ ] Clean git status
- [ ] Spec file created
- [ ] Max iterations decided
- [ ] Completion promise chosen
- [ ] Escape hatch defined
- [ ] Cost estimate acceptable

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project context |
| `RALPH_CONFIG.md` | Loop configuration |
| `.ralph/specs/*.md` | Feature/bug specs |
| `.ralph/state.json` | Progress tracking |
| `.ralph/blockers.md` | Documented blockers |
| `.claude/settings.json` | Permissions |

---

## Windows Gotchas

1. **jq required** - `winget install jqlang.jq`
2. **Use Git Bash path** - `C:\Program Files\Git\usr\bin\bash.exe`
3. **CVE workaround** - Use Write tool approach for v1.0.20+
4. **No WSL mixing** - Stick to native Windows paths

---

## When to Stop Manually

- Same error 3+ times
- No progress for 5 iterations
- Test count decreasing
- Unexpected file deletions
- Cost exceeding budget
- "Bizarre emergent behavior"

---

## Post-Session

```powershell
# Review changes
git diff --stat

# Commit with context
git add -A
git commit -m "feat(scope): description [ralph:iter-N]"

# Push for review
git push -u origin HEAD
```
