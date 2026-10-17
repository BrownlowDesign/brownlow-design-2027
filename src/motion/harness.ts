import { clock } from "./clock";
import type { Tier } from "./types";

/** A unique string so the production bundle search can confirm this file is absent. */
export const HARNESS_MARKER = "__HARNESS_RUNTIME_v001__";

export type HarnessParams = {
  harness: boolean;
  t: number;
  progress: number;
  tier: Tier | null;
  scene: string | null;
  sp: number;
  transition: string | null;
  tp: number;
};

export function parseHarnessParams(search: URLSearchParams): HarnessParams {
  const asFloat = (key: string) => {
    const v = search.get(key);
    if (v === null) return 0;
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  };
  const tier = search.get("tier");
  return {
    harness: search.get("harness") === "1",
    t: asFloat("t"),
    progress: asFloat("progress"),
    tier:
      tier === "full" || tier === "reduced" || tier === "static" ? tier : null,
    scene: search.get("scene"),
    sp: asFloat("sp"),
    transition: search.get("transition"),
    tp: asFloat("tp"),
  };
}

function rAFPromise(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function initHarness(
  search: URLSearchParams,
  tier: Tier
): Promise<void> {
  const params = parseHarnessParams(search);
  // perf=live: freeze for initialization, then unfreeze so the clock drives real renders.
  const perfLive = search.get("perf") === "live";

  clock.freeze();
  clock.set(params.t);

  if (params.progress > 0) {
    const totalH = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, params.progress * totalH);
  }

  // Wait for fonts and images
  await document.fonts.ready;
  const images = Array.from(document.images);
  await Promise.all(images.map((img) => img.decode().catch(() => {})));

  // Two clock.tick calls + two rAF yields ensure R3F renders at least twice
  clock.tick(params.t);
  await rAFPromise();
  await rAFPromise();
  clock.tick(params.t);
  await rAFPromise();
  await rAFPromise();

  window.__HARNESS__ = {
    ready: true,
    tier,
    t: params.t,
    progress: params.progress,
    scenes: [],
    scrollTo(p: number) {
      window.scrollTo(0, p * (document.documentElement.scrollHeight - window.innerHeight));
    },
    setTime(t: number) {
      clock.set(t);
      clock.tick(t);
    },
  };

  // perf=live: unfreeze after initialization so the clock drives real renders.
  // Harness mode stays active (scroll disabled, seeds fixed) but frame timing is real.
  if (perfLive) clock.unfreeze();
}
