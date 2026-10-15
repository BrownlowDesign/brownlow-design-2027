"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { presets } from "../presets";
import { useTier } from "../tier";

type Props = {
  routeKey: string;
  children: React.ReactNode;
};

// Harness detection via useSyncExternalStore — the only React-sanctioned way to
// read a client-only value (window.location.search) without causing either a
// hydration mismatch or a setState-in-effect lint error. Server snapshot = false;
// client snapshot = actual harness param value.
function useIsHarness(): boolean {
  return useSyncExternalStore(
    () => () => {},  // no subscription needed (param never changes mid-session)
    () => new URLSearchParams(window.location.search).get("harness") === "1",
    () => false,
  );
}

// Variant B page transition: AnimatePresence crossfade keyed on the pathname.
// Reduced tier: crossfade only. Static tier: instant (duration 0).
//
// Harness mode: Motion animations are JS-driven and unaffected by Playwright's
// `animations: 'disabled'` flag. The page duration token is 900ms; initHarness
// waits ~64ms → snap fires with content near-transparent. Fix: start fully
// visible (initial + animate both opacity 1, duration 0) in harness mode.
export function MotionPageTransition({ routeKey, children }: Props) {
  const tier = useTier();
  const isHarness = useIsHarness();

  const duration = isHarness || tier === "static" ? 0 : presets.duration.page / 1000;
  const ease = tier === "reduced" ? "easeInOut" : presets.easing.enter;
  const initial = isHarness ? { opacity: 1 } : { opacity: 0 };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={initial}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration, ease }}
        style={{ position: "relative" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
