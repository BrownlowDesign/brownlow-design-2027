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

## 2026-10-13 — token-group-type-collision
- What happened: `tokens/semantic.json` and `tokens/base/color.json` both declared `"$type": "color"` on the top-level `"color"` group. Style Dictionary v4 with `log.warnings: "error"` treats any duplicate path as a fatal collision, even when the values are identical. Blocked `pnpm tokens:build` for all of task 000.
- Failure type: missing_guardrail
- Fix: move `$type` off the group level in semantic files; set it on each leaf token instead. Group-level `$type` should only exist in the base file that defines the scale.
- Encoded as: tests/unit/tokens.test.ts (GLSL + CSS regression tests); scope exception approved by Ryan in task 000.
