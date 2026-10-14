import { describe, it, expect } from "vitest";
import { loadESLint } from "eslint";

// Uses ESLint's Node API to run harness import rules against synthetic file content.
// filePath triggers the flat-config file matchers; lintText supplies the source.

const FlatESLint = await loadESLint({ useFlatConfig: true });
const eslint = new FlatESLint({ cwd: process.cwd() });

async function lint(code: string, filePath: string) {
  const results = await eslint.lintText(code, { filePath });
  return results[0]?.messages ?? [];
}

describe("harness import rules — regex anchored, no relative-path bleed", () => {
  it("src/gl importing ../motion/clock → no error", async () => {
    const msgs = await lint(
      `import { clock } from '../motion/clock';`,
      "src/gl/SomeScene.tsx"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted).toHaveLength(0);
  });

  it("src/components importing 'motion/react' → error (motionLib)", async () => {
    const msgs = await lint(
      `import { animate } from 'motion/react';`,
      "src/components/Foo.tsx"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted.length).toBeGreaterThan(0);
  });

  it("src/components importing 'gsap' → error (motionLib)", async () => {
    const msgs = await lint(
      `import gsap from 'gsap';`,
      "src/components/Foo.tsx"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted.length).toBeGreaterThan(0);
  });

  it("src/components importing 'lenis' → error (motionLib)", async () => {
    const msgs = await lint(
      `import Lenis from 'lenis';`,
      "src/components/Foo.tsx"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted.length).toBeGreaterThan(0);
  });

  it("src/components importing 'three' → error (three-only)", async () => {
    const msgs = await lint(
      `import * as THREE from 'three';`,
      "src/components/Foo.tsx"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted.length).toBeGreaterThan(0);
  });

  it("src/gl importing 'gsap' → error (motionLib still blocked in gl)", async () => {
    const msgs = await lint(
      `import gsap from 'gsap';`,
      "src/gl/SomeScene.tsx"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted.length).toBeGreaterThan(0);
  });

  it("src/motion importing 'gsap' → no error (motion layer owns animation libs)", async () => {
    const msgs = await lint(
      `import gsap from 'gsap';`,
      "src/motion/SomeUtil.ts"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted).toHaveLength(0);
  });

  it("src/gl importing 'three' → no error (gl owns three)", async () => {
    const msgs = await lint(
      `import * as THREE from 'three';`,
      "src/gl/SomeScene.tsx"
    );
    const restricted = msgs.filter((m) => m.ruleId === "no-restricted-imports");
    expect(restricted).toHaveLength(0);
  });
});
