import { describe, it, expect } from "vitest";
import { parseHarnessParams } from "../../src/motion/harness";

describe("parseHarnessParams", () => {
  it("defaults everything when params are empty", () => {
    const p = parseHarnessParams(new URLSearchParams());
    expect(p).toEqual({
      harness: false,
      t: 0,
      progress: 0,
      tier: null,
      scene: null,
      sp: 0,
      transition: null,
      tp: 0,
    });
  });

  it("parses harness=1", () => {
    const p = parseHarnessParams(new URLSearchParams("harness=1"));
    expect(p.harness).toBe(true);
  });

  it("parses t and progress as floats", () => {
    const p = parseHarnessParams(new URLSearchParams("t=2.5&progress=0.4"));
    expect(p.t).toBe(2.5);
    expect(p.progress).toBe(0.4);
  });

  it("parses valid tier values", () => {
    expect(parseHarnessParams(new URLSearchParams("tier=full")).tier).toBe("full");
    expect(parseHarnessParams(new URLSearchParams("tier=reduced")).tier).toBe("reduced");
    expect(parseHarnessParams(new URLSearchParams("tier=static")).tier).toBe("static");
  });

  it("returns tier=null for unknown tier", () => {
    const p = parseHarnessParams(new URLSearchParams("tier=bogus"));
    expect(p.tier).toBeNull();
  });

  it("parses scene + sp and transition + tp", () => {
    const p = parseHarnessParams(
      new URLSearchParams("scene=hero&sp=0.5&transition=fade&tp=0.25")
    );
    expect(p.scene).toBe("hero");
    expect(p.sp).toBe(0.5);
    expect(p.transition).toBe("fade");
    expect(p.tp).toBe(0.25);
  });

  it("treats NaN values as 0", () => {
    const p = parseHarnessParams(new URLSearchParams("t=notanumber&progress="));
    expect(p.t).toBe(0);
    expect(p.progress).toBe(0);
  });
});
