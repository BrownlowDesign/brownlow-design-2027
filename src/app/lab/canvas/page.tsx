"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ReferenceScene } from "../../../gl/scenes/_reference/Scene";
import { useScrollScene } from "../../../motion/useScrollScene";
import { canvasSignals } from "../../../gl/signals";
import { useTier } from "../../../motion/tier";

export default function CanvasLab() {
  const params = useSearchParams();
  const tier = useTier();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Apply tp= transition freeze in harness mode
  useEffect(() => {
    if (params.get("harness") !== "1") return;
    const tp = parseFloat(params.get("tp") ?? "NaN");
    if (!isNaN(tp)) canvasSignals.setTransition(tp);
  }, [params]);

  useScrollScene(scrollRef, { id: "canvas-lab" });

  return (
    <main
      ref={scrollRef}
      className="relative z-10 p-8"
      style={{ minHeight: "300vh" }}
      data-scene="canvas-lab"
    >
      <h1 className="text-ink font-sans text-2xl mb-4">canvas lab</h1>
      <p className="text-ink/60 font-sans text-sm mb-8">
        Two Views tracking distinct DOM elements. Scroll to drive progress.
        {tier === "static" && " (static tier — poster fallback)"}
      </p>

      <div className="grid grid-cols-2 gap-4 sticky top-8">
        <div>
          <p className="text-ink/60 font-sans text-xs mb-2">scene A — scroll progress</p>
          <div className="rounded-md overflow-hidden" style={{ height: "40vh" }}>
            <ReferenceScene
              id="ref-a"
              style={{ height: "100%" }}
            />
          </div>
        </div>
        <div>
          <p className="text-ink/60 font-sans text-xs mb-2">scene B — fixed progress 0.5</p>
          <div className="rounded-md overflow-hidden" style={{ height: "40vh" }}>
            <ReferenceScene
              id="ref-b"
              progress={0.5}
              style={{ height: "100%" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/lab/canvas/next"
          className="text-accent font-sans text-sm underline"
        >
          → /lab/canvas/next (cross-route persistence test)
        </Link>
      </div>
    </main>
  );
}
