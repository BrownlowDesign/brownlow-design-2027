"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TierContext, detectTier } from "./tier";
import type { Tier } from "./types";

function MotionProviderInner({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();

  const tierParam = params.get("tier");
  const tier: Tier =
    tierParam === "full" || tierParam === "reduced" || tierParam === "static"
      ? tierParam
      : detectTier();

  useEffect(() => {
    if (params.get("harness") !== "1") return;
    import("./harness").then(({ initHarness }) => {
      initHarness(params, tier).catch(console.error);
    });
  }, [params, tier]);

  return <TierContext.Provider value={tier}>{children}</TierContext.Provider>;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MotionProviderInner>{children}</MotionProviderInner>
    </Suspense>
  );
}
