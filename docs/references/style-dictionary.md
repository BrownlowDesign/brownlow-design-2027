# Style Dictionary

**Installed:** 4.4.0  
**Docs:** https://styledictionary.com

## Key choices
- DTCG format (`usesDtcg: true`). Token source in `tokens/*.json`.
- Three output platforms: `css` (CSS vars → `src/styles/generated/tokens.css`), `ts` (JS/TS → `src/tokens/generated/tokens.{js,d.ts}`), `glsl` (GLSL constants → `src/gl/glsl/generated/tokens.glsl`).
- Generated files are gitignored; rebuilt by `pnpm tokens:build` (runs before dev/build/verify).

## Known issue (task 000)
`tokens/semantic.json` and `tokens/base/color.json` both declare `"color": { "$type": "color" }` at the group level. Style Dictionary v4 treats this as a fatal collision when `log.warnings: "error"`. Fix tracked in plan `plans/active/000.md`.
