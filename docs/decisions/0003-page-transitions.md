# ADR-0003: Page transition approach

- **Status:** accepted
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

**A — ViewTransition API.** Ryan evaluated all three on Vercel and the native browser morph felt noticeably better than the JS-driven crossfade (Variant B) even after tuning B's timing and easing.

The iOS < 18 gap is accepted: on older Safari the browser silently falls back to a crossfade — no broken state, just no morph. By the time the portfolio is live iOS 18+ penetration will be high enough that the morph is the common case.

Variant B (Motion AnimatePresence + SharedElement layoutId morph) is **preserved** at `/lab/transitions/b` — not deleted. Ryan may revisit it. Variant C (GSAP overlay) similarly preserved at `/lab/transitions/c`.

Strongest counter: B is the right call if the audience on iOS 17 is larger than expected. Reconsider after the first month of real traffic analytics.

Public API in `src/motion/transitions/` for Variant A: standard Next.js `<Link>` with `<ViewTransition>` wrapping in layout; `viewTransitionName` CSS property on matched elements. No custom `TransitionLink` logic required. `useScrollScene()` is the public API for scroll scenes; unchanged.

## Consequences

- Variant A's public API is `<ViewTransition>` in route layouts + `viewTransitionName` style property on matched elements. Zero JS overhead (React 19 built-in).
- `MotionPageTransition`, `SharedElement`, `GsapOverlay`, `TransitionLink` remain in `src/motion/transitions/` for reference and potential future use — not deleted.
- `useScrollScene()` is the public API for case-study scroll; it handles tier gating and harness determinism.
- Reduced tier: browser respects `prefers-reduced-motion` and skips the morph automatically — no app-level handling needed.
- Revisit if: a case study needs canvas-synchronized transitions (→ Variant C); or if the morph needs to work on a pre-iOS-18 device (→ Variant B with layoutId).
