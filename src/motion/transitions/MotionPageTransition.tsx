"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
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
function useHarnessSearch(): string {
  return useSyncExternalStore(
    () => () => {},  // no subscription needed (param never changes mid-session)
    () => window.location.search,
    () => "",
  );
}

// Variant B page transition: AnimatePresence crossfade keyed on the pathname.
// Reduced tier: crossfade only. Static tier: instant (duration 0).
//
// Harness mode: Motion animations are JS-driven and unaffected by Playwright's
// `animations: 'disabled'` flag. The page duration token is 900ms; initHarness
// waits ~64ms → snap fires with content near-transparent. Fix: start fully
// visible (initial + animate both opacity 1, duration 0) in harness mode.
//
// tp= param: freezes the crossfade at the given progress (0 = invisible, 1 = fully visible).
// Used for case-1 transition snaps.
export function MotionPageTransition({ routeKey, children }: Props) {
  const tier = useTier();
  const search = useHarnessSearch();
  const params = new URLSearchParams(search);
  const isHarness = params.get("harness") === "1";
  const tp = isHarness ? parseFloat(params.get("tp") ?? "NaN") : NaN;
  const hasTp = !isNaN(tp);

  const duration = isHarness || tier === "static" ? 0 : presets.duration.page / 1000;
  const ease = tier === "reduced" ? "easeInOut" : presets.easing.enter;
  const initial = isHarness ? { opacity: 1 } : { opacity: 0 };

  // tp= freeze: AnimatePresence initial={false} suppresses the initial prop on the
  // first render, so we cannot use initial/animate to freeze opacity. Instead render
  // a plain div with the exact opacity directly. This is only for harness snap capture.
  if (hasTp) {
    return (
      <div style={{ position: "relative", opacity: tp }}>
        {children}
      </div>
    );
  }

  // LayoutGroup scopes the layoutId namespace so hero morphs don't bleed
  // into other AnimatePresence trees on the same page (e.g. modals, drawers).
  return (
    <LayoutGroup>
      <AnimatePresence mode="popLayout" initial={false}>
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
    </LayoutGroup>
  );
}
