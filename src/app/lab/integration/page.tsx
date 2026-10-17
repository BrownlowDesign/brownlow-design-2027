"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ReferenceScene } from "../../../gl/scenes/_reference/Scene";
import { useScrollScene } from "../../../motion/useScrollScene";
import { canvasSignals } from "../../../gl/signals";
import { useTier } from "../../../motion/tier";

export default function IntegrationIndex() {
  const params = useSearchParams();
  const tier = useTier();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.get("harness") !== "1") return;
    const tp = parseFloat(params.get("tp") ?? "NaN");
    if (!isNaN(tp)) canvasSignals.setTransition(tp);
    else canvasSignals.setTransition(0);
  }, [params]);

  useScrollScene(scrollRef, { id: "integration-index" });

  return (
    <main
      ref={scrollRef}
      className="relative z-10 p-8"
      style={{ minHeight: "300vh" }}
      data-scene="integration-index"
    >
      <h1 className="text-ink font-sans text-2xl mb-2">integration lab</h1>
      <p className="text-ink/60 font-sans text-sm mb-8">
        Scroll (Lenis+GSAP) + ViewTransition API + two shader Views — all three lab winners.
        {tier !== "full" && ` [tier: ${tier}]`}
      </p>

      <div className="grid grid-cols-2 gap-4 sticky top-8">
        <div>
          <p className="text-ink/60 font-sans text-xs mb-2">scene A — scroll progress</p>
          <div
            className="rounded-md overflow-hidden"
            style={{ height: "40vh", viewTransitionName: "scene-a" }}
          >
            <ReferenceScene id="integration-a" style={{ height: "100%" }} />
          </div>
        </div>
        <div>
          <p className="text-ink/60 font-sans text-xs mb-2">scene B — fixed 0.5</p>
          <div
            className="rounded-md overflow-hidden"
            style={{ height: "40vh", viewTransitionName: "scene-b" }}
          >
            <ReferenceScene id="integration-b" progress={0.5} style={{ height: "100%" }} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/lab/integration/detail"
          className="text-accent font-sans text-sm underline"
        >
          → /lab/integration/detail (transition test)
        </Link>
      </div>
    </main>
  );
}
