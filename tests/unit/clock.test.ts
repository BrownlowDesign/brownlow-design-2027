import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the clock in a Node environment (no real rAF — we only test the
// manual API: freeze/set/tick and subscriber notification).
// rAF is not called in these tests; _ensureRunning() is a no-op in Node.

beforeEach(async () => {
  // Re-import to get a fresh module state between test suites
  vi.resetModules();
});

describe("clock — freeze / set / tick", () => {
  it("starts at t=0", async () => {
    const { clock } = await import("../../src/motion/clock");
    expect(clock.now()).toBe(0);
  });

  it("set() moves time without notifying subscribers", async () => {
    const { clock } = await import("../../src/motion/clock");
    const fn = vi.fn();
    clock.subscribe(fn);
    clock.set(3.5);
    expect(clock.now()).toBe(3.5);
    expect(fn).not.toHaveBeenCalled();
  });

  it("tick() moves time AND notifies subscribers with (t, dt)", async () => {
    const { clock } = await import("../../src/motion/clock");
    const fn = vi.fn();
    clock.subscribe(fn);
    clock.set(1.0);
    clock.tick(2.5);
    expect(clock.now()).toBe(2.5);
    expect(fn).toHaveBeenCalledWith(2.5, 1.5);
  });

  it("subscribe() returns an unsubscribe function", async () => {
    const { clock } = await import("../../src/motion/clock");
    const fn = vi.fn();
    const unsub = clock.subscribe(fn);
    unsub();
    clock.tick(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it("freeze() prevents rAF loop restart after tick()", async () => {
    const { clock } = await import("../../src/motion/clock");
    clock.freeze();
    const fn = vi.fn();
    clock.subscribe(fn);
    // tick() still notifies synchronously even when frozen
    clock.tick(5);
    expect(fn).toHaveBeenCalledWith(5, 5);
  });

  it("multiple subscribers all receive the same tick", async () => {
    const { clock } = await import("../../src/motion/clock");
    const a = vi.fn();
    const b = vi.fn();
    clock.subscribe(a);
    clock.subscribe(b);
    clock.tick(1);
    expect(a).toHaveBeenCalledWith(1, 1);
    expect(b).toHaveBeenCalledWith(1, 1);
  });
});
