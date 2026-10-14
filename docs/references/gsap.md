# GSAP — pinned version 3.15.0 (+ ScrollTrigger plugin)

Used only inside `src/motion/engines/lenis-gsap/`. Register plugins before use.

## Setup

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

## Clock integration (required by MOTION.md)

For time-based tweens, drive GSAP from our clock so harness mode can freeze time.
Scroll-scrubbed tweens (scrub: true) use scroll position, not time — no clock bridge needed for those.

```ts
// Detach GSAP's own rAF loop:
gsap.ticker.remove(gsap.updateRoot);
// Drive from our clock:
import { clock } from '../../clock';
clock.subscribe((t) => gsap.updateRoot(t * 1000)); // updateRoot expects ms
// Restore on cleanup:
// gsap.ticker.add(gsap.updateRoot);
```

## Scroll-scrubbed timeline

```ts
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: containerEl,
    start: 'top top',
    end: '+=200%',
    pin: true,
    scrub: 0.5, // seconds of lag smoothing (0 = instant for harness)
  },
});
tl.to(el, { opacity: 1 }).to(el2, { scale: 1.5 });
```

## Harness (key calls)

```ts
ScrollTrigger.refresh();   // recalculate trigger positions after DOM changes
ScrollTrigger.update();    // sync all triggers to current scroll position
```

## Cleanup

```ts
ScrollTrigger.killAll();
gsap.ticker.add(gsap.updateRoot); // restore ticker
```
