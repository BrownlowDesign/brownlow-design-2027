---
name: lab-experiment
description: Use for lab tasks (type lab) that compare variants and end in an ADR — scroll engine, page transitions, canvas architecture, tiers.
---

# Run a lab experiment

Labs answer a question with evidence. The deliverable is a decision, not polished UI.

1. **Same scene, every variant.** Build the shared test scene once as data/markup; each variant only differs in the engine/adapter. Differences in visuals between variants invalidate the comparison.
2. **Placeholder visuals.** Use existing tokens. No styling work beyond what the scene needs to be legible.
3. **Isolate library code** in `src/motion/engines/<variant>/` or `src/gl/<variant>/`. Routes under `src/app/lab/<topic>/<variant>/`.
4. **Harness mode first.** Make `?harness=1&progress=` (and `tp=` for transitions) deterministic for a variant before measuring anything else. A variant that can't be made deterministic: record exactly why — that's a result.
5. **Measure the same way for each variant:**
   - double-snap hash at the key checkpoints
   - `pnpm perf <route>` desktop and `--viewport=mobile`
   - JS added: compare `.next` route sizes from `pnpm build` output before/after
   - reduced and static tiers at every checkpoint
   - the task's specific cases (write a Playwright test per case, not a manual check)
6. **Comparison table in the plan**, one row per variant, every cell has a number or a link.
7. **Recommend, don't decide.** Write `docs/decisions/NNNN-*.md` from `docs/decisions/TEMPLATE.md` with `Status: proposed`. Give a clear recommendation and the strongest argument against it.
8. **Ryan tries it.** Push the branch for a Vercel preview; tell him the URLs and what to feel for (e.g. "scroll fast then stop on mobile — does it settle or overshoot?").
9. After the ADR is accepted: implement the public API (`useScrollScene`, `<TransitionLink>`, scene registry) on the winner, delete losing variants' engine code (keep their numbers in the ADR), and update `docs/MOTION.md` / `docs/WEBGL.md` to describe what's real now.
