# Tokens

Source of truth: `tokens/*.json` in DTCG format (`$value`, `$type`). `pnpm tokens:build` generates:

| Output | Used by |
|---|---|
| `src/styles/generated/tokens.css` | CSS variables, mapped into the Tailwind theme |
| `src/tokens/generated/tokens.ts` | TS constants for motion presets and JS |
| `src/gl/glsl/generated/tokens.glsl` | GLSL constants (`vec3` colors, `float` durations/numbers, `vec4` easings) |

Never edit generated files. The post-edit hook rebuilds tokens when a token file changes.

## Layers

1. `tokens/base/*.json` — raw palette and scales (`color.ink.900`, `space.4`).
2. `tokens/semantic.json` — roles that reference base (`color.surface.default: {color.ink.50}`). Components use semantic tokens only.
3. `tokens/motion.json` — durations, easings, staggers.

## Adding a token

1. Add it to the right file with `$type` and a `$description` saying when to use it.
2. `pnpm tokens:build`.
3. Use the semantic name. If you need a new raw value for a component, escalate: that's a design decision for Ryan.

Current values are **placeholders** for the motion lab. The real system is task `010` (after `docs/DESIGN.md` is filled in).
