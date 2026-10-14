import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Tier = 'full' | 'reduced' | 'static';

type Checkpoint = {
  name: string;
  route: string;
  progress?: number[];
  tiers?: Tier[];
  /** Clock time(s). Array → iterated as a fourth axis, files named __t-<value>. */
  t?: number | number[];
  transition?: string;
  tp?: number[];
  scene?: string;
  sp?: number[];
};

const { checkpoints } = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/visual/checkpoints.json'), 'utf8'),
) as { checkpoints: Checkpoint[] };

for (const cp of checkpoints) {
  const tiers = cp.tiers ?? ['full', 'reduced', 'static'];
  // Scroll/transition position axis
  const axis = cp.tp ? 'tp' : cp.sp ? 'sp' : 'progress';
  const positions = cp.tp ?? cp.sp ?? cp.progress ?? [0];
  // Clock-time axis: scalar coerced to single-element array
  const tValues: number[] = Array.isArray(cp.t) ? cp.t : [cp.t ?? 0];
  const multiT = tValues.length > 1;

  // ── per-frame snapshot tests ────────────────────────────────────────────────
  for (const tier of tiers) {
    for (const pos of positions) {
      for (const tVal of tValues) {
        // Include __t-<v> suffix only when t is an array (multiple clock positions)
        const nameSuffix = multiT ? `__t-${tVal}` : '';
        const snapshotFile = `${cp.name}__${tier}__${axis}-${pos}${nameSuffix}.png`;

        test(`${cp.name} ${tier} ${axis}=${pos}${multiT ? ` t=${tVal}` : ''}`, async ({ page }) => {
          const params = new URLSearchParams({
            harness: '1',
            tier,
            t: String(tVal),
            [axis]: String(pos),
          });
          if (cp.transition) params.set('transition', cp.transition);
          if (cp.scene) params.set('scene', cp.scene);

          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(String(e)));

          if (tier === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.goto(`${cp.route}?${params}`);
          await page.waitForFunction(
            () => (window as unknown as { __HARNESS__?: { ready?: boolean } }).__HARNESS__?.ready === true,
            null,
            { timeout: 20_000 },
          );

          expect(errors, 'page threw errors').toEqual([]);
          await expect(page).toHaveScreenshot(snapshotFile);
        });
      }
    }
  }

  // ── animation integrity assertions ─────────────────────────────────────────
  // For any checkpoint with 2+ t values, assert that:
  //   full   → first and last frames are NOT identical (clock drives the UI)
  //   reduced → first and last frames ARE identical (motion suppressed)
  if (multiT) {
    const firstT = tValues[0]!;
    const lastT = tValues[tValues.length - 1]!;
    const pos = positions[0]!;

    const captureAt = async (
      page: import('@playwright/test').Page,
      tier: Tier,
      tVal: number,
    ): Promise<Buffer> => {
      const params = new URLSearchParams({
        harness: '1',
        tier,
        t: String(tVal),
        [axis]: String(pos),
      });
      if (cp.transition) params.set('transition', cp.transition);
      if (cp.scene) params.set('scene', cp.scene);
      if (tier === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${cp.route}?${params}`);
      await page.waitForFunction(
        () => (window as unknown as { __HARNESS__?: { ready?: boolean } }).__HARNESS__?.ready === true,
        null,
        { timeout: 20_000 },
      );
      return page.screenshot();
    };

    for (const tier of tiers.filter((t): t is 'full' | 'reduced' => t !== 'static')) {
      if (tier === 'full') {
        test(`${cp.name} full — clock drives frames (t=${firstT}↔${lastT} differ)`, async ({ page }) => {
          const a = await captureAt(page, 'full', firstT);
          const b = await captureAt(page, 'full', lastT);
          expect(
            a.equals(b),
            `animation not driven by the clock at ${cp.route} — t=${firstT} and t=${lastT} produced identical frames`,
          ).toBe(false);
        });
      } else {
        test(`${cp.name} reduced — motion suppressed (t=${firstT}↔${lastT} identical)`, async ({ page }) => {
          const a = await captureAt(page, 'reduced', firstT);
          const b = await captureAt(page, 'reduced', lastT);
          expect(
            a.equals(b),
            `reduced tier should suppress animation at ${cp.route} — t=${firstT} and t=${lastT} produced different frames`,
          ).toBe(true);
        });
      }
    }
  }
}
