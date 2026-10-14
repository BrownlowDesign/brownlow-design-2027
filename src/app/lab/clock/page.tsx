"use client";

import { useEffect, useState } from "react";
import { clock } from "../../../motion/clock";
import { useTier } from "../../../motion/tier";

export default function ClockLab() {
  const tier = useTier();
  const [t, setT] = useState(0);

  useEffect(() => {
    // reduced/static: no motion — counter stays at 0 per MOTION.md
    if (tier !== "full") return;
    return clock.subscribe((time) => {
      setT(time);
    });
  }, [tier]);

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center">
      <p
        className="text-ink font-sans text-4xl tabular-nums"
        data-testid="clock-value"
      >
        t&nbsp;=&nbsp;{t.toFixed(3)}
      </p>
    </main>
  );
}
