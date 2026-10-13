---
name: add-shader-scene
description: Use when adding or changing a WebGL scene or shader (anything under src/gl).
---

# Add a shader scene

Read `docs/WEBGL.md` first. After ADR-0004, copy `src/gl/scenes/_reference/` — it's the canonical shape.

1. `src/gl/scenes/<id>/`: `Scene.tsx`, `uniforms.ts`, `<id>.vert`, `<id>.frag`, `README.md` (one paragraph: what it shows, inputs, cost).
2. Uniforms declared in `uniforms.ts` with types and defaults. Standard names: `uTime`, `uProgress`, `uTransition`, `uResolution`.
3. Colors and design numbers from `#include "tokens.glsl"`. Shared math from `src/gl/glsl/` (noise, easing). Don't paste the same function into two shaders — move it to `glsl/`.
4. Register in `src/gl/registry.ts`. Place it in a section with `<View track={ref}>` (or the pattern from ADR-0004).
5. Time comes from the clock via the frame loop; no `performance.now()`, no `clock.getElapsedTime()` from three.
6. Dispose on unregister: geometries, materials, textures, render targets.
7. Static tier: generate `poster.png` with `pnpm snap` on the scene's lab view and place it at the scene folder; the section renders it instead.
8. Check it:
   - `pnpm shaders`
   - Snap at the scene's key progress/transition points, read them, double-snap one for a matching hash
   - `pnpm perf` desktop + mobile; DPR clamp respected
   - Contrast of any text over the scene at every checkpoint (DESIGN.md fail condition)
