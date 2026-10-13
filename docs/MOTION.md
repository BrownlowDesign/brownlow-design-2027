# Motion

Everything that moves goes through `src/motion/`. This is what makes motion testable.

## The clock

`src/motion/clock.ts` exports one clock:

```ts
clock.now(): number          // seconds since start (frozen in harness mode)
clock.subscribe(fn): unsub   // fn(time, delta) once per frame — the only rAF loop in the app
clock.set(t: number)         // harness only: jump to time t
```

- GSAP's ticker, R3F's frame loop (`frameloop="demand"` + invalidate, or driven by the clock), and CSS-time animations must all derive from this clock.
- Never call `performance.now()`, `Date.now()` or `requestAnimationFrame` outside `src/motion/`. Lint enforces this.

## Harness mode

Any route loaded with `?harness=1` is deterministic:

| Param | Effect |
|---|---|
| `harness=1` | Clock frozen at 0, smooth scroll disabled, random seeds fixed, cursor effects off |
| `t=2.5` | Clock set to 2.5s |
| `progress=0.4` | Page scroll jumped so every scroll timeline is at 40% of the page |
| `scene=<id>&sp=0.5` | (optional) A single scroll scene jumped to its own 50% |
| `tier=full\|reduced\|static` | Force a tier |
| `transition=<name>&tp=0.5` | Freeze a page transition at 50% (see transitions below) |

When everything has rendered for those params (fonts loaded, textures decoded, canvas drawn at least twice), the app sets:

```ts
window.__HARNESS__ = { ready: true, tier, t, progress, scenes: string[] }
```

`pnpm snap` waits for `ready`. If a page never sets it, snap fails with a hint. A page that can't be captured deterministically isn't done.

`window.__HARNESS__` also exposes `scrollTo(progress)` and `setTime(t)` for perf and interaction tests. Harness code is tree-shaken out unless the param is present (dynamic import).

## Tiers

| Tier | When | Rule |
|---|---|---|
| `full` | Capable GPU, no reduced-motion preference | Everything on |
| `reduced` | `prefers-reduced-motion: reduce`, or weak GPU | No scroll-scrubbed movement or parallax; opacity/color transitions only; shaders render static frames |
| `static` | No WebGL2, save-data, or forced | No canvas. Poster images replace scenes. Page fully readable. |

Detection lives in `src/motion/tier.ts`; components read `useTier()`.

## Scroll scenes

Sections declare scroll behavior; they never implement scroll mechanics.

```ts
useScrollScene({
  id: 'hero-intro',               // unique, appears in __HARNESS__.scenes
  trigger: ref,
  start: 'top top', end: '+=150%',
  pin: true,
  timeline: (tl) => { /* tween using motion presets */ },
  reduced: (el) => { /* fallback */ },
})
```

The implementation behind `useScrollScene` is chosen by **ADR-0002** (lab task 002). Until then this API is the target shape, not code.

## Page transitions

Approach chosen by **ADR-0003** (lab task 003). Whatever wins must support:

- Freezing at a transition progress (`transition=<name>&tp=`) for snapshots
- Interrupted navigation (click another link mid-transition)
- Back/forward with correct scroll restoration
- Canvas continuity: the WebGL canvas never unmounts on navigation
- Reduced tier: crossfade only; static tier: instant

## Motion presets

Durations and easings come from motion tokens (`tokens/motion.json`) via `src/motion/presets.ts`. Tweens reference presets by name (`presets.enter`, `presets.scrub`), never literal numbers.
