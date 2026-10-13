"use client";

import { useEffect, useState } from "react";
import { clock } from "../../../motion/clock";

export default function ClockLab() {
  const [t, setT] = useState(0);

  useEffect(() => {
    return clock.subscribe((time) => {
      setT(time);
    });
  }, []);

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
