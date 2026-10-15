# ADR-0002: Scroll engine

- **Status:** accepted
- **Date:** 2026-10-13
- **Task:** tasks/002-lab-scroll-engine.yaml

## Context

The site needs a scroll engine to power pinned sequences, parallax, horizontal strips, and canvas uniform updates. Constraints from `docs/MOTION.md`: the engine must use our single clock, support harness mode (deterministic `jumpToProgress`), and three tiers (full/reduced/static). Perf budget from `docs/budgets.json`: p95 ≤ 18.5ms desktop, ≤ 22ms mobile; max ≤ 50ms desktop, ≤ 66ms mobile.

Three candidates were built as identical scenes at `src/app/lab/scroll/{a,b,c}/` and measured. Full numbers in `plans/active/002.md`.

## Options tested

| Option | Evidence | Pros | Cons |
|---|---|---|---|
| A — Lenis 1.3.26 + GSAP 3.15.0 | artifacts/perf/lab_scroll_a__{desktop,mobile}__full.json | Best mobile long-frame count (4); iOS Safari reliability; GSAP Context cleanup; rich timeline API for future effects | ~54KB bundle (lenis 8.3 + gsap 28.4 + ST 18.0, gzip); worst desktop long-frame count (99) |
| B — Native scroll events + IntersectionObserver | artifacts/perf/lab_scroll_b__{desktop,mobile}__full.json | Zero bundle cost; minimal complexity | Mobile max spikes to 100ms; iOS passive-scroll low-frequency; IntersectionObserver sticky bugs on iOS <15 |
| C — motion.dev 14.2.0 (`scroll`+`animate`) | artifacts/perf/lab_scroll_c__{desktop,mobile}__full.json | ~20–25KB bundle; clean functional API | Mobile max 99.9ms; newer library, less iOS Safari history |

Desktop all three fail absolute budget under SwiftShader/dev — relative comparison valid. Mobile p95 all pass (16.8ms); A has best max (66.7ms vs 100ms for B/C) and fewest long frames (4 vs 5).

## Decision

Recommend **A — Lenis + GSAP**. For a portfolio where each visitor is a potential client, render quality on iOS and visual complexity (future Flip, physics easings, per-element timeline composition) matter more than saving 54KB. Lenis was purpose-built for iOS momentum-scroll parity; ScrollTrigger has the widest iOS Safari fix history of any scroll library. The desktop long-frame regression vs C (99 vs 69) is real but expected to narrow substantially in production builds with a real GPU.

The `useScrollScene()` adapter will wrap `gsap.context()` so all triggers created inside a scene revert atomically when the route unmounts — the right primitive for page transitions.

Strongest counter: B saves ~54KB and has zero dependencies, making it the obvious choice for a high-traffic app. For this portfolio, rejected.

After Ryan accepts, the plan is: implement `useScrollScene()` on engine A; delete engines B and C (numbers live in this ADR); update `docs/MOTION.md` to describe the pattern.

## Consequences

- `lenis`, `gsap`, and the `ScrollTrigger` plugin are permanent deps (~54KB gzip).
- All scroll work in `src/motion/engines/lenis-gsap/`; nothing else may import Lenis or use ScrollTrigger directly.
- `gsap.ticker` must remain driven by our clock (see `docs/MOTION.md`); the clock bridge in `initGsapClockBridge()` is the only place that calls `gsap.updateRoot`.
- `useScrollScene()` returns a cleanup function based on `gsap.context().revert()`.
- Revisit if: Lenis drops iOS support, GSAP licensing changes, or bundle budget forces cuts.
