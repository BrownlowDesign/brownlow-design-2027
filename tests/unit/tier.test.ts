import { describe, it, expect, vi, afterEach } from "vitest";
import { detectTier } from "../../src/motion/tier";

// detectTier() reads browser APIs. Use vi.stubGlobal to simulate them.
// restoreAllMocks runs after each test to clean up stubs.

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const mockWindow = (
  opts: {
    webgl2?: boolean;
    saveData?: boolean;
    reducedMotion?: boolean;
  } = {}
) => {
  const { webgl2 = true, saveData = false, reducedMotion = false } = opts;
  vi.stubGlobal("window", {
    navigator: {
      connection: saveData ? { saveData: true } : undefined,
    },
    matchMedia: (q: string) => ({
      matches: q === "(prefers-reduced-motion: reduce)" && reducedMotion,
    }),
  });
  vi.stubGlobal("document", {
    createElement: (tag: string) =>
      tag === "canvas"
        ? { getContext: (t: string) => (t === "webgl2" && webgl2 ? {} : null) }
        : {},
  });
};

describe("detectTier", () => {
  it("returns 'full' on the server (window undefined)", () => {
    // vitest node env has no window — the guard returns 'full' immediately
    expect(typeof window).toBe("undefined");
    expect(detectTier()).toBe("full");
  });

  it("returns 'full' when WebGL2 available, no reduced-motion", () => {
    mockWindow({ webgl2: true });
    expect(detectTier()).toBe("full");
  });

  it("returns 'static' when WebGL2 unavailable", () => {
    mockWindow({ webgl2: false });
    expect(detectTier()).toBe("static");
  });

  it("returns 'reduced' when prefers-reduced-motion is set", () => {
    mockWindow({ reducedMotion: true });
    expect(detectTier()).toBe("reduced");
  });

  it("returns 'static' when save-data is on", () => {
    mockWindow({ saveData: true });
    expect(detectTier()).toBe("static");
  });

  it("save-data takes priority over reduced-motion", () => {
    mockWindow({ saveData: true, reducedMotion: true });
    expect(detectTier()).toBe("static");
  });
});
