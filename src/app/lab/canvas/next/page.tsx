"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ReferenceScene } from "../../../../gl/scenes/_reference/Scene";
import { canvasSignals } from "../../../../gl/signals";

export default function CanvasNextLab() {
  const params = useSearchParams();

  // This page represents the "after" state: uTransition = 1 at rest,
  // or frozen at tp= for cross-route snap tests.
  useEffect(() => {
    const tp = parseFloat(params.get("tp") ?? "NaN");
    canvasSignals.setTransition(isNaN(tp) ? 1 : tp);
    return () => { canvasSignals.setTransition(0); };
  }, [params]);

  return (
    <main className="relative z-10 p-8" data-scene="canvas-next">
      <h1 className="text-ink font-sans text-2xl mb-4">canvas / next</h1>
      <p className="text-ink/60 font-sans text-sm mb-8">
        Same WebGL context as /lab/canvas — canvas never unmounted.
        uTransition = 1 (accent pulse complete).
      </p>

      <div className="rounded-md overflow-hidden" style={{ height: "60vh" }}>
        <ReferenceScene
          id="ref-next"
          progress={1}
          style={{ height: "100%" }}
        />
      </div>

      <div className="mt-8">
        <Link
          href="/lab/canvas"
          className="text-accent font-sans text-sm underline"
        >
          ← back to /lab/canvas
        </Link>
      </div>
    </main>
  );
}
