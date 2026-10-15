"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { clock } from "../motion/clock";
import { useTier } from "../motion/tier";
import { canvasSignals } from "./signals";

function CanvasInternals() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const u1 = clock.subscribe(() => invalidate());
    const u2 = canvasSignals.onProgress(() => invalidate());
    const u3 = canvasSignals.onTransition(() => invalidate());
    return () => { u1(); u2(); u3(); };
  }, [invalidate]);
  return null;
}

export default function CanvasRoot() {
  const tier = useTier();
  if (tier === "static") return null;

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1] }}
      frameloop="demand"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <CanvasInternals />
      <View.Port />
    </Canvas>
  );
}
