# brownlow.design — agent map

Ryan's portfolio site. Next.js (App Router) + TypeScript + Tailwind, R3F for WebGL, deployed on Vercel from GitHub.
The site is visually complex (tokens, motion, shaders, scroll, page transitions) and must stay reliable as it changes.

**This file is a map, not a manual.** Before touching an area, read its doc. Don't read every doc up front.

## How work happens here

1. **Every change is a task** in `tasks/NNN-*.yaml`. No task, no code. If Ryan asks for something with no task file, draft the task first and ask him to confirm it.
2. **Run tasks with the `run-task` skill.** It creates `plans/active/NNN.md` and you keep it current (progress, decisions, open risks, next action). The plan is your memory; the chat is not.
3. **Done = evidence.** `pnpm verify --task=NNN` passes AND every `done_when` item in the task has evidence listed in the plan (a path, a number, a check id). "Looks good" is never done.
4. **Visual baselines change only with Ryan's approval.** `pnpm visual:update` always asks. Never edit files under `tests/visual/__screenshots__/`.
5. **Three strikes.** If the same check fails 3 times for the same reason, stop, write what you know in the plan, and escalate.
6. **Fix the harness, not just the code.** When a failure came from missing context, a weak tool, a missing rule, or a missing test, use the `harness-repair` skill so it can't happen again.

## Where things are

| Working on | Read first |
|---|---|
| Layers, folders, what may import what | `docs/ARCHITECTURE.md` |
| Time, scroll, page transitions, harness mode | `docs/MOTION.md` |
| Canvas, scenes, shaders, uniforms | `docs/WEBGL.md` |
| Tokens (color, type, space, motion) | `docs/TOKENS.md` |
| Checks, snapshots, perf budgets | `docs/TESTING.md`, `docs/budgets.json` |
| Visual quality rubric | `docs/DESIGN.md` (Ryan owns this) |
| Narrative / content | `docs/STORY.md` (Ryan owns this) |
| Past decisions | `docs/decisions/` |
| Library docs pinned to our versions | `docs/references/` |
| Known failure patterns not yet encoded | `lessons.md` |

## Layers (enforced by `pnpm boundaries`)

```
tokens ─▶ motion ─▶ components ─▶ sections ─▶ app (routes)
   └────▶ gl ──────────────────────▲
content (typed, zod) ─────────────▶ sections, app
```

## Hard rules (lint-enforced — the error message tells you the fix)

- No raw colors, px values, durations, or easings outside `tokens/`. Use generated tokens.
- Only `src/motion/` touches time, `requestAnimationFrame`, scroll, `gsap`, or `lenis`. Read time from the clock.
- Only `src/gl/` imports `three` or `@react-three/*`. There is exactly one `<Canvas>`: `src/gl/CanvasRoot.tsx`.
- Every route, section and scene supports **harness mode** and all three **tiers** (`full`, `reduced`, `static`). See `docs/MOTION.md`.
- Lab experiments live in `src/app/lab/**` and are never imported by production routes.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server (labs on at `/lab`) |
| `pnpm verify` | Fast gate: typecheck, lint, boundaries. JSON result in `artifacts/verify.json` |
| `pnpm verify --full --task=NNN` | Everything incl. shaders, unit, visual, scope check against the task |
| `pnpm snap <route> --progress=0.4 --tier=full` | Deterministic screenshot you can Read |
| `pnpm perf <route>` | Frame-time stats vs `docs/budgets.json` |
| `pnpm shaders` | Compiles every shader in headless WebGL2 |
| `pnpm tokens:build` | Regenerates CSS / TS / GLSL tokens |

All harness scripts print one JSON object: `status`, `summary`, `evidence` (file paths), `hint` (what to do next).

## Current phase

**Motion lab** — tasks `000`–`005`. Goal: pick the scroll engine, page-transition approach, and canvas architecture with evidence, recorded as ADRs.
Content and final visual design are **blocked** until Ryan fills in `docs/STORY.md` and the rubric in `docs/DESIGN.md`. Lab visuals use placeholder tokens; don't polish them.
