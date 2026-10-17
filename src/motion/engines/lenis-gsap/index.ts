"use client";

// Variant A — Lenis + GSAP engine.
//
// Non-harness mode:
//   - Lenis virtualises smooth scroll; its raf() is driven by clock.subscribe.
//   - Scroll progress is computed from Lenis's scroll/limit (same formula as B/C).
//   - GSAP animates elements via direct style writes (parity with B/C) + gsap.to
//     for the non-scrubbed text-reveal tween.
//   - GSAP ticker is driven by the project clock so tweens stay in sync.
//
// Harness mode:
//   - Lenis is skipped; native window.scrollTo + scroll listener.
//   - Same progressFromPage mapping as B/C → pixel-identical element positions.
//
// Layer note: canvasSignals in src/gl — caller passes onPinProgress callback.

import gsap from "gsap";
import Lenis from "lenis";
import { clock } from "../../clock";
import { presets } from "../../presets";

// Shared progress formula — identical constants to native and motion-dev engines.
const PIN_END = 300 / 900;
const PAR_END = 500 / 900;
const STRIP_END = 800 / 900;

export { PIN_END, PAR_END, STRIP_END };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

export { clamp, lerp };

function progressFromPage(pageP: number) {
  return {
    pinP: clamp(pageP / PIN_END, 0, 1),
    parP: clamp((pageP - PIN_END) / (PAR_END - PIN_END), 0, 1),
    stripP: clamp((pageP - PAR_END) / (STRIP_END - PAR_END), 0, 1),
  };
}

// Drive GSAP's root timeline from our clock instead of wall-clock rAF.
function initGsapClockBridge(): () => void {
  gsap.ticker.remove(gsap.updateRoot);
  const unsub = clock.subscribe((t) => {
    gsap.updateRoot(t * 1000);
  });
  return () => {
    unsub();
    gsap.ticker.add(gsap.updateRoot);
  };
}

// Apply scroll state to DOM — same formula as B/C for pixel-identical parity.
function applyScrollState(
  root: HTMLElement,
  pageP: number,
  onPinProgress?: (p: number) => void,
): void {
  const { pinP, parP, stripP } = progressFromPage(pageP);
  onPinProgress?.(pinP);

  // Progress bar
  const barEl = root.querySelector<HTMLElement>("[data-scene='progress-bar']");
  if (barEl) barEl.style.width = `${pinP * 100}%`;

  // Headline lines
  root.querySelectorAll<HTMLElement>("[data-scene='headline-line']").forEach((el) => {
    const line = Number(el.dataset.line ?? 0);
    const p = clamp((pinP - line / 3) / (1 / 3), 0, 1);
    el.style.opacity = String(p);
    el.style.transform = `translateY(calc(var(--space-6) * ${1 - p}))`;
  });

  // Hero image: stage 2 (pin 0.33–0.66)
  const heroP = clamp((pinP - 1 / 3) / (1 / 3), 0, 1);
  const heroEl = root.querySelector<HTMLElement>("[data-scene='hero-image']");
  if (heroEl) {
    heroEl.style.opacity = String(heroP);
    heroEl.style.width = `${lerp(38, 100, heroP)}%`;
    heroEl.style.height = `${lerp(42, 100, heroP)}%`;
    heroEl.style.borderRadius = `${lerp(12, 0, heroP)}px`;
  }

  // Caption: stage 3 (pin 0.66–1.0)
  const captionP = clamp((pinP - 2 / 3) / (1 / 3), 0, 1);
  const captionEl = root.querySelector<HTMLElement>("[data-scene='caption']");
  if (captionEl) captionEl.style.opacity = String(captionP);

  // Parallax layers
  root.querySelectorAll<HTMLElement>("[data-scene='parallax-layer']").forEach((el) => {
    const rate = Number(el.dataset.rate ?? 0.5);
    const travel = (1 - rate) * 20;
    el.style.transform = `translateY(${-parP * travel}%)`;
  });

  // Horizontal strip track
  const trackEl = root.querySelector<HTMLElement>("[data-scene='strip-track']");
  if (trackEl) {
    trackEl.style.transform = `translateX(-${stripP * 400}vw)`;
  }
}

// Text reveal: IntersectionObserver + GSAP tween (not scrubbed)
function buildTextReveal(root: HTMLElement): () => void {
  const el = root.querySelector<HTMLElement>("[data-scene='text-reveal']");
  if (!el) return () => undefined;

  const isHarness = new URLSearchParams(window.location.search).get("harness") === "1";

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        if (isHarness) {
          // gsap.set is synchronous — no tick needed. gsap.to(duration:0) requires
          // gsap.updateRoot at time >= tween creation, which fails when the clock is frozen.
          gsap.set(el, { opacity: 1, y: 0 });
        } else {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: presets.duration.base / 1000,
            ease: `cubic-bezier(${presets.easing.enter.join(",")})`,
          });
        }
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
  const cleanupReveal = buildTextReveal(root);

  let cleanup: () => void;

  if (!isHarness) {
    // Non-harness: Lenis drives smooth scroll; its scroll event drives animation.
    const lenis = new Lenis({
      duration: presets.duration.reveal / 1000,
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    const unsubClock = clock.subscribe((t) => {
      lenis.raf(t * 1000);
    });

    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      const pageP = limit > 0 ? scroll / limit : 0;
      applyScrollState(root, pageP, onPinProgress);
    });

    // Initial paint at page load (scroll=0)
    applyScrollState(root, 0, onPinProgress);

    cleanup = () => {
      unsubClock();
      lenis.destroy();
    };
  } else {
    // Harness: native scroll listener drives animation (same as B/C).
    const totalH = () => document.documentElement.scrollHeight - window.innerHeight;

    const onScroll = () => {
      const h = totalH();
      const pageP = h > 0 ? window.scrollY / h : 0;
      applyScrollState(root, pageP, onPinProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial paint at current scroll position

    cleanup = () => window.removeEventListener("scroll", onScroll);
  }

  return () => {
    cleanup();
    cleanupReveal();
    cleanupClock();
  };
}

// Harness: jump to pageP and apply state instantly.
export function jumpToProgress(
  root: HTMLElement,
  pageP: number,
  onPinProgress?: (p: number) => void,
): void {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, pageP * totalH);
  applyScrollState(root, pageP, onPinProgress);

  // Force text-reveal final state when page is past the reveal section.
  // Mirrors B's jumpToProgress; necessary because the IO may not have fired
  // before jumpToProgress is called in harness mode.
  if (pageP >= STRIP_END) {
    const el = root.querySelector<HTMLElement>("[data-scene='text-reveal']");
    if (el) gsap.set(el, { opacity: 1, y: 0 });
  }
}
