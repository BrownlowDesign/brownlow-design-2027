"use client";

import { useEffect, useRef } from "react";
import { ScrollSceneLayout } from "../_scene/layout";
import { initNativeScroll, jumpToProgress } from "../../../../motion/engines/native";
import { canvasSignals } from "../../../../gl/signals";
import { useTier } from "../../../../motion/tier";

export default function ScrollLabB() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tier = useTier();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || tier === "static") return;

    const onPin = tier === "full" ? canvasSignals.setProgress : undefined;

    // Harness: initHarness already called window.scrollTo before this effect runs.
    // Jump applies state instantly at whatever scroll position was set.
    const params = new URLSearchParams(window.location.search);
    const isHarness = params.get("harness") === "1";
    if (isHarness) {
      const progress = parseFloat(params.get("progress") ?? "0") || 0;
      jumpToProgress(root, progress, onPin);
    }

    return initNativeScroll(root, onPin);
  }, [tier]);

  return <ScrollSceneLayout ref={rootRef} variant="b" />;
}
