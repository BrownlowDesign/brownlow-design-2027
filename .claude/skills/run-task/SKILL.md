---
name: run-task
description: Use to start, resume, or finish any task in tasks/NNN-*.yaml. Every code change in this repo goes through this skill.
---

# Run a task

## Start
1. Read the task contract `tasks/NNN-*.yaml`. Check `depends_on` tasks are `done` (their plans are in `plans/done/`). If not, stop and tell Ryan.
2. Read only the docs in `read_first`. Pull in other docs later if you hit something they cover.
3. If `plans/active/NNN.md` exists, you're resuming: read it and continue from **Next action**. Don't redo finished steps.
4. Otherwise copy `plans/TEMPLATE.md` to `plans/active/NNN.md`. Copy every `done_when` item into the evidence table. Write a 3–6 line approach.
5. Create a branch: `git switch -c task/NNN-short-name`. Set the task's `status: active`.
6. If anything in the contract is ambiguous in a way that changes what you build, ask Ryan now — one question, with your proposed answer.

## Work
- Small steps. After each meaningful step: update **Progress** and **Next action** in the plan. Commit with `NNN: what changed`.
- Record decisions in the plan as you make them, with the reason.
- Stay inside `scope.allow`. If you need a file outside it, stop and escalate — don't work around it.
- Use `pnpm snap` to look at what you built. Read the PNG. Don't claim visual work is right without seeing it.
- When a check fails: log it in **Failures** (check, attempt #, what, classification). Fix one cause at a time.
- Third failure for the same reason, or any `escalate_when` condition → stop. Write what you know, what you tried, and your best hypothesis in the plan. Tell Ryan.

## Finish
1. `pnpm verify --full --task=NNN`. Must pass.
2. Fill in evidence for every `done_when` row (paths, hashes, numbers, check ids).
3. For `by: reviewer` rows: run the `visual-reviewer` subagent with the task id and the snap paths. Paste its verdict.
4. For `by: ryan` rows: push the branch (asks permission) so Vercel builds a preview, then list exactly what Ryan needs to look at, with URLs and what to judge.
5. If any failure during the task came from missing docs, a weak tool, a missing rule, or a missing test → run `harness-repair` before closing.
6. When Ryan signs off: move the plan to `plans/done/`, set task `status: done`, open a PR (asks permission) summarizing evidence.

Never mark a `done_when` row complete without evidence. "Looks right" is not evidence.
