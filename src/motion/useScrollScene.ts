"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { initLenisGsap, jumpToProgress } from "./engines/lenis-gsap";
import { canvasSignals } from "../gl/signals";
import { useTier } from "./tier";

export type UseScrollSceneOptions = {
  id: string;
  onPinProgress?: (p: number) => void;
};

// Initialize the Lenis+GSAP scroll engine on a DOM subtree.
// Handles harness mode, tier gating, cleanup on unmount, and registers the
// scene id in __HARNESS__.scenes so snap knows this scene is active.
//
// Options must be stable across renders (memoize callbacks with useCallback).
export function useScrollScene(
  ref: RefObject<HTMLElement | null>,
  options: UseScrollSceneOptions,
): void {
  const tier = useTier();
  const { id, onPinProgress } = options;

  useEffect(() => {
    const root = ref.current;
    if (!root || tier !== "full") return;

    const onPin = onPinProgress ?? canvasSignals.setProgress;
    const params = new URLSearchParams(window.location.search);

    if (params.get("harness") === "1") {
      const p = parseFloat(params.get("progress") ?? "0") || 0;
      jumpToProgress(root, p, onPin);
    }

    if (window.__HARNESS__ && !window.__HARNESS__.scenes.includes(id)) {
      window.__HARNESS__.scenes.push(id);
    }

    return initLenisGsap(root, onPin);
  }, [ref, tier, id, onPinProgress]);
}
