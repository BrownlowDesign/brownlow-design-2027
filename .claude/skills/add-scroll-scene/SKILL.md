---
name: add-scroll-scene
description: Use when adding or changing scroll-driven animation in a section (pinning, scrubbing, parallax, reveals, scroll-linked shader uniforms).
---

# Add a scroll scene

Requires ADR-0002 accepted (the engine behind `useScrollScene`). Read `docs/MOTION.md` first.

1. Pick a unique `id` (`<section>-<what>`, e.g. `hero-intro`). It appears in `__HARNESS__.scenes` and in snap filenames.
2. Declare it with `useScrollScene({ id, trigger, start, end, pin?, timeline, reduced })` in the section. Never import the scroll library directly.
3. Tweens use `presets.*` from `src/motion/presets.ts`. No literal durations or easings.
4. If the scene drives a shader, pass progress as `uProgress` through the scene's props — don't read scroll inside `src/gl`.
5. Write the `reduced` fallback (opacity/color only, no movement tied to scroll). Static tier: final state, no animation.
6. Add a checkpoint entry to `tests/visual/checkpoints.json` (route, progress points covering the scene's start/middle/end, all tiers). Use `scene=<id>&sp=` to target the scene alone if page progress is too coarse.
7. Check it:
   - `pnpm snap <route> --scene=<id> --sp=0` / `0.5` / `1`, read all three
   - Run twice at `sp=0.5`, hashes must match
   - `pnpm perf <route>` desktop + mobile, compare with the previous artifact
   - `--tier=reduced` and `--tier=static` snaps
8. Record evidence in the plan.
