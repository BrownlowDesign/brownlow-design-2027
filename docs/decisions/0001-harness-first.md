# ADR-0001: Harness first, determinism as a contract

- **Status:** accepted
- **Date:** 2026-10-12

## Context
The site depends on time- and scroll-driven visuals (shaders, scroll scenes, page transitions). Agents can't verify work they can't see, and screenshots of animated pages aren't reproducible by default. Without a single source of design values, every edit drifts.

## Decision
1. Build the harness (task contracts, plans, verify, hooks, lints) before the site.
2. All motion derives from one clock; every route supports harness mode (`?harness=1&t=&progress=&tier=`) and reports `window.__HARNESS__.ready`.
3. Tokens are the only source of design values and generate CSS, TS and GLSL.
4. One canvas, one scroll owner, one clock. Enforced by lint and dependency rules, not by convention.
5. Motion architecture (scroll engine, page transitions, canvas lifecycle) is decided by lab tasks with evidence before content work starts.

## Consequences
- Some up-front cost before anything visible ships.
- Every new feature must include harness-mode support and tier fallbacks; that's part of `done_when`, not optional.
- Visual baselines are rendered on Linux (Docker/CI) only.
