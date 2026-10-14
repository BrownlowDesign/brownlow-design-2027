"use client";

// Variant C — motion.dev (motion/react) scroll engine.
// Uses useAnimate + scroll() imperative API to drive animations.
// All targeting is done within a scoped root element, so no motion.div
// components appear in the shared scene markup.
//
// Layer note: canvasSignals lives in src/gl — pass onPinProgress callback
// from the page layer the same way as the native engine.

import { scroll, animate } from "motion";
import { presets } from "../../presets";

export type MotionDevScrollState = {
  pinP: number;
  parP: number;
  stripP: number;
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function progressFromPage(pageP: number): MotionDevScrollState {
  const pinEnd = 300 / 900;
  const parEnd = 500 / 900;
  const stripEnd = 800 / 900;
  return {
    pinP: clamp(pageP / pinEnd, 0, 1),
    parP: clamp((pageP - pinEnd) / (parEnd - pinEnd), 0, 1),
    stripP: clamp((pageP - parEnd) / (stripEnd - parEnd), 0, 1),
  };
}

// Apply a fully-resolved scroll state snapshot to the DOM.
// Used both by the scroll() driver and by jumpToProgress for harness mode.
export function applyState(
  root: HTMLElement,
  state: MotionDevScrollState,
  onPinProgress?: (p: number) => void,
): void {
  const { pinP, parP, stripP } = state;
  onPinProgress?.(pinP);

  // Headline lines
  root.querySelectorAll<HTMLElement>("[data-scene='headline-line']").forEach((el) => {
    const line = Number(el.dataset.line ?? 0);
    const p = clamp((pinP - line / 3) / (1 / 3), 0, 1);
    animate(el, { opacity: p, y: lerp(24, 0, p) }, { duration: presets.duration.instant / 1000 });
  });

  // Hero image: stage 2
  const heroP = clamp((pinP - 1 / 3) / (1 / 3), 0, 1);
  const heroEl = root.querySelector<HTMLElement>("[data-scene='hero-image']");
  if (heroEl) {
    animate(heroEl, { opacity: heroP }, { duration: presets.duration.instant / 1000 });
    heroEl.style.width = `${lerp(38, 100, heroP)}%`;
    heroEl.style.height = `${lerp(42, 100, heroP)}%`;
    heroEl.style.borderRadius = `${lerp(12, 0, heroP)}px`;
  }

  // Caption: stage 3
  const captionEl = root.querySelector<HTMLElement>("[data-scene='caption']");
  if (captionEl) {
    animate(captionEl, { opacity: clamp((pinP - 2 / 3) / (1 / 3), 0, 1) }, { duration: presets.duration.instant / 1000 });
  }

  // Progress bar
  const barEl = root.querySelector<HTMLElement>("[data-scene='progress-bar']");
  if (barEl) {
    animate(barEl, { width: `${pinP * 100}%` }, { duration: presets.duration.instant / 1000 });
  }

  // Parallax layers
  root.querySelectorAll<HTMLElement>("[data-scene='parallax-layer']").forEach((el) => {
    const rate = Number(el.dataset.rate ?? 0.5);
    const travel = (1 - rate) * 20;
    animate(el, { y: `${-parP * travel}%` }, { duration: presets.duration.instant / 1000 });
  });

  // Horizontal strip
  const trackEl = root.querySelector<HTMLElement>("[data-scene='strip-track']");
  if (trackEl) {
    animate(trackEl, { x: `-${stripP * 400}vw` }, { duration: presets.duration.instant / 1000 });
  }
}

// Initialise the scroll engine for a scene root.
// Returns cleanup function for useEffect.
export function initMotionScroll(
  root: HTMLElement,
  onPinProgress?: (p: number) => void,
): () => void {
  const totalH = () => document.documentElement.scrollHeight - window.innerHeight;

  // scroll() returns a cancel function
  const cancelScroll = scroll(
    (progress: number) => {
      const state = progressFromPage(progress);
      applyState(root, state, onPinProgress);
    },
    { axis: "y" },
  );

  // Initial paint at current position
  const init = totalH() > 0 ? window.scrollY / totalH() : 0;
  applyState(root, progressFromPage(init), onPinProgress);

  // Text reveal via IntersectionObserver (not scrubbed, uses presets)
  const revealEl = root.querySelector<HTMLElement>("[data-scene='text-reveal']");
  let io: IntersectionObserver | null = null;
  if (revealEl) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const isHarness = new URLSearchParams(window.location.search).get("harness") === "1";
          animate(
            revealEl,
            { opacity: 1, y: 0 },
            {
              duration: isHarness ? 0 : presets.duration.base / 1000,
              ease: isHarness ? undefined : presets.easing.enter,
            },
          );
          io?.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(revealEl);
  }

  return () => {
    cancelScroll();
    io?.disconnect();
  };
}

export function jumpToProgress(
  root: HTMLElement,
  pageP: number,
  onPinProgress?: (p: number) => void,
): void {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, pageP * totalH);
  applyState(root, progressFromPage(pageP), onPinProgress);
}
