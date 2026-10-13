import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = new URL("../../", import.meta.url).pathname;

describe("generated tokens", () => {
  it("TS output exports at least one color", async () => {
    const tokens = await import("../../src/tokens/generated/tokens.js");
    const keys = Object.keys(tokens);
    const colorKeys = keys.filter((k) => k.toLowerCase().includes("color"));
    expect(colorKeys.length).toBeGreaterThan(0);
  });

  it("GLSL output contains COLOR_SURFACE_DEFAULT and COLOR_TEXT_DEFAULT", () => {
    const glsl = readFileSync(join(ROOT, "src/gl/glsl/generated/tokens.glsl"), "utf8");
    expect(glsl).toContain("COLOR_SURFACE_DEFAULT");
    expect(glsl).toContain("COLOR_TEXT_DEFAULT");
  });

  it("CSS output contains --color-surface-default", () => {
    const css = readFileSync(join(ROOT, "src/styles/generated/tokens.css"), "utf8");
    expect(css).toContain("--color-surface-default");
  });
});
