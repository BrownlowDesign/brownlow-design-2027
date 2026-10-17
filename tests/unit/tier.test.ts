import { describe, it, expect, vi, afterEach } from "vitest";
import { detectTier } from "../../src/motion/tier";

// detectTier() reads browser APIs. Use vi.stubGlobal to simulate them.
// restoreAllMocks runs after each test to clean up stubs.

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makeGlContext(opts: {
  renderer?: string;
  probeMs?: number; // simulated gl.finish() latency
} = {}) {
  const { renderer = "ANGLE (Apple, Apple M2)", probeMs = 0 } = opts;
  const RENDERER = 0x1f01; // WebGL constant value
  let perfNow = 0;

  const gl = {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    POINTS: 0,
    RENDERER,
    getParameter: (p: number) => (p === RENDERER ? renderer : null),
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {},
    useProgram: () => {},
    drawArrays: () => { perfNow = probeMs; },
    finish: () => {},
    deleteProgram: () => {},
    deleteShader: () => {},
  };

  // Patch performance.now() to simulate probe timing
  vi.stubGlobal("performance", {
    now: () => { const v = perfNow; return v; },
  });
  // Two calls: before draw (0) and after finish (probeMs)
  let calls = 0;
  vi.stubGlobal("performance", {
    now: () => (calls++ === 0 ? 0 : probeMs),
  });

  return gl;
}

const mockWindow = (
  opts: {
    webgl2?: boolean;
    saveData?: boolean;
    reducedMotion?: boolean;
    deviceMemory?: number;
    renderer?: string;
    probeMs?: number;
  } = {}
) => {
  const {
    webgl2 = true,
    saveData = false,
    reducedMotion = false,
    deviceMemory,
    renderer = "ANGLE (Apple, Apple M2)",
    probeMs = 0,
  } = opts;

  const gl = webgl2 ? makeGlContext({ renderer, probeMs }) : null;

  vi.stubGlobal("window", {
    navigator: {
      connection: saveData ? { saveData: true } : undefined,
      ...(deviceMemory !== undefined ? { deviceMemory } : {}),
    },
    matchMedia: (q: string) => ({
      matches: q === "(prefers-reduced-motion: reduce)" && reducedMotion,
    }),
  });
  vi.stubGlobal("document", {
    createElement: (tag: string) =>
      tag === "canvas" ? { getContext: (t: string) => (t === "webgl2" ? gl : null) } : {},
  });
};

describe("detectTier", () => {
  it("returns 'full' on the server (window undefined)", () => {
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

  it("returns 'static' when deviceMemory <= 1", () => {
    mockWindow({ deviceMemory: 1 });
    expect(detectTier()).toBe("static");
  });

  it("returns 'reduced' when deviceMemory is 2", () => {
    mockWindow({ deviceMemory: 2 });
    expect(detectTier()).toBe("reduced");
  });

  it("returns 'full' when deviceMemory is 4", () => {
    mockWindow({ deviceMemory: 4 });
    expect(detectTier()).toBe("full");
  });

  it("returns 'reduced' when GPU renderer is SwiftShader", () => {
    mockWindow({ renderer: "Google SwiftShader" });
    expect(detectTier()).toBe("reduced");
  });

  it("returns 'reduced' when GPU probe takes > 8ms", () => {
    mockWindow({ probeMs: 10 });
    expect(detectTier()).toBe("reduced");
  });

  it("returns 'full' when GPU probe takes < 8ms", () => {
    mockWindow({ probeMs: 2 });
    expect(detectTier()).toBe("full");
  });
});
