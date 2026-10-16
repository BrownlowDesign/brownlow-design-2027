"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clock } from "../../motion/clock";
import { useTier } from "../../motion/tier";

const WINDOW = 60; // frames in rolling window

function p95(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]!;
}

export function PerfOverlay() {
  const params = useSearchParams();
  const tier = useTier();
  const [stats, setStats] = useState({ fps: 0, p95ms: 0 });
  const buf = useRef<number[]>([]);

  useEffect(() => {
    if (params.get("perf") !== "overlay") return;
    let last = 0;
    const unsub = clock.subscribe((_t, dt) => {
      if (last === 0) { last = dt; return; }
      const ms = dt * 1000;
      buf.current.push(ms);
      if (buf.current.length > WINDOW) buf.current.shift();
      const fps = buf.current.length > 0 ? Math.round(1000 / (buf.current.reduce((a, b) => a + b, 0) / buf.current.length)) : 0;
      setStats({ fps, p95ms: Math.round(p95(buf.current) * 10) / 10 });
      last = dt;
    });
    return unsub;
  }, [params]);

  if (params.get("perf") !== "overlay") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: "var(--color-surface-inverse)",
        color: "var(--color-ink-inverse)",
        fontFamily: "monospace",
        fontSize: 11,
        padding: "6px 10px",
        borderRadius: 4,
        lineHeight: 1.6,
        pointerEvents: "none",
        opacity: 0.9,
      }}
    >
      <div>{stats.fps} fps</div>
      <div>p95 {stats.p95ms}ms</div>
      <div>tier: {tier}</div>
    </div>
  );
}
