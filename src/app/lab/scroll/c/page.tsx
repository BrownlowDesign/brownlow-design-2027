"use client";

import { useEffect, useRef } from "react";
import { ScrollSceneLayout } from "../_scene/layout";
import { initMotionScroll, jumpToProgress } from "../../../../motion/engines/motion-dev";
import { canvasSignals } from "../../../../gl/signals";
import { useTier } from "../../../../motion/tier";

export default function ScrollLabC() {
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

    return initMotionScroll(root, onPin);
  }, [tier]);

  return <ScrollSceneLayout ref={rootRef} variant="c" tier={tier} />;
}
