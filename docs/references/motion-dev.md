# Motion (motion.dev) — pinned version 14.2.0

React scroll hooks + imperative animate. Used only inside `src/motion/engines/motion-dev/`.
Import from `motion/react` for React hooks; `motion` for vanilla helpers.

## Scroll tracking

```ts
import { useScroll, useTransform } from 'motion/react';

// Page scroll 0→1
const { scrollYProgress } = useScroll();

// Element in view 0→1
const { scrollYProgress: elemProgress } = useScroll({
  target: ref,
  offset: ['start end', 'end start'],
});

// Map progress to a value
const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
```

## Imperative animation (engine-side, no motion.div in shared markup)

```ts
import { useAnimate } from 'motion/react';
const [scope, animate] = useAnimate();
// scope ref is attached to the scene root
// animate targets are queried within scope:
animate('[data-scene="headline"]', { opacity: 1 }, { duration: 0 }); // instant
```

## Scroll-driven imperative

```ts
import { scroll } from 'motion';
scroll(
  (progress) => {
    animate('[data-scene="headline"]', { opacity: progress }, { duration: 0 });
  },
  { target: containerEl, offset: ['start end', 'end start'] }
);
```

## Harness

Motion's `useScroll` reads `window.scrollY`. After `window.scrollTo(y)`:
- MotionValues update on the next `scroll` event
- Add a `scroll` event listener that calls `MotionValue.set(newValue)` explicitly if needed
- Or: let the two rAF cycles in `initHarness` settle the values

## Reduced tier

Use `duration: 0` or check `useTier()` to skip animations in reduced/static tiers.
