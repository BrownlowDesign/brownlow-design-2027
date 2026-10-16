"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ReferenceScene } from "../../../../gl/scenes/_reference/Scene";
import { canvasSignals } from "../../../../gl/signals";
import { useTier } from "../../../../motion/tier";

export default function IntegrationDetail() {
  const tier = useTier();

  // Transition is complete on this page — uTransition = 1
  useEffect(() => {
    canvasSignals.setTransition(1);
    return () => canvasSignals.setTransition(0);
  }, []);

  return (
    <main
      className="relative z-10 p-8 min-h-screen"
      data-scene="integration-detail"
    >
      <h1 className="text-ink font-sans text-2xl mb-2">detail — uTransition=1</h1>
      <p className="text-ink/60 font-sans text-sm mb-8">
        Arrived via ViewTransition API. Scene shows accent pulse at full intensity.
        {tier !== "full" && ` [tier: ${tier}]`}
      </p>

      <div
        className="rounded-md overflow-hidden"
        style={{ height: "50vh", viewTransitionName: "scene-a" }}
      >
        <ReferenceScene id="integration-detail" progress={1} style={{ height: "100%" }} />
      </div>

      <div className="mt-8">
        <Link
          href="/lab/integration"
          className="text-accent font-sans text-sm underline"
        >
          ← back to /lab/integration
        </Link>
      </div>
    </main>
  );
}
