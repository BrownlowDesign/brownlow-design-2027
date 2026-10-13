#!/usr/bin/env node
// Evidence gate. Usage:
//   node scripts/verify.mjs            standard
//   node scripts/verify.mjs --fast     typecheck, lint, boundaries (used by the Stop hook)
//   node scripts/verify.mjs --full     + visual
//   --task=NNN                         also check changed files against the task's scope
//   --only=lint,typecheck              run only these checks
// Prints one JSON object and writes artifacts/verify.json.
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT, emit, ensureDir, readPkg, hasDep, hasBin, run, trimOutput,
  changedFiles, matchesAny, readTask, argValue,
} from './lib/harness.mjs';

const args = process.argv.slice(2);
const mode = args.includes('--full') ? 'full' : args.includes('--fast') ? 'fast' : 'standard';
const taskId = argValue(args, 'task');
const only = argValue(args, 'only')?.split(',');
const pkg = readPkg();

const exists = (p) => existsSync(join(ROOT, p));

const CHECKS = [
  {
    id: 'tokens',
    modes: ['standard', 'full'],
    ready: () => hasDep('style-dictionary', pkg),
    cmd: ['node', ['tokens/build.mjs']],
    hint: 'A token file is invalid or a reference points at a missing token. Fix tokens/*.json; see docs/TOKENS.md.',
  },
  {
    id: 'typecheck',
    modes: ['fast', 'standard', 'full'],
    ready: () => exists('tsconfig.json') && hasBin('tsc'),
    cmd: ['node_modules/.bin/tsc', ['--noEmit', '--pretty', 'false']],
    hint: 'Fix the type errors listed. Do not add `any` or `@ts-ignore`; parse unknown data with zod at the boundary.',
  },
  {
    id: 'lint',
    modes: ['fast', 'standard', 'full'],
    ready: () => exists('eslint.config.mjs') && hasBin('eslint'),
    cmd: ['node_modules/.bin/eslint', ['.', '--max-warnings=0']],
    hint: 'Harness rule messages say exactly what to use instead. Never disable a harness rule inline.',
  },
  {
    id: 'styles',
    modes: ['standard', 'full'],
    ready: () => exists('.stylelintrc.json') && hasBin('stylelint'),
    cmd: ['node_modules/.bin/stylelint', ['src/**/*.css', '--allow-empty-input', '--formatter', 'unix']],
    hint: 'Use token CSS variables (var(--color-...)) instead of raw colors.',
  },
  {
    id: 'boundaries',
    modes: ['fast', 'standard', 'full'],
    ready: () => exists('src') && hasBin('depcruise'),
    cmd: ['node_modules/.bin/depcruise', ['src', '--config', '.dependency-cruiser.cjs', '--output-type', 'err-long']],
    hint: 'A layer imported something it may not. The rule comment names the allowed path; see docs/ARCHITECTURE.md#layer-rules.',
  },
  {
    id: 'unit',
    modes: ['standard', 'full'],
    ready: () => hasBin('vitest'),
    cmd: ['node_modules/.bin/vitest', ['run', '--passWithNoTests', '--reporter=dot']],
    hint: 'Fix the failing unit test or the code it covers. Do not delete or skip tests to pass.',
  },
  {
    id: 'shaders',
    modes: ['standard', 'full'],
    ready: () => hasDep('@playwright/test', pkg) && exists('src/gl'),
    cmd: ['node', ['scripts/shader-check.mjs']],
    hint: 'Compile errors include file and line. Built-ins (position, uv, modelViewMatrix…) are predeclared; see docs/WEBGL.md#shaders.',
  },
  {
    id: 'visual',
    modes: ['full'],
    ready: () => hasDep('@playwright/test', pkg) && exists('playwright.config.ts') && process.env.HARNESS_VISUAL !== '0' && exists('src/motion/harness.ts'),
    cmd: ['node_modules/.bin/playwright', ['test', '--reporter=line']],
    timeoutMs: 900_000,
    hint: 'Diff images are in test-results/. Read the -diff.png. If the change is intended, record it in the plan and ask Ryan to approve `pnpm visual:docker --update-snapshots`. On macOS run `pnpm visual:docker` — local Mac renders never match Linux baselines.',
  },
];

const results = [];

for (const check of CHECKS) {
  if (only && !only.includes(check.id)) continue;
  if (!only && !check.modes.includes(mode)) continue;
  if (!check.ready()) {
    results.push({ id: check.id, status: 'not_configured', summary: 'Tool or config not installed yet (expected only before task 000/001).' });
    continue;
  }
  const [cmd, cmdArgs] = check.cmd;
  const r = run(cmd, cmdArgs, { timeoutMs: check.timeoutMs });
  results.push({
    id: check.id,
    status: r.ok ? 'pass' : 'fail',
    duration_ms: r.duration_ms,
    ...(r.ok ? {} : {
      summary: r.timedOut ? 'Timed out.' : r.spawnError ?? trimOutput(r.output),
      hint: check.hint,
      retryable: true,
    }),
  });
}

// Scope check against the task contract
if (taskId && (!only || only.includes('scope'))) {
  const task = await readTask(taskId);
  const files = changedFiles();
  if (!task) {
    results.push({ id: 'scope', status: 'fail', summary: `No tasks/${taskId}-*.yaml found.`, hint: 'Create the task contract first (run-task skill).', retryable: false });
  } else if (task.__unparsed) {
    results.push({ id: 'scope', status: 'not_configured', summary: 'yaml package not installed.' });
  } else if (files === null) {
    results.push({ id: 'scope', status: 'not_configured', summary: 'Not a git repo or no commits yet.' });
  } else {
    const harnessState = ['plans/**', 'runs/**', 'artifacts/**', 'lessons.md'];
    const outside = files.filter((f) => !matchesAny(f, [...(task.scope?.allow ?? []), ...harnessState]));
    const denied = files.filter((f) => matchesAny(f, task.scope?.deny ?? []));
    const bad = [...new Set([...outside, ...denied])];
    results.push({
      id: 'scope',
      status: bad.length ? 'fail' : 'pass',
      ...(bad.length ? {
        summary: `Changed outside task ${taskId} scope:\n${bad.join('\n')}`,
        hint: 'Revert these, or if the task truly needs them, stop and escalate — scope changes are Ryan\'s call (edit the task contract with his OK).',
        retryable: false,
      } : { summary: `${files.length} changed files, all in scope.` }),
    });
  }
}

const failed = results.filter((r) => r.status === 'fail');
const notConfigured = results.filter((r) => r.status === 'not_configured').map((r) => r.id);
const result = {
  tool: 'verify',
  status: failed.length ? 'fail' : 'pass',
  mode,
  task: taskId ?? null,
  ran_at: new Date().toISOString(),
  summary: failed.length
    ? `${failed.length} check(s) failed: ${failed.map((f) => f.id).join(', ')}`
    : `All ${results.length - notConfigured.length} configured checks passed${notConfigured.length ? `; not configured: ${notConfigured.join(', ')}` : ''}.`,
  checks: results,
  next_action: failed.length
    ? `Fix ${failed[0].id} first (see its hint). Log the attempt in the plan's Failures table. Third failure for the same reason → escalate.`
    : taskId ? 'Fill in evidence for every done_when item in the plan, then run the visual-reviewer if the task has reviewer checks.' : 'OK',
};

ensureDir(join(ROOT, 'artifacts'));
writeFileSync(join(ROOT, 'artifacts', 'verify.json'), JSON.stringify(result, null, 2));
emit(result);
