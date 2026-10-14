"use client";

import { useEffect, useRef } from "react";
import { ScrollSceneLayout } from "../_scene/layout";
import { initLenisGsap, jumpToProgress } from "../../../../motion/engines/lenis-gsap";
import { canvasSignals } from "../../../../gl/signals";
import { useTier } from "../../../../motion/tier";

export default function ScrollLabA() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tier = useTier();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || tier !== "full") return;

    const onPin = tier === "full" ? canvasSignals.setProgress : undefined;

    const params = new URLSearchParams(window.location.search);
    if (params.get("harness") === "1") {
      const progress = parseFloat(params.get("progress") ?? "0") || 0;
      jumpToProgress(root, progress, onPin);
    }

    return initLenisGsap(root, onPin);
  }, [tier]);

  return <ScrollSceneLayout ref={rootRef} variant="a" tier={tier} />;
}
