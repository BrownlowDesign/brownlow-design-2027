"use client";

import { createContext, useContext } from "react";
import type { Tier } from "./types";

export type { Tier };

export function detectTier(): Tier {
  if (typeof window === "undefined") return "full";

  // save-data → static
  const nav = window.navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return "static";

  // No WebGL2 → static
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) return "static";
  } catch {
    return "static";
  }

  // prefers-reduced-motion → reduced
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }

  return "full";
}

export const TierContext = createContext<Tier>("full");

export function useTier(): Tier {
  return useContext(TierContext);
}
