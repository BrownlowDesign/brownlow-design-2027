import { describe, it, expect } from "vitest";

describe("generated tokens", () => {
  it("exports at least one color", async () => {
    const tokens = await import("../../src/tokens/generated/tokens.js");
    const keys = Object.keys(tokens);
    const colorKeys = keys.filter((k) => k.toLowerCase().includes("color"));
    expect(colorKeys.length).toBeGreaterThan(0);
  });
});
