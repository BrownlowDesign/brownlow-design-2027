#!/usr/bin/env node
// Deterministic screenshot for the agent to Read.
// Usage: node scripts/snap.mjs <route> [--t=1.5] [--progress=0.4] [--tier=full|reduced|static]
//        [--viewport=desktop|mobile] [--transition=name --tp=0.5] [--scene=id --sp=0.5] [--out=path.png]
// Needs the app running at BASE_URL (default http://localhost:3000).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, emit, ensureDir, argValue, launchBrowser } from './lib/harness.mjs';

const args = process.argv.slice(2);
const route = args.find((a) => !a.startsWith('--'));
if (!route) emit({ tool: 'snap', status: 'fail', summary: 'Missing route.', hint: 'pnpm snap /lab/clock --t=1 --tier=full' });

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const viewport = argValue(args, 'viewport', 'desktop');
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
if (!VIEWPORTS[viewport]) emit({ tool: 'snap', status: 'fail', summary: `Unknown viewport ${viewport}`, hint: 'Use desktop or mobile.' });

const params = new URLSearchParams({ harness: '1' });
for (const key of ['t', 'progress', 'tier', 'transition', 'tp', 'scene', 'sp']) {
  const v = argValue(args, key);
  if (v !== undefined && v !== true) params.set(key, String(v));
}
const url = `${base}${route}${route.includes('?') ? '&' : '?'}${params}`;

const slug = `${route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root'}__${[...params.entries()].filter(([k]) => k !== 'harness').map(([k, v]) => `${k}-${v}`).join('_') || 'default'}__${viewport}`;
const out = argValue(args, 'out') || join(ensureDir(join(ROOT, 'artifacts', 'snaps')), `${slug}.png`);

const browser = await launchBrowser('snap');
const consoleErrors = [];
try {
  const context = await browser.newContext({ ...VIEWPORTS[viewport], reducedMotion: params.get('tier') === 'reduced' ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
  } catch (e) {
    emit({ tool: 'snap', status: 'fail', url, summary: `Could not load page: ${e.message.split('\n')[0]}`, hint: `Is the app running at ${base}? Start it with \`pnpm dev\` or set BASE_URL.` });
  }

  try {
    await page.waitForFunction(() => window.__HARNESS__?.ready === true, null, { timeout: 15_000 });
  } catch {
    emit({
      tool: 'snap', status: 'fail', url,
      summary: 'Page never set window.__HARNESS__.ready = true.',
      evidence: consoleErrors.slice(0, 10),
      hint: 'Every route must support harness mode (docs/MOTION.md#harness-mode). Check that MotionProvider is in the layout and the page reports ready after fonts, images, and two canvas frames.',
    });
  }

  const harness = await page.evaluate(() => {
    const h = window.__HARNESS__;
    return { tier: h.tier, t: h.t, progress: h.progress, scenes: h.scenes };
  });
  await page.screenshot({ path: out, fullPage: false, animations: 'disabled' });
  const sha256 = createHash('sha256').update(readFileSync(out)).digest('hex');

  emit({
    tool: 'snap',
    status: 'pass',
    url,
    summary: `Captured ${route} (${viewport}).`,
    evidence: [relative(ROOT, out)],
    sha256,
    harness,
    console_errors: consoleErrors.slice(0, 10),
    hint: consoleErrors.length ? 'Page logged errors — fix them before trusting this snap.' : 'Read the PNG to check it.',
  }, consoleErrors.length ? 1 : 0);
} finally {
  await browser.close();
}
