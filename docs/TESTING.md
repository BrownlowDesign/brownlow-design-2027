# Testing and evidence

Deterministic checks run first. A model-based review only runs after they pass.

## Checks (`pnpm verify`)

| Check | Fast | Standard | Full | Tool |
|---|---|---|---|---|
| tokens | | ✓ | ✓ | Style Dictionary build |
| typecheck | ✓ | ✓ | ✓ | `tsc --noEmit` |
| lint | ✓ | ✓ | ✓ | ESLint (harness rules in `eslint.harness.mjs`) |
| styles | | ✓ | ✓ | Stylelint (no raw colors in CSS) |
| boundaries | ✓ | ✓ | ✓ | dependency-cruiser (`.dependency-cruiser.cjs`) |
| unit | | ✓ | ✓ | Vitest |
| shaders | | ✓ | ✓ | `scripts/shader-check.mjs` |
| visual | | | ✓ | Playwright, driven by `tests/visual/checkpoints.json` |
| scope | with `--task` | | | Changed files vs the task's `scope` |

A check whose tool isn't installed yet reports `not_configured` (allowed only before task 000 is done).

## Visual checkpoints

`tests/visual/checkpoints.json` lists what gets captured:

```json
{ "name": "lab-scroll-a", "route": "/lab/scroll/a", "progress": [0, 0.25, 0.5, 0.75, 1], "tiers": ["full", "reduced", "static"] }
```

Each entry × progress × tier × viewport (desktop 1440×900, mobile 390×844) becomes a screenshot test. Add an entry whenever you add a route, section, or scroll scene.

**Baselines are Linux-rendered.** macOS fonts and GPU differ, so local Mac screenshots never match CI. Update baselines with `pnpm visual:docker --update-snapshots` (runs in the Playwright Docker image) or let CI produce them. Updating baselines requires Ryan's approval.

## Snap (for the agent's own eyes)

`pnpm snap /lab/scroll/a --progress=0.5 --tier=full --viewport=mobile` writes a PNG to `artifacts/snaps/` and prints its path. Read the PNG to check your work before claiming done. Requires `pnpm dev` (or `BASE_URL`) running.

## Perf

`pnpm perf <route>` scrolls the page in harness-live mode and reports frame-time p50/p95/max and long frames against `docs/budgets.json`. Headless CI numbers are software-rendered: use them for regressions (relative), not absolute truth. Absolute budgets are checked locally.

## Review

After deterministic checks pass, the `visual-reviewer` subagent grades the task's snapshots against the rubric in `docs/DESIGN.md`. It has fresh context and didn't write the code. Its verdict and notes go in the plan. Ryan makes the final call on anything visual.
