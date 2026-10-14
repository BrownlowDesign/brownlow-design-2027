# Lenis — pinned version 1.3.26

Smooth virtual scroll. Used only inside `src/motion/engines/lenis-gsap/`.

## Init

```ts
import Lenis from 'lenis';
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
});
```

## Drive from clock (required by MOTION.md)

```ts
import { clock } from '../../clock';
clock.subscribe((_t, dt) => {
  lenis.raf(dt * 1000); // lenis.raf expects ms delta
});
```

## ScrollTrigger proxy

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';
lenis.on('scroll', ScrollTrigger.update);
ScrollTrigger.scrollerProxy(window, {
  scrollTop: () => lenis.scroll,
  getBoundingClientRect: () => ({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }),
});
```

## Harness mode

In `?harness=1`, do **not** init Lenis. Use `window.scrollTo` directly; GSAP ScrollTrigger reads native scroll position.

## Cleanup

```ts
lenis.destroy();
ScrollTrigger.scrollerProxy(window, undefined); // reset proxy
```
