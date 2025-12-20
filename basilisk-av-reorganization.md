# Basilisk AV Repository Reorganization

## Goal
Clean up outdated/temporary files and organize for Claude Code CLI + VS Code extension workflow.

---

## Current Root Files Analysis

### ✅ KEEP (Core Project Files)
| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `CLAUDE.md` | Claude Code project context (NEW) |
| `BACKLOG.md` | Feature inventory (NEW - replaces old roadmap) |
| `roadmap.md` | Shipped features + current interests (REPLACE with new version) |
| `package.json` | Dependencies |
| `index.html` | Entry point |
| `vite.config.ts` | Build config |
| `vitest.config.ts` | Test config |
| `eslint.config.js` | Linting |
| `tailwind.config.js` | Styling |
| `tsconfig*.json` | TypeScript |
| `postcss.config.js` | CSS processing |

### 🗑️ DELETE (Obsolete)
| File | Reason |
|------|--------|
| `REFACTOR_PLAN.md` | Phase 4 complete |
| `GREPTILE_COMMENTS_RESOLUTION.md` | PR-specific, resolved |
| `INLINE_VIZ_MANUAL_TEST.md` | Temp test doc |
| `INLINE_VIZ_REMAINING.md` | Temp tracking doc |
| `PR37_FIX_PLAN.md` | PR-specific, resolved |
| `STRUDEL_INLINE_VIZ_SOLUTION.md` | Superseded by architecture doc |
| `VERIFICATION_PROMPT.md` | Temp prompt doc |
| `hydra_strudel_architecture_*.png` | Timestamped temp file |
| `package.playwright.json` | Merge into package.json |

### 📁 MOVE TO `hydra-scripts/`
| File | Content |
|------|---------|
| `EXAMPLE_SCRIPT_ONE.ts` | Hydra+Strudel audio-reactive kaleidoscope |

### 📁 MOVE TO `docs/`
| File | New Location |
|------|--------------|
| `API.md` | `docs/API.md` |
| `ARCHITECTURE.md` | `docs/ARCHITECTURE.md` |
| `CONTRIBUTING.md` | `docs/CONTRIBUTING.md` |
| `PLAYWRIGHT_MCP.md` | `docs/PLAYWRIGHT_MCP.md` |

### 🚫 GITIGNORE (Claude Code Session Files)
| File | Purpose |
|------|---------|
| `claude-progress.txt` | Session handoff |
| `features.json` | Feature tracking (obsolete with BACKLOG.md) |
| `init.sh` | Dev session script |

### 📝 REPLACE (New Versions)
| File | Action |
|------|--------|
| `roadmap.md` | Replace with slim version (~80 lines) |
| — | Add `BACKLOG.md` (feature inventory) |

---

## Folder Reorganization

### Current Structure
```
basilisk-av/
├── .claude/              # Keep (Claude Code config)
├── .playwright-mcp/      # Gitignore or delete
├── archive/              # Move to docs/archive
├── docs/                 # Consolidate docs here
├── public/               # Keep
├── skills/               # Move to .claude/skills/
├── src/                  # Keep
├── test-samples/         # Keep
└── [root files]
```

### Target Structure
```
basilisk-av/
├── .claude/
│   ├── commands/         # Custom slash commands
│   ├── skills/           # Moved from /skills
│   │   ├── agentic-development/
│   │   ├── basilisk-av/  # Project-specific skill
│   │   ├── basilisk-style/
│   │   └── playwright-verification/
│   └── settings.json
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   ├── PLAYWRIGHT_MCP.md
│   ├── USER_LIBRARY_SPEC.md
│   ├── USER_SAMPLES_GUIDE.md
│   └── archive/          # Historical docs
│       ├── HOW_TO_STRUDEL_HYDRA.md
│       ├── INTEGRATION_SUMMARY.md
│       └── TESTING_GUIDE.md
├── hydra-scripts/        # NEW: Example scripts
│   └── kaleidoscope.ts   # Renamed from EXAMPLE_SCRIPT_ONE.ts
├── public/
├── src/
├── test-samples/
├── BACKLOG.md            # NEW: Feature inventory
├── CLAUDE.md             # NEW: Claude Code context
├── README.md
├── roadmap.md            # REPLACED: Slim version
└── [config files]
```

---

## .gitignore Additions

```gitignore
# Claude Code session files
claude-progress.txt
features.json
init.sh

# Playwright MCP temp files
.playwright-mcp/

# Research notes
Strudel_Inline_Visualization_*.md
```

---

## Git Commands for Cleanup

```bash
# 1. Create hydra-scripts directory and move example
mkdir -p hydra-scripts
git mv EXAMPLE_SCRIPT_ONE.ts hydra-scripts/kaleidoscope.ts

# 2. Move docs to docs/
git mv API.md docs/
git mv ARCHITECTURE.md docs/
git mv CONTRIBUTING.md docs/
git mv PLAYWRIGHT_MCP.md docs/

# 3. Move archive contents into docs/archive
git mv archive docs/

# 4. Move skills into .claude
git mv skills .claude/

# 5. Delete obsolete files
git rm REFACTOR_PLAN.md
git rm GREPTILE_COMMENTS_RESOLUTION.md
git rm INLINE_VIZ_MANUAL_TEST.md
git rm INLINE_VIZ_REMAINING.md
git rm PR37_FIX_PLAN.md
git rm STRUDEL_INLINE_VIZ_SOLUTION.md
git rm VERIFICATION_PROMPT.md
git rm "hydra_strudel_architecture_*.png"
git rm package.playwright.json

# 6. Delete obsolete docs/ files (ESLint docs no longer needed)
git rm docs/ESLINT_ENHANCEMENT_PLAN.md
git rm docs/ESLINT_RULES_SUMMARY.md
git rm docs/TYPE_SAFETY.md

# 7. Remove session files from git (keep locally)
git rm --cached claude-progress.txt
git rm --cached features.json
git rm --cached init.sh

# 8. Update .gitignore
cat >> .gitignore << 'EOF'

# Claude Code session files
claude-progress.txt
features.json
init.sh

# Playwright MCP temp files
.playwright-mcp/

# Research notes
Strudel_Inline_Visualization_*.md
EOF

# 9. Add new files (copy from Claude output)
# - CLAUDE.md (Claude Code context)
# - BACKLOG.md (feature inventory)
# - roadmap.md (replace existing with slim version)

# 10. Commit
git add -A
git commit -m "chore: reorganize repo structure

- Add BACKLOG.md feature inventory
- Slim down roadmap.md to essentials
- Move example script to hydra-scripts/
- Consolidate docs in docs/
- Move skills to .claude/skills/
- Remove obsolete PR/fix/temp docs
- Gitignore Claude session files
"
```

---

## New Files to Add

### 1. `CLAUDE.md`
Root-level context file for Claude Code — automatically read when entering the project:
- Quick project context (stack, conventions)
- Key files reference
- Audio-visual bridge explanation
- Current priorities
- Aesthetic guidelines

### 2. `BACKLOG.md`
Feature inventory organized by domain with priority section at top:
- 🔥 Up Next: Strudel visuals, MIDI I/O, ENV auto-load, fullscreen REPL, dark mode, multi-window
- ✅ Shipped: Core platform, audio bridge, window management, Sound Browser, User Library
- Remaining domains: Keyboard, HUD, Workspace, Pattern Library, Recording, etc.

### 3. `roadmap.md` (replacement)
Slim ~80 line version:
- What's built (shipped features)
- Points to BACKLOG.md for what's next
- Architecture overview
- Running locally

### 4. `.claude/skills/basilisk-av/SKILL.md`
Project-specific Claude Code skill with conventions, architecture, and priorities.

---

## Claude Code Setup After Cleanup

### 1. Create `.claude/skills/basilisk-av/SKILL.md`
Project-specific skill for Claude Code context:

```markdown
# Basilisk AV Development Skill

## Project Overview
Basilisk AV is a live-coding platform combining Strudel (audio patterns) with Hydra (visual synthesis) for audio-visual performances.

## Code Style
- Functional programming patterns (no mutation/recursion except in reduce)
- TypeScript strict mode
- Tailwind for styling with glassmorphism design system

## Architecture
- Services in `src/services/` for business logic
- Hooks in `src/hooks/` for React state
- Components in `src/components/` with flat structure

## Key Files
- `src/utils/patchSuperdough.ts` — Audio routing interceptor
- `src/utils/strudelHydraBridge.ts` — FFT bridge to Hydra
- `src/hooks/useStrudelEngine.ts` — Engine lifecycle

## Testing
- Vitest for unit tests
- Playwright MCP for E2E verification
- 150+ tests baseline

## Audio-Visual Bridge
- Use `a.fft[0-3]` for audio reactivity (bass, mids, highs, presence)
- Initialize Hydra via `initHydra()`
- Strudel patterns via `s()` function

## Aesthetic (Algorithmic Minimalism)
- Monochrome UI with Hydra color accents
- Glassmorphism overlays (85% opacity, backdrop blur)
- Meditative, slow motion
- Tight audio-visual coupling

## Current Priorities
See BACKLOG.md for feature inventory. Top priorities:
1. Strudel inline visuals (pianoroll, punchcard, spiral, etc.)
2. MIDI I/O (controller input, Ableton integration)
3. Multi-window (Hydra on external display)
4. Environment auto-load
5. Dark mode & fullscreen REPL
```

### 2. Update `.claude/settings.json`
Ensure MCP servers are configured:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-playwright"]
    }
  }
}
```

### 3. Keep existing commands
The `/project:verify` and `/project:verify-all` commands in `.claude/commands/` remain useful for feature verification.

---

## Post-Cleanup Verification

```bash
# Verify structure
find . -maxdepth 2 -type f -name "*.md" | sort

# Verify no broken imports
npm run build

# Verify tests still pass
npm test

# Expected root .md files:
# ./BACKLOG.md
# ./CLAUDE.md
# ./README.md
# ./roadmap.md
```

---

## Summary of Changes

| Action | Count |
|--------|-------|
| Files deleted | 9 |
| Files moved to docs/ | 4 |
| Files moved to hydra-scripts/ | 1 |
| Folders reorganized | 2 (archive, skills) |
| New files added | 3 (CLAUDE.md, BACKLOG.md, roadmap.md replacement) |
| Gitignore additions | 5 patterns |
