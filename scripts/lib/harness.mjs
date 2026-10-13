// Shared helpers for harness scripts. Every script prints exactly one JSON object.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = process.cwd();

export function emit(result, exitCode = result.status === 'pass' ? 0 : 1) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(exitCode);
}

export function ensureDir(p) {
  mkdirSync(p, { recursive: true });
  return p;
}

export function readPkg() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  } catch {
    return {};
  }
}

export function hasDep(name, pkg = readPkg()) {
  return Boolean(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

export function hasBin(name) {
  return existsSync(join(ROOT, 'node_modules', '.bin', name));
}

/** Run a command; never throws. Returns { ok, code, output, duration_ms, timedOut }. */
export function run(cmd, args, { timeoutMs = 300_000, env = {} } = {}) {
  const start = Date.now();
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env, FORCE_COLOR: '0', CI: process.env.CI ?? '1', ...env },
    maxBuffer: 32 * 1024 * 1024,
  });
  const output = `${r.stdout ?? ''}${r.stderr ?? ''}`.replaceAll(`${ROOT}/`, '');
  return {
    ok: r.status === 0,
    code: r.status,
    output,
    duration_ms: Date.now() - start,
    timedOut: r.error?.code === 'ETIMEDOUT',
    spawnError: r.error && r.error.code !== 'ETIMEDOUT' ? String(r.error.message) : undefined,
  };
}

/** Keep the lines an agent needs; drop the noise. */
export function trimOutput(output, maxLines = 40) {
  const lines = output.split('\n').map((l) => l.trimEnd()).filter(Boolean);
  if (lines.length <= maxLines) return lines.join('\n');
  const signal = lines.filter((l) =>
    /^(\/|src\/|tests\/)|error|Error|ERROR|✘|✖|×|failed|FAIL|warning|not allowed|violat|expected|Received|Diff|at .*:\d+:\d+|\.(ts|tsx|js|mjs|css|glsl|frag|vert):\d+/.test(l),
  );
  const picked = signal.length ? signal : lines.slice(-maxLines);
  const out = picked.slice(0, maxLines);
  if (picked.length > maxLines) out.push(`… ${picked.length - maxLines} more lines (rerun the step directly for the full log)`);
  return out.join('\n');
}

export function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

/** Files changed vs HEAD, plus untracked files. null if not a git repo / no HEAD. */
export function changedFiles() {
  const tracked = git(['diff', '--name-only', 'HEAD']);
  if (tracked === null) return null;
  const untracked = git(['ls-files', '--others', '--exclude-standard']) ?? '';
  return [...new Set([...tracked.split('\n'), ...untracked.split('\n')].filter(Boolean))];
}

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(file, globs = []) {
  return globs.some((g) => globToRegExp(g).test(file));
}

export async function readTask(id) {
  const dir = join(ROOT, 'tasks');
  if (!existsSync(dir)) return null;
  const file = readdirSync(dir).find((f) => f.startsWith(`${id}-`) && f.endsWith('.yaml'));
  if (!file) return null;
  let YAML;
  try {
    YAML = (await import('yaml')).default;
  } catch {
    return { __file: join('tasks', file), __unparsed: true };
  }
  return { ...YAML.parse(readFileSync(join(dir, file), 'utf8')), __file: join('tasks', file) };
}

/** Read stdin fully (for Claude Code hooks). */
export async function readStdinJson() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

export function argValue(args, name, fallback) {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  if (hit === `--${name}`) return true;
  return hit.slice(name.length + 3);
}

/** Launch headless Chromium with software WebGL. On failure, emits a structured error instead of a stack trace. */
export async function launchBrowser(tool, extraArgs = []) {
  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    emit({ tool, status: 'fail', summary: '@playwright/test is not installed.', hint: 'Task 000 installs it: pnpm add -D @playwright/test && pnpm exec playwright install chromium' });
  }
  try {
    return await chromium.launch({
      executablePath: process.env.HARNESS_CHROMIUM_PATH || undefined,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none', ...extraArgs],
    });
  } catch (e) {
    emit({
      tool,
      status: 'fail',
      summary: `Could not launch Chromium: ${String(e.message).split('\n')[0]}`,
      hint: 'Run `pnpm exec playwright install chromium` (browser version must match @playwright/test). Or set HARNESS_CHROMIUM_PATH to a Chromium binary.',
      retryable: false,
    });
  }
}
