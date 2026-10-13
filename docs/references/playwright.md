# Playwright

**Installed:** 1.56.0  
**Docs:** https://playwright.dev/docs/intro

## Key choices
- Chromium only (headless). Run `pnpm exec playwright install chromium` after fresh install.
- CI uses `mcr.microsoft.com/playwright:v1.56.0-noble` — tag must match installed version.
- Visual baselines are Linux-rendered (CI image). Never update from macOS — use `pnpm visual:docker --update-snapshots` or let CI produce them.
- Visual tests are driven by `tests/visual/checkpoints.json`. Enabled in task 001.
- Playwright is also used by `scripts/shader-check.mjs` and `scripts/snap.mjs` for headless WebGL2.
