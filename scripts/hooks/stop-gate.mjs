#!/usr/bin/env node
// Claude Code Stop hook.
// 1. If source files changed this session, run the fast verify gate. Failing → block the stop once (exit 2).
// 2. Always append a trace line to runs/traces.jsonl.
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readStdinJson, run, changedFiles, ensureDir, ROOT, git } from '../lib/harness.mjs';

const input = await readStdinJson();
const alreadyBlocked = input?.stop_hook_active === true;

const changed = changedFiles() ?? [];
const codeChanged = changed.filter((f) => /^(src|tests|tokens)\//.test(f) || /^[^/]+\.(ts|mjs|cjs|json)$/.test(f));

const activePlans = existsSync(join(ROOT, 'plans', 'active'))
  ? readdirSync(join(ROOT, 'plans', 'active')).filter((f) => f.endsWith('.md'))
  : [];
const activeTask = activePlans[0]?.match(/^(\d{3})/)?.[1] ?? null;
const planStatus = activePlans[0]
  ? readFileSync(join(ROOT, 'plans', 'active', activePlans[0]), 'utf8').match(/\*\*Status:\*\*\s*([a-z]+)/)?.[1] ?? null
  : null;

let gate = { ran: false };
if (codeChanged.length && !alreadyBlocked && existsSync(join(ROOT, 'node_modules'))) {
  const r = run('node', ['scripts/verify.mjs', '--fast'], { timeoutMs: 240_000 });
  let parsed = null;
  try { parsed = JSON.parse(r.output.slice(r.output.indexOf('{'))); } catch {}
  gate = { ran: true, status: parsed?.status ?? (r.ok ? 'pass' : 'fail'), summary: parsed?.summary };
}

ensureDir(join(ROOT, 'runs'));
appendFileSync(
  join(ROOT, 'runs', 'traces.jsonl'),
  JSON.stringify({
    at: new Date().toISOString(),
    session: input?.session_id ?? null,
    task: activeTask,
    plan_status: planStatus,
    changed_files: changed.length,
    head: git(['rev-parse', '--short', 'HEAD'])?.trim() ?? null,
    gate: gate.ran ? gate.status : 'skipped',
    stop: gate.ran && gate.status === 'fail' ? 'blocked_by_gate' : alreadyBlocked ? 'stopped_after_block' : 'stopped',
  }) + '\n',
);

if (gate.ran && gate.status === 'fail') {
  process.stderr.write(
    `Fast verify failed — you can't stop with a broken build.\n${gate.summary}\n` +
    `Run \`pnpm verify --fast\` for details and fix it. If you can't fix it, record the failure in the plan ` +
    `(Failures table + Next action) and tell Ryan it's blocked.\n`,
  );
  process.exit(2);
}
process.exit(0);
