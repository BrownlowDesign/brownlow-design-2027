# Lessons

Failures that should change future runs but aren't encoded yet. Each entry is temporary: the goal is to turn it into a doc update, a better tool, a lint rule, or a test, then delete it here and link the fix.

Format:

```
## YYYY-MM-DD — short name
- What happened:
- Failure type: missing_context | bad_tool | missing_guardrail | weak_verification | other
- Encoded as: (link to commit/file once fixed) | pending
```

<!-- entries below -->

## 2026-10-14 — toHaveScreenshot-compositor-lag-sticky-boundary
- What happened: `toHaveScreenshot` stabilisation loop fires its first poll at `timeout=0` (no rAF wait before capture). At exactly `progress=1.0` on desktop, the `position:sticky` strip-inner sits at `bottom=0` in viewport coordinates — the compositor hadn't yet presented the translated sticky state. Both snapshots in the loop captured the stale "05" card instead of the text-reveal section. `page.screenshot()` after a prior CDP round-trip (waitForFunction, or a separate evaluate) gave the compositor enough time and captured the correct state.
- Failure type: weak_verification (test infrastructure, not app code)
- Fix: replace `expect(page).toHaveScreenshot` with double-rAF evaluate + `page.screenshot({ scale:'css' }) + expect(buffer).toMatchSnapshot`. The double-rAF gives the compositor time to present the sticky release. `scale:'css'` matches `toHaveScreenshot`'s default (logical pixels, not device pixels) so existing baselines stay valid.
- Encoded as: `tests/visual/checkpoints.spec.ts` (line 63-71); note that `--update-snapshots=all` is required when regenerating baselines with this approach (plain `--update-snapshots` only creates missing snapshots).

## 2026-10-14 — verify-script-sets-CI-1-conflicts-with-running-server
- What happened: `scripts/lib/harness.mjs`'s `run()` always injects `CI=1` into subprocess env. `playwright.config.ts` uses `reuseExistingServer: !process.env.CI`, so `pnpm verify --full` always sets `reuseExistingServer: false`. Running a dev/prod server on port 3100 before `pnpm verify` blocks the visual step ("port already in use").
- Failure type: missing_context (not documented)
- Fix: kill port 3100 before running `pnpm verify --full`. Or: `HARNESS_VISUAL=0 pnpm verify` to skip visual step during active development.
- Encoded as: pending (should add a note to docs/TESTING.md)

## 2026-10-13 — eslint-no-restricted-imports-glob-bleed
- What happened: `eslint.harness.mjs` used ESLint `no-restricted-imports` `group` arrays (gitignore-style glob matching). ESLint v9 strips leading `../` from relative import specifiers before matching, so `motion/*` matched `../motion/clock` in `src/gl/` — blocking an import that the `dependency-cruiser` explicitly allows (`src/gl may import src/motion`). The same path-stripping would have caused `three/*` to match a hypothetical `../three-compat/something`. Any future `group:` entry with a bare package name will have the same bleed if a local directory shares that prefix.
- Failure type: missing_guardrail → weak_verification (guardrail existed but used wrong matching mode; no test verified it)
- Fix: replace both `group` arrays in `importRules()` with anchored `regex` strings that match only npm package import specifiers:
  - `^(three(/.*)?|@react-three/.+)$`
  - `^(gsap(/.*)?|@gsap/.+|lenis(/.*)?|motion(/.*)?|framer-motion(/.*)?)$`
- Encoded as: `tests/unit/lint-rules.test.ts` (8 cases); `eslint.harness.mjs` patched in task 001 (Ryan-approved scope exception).

## 2026-10-13 — checkpoints-t-array-not-iterated
- What happened: `tests/visual/checkpoints.json` specified `"t": [0, 1, 2.5]` (an array of clock times) but `checkpoints.spec.ts` typed `t` as `number` (scalar). `String([0,1,2.5])` became `"0,1,2.5"`, `parseFloat` in `initHarness` returned 0 for all three frames. Every CI baseline captured `t = 0.000` — the spec never verified frames differed, so all three "passed".
- Failure type: weak_verification (snapshots passed but all showed the same frozen frame; no assertion that different `t` values produce different output)
- Fix: treat `t` as a fourth iteration axis in the spec (array coerced to single-element when scalar); name files `__t-<value>`; add animation-integrity assertions: full tier → first/last frames NOT byte-identical; reduced tier → first/last frames ARE byte-identical.
- Encoded as: `tests/visual/checkpoints.spec.ts` (array iteration + Buffer.equals assertions).

## 2026-10-13 — token-group-type-collision
- What happened: `tokens/semantic.json` and `tokens/base/color.json` both declared `"$type": "color"` on the top-level `"color"` group. Style Dictionary v4 with `log.warnings: "error"` treats any duplicate path as a fatal collision, even when the values are identical. Blocked `pnpm tokens:build` for all of task 000.
- Failure type: missing_guardrail
- Fix: move `$type` off the group level in semantic files; set it on each leaf token instead. Group-level `$type` should only exist in the base file that defines the scale.
- Encoded as: tests/unit/tokens.test.ts (GLSL + CSS regression tests); scope exception approved by Ryan in task 000.
