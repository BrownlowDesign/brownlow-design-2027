import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Checkpoint = {
  name: string;
  route: string;
  progress?: number[];
  tiers?: Array<'full' | 'reduced' | 'static'>;
  t?: number;
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
  // One "axis" of positions per checkpoint: tp (transition), sp (scene), or page progress.
  const axis = cp.tp ? 'tp' : cp.sp ? 'sp' : 'progress';
  const positions = cp.tp ?? cp.sp ?? cp.progress ?? [0];

  for (const tier of tiers) {
    for (const pos of positions) {
      test(`${cp.name} ${tier} ${axis}=${pos}`, async ({ page }) => {
        const params = new URLSearchParams({ harness: '1', tier, t: String(cp.t ?? 0), [axis]: String(pos) });
        if (cp.transition) params.set('transition', cp.transition);
        if (cp.scene) params.set('scene', cp.scene);

        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));

        if (tier === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(`${cp.route}?${params}`);
        await page.waitForFunction(() => (window as unknown as { __HARNESS__?: { ready?: boolean } }).__HARNESS__?.ready === true, null, { timeout: 20_000 });

        expect(errors, 'page threw errors').toEqual([]);
        await expect(page).toHaveScreenshot(`${cp.name}__${tier}__${axis}-${pos}.png`);
      });
    }
  }
}
