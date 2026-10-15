# Reference Scene

Template for new scenes. Copy this folder, rename the id, adjust shaders.

## Uniforms

| Name | Type | Source | Description |
|---|---|---|---|
| uTime | float | clock.now() | Absolute time in seconds (0 in reduced/static) |
| uProgress | float | canvasSignals / prop | Scroll progress 0–1 |
| uTransition | float | canvasSignals | Page transition 0→1 |
| uResolution | vec2 | canvas size | Viewport px |

## Includes

`#include "tokens.glsl"` is resolved by the webpack/turbopack loader and by `pnpm shaders`.
