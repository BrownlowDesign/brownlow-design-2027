# brownlow.design

Portfolio site, built by agents inside a harness. This README is for Ryan. Agents start at `CLAUDE.md`.

## What's here

| Layer | Files |
|---|---|
| Task contract | `tasks/*.yaml`, `tasks/schema.json`, `tasks/BACKLOG.md` |
| Context map | `CLAUDE.md` (map), `docs/` (system of record), `.claude/skills/` (procedures loaded on demand) |
| Tool gateway | `.claude/settings.json` (allow / ask / deny), `scripts/*` (JSON-output tools) |
| Durable state | `plans/active/`, `plans/done/`, `docs/decisions/`, `lessons.md` |
| Evidence gates | `scripts/verify.mjs`, lint/boundary/style rules, `tests/visual/`, `scripts/shader-check.mjs`, `scripts/perf.mjs`, `visual-reviewer` subagent |
| Trace + recovery | `runs/traces.jsonl` (Stop hook), `harness-repair` skill |

## Setup (once)

```bash
# 1. Repo
unzip brownlow-design-harness.zip && cd brownlow-design
git init && git add -A && git commit -m "Harness"
gh repo create brownlow-design --private --source=. --push

# 2. Vercel: import the GitHub repo in the Vercel dashboard (framework: Next.js).
#    Add env var NEXT_PUBLIC_LAB=1 to the *Preview* environment only, so labs show on previews, not production.

# 3. Node + pnpm
nvm use          # Node 22
corepack enable  # pnpm from packageManager

# 4. Docker Desktop (for Linux-rendered visual baselines)
```

## Start Claude Code (in Cursor's terminal)

```bash
claude
```

First prompt:

```
Read CLAUDE.md. Then run task 000 with the run-task skill.
```

After each task finishes, start a fresh session for the next one (`/clear`) — the plan file carries the state, so you don't lose anything:

```
Run task 001 with the run-task skill.
```

For the labs (002–005), say "run task 002 with the run-task and lab-experiment skills".

## Where you're needed

| When | What you do |
|---|---|
| Task 001 | Approve the first visual baselines |
| Each lab (002–005) | Open the Vercel preview on laptop + phone, record your preference in the plan, accept or reject the ADR |
| Before task 010 | Fill in `docs/DESIGN.md` (rubric) and `docs/STORY.md` |
| Any `ask` prompt | Adding deps, pushing, updating baselines, editing the harness itself |
| Escalations | The agent stops and writes what it knows in the plan |

## The metric

Accepted outputs ÷ your review minutes. If a task costs you more review time than it should, the fix is in the harness (`harness-repair`), not a longer prompt.

## Notes

- Hooks run on every edit (single-file lint, token rebuild, baseline protection) and on stop (fast verify + trace). If one misbehaves, `/hooks` in Claude Code shows them; the scripts are in `scripts/hooks/`.
- Snap, perf and shader checks need `pnpm exec playwright install chromium` (task 000 does this).
- macOS screenshots never match Linux baselines. Use `pnpm visual:docker`, or let CI run visual tests.
