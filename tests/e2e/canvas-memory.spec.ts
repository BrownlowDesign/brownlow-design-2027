/**
 * Canvas memory budget test for Task 004.
 *
 * Navigates between /lab/canvas and /lab/canvas/next 20 times and verifies:
 *   a) Heap growth stays within docs/budgets.json memory.heap_growth_after_20_navigations_mb_max (15MB)
 *   b) The canvas element is the same DOM node throughout (context never lost)
 *
 * Note: performance.memory is Chromium-only. The test runs in the default chromium project.
 */

import { expect, test } from "@playwright/test";

const BUDGET_MB = 15;
const NAV_COUNT = 20;
const ROUTES = ["/lab/canvas", "/lab/canvas/next"];

test("canvas heap growth ≤ 15MB across 20 navigations", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(ROUTES[0]!);
  await page.waitForLoadState("networkidle");

  // Fingerprint the canvas element
  await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("No canvas on initial load");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).__memTest__ = { fingerprint: "canvas-004-v1", contextLost: 0 };
    canvas.addEventListener("webglcontextlost", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).__memTest__.contextLost++;
    });
  });

  // Force a GC cycle if available, then record baseline heap
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gc?.();
  });
  const heapBefore: number = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (performance as any).memory?.usedJSHeapSize ?? 0;
  });

  // 20 navigations cycling between the two routes
  for (let i = 0; i < NAV_COUNT; i++) {
    const route = ROUTES[(i + 1) % ROUTES.length]!;
    await page.evaluate((href) => {
      const a = document.createElement("a");
      a.href = href;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, route);
    await page.waitForLoadState("networkidle");
  }

  // Force GC again, measure final heap
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gc?.();
  });
  const heapAfter: number = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (performance as any).memory?.usedJSHeapSize ?? 0;
  });

  const growthMb = (heapAfter - heapBefore) / 1024 / 1024;

  const { contextLost, fingerprint } = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (canvas as any)?.__memTest__;
    return { contextLost: t?.contextLost ?? -1, fingerprint: t?.fingerprint ?? "" };
  });

  expect(errors, "no JS errors during navigations").toHaveLength(0);
  expect(fingerprint, "canvas is the same element").toBe("canvas-004-v1");
  expect(contextLost, "no webglcontextlost events").toBe(0);

  if (heapBefore > 0) {
    expect(
      growthMb,
      `heap growth ${growthMb.toFixed(1)}MB should be ≤ ${BUDGET_MB}MB`,
    ).toBeLessThanOrEqual(BUDGET_MB);
  }
});
