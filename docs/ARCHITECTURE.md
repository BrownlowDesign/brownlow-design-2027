# Architecture

## Folders

```
tokens/                 DTCG JSON — the only place raw design values live
  build.mjs             Style Dictionary → CSS vars, TS constants, GLSL constants
src/
  app/                  Next.js routes. Thin: compose sections, load content.
    lab/                Experiments (motion lab). Gated: 404 in production unless NEXT_PUBLIC_LAB=1.
  content/              Typed content (MDX + zod schemas). No UI imports.
  tokens/generated/     Generated TS tokens (do not edit)
  styles/generated/     Generated CSS variables (do not edit)
  motion/               Clock, harness mode, tiers, scroll engine, transitions, motion presets
  gl/                   CanvasRoot, scene registry, scenes/, shaders/, glsl/ includes
    glsl/generated/     Generated GLSL token constants (do not edit)
  components/           DOM components. Stateless where possible. Every one has a story/lab view.
  sections/             Compose components + motion + gl scenes into page sections
tests/
  visual/               Playwright checkpoints (checkpoints.json drives them)
  unit/                 Vitest
scripts/                Harness tools (verify, snap, perf, shader-check, hooks)
tasks/  plans/  runs/  lessons.md   Harness state (see CLAUDE.md)
```

## Layer rules

Dependencies flow one way. `pnpm boundaries` (dependency-cruiser) fails on any violation and its message names the allowed path.

| Layer | May import |
|---|---|
| `tokens/generated` | nothing |
| `motion` | tokens |
| `gl` | tokens, motion |
| `components` | tokens, motion |
| `sections` | tokens, motion, gl, components, content |
| `app` | everything except `app/lab` (from non-lab routes) |
| `content` | nothing UI (zod only) |

Cross-cutting state (current tier, harness mode, route transition state) is provided by `src/motion/MotionProvider.tsx`. Nothing else creates global providers for these.

## Invariants

1. **One canvas.** `src/gl/CanvasRoot.tsx` mounts once in the root layout. Sections register scenes into it (drei `View` / tunnel). A second `<Canvas>` anywhere is a bug.
2. **One clock.** `src/motion/clock.ts` is the only source of time. In harness mode it is frozen and settable.
3. **One scroll owner.** The chosen scroll engine (ADR-0002) is initialized once in `src/motion/`. Sections declare scroll timelines through `useScrollScene()`; they never read `window.scrollY` or attach scroll listeners.
4. **Every visual feature declares its fallback** for `reduced` and `static` tiers.
5. **Parse at the boundary.** Content is validated with zod at load. Components never receive unvalidated data.

## Stack

- Next.js App Router, React, TypeScript strict, Tailwind (theme mapped to token CSS vars)
- `@react-three/fiber`, `@react-three/drei`, `three`
- Scroll/transition libraries: decided by the motion lab (ADR-0002, ADR-0003). Don't add one outside a lab task.
- Hosting: Vercel. PRs get preview deploys automatically; production deploys come from `main` only.

Prefer boring, well-documented libraries. If a library's behavior is opaque, a small in-repo implementation with tests is better than working around it.
