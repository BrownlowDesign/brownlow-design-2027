"use client";

// Variant A — Lenis + GSAP ScrollTrigger engine.
//
// Non-harness mode:
//   - Lenis virtualises smooth scroll; its raf() is driven by clock.subscribe
//     so the whole scroll loop derives from one clock (MOTION.md requirement).
//   - GSAP ticker is also driven by the clock (time-based tweens stay in sync).
//   - Lenis feeds ScrollTrigger via a scrollerProxy + lenis.on('scroll', ST.update).
//
// Harness mode:
//   - Lenis is skipped; initHarness uses window.scrollTo natively.
//   - After the scroll jump, ScrollTrigger.refresh() + ScrollTrigger.update()
//     force all triggers to the correct state before __HARNESS__.ready is set.
//
// Layer note: canvasSignals in src/gl — caller passes onPinProgress callback.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { clock } from "../../clock";
import { presets } from "../../presets";

gsap.registerPlugin(ScrollTrigger);

// Page structure constants (must match layout.tsx and other engines)
const PAGE_VH = 900;
const PIN_END = 300 / PAGE_VH; // 0.333
const PAR_END = 500 / PAGE_VH; // 0.556
const STRIP_END = 800 / PAGE_VH; // 0.889

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

// Drive GSAP's root timeline from our clock instead of wall-clock rAF.
// Returns a cleanup that restores GSAP's own ticker.
function initGsapClockBridge(): () => void {
  gsap.ticker.remove(gsap.updateRoot);
  const unsub = clock.subscribe((t) => {
    gsap.updateRoot(t * 1000); // GSAP expects milliseconds
  });
  return () => {
    unsub();
    gsap.ticker.add(gsap.updateRoot);
  };
}

// Pin-section: 3-stage scrubbed timeline (0→300vh)
function buildPinTimeline(root: HTMLElement, onPinProgress?: (p: number) => void): () => void {
  const pinOuter = root.querySelector<HTMLElement>("[data-scene='pin-outer']");
  if (!pinOuter) return () => undefined;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pinOuter,
      start: "top top",
      end: "bottom top",
      pin: "[data-scene='pin-inner']",
      scrub: 0.3,
      onUpdate(self) {
        onPinProgress?.(self.progress);
        const bar = root.querySelector<HTMLElement>("[data-scene='progress-bar']");
        if (bar) bar.style.width = `${self.progress * 100}%`;
      },
    },
  });

  // Stage 1: headline lines (0→33%)
  root.querySelectorAll<HTMLElement>("[data-scene='headline-line']").forEach((el) => {
    const line = Number(el.dataset.line ?? 0);
    tl.to(el, { opacity: 1, y: 0, duration: 1 / 9 }, line / 9);
  });

  // Stage 2: hero image card→full-bleed (33→66%)
  tl.to(
    "[data-scene='hero-image']",
    { opacity: 1, width: "100%", height: "100%", borderRadius: 0, duration: 1 / 3 },
    1 / 3,
  );

  // Stage 3: caption (66→100%)
  tl.to("[data-scene='caption']", { opacity: 1, duration: 1 / 3 }, 2 / 3);

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
  };
}

// Parallax layers: each at its data-rate relative speed
function buildParallax(root: HTMLElement): () => void {
  const outer = root.querySelector<HTMLElement>("[data-scene='parallax-outer']");
  if (!outer) return () => undefined;

  const kills: (() => void)[] = [];
  root.querySelectorAll<HTMLElement>("[data-scene='parallax-layer']").forEach((el) => {
    const rate = Number(el.dataset.rate ?? 0.5);
    const travel = (1 - rate) * 20;
    const st = ScrollTrigger.create({
      trigger: outer,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate(self) {
        gsap.set(el, { y: `${-self.progress * travel}%` });
      },
    });
    kills.push(() => st.kill());
  });

  return () => kills.forEach((k) => k());
}

// Horizontal strip
function buildStrip(root: HTMLElement): () => void {
  const outer = root.querySelector<HTMLElement>("[data-scene='strip-outer']");
  const track = root.querySelector<HTMLElement>("[data-scene='strip-track']");
  if (!outer || !track) return () => undefined;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: outer,
      start: "top top",
      end: "bottom top",
      pin: "[data-scene='strip-inner']",
      scrub: 0.3,
    },
  });
  // ease omitted — scrub: true normalises progress; duration sets relative weight only
  tl.to(track, { x: "-400vw", duration: presets.duration.base / 1000 });

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
  };
}

// Text reveal: IntersectionObserver + GSAP tween (not scrubbed)
function buildTextReveal(root: HTMLElement): () => void {
  const el = root.querySelector<HTMLElement>("[data-scene='text-reveal']");
  if (!el) return () => undefined;

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: presets.duration.base / 1000,
          ease: `cubic-bezier(${presets.easing.enter.join(",")})`,
        });
        io.disconnect();
      }
    },
    { threshold: 0.2 },
  );
  io.observe(el);

  return () => io.disconnect();
}

export function initLenisGsap(
  root: HTMLElement,
  onPinProgress?: (p: number) => void,
): () => void {
  const params = new URLSearchParams(window.location.search);
  const isHarness = params.get("harness") === "1";

  const cleanupClock = initGsapClockBridge();
  ScrollTrigger.refresh();

  let lenis: Lenis | null = null;
  if (!isHarness) {
    lenis = new Lenis({ duration: presets.duration.slow / 1000, gestureOrientation: "vertical", smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    ScrollTrigger.scrollerProxy(window, {
      scrollTop: () => lenis!.scroll,
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    });
    clock.subscribe((_t, dt) => {
      lenis!.raf(dt * 1000);
    });
  }

  const cleanupPin = buildPinTimeline(root, onPinProgress);
  const cleanupPar = buildParallax(root);
  const cleanupStrip = buildStrip(root);
  const cleanupReveal = buildTextReveal(root);

  ScrollTrigger.refresh();

  return () => {
    cleanupPin();
    cleanupPar();
    cleanupStrip();
    cleanupReveal();
    cleanupClock();
    if (lenis) {
      lenis.destroy();
      ScrollTrigger.scrollerProxy(window, undefined as unknown as Parameters<typeof ScrollTrigger.scrollerProxy>[1]);
    }
    ScrollTrigger.killAll();
  };
}

// Harness: jump to pageP and force all triggers to that state.
export function jumpToProgress(
  root: HTMLElement,
  pageP: number,
  onPinProgress?: (p: number) => void,
): void {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, pageP * totalH);
  ScrollTrigger.refresh();
  ScrollTrigger.update();
  onPinProgress?.(clamp(pageP / PIN_END, 0, 1));

  if (pageP >= STRIP_END) {
    const el = root.querySelector<HTMLElement>("[data-scene='text-reveal']");
    if (el) gsap.set(el, { opacity: 1, y: 0 });
  }
}

// Exported for reference in the comparison table
export { lerp, clamp, PIN_END, PAR_END, STRIP_END };
