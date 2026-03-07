# AGENTS.md - Basilisk AV

Universal context for coding agents working in this repo (Codex, Claude Code, Cursor, Copilot).

## Mission

Basilisk AV is an audio-visual live-coding app that combines Strudel (music) and Hydra (visuals) in one REPL.

Primary stack: Vite + React + TypeScript.

## Dev Loop Commands

```bash
npm run dev        # local dev server at http://localhost:5173
npm run typecheck  # strict TypeScript checks
npm run lint       # ESLint
npm run test       # Vitest
npm run build      # production build
```

Verification gate before completion or merge:

```bash
npm run typecheck && npm run lint && npm test -- --run && npm run build
```

## Non-Negotiable Rules

- Functional style only: no mutation and no recursion (reduce accumulators are allowed).
- TypeScript strict mode: no `any`; use `unknown` when needed.
- No `@ts-ignore` unless explicitly justified in code comments and review notes.
- React function components and hooks only.
- Keep domain placement consistent:
  - `src/components/` for UI
  - `src/hooks/` for hooks
  - `src/services/` for business logic
  - `src/types/` for type definitions

### useEffect Policy

Use effects only for external sync (Web Audio, MIDI, sockets, analytics, fetch with cleanup).

Do not use effects for:
- derived state
- user event handling
- prop-to-state reset patterns
- state that can be computed during render

### State Policy

- Derive, do not store, whenever possible.
- Store IDs and derive objects.
- Keep state close to the consumer.
- Use `useMemo` for expensive computations.

## Codex Workflow Expectations

- Keep commits small and scoped to one concern.
- Do not mix feature WIP with cleanup/docs changes.
- Do not disable tests to pass CI.
- Do not weaken lint rules to silence warnings.
- Do not modify assertions to match buggy behavior.
- Run the verification gate before requesting merge.

## Architecture Quick Map

```text
src/
|- App.tsx                        # app coordinator and engine controls
|- components/
|  |- StrudelRepl.tsx             # unified Strudel + Hydra editor
|  |- HydraCanvas.tsx             # visual output canvas
|  `- ui/                         # shared UI primitives
|- hooks/
|  `- useStrudelEngine.ts         # engine lifecycle
|- services/                      # app business logic
|- types/                         # TypeScript interfaces
`- utils/
   |- patchSuperdough.ts          # audio routing patch (must load before Strudel)
   `- strudelHydraBridge.ts       # exposes a.fft[0-3] for Hydra
```

Audio-reactive contract:
- `window.a.fft[0]`: bass
- `window.a.fft[1]`: low-mid
- `window.a.fft[2]`: high-mid
- `window.a.fft[3]`: highs

## Planning and Docs Map

- `BACKLOG.md`: full feature inventory and idea bank
- `ROADMAP.md`: current execution priorities and acceptance criteria
- `CLAUDE.md`: Claude-specific context
- `RALPH_CONFIG.md`: agentic loop configuration
- `docs/reference/ARCHITECTURE.md`: deep implementation reference
- `docs/reference/API.md`: API contracts
- `docs/development/CONTRIBUTING.md`: contributor workflow
- `docs/specs/`: active feature specs
- `docs/examples/`: versioned example scripts
- `docs/assets/`: screenshots and non-source docs assets

## Git Conventions

- Branches: `feat/<name>`, `fix/<name>`, `chore/<name>`.
- Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`, `chore(scope):`, `docs(scope):`, `test(scope):`.
- Never force-push `main`.

## Completion Checklist

1. Scope stayed focused (no unrelated file churn).
2. Verification gate completed.
3. Docs and links updated for user-visible changes.
4. No temporary artifacts accidentally tracked (`.cursor/plans`, local dumps, screenshots).
