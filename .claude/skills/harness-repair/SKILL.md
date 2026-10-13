---
name: harness-repair
description: Use after a failure that took more than one attempt, or that you only caught by luck — to turn it into a permanent fix in the harness so it can't recur.
---

# Repair the harness

Don't just fix the code. Ask: **what capability was missing, and how do we make it legible and enforceable?**

1. Classify the failure (write it in the plan's Failures row):
   - **missing_context** — the info existed but you didn't have it (in someone's head, buried in a long doc, not in docs/references)
   - **bad_tool** — a script gave unclear output, too much output, a misleading error, or no way to see what you needed
   - **missing_guardrail** — nothing stopped a bad pattern (raw value, wrong import, second canvas, direct scroll listener)
   - **weak_verification** — the checks passed but the result was wrong
2. Pick the fix that matches:
   | Type | Fix |
   |---|---|
   | missing_context | Short addition to the right doc in `docs/`, or a pointer in `CLAUDE.md`'s map. Keep `CLAUDE.md` under ~90 lines. |
   | bad_tool | Change the script's JSON output: clearer `summary`, better `hint`, add `evidence` paths. |
   | missing_guardrail | Lint rule in `eslint.harness.mjs` or a forbidden rule in `.dependency-cruiser.cjs`, **with a message that says what to do instead**. |
   | weak_verification | A unit test, a new checkpoint in `tests/visual/checkpoints.json`, or a Playwright interaction test reproducing the exact case. |
3. Files under `scripts/`, `.claude/`, and `CLAUDE.md` require Ryan's approval — propose the change, he approves the edit.
4. Prove the fix: reproduce the original failure and show the new rule/test/doc catches or prevents it.
5. If you can't encode it now, add an entry to `lessons.md` with `Encoded as: pending`.
