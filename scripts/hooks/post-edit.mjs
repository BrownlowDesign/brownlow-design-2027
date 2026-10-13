#!/usr/bin/env node
// Claude Code PostToolUse hook (Edit|Write|MultiEdit).
// Fast feedback on the single file just edited. Exit 2 = message goes back to Claude.
import { relative } from 'node:path';
import { readStdinJson, run, hasBin, trimOutput, ROOT } from '../lib/harness.mjs';

const input = await readStdinJson();
const abs = input?.tool_input?.file_path;
if (!abs) process.exit(0);
const file = relative(ROOT, abs);

const problems = [];

if (/^tests\/visual\/__screenshots__\//.test(file)) {
  problems.push('Visual baselines must not be edited directly. Revert this file. Baselines change only via `pnpm visual:docker --update-snapshots` with Ryan\'s approval.');
}

if (/^(src\/(tokens|styles|gl\/glsl)\/generated)\//.test(file)) {
  problems.push(`${file} is generated. Revert it and edit tokens/*.json instead, then run \`pnpm tokens:build\`.`);
}

if (/^tokens\/.*\.json$/.test(file)) {
  const r = run('node', ['tokens/build.mjs'], { timeoutMs: 60_000 });
  if (!r.ok && !/Cannot find package 'style-dictionary'/.test(r.output)) {
    problems.push(`Token build failed after editing ${file}:\n${trimOutput(r.output, 20)}`);
  }
}

if (/^(src|tests)\/.*\.(ts|tsx|js|mjs)$/.test(file) && hasBin('eslint')) {
  const r = run('node_modules/.bin/eslint', [file, '--max-warnings=0'], { timeoutMs: 60_000 });
  if (!r.ok) problems.push(`Lint failed for ${file}:\n${trimOutput(r.output, 20)}`);
}

if (/^src\/.*\.css$/.test(file) && hasBin('stylelint')) {
  const r = run('node_modules/.bin/stylelint', [file, '--formatter', 'unix'], { timeoutMs: 60_000 });
  if (!r.ok) problems.push(`Stylelint failed for ${file}:\n${trimOutput(r.output, 20)}`);
}

if (problems.length) {
  process.stderr.write(problems.join('\n\n') + '\n');
  process.exit(2);
}
process.exit(0);
