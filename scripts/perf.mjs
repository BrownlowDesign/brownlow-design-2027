#!/usr/bin/env node
// Frame-time measurement while scrolling a route top→bottom.
// Usage: node scripts/perf.mjs <route> [--viewport=desktop|mobile] [--tier=full] [--duration=6000] [--navigations=0]
// --navigations=N : instead of scrolling, navigate between <route> and its links N times and report heap growth.
// Headless numbers are software-rendered: use them to compare before/after, not as absolute truth.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, emit, ensureDir, argValue, launchBrowser } from './lib/harness.mjs';

const args = process.argv.slice(2);
const route = args.find((a) => !a.startsWith('--'));
if (!route) emit({ tool: 'perf', status: 'fail', summary: 'Missing route.', hint: 'pnpm perf /lab/scroll/a --viewport=mobile' });

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const viewport = argValue(args, 'viewport', 'desktop');
const tier = argValue(args, 'tier', 'full');
const duration = Number(argValue(args, 'duration', 6000));
const navigations = Number(argValue(args, 'navigations', 0));
const budgets = JSON.parse(readFileSync(join(ROOT, 'docs', 'budgets.json'), 'utf8'));
const frameBudget = viewport === 'mobile' ? budgets.mobile_frame : budgets.frame;

const browser = await launchBrowser('perf', ['--enable-precise-memory-info', '--js-flags=--expose-gc']);
const context = await browser.newContext(
  viewport === 'mobile'
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
const page = await context.newPage();
// perf=live: harness hooks available, but the clock runs in real time.
const url = `${base}${route}?harness=1&perf=live&tier=${tier}`;
const outDir = ensureDir(join(ROOT, 'artifacts', 'perf'));
const slug = `${route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')}__${viewport}__${tier}${navigations ? '__nav' : ''}`;

try {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__HARNESS__?.ready === true, null, { timeout: 15_000 });

  if (navigations > 0) {
    const heap = async () => {
      await page.evaluate(() => window.gc?.());
      return page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
    };
    const start = await heap();
    const links = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')).filter(Boolean));
    if (!links.length) throw new Error('No internal links on page to navigate between.');
    for (let i = 0; i < navigations; i++) {
      await page.click(`a[href="${links[i % links.length]}"]`);
      await page.waitForTimeout(1200);
      await page.goBack();
      await page.waitForTimeout(1200);
    }
    const end = await heap();
    const growthMb = (end - start) / 1024 / 1024;
    const max = budgets.memory.heap_growth_after_20_navigations_mb_max;
    const result = { tool: 'perf', mode: 'navigations', route, navigations, heap_start_mb: +(start / 1048576).toFixed(1), heap_end_mb: +(end / 1048576).toFixed(1), growth_mb: +growthMb.toFixed(1), budget_mb: max };
    const out = join(outDir, `${slug}.json`);
    writeFileSync(out, JSON.stringify(result, null, 2));
    emit({ ...result, status: growthMb <= max ? 'pass' : 'fail', evidence: [relative(ROOT, out)], summary: `Heap grew ${growthMb.toFixed(1)}MB over ${navigations} round trips (budget ${max}MB).`, hint: growthMb <= max ? 'OK' : 'Something isn\'t disposed on unmount: scenes, textures, scroll triggers, listeners. Check the scene registry unregister path.' });
  }

  const stats = await page.evaluate(async (ms) => {
    const deltas = [];
    let last = performance.now();
    let running = true;
    const tick = (now) => { deltas.push(now - last); last = now; if (running) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const max = document.documentElement.scrollHeight - innerHeight;
    const start = performance.now();
    await new Promise((resolve) => {
      const step = () => {
        const p = Math.min(1, (performance.now() - start) / ms);
        window.scrollTo(0, max * p);
        if (p < 1) setTimeout(step, 16); else resolve();
      };
      step();
    });
    running = false;
    const sorted = [...deltas].slice(2).sort((a, b) => a - b);
    const q = (x) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * x))] ?? 0;
    return { frames: sorted.length, p50_ms: q(0.5), p95_ms: q(0.95), max_ms: sorted.at(-1) ?? 0, long_frames_over_32ms: sorted.filter((d) => d > 32).length };
  }, duration);

  const round = (n) => Math.round(n * 10) / 10;
  const result = { tool: 'perf', route, viewport, tier, ...Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, round(v)])), budget: frameBudget };
  const failures = [];
  if (stats.p95_ms > frameBudget.p95_ms) failures.push(`p95 ${round(stats.p95_ms)}ms > ${frameBudget.p95_ms}`);
  if (stats.max_ms > frameBudget.max_ms) failures.push(`max ${round(stats.max_ms)}ms > ${frameBudget.max_ms}`);
  if (stats.long_frames_over_32ms > frameBudget.long_frames_over_32ms_max) failures.push(`${stats.long_frames_over_32ms} long frames > ${frameBudget.long_frames_over_32ms_max}`);
  const out = join(outDir, `${slug}.json`);
  writeFileSync(out, JSON.stringify(result, null, 2));
  emit({
    ...result,
    status: failures.length ? 'fail' : 'pass',
    summary: failures.length ? failures.join('; ') : `Within budget (p95 ${round(stats.p95_ms)}ms).`,
    evidence: [relative(ROOT, out)],
    hint: failures.length ? 'Compare with the previous artifact for this route. Common causes: shader cost at high DPR, layout thrash in scroll callbacks, too many simultaneous scroll triggers.' : 'OK',
  });
} catch (e) {
  emit({ tool: 'perf', status: 'fail', route, summary: String(e.message).split('\n')[0], hint: `Is the app running at ${base} with harness mode working?` });
} finally {
  await browser.close();
}
