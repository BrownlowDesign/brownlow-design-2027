"use client";

import { createContext, useContext } from "react";
import type { Tier } from "./types";

export type { Tier };

// GPU probe: render 1 triangle and measure wall time. Anything taking > 8ms
// on a trivial draw indicates software rasterization or a heavily throttled
// GPU → downgrade to reduced. Threshold chosen to pass on any discrete or
// integrated GPU but catch headless software renderers.
function isWeakGpu(gl: WebGL2RenderingContext): boolean {
  const renderer = gl.getParameter(gl.RENDERER) as string;
  // Known software renderers
  if (/SwiftShader|llvmpipe|softpipe|Microsoft Basic/i.test(renderer)) return true;

  // Timed draw probe — one triangle, measure rasterization latency
  try {
    const vert = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vert, "void main(){gl_Position=vec4(0,0,0,1);gl_PointSize=1.0;}");
    gl.compileShader(vert);
    const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(frag, "void main(){gl_FragColor=vec4(1);}");
    gl.compileShader(frag);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const t0 = performance.now();
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.finish(); // force synchronous completion
    const dt = performance.now() - t0;
    gl.deleteProgram(prog);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    if (dt > 8) return true;
  } catch {
    return true;
  }
  return false;
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "full";

  // save-data → static
  const nav = window.navigator as Navigator & {
    connection?: { saveData?: boolean; deviceMemory?: number };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return "static";

  // No WebGL2 → static
  let gl: WebGL2RenderingContext | null = null;
  try {
    const canvas = document.createElement("canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) return "static";
  } catch {
    return "static";
  }

  // Low device memory (≤ 1GB) → static; 2GB → reduced
  const mem = nav.deviceMemory ?? (nav.connection as { deviceMemory?: number } | undefined)?.deviceMemory;
  if (mem !== undefined) {
    if (mem <= 1) return "static";
    if (mem <= 2) return "reduced";
  }

  // prefers-reduced-motion → reduced
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }

  // GPU probe — weak GPU → reduced
  if (isWeakGpu(gl)) return "reduced";

  return "full";
}

export const TierContext = createContext<Tier>("full");

export function useTier(): Tier {
  return useContext(TierContext);
}
