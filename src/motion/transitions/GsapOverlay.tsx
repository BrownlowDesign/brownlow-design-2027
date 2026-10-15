"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { canvasSignals } from "../../gl/signals";
import { presets } from "../presets";
import { useTier } from "../tier";

type Props = { children: React.ReactNode };

// Variant C: GSAP overlay transition.
// A full-screen cover div sits above the page. On navigation:
//   1. Cover animates in (opacity 0→1), uTransition 0→0.5
//   2. Route change happens while cover is opaque
//   3. Cover animates out (opacity 1→0), uTransition 0.5→1→0
// Exposes window.__TRANSITION_NAVIGATE__ for the TransitionLink to trigger.

export function GsapOverlay({ children }: Props) {
  const coverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const tier = useTier();

  const duration = tier === "static" ? 0 : presets.duration.page / 1000;
  const ease = `cubic-bezier(${presets.easing.enter.join(",")})`;

  useEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;

    // Expose navigation trigger to TransitionLink
    (window as Window & { __TRANSITION_NAVIGATE__?: (href: string) => void }).__TRANSITION_NAVIGATE__ =
      (href: string) => {
        if (tier === "static") {
          router.push(href);
          return;
        }

        gsap.timeline()
          .to(cover, {
            opacity: 1,
            duration: duration / 2,
            ease,
            onUpdate() {
              canvasSignals.setTransition(this.progress() * 0.5);
            },
          })
          .add(() => { router.push(href); })
          .to(cover, {
            opacity: 0,
            duration: duration / 2,
            ease,
            onUpdate() {
              canvasSignals.setTransition(0.5 + this.progress() * 0.5);
            },
            onComplete() {
              canvasSignals.setTransition(0);
            },
          });
      };

    return () => {
      delete (window as Window & { __TRANSITION_NAVIGATE__?: (href: string) => void }).__TRANSITION_NAVIGATE__;
    };
  }, [router, tier, duration, ease]);

  // Animate in on route entry (skip in harness; if tp= present, freeze at that state)
  useEffect(() => {
    const cover = coverRef.current;
    if (!cover || tier === "static") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("harness") !== "1") {
      gsap.fromTo(cover, { opacity: 1 }, { opacity: 0, duration: duration / 2, ease });
      return;
    }
    // tp= freezes: 0→0.5 = cover fading in, 0.5→1 = cover fading out
    const tpRaw = parseFloat(p.get("tp") ?? "NaN");
    if (!isNaN(tpRaw)) {
      const coverOpacity = tpRaw <= 0.5 ? tpRaw * 2 : (1 - tpRaw) * 2;
      gsap.set(cover, { opacity: coverOpacity });
      canvasSignals.setTransition(tpRaw < 1 ? tpRaw : 0);
    }
  }, [pathname, tier, duration, ease]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={coverRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--color-surface-inverse)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 200,
        }}
      />
      {children}
    </div>
  );
}
