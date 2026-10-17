# ADR-0005: Tier detection strategy and performance budget methodology

- **Status:** accepted (2026-10-17)
- **Date:** 2026-10-16
- **Task:** tasks/005-lab-tiers-and-budgets.yaml

## Context

Tasks 000–004 established the full lab stack. Before building production content, we need to know what "good enough" means for frame performance, and ensure the tier system correctly identifies what the current device can handle. The `/lab/integration` page combines all three lab winners and serves as the perf reference point.

## Decision 1: Tier detection inputs

**Chosen inputs (in priority order):**

1. `navigator.connection.saveData` → `static` (user explicitly opted out of heavy content)
2. No WebGL2 support → `static`
3. `navigator.deviceMemory ≤ 1GB` → `static`; `≤ 2GB` → `reduced`
4. `prefers-reduced-motion: reduce` → `reduced`
5. GPU probe: software renderer string (SwiftShader, llvmpipe) OR timed draw > 8ms → `reduced`
6. Otherwise → `full`

**Rationale:** Detection must be synchronous and settle before the first canvas frame. The GPU probe adds ~1ms on any hardware GPU; the 8ms threshold was chosen to pass all real integrated GPUs (Intel Iris, Apple M-series) while catching software renderers. `deviceMemory` is Chromium/Edge only — absence is treated as neutral (no downgrade).

**Rejected alternatives:**
- Async GPU benchmark: would delay first frame; not worth it for a portfolio
- FPS-based dynamic downgrade mid-session: violates "never flip mid-session" rule; causes visual pop

## Decision 2: Budget methodology

**Two separate threshold sets:**

| Set | Used by | Purpose |
|---|---|---|
| `frame.*` / `mobile_frame.*` | Real-device manual measurement | Actual quality bar for the portfolio |
| `headless_frame.*` | CI `perf` job | Regression detection only; ~2× looser than real-device |

**Rationale:** Headless Chromium software-rasterizes WebGL. p95 on `/lab/integration` is ~50ms headless vs ~8ms on a real GPU. Running the real-device budget in CI would permanently fail. Separate thresholds let CI catch regressions (relative increases) without false positives from the environment.

**Headless thresholds (initial):** p95 ≤ 60ms, max ≤ 120ms, long frames ≤ 30.
These were set from the measured integration page baseline. They will tighten as the real shader budget is understood.

## Decision 3: CI perf job

A dedicated `perf` job in `.github/workflows/verify.yml` runs `tests/e2e/perf-integration.spec.ts` against the `headless_frame` budget on every PR. The 400-iteration regression test (commit `2e84feb`, reverted in the next commit) confirmed the gate fires correctly.

## Recommendation

Accept all three decisions. Together they give a complete, testable definition of "performance is OK" that doesn't require manual measurement on every PR.

**Strongest argument against:** The GPU probe adds ~1ms to first render and could theoretically misfire on a legitimate slow-start device. The mitigation is that the 8ms threshold is generous; a real GPU that takes >8ms on a trivial draw should be treated as reduced anyway.

## Real-device measurements (2026-10-17)

| Device | fps | p95 frame | tier detected |
|---|---|---|---|
| Laptop | 60 | 17ms | full |
| Phone | — | — | — (pending) |

Laptop p95 of 17ms sits just under the `frame.p95_ms: 18.5ms` real-device budget — confirms the budget is well-calibrated. Phone measurement pending.

## Consequences

- `src/motion/tier.ts` is the single source of truth for capability detection
- `docs/budgets.json` carries both real-device and headless budgets; neither set may be loosened without updating this ADR
- Phone real-device numbers to be added to this ADR and `mobile_frame.*` confirmed once measured
