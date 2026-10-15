# ADR-0003: Page transition approach

- **Status:** proposed
- **Date:** 2026-10-15
- **Task:** tasks/003-lab-page-transitions.yaml

## Context

The portfolio needs page transitions between the index grid and case-study pages. Constraints from `docs/MOTION.md`: transitions must support three tiers (full/reduced/static), harness mode (`?tp=`), and must not unmount the `<CanvasRoot />` — the canvas quad must remain mounted and animate `uTransition` 0→1 across every navigation. Case studies use `useScrollScene()` (ADR-0002 engine) which must re-initialize cleanly after each navigation.

React 19.3.0 ships `<ViewTransition>` and `viewTransitionName`; Motion 14 ships `AnimatePresence`; GSAP covers the orchestrated overlay pattern. All three were prototyped at identical scenes.

## Options tested

| | A — ViewTransition API | B — Motion AnimatePresence | C — GSAP Overlay |
|---|---|---|---|
| **Case 1: shared-element morph** | Native CSS — browser morphs matched `viewTransitionName` elements automatically | None (crossfade only, no per-element morph) | FLIP possible but requires manual measurement before route change |
| **Case 2: back/scroll restore** | Browser manages natively | Browser manages; scroll-restoration API | Browser manages; scroll-restoration API |
| **Case 3: interrupted nav** | Browser queues/cancels cleanly | AnimatePresence `mode="wait"` queues, second click cancels first | GSAP timeline must be killed + restarted; works but requires `tl.kill()` |
| **Case 4: deep link** | ✓ no transition on direct load | ✓ `initial={false}` on AnimatePresence | ✓ harness check skips entry animation |
| **Case 5: canvas continuity** | ✓ canvas in root layout, never unmounts | ✓ same | ✓ same |
| **Case 6: scroll re-init** | ✓ `useScrollScene` useEffect re-runs on pathname change | ✓ same | ✓ same |
| **tp= harness freeze** | ✗ not possible — browser API, no JS interception | ✓ plain div at `opacity: tp` | ✓ gsap.set cover to `opacity: 1−|2tp−1|` |
| **Reduced tier** | Crossfade only (prefers-reduced-motion CSS) | ✓ easeInOut crossfade | ✓ easeInOut cover |
| **Static tier** | ✓ instant (CSS transition: none) | ✓ duration=0 | ✓ duration=0 |
| **Safari/Firefox support** | Chromium 125+; Safari 18+; Firefox 131+. Morph not available in Safari < 18 | Full (JS-driven, all browsers) | Full (JS-driven, all browsers) |
| **iOS support note** | Mobile Safari 18+ only — ~30% of current traffic on older iOS | All iOS versions | All iOS versions |
| **Complexity (files touched in app/)** | 3 files, ~60 lines | 4 files, ~80 lines | 4 files, ~100 lines |
| **JS added (gzip est.)** | 0KB (React 19 built-in) | ~2KB incremental (motion already in tree) | ~0KB incremental (GSAP already in tree) |
| **Failure mode** | Older Safari: falls back to crossfade silently | None observed | Timeline not cleaned up on interrupted nav without `tl.kill()` |
| **Evidence** | `artifacts/snaps/transitions-a-*` | `artifacts/snaps/transitions-b-*` | `artifacts/snaps/transitions-c-*` |

## Decision

Recommend **B — Motion AnimatePresence**. Primary reason: iOS Safari support. The portfolio's audience skews heavily toward iOS (creative directors, recruiters viewing from iPhones) and iOS 16–17 is still a significant slice of Safari traffic. ViewTransition morphing falls back to a crossfade on older Safari — acceptable degradation — but the shared-element effect is the key differentiator of Variant A and it simply doesn't fire there.

Variant B's limitation is that it has no per-element shared-element morph. However, GSAP FLIP can be layered on top of AnimatePresence for specific elements if needed — it is not inherently excluded by choosing B. The crossfade itself is clean, browser-independent, and supported at all tiers.

Variant C (GSAP overlay) is the right pattern for heavy orchestration — progress-based cover-and-reveal — but adds complexity (timeline lifecycle, interrupted-nav cleanup) that isn't justified for the current use case. Worth revisiting if transitions need to synchronize with canvas shader sequences.

Strongest counter: Variant A will be the natural choice once ViewTransition reaches ~95% browser coverage (expected 2027). If the portfolio is still active then, consider migrating.

After Ryan accepts: keep `MotionPageTransition` + `TransitionLink` as the public API in `src/motion/transitions/`; delete the `GsapOverlay` and Variant A layout wiring from `app/lab/transitions/`; update `docs/MOTION.md` to document the public API.

## Consequences

- `motion/react` is a permanent dep; `MotionPageTransition` is the only file that imports it in `src/motion/`.
- Every route that wants a page transition wraps `{children}` in `<MotionPageTransition routeKey={pathname}>` via a `template.tsx`.
- `canvasSignals.setTransition()` is called externally by whoever drives the transition; for Variant B the canvas signal is not yet wired — add a `useEffect` in `MotionPageTransition` that mirrors opacity to `uTransition` if canvas shader effects are needed.
- `useScrollScene()` is the public API for case-study scroll; it handles tier gating and harness determinism.
- Revisit if: iOS Safari gains ViewTransition support above 95% usage, or if a case study requires synchronized canvas+DOM transition sequences (→ Variant C's overlay pattern).
